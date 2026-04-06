import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler,
} from "chart.js";


import MyOrders from "./MyOrders";
import AddProduct from "./AddProduct";
import ReelsPage from "./ReelsPage";
import ProfilePage from "./ProfilePage";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import BusinessAnalytics from "./BusinessAnalytics";
import FinanceForSeller from "./FinanceForSeller";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SellerDashboard = () => {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isLoading, setIsLoading] = useState(false);
    
    
    const [sellerProfile, setSellerProfile] = useState(null);
    
    const [stats, setStats] = useState({
        new: 0, pending: 0, packed: 0, shipped: 0, delivered: 0, returns: 0, revenue: 0
    });
    const [topProducts, setTopProducts] = useState([]);
    const [weeklySalesData, setWeeklySalesData] = useState([0, 0, 0, 0, 0, 0, 0]);

    const navigate = useNavigate();
    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const sellerId = sellerData.id || sellerData._id;
    const token = localStorage.getItem("userToken");
    const [timeFilter, setTimeFilter] = useState("Weekly"); 
const [displayRevenue, setDisplayRevenue] = useState(0); 

    const API_BASE = "https://api.zhopingo.in/api/v1";
    
    const IMAGE_BASE = "https://d1utzn73483swp.cloudfront.net/";

    useEffect(() => {
        if (sellerId) {
            fetchSellerLiveStats();
            fetchSellerProfile(); 
        }
    }, [sellerId]);

    const fetchSellerProfile = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE}/seller/dashboard/${sellerId}`, config);
            if (res.data.success) {
                setSellerProfile(res.data.data);
            }
        } catch (err) {
            console.error("Profile Fetch Error", err);
        }
    };

const fetchSellerLiveStats = async () => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
       
        const [ordersRes, dashboardRes, settlementRes] = await Promise.all([
            axios.get(`${API_BASE}/orders/all`, config),
            axios.get(`${API_BASE}/seller/dashboard/${sellerId}`, config),
            
            axios.get(`${API_BASE}/admin/finance/settlements/${sellerId}`, config) 
        ]);

        if (ordersRes.data.success && dashboardRes.data.success) {
            
            const myOrders = ordersRes.data.data.filter(order => 
                order.sellerSplitData?.some(split => (split.sellerId?._id || split.sellerId) === sellerId)
            );

            const paidSettlements = (settlementRes.data.data || []).filter(s => s.status === 'Paid');
            

            const totalPaidRevenue = paidSettlements.reduce((sum, s) => sum + (s.finalSettlementAmount || 0), 0);

            setStats({
                new: myOrders.filter(o => o.status === "Placed").length,
                placed: myOrders.filter(o => o.status === "Placed").length,
                shipped: myOrders.filter(o => o.status === "Shipped").length,
                delivered: myOrders.filter(o => o.status === "Delivered").length,
                cancelled: myOrders.filter(o => o.status === "Cancelled").length,

                revenue: totalPaidRevenue.toFixed(2) 
            });


            const now = new Date();
            let chartData = [];

            if (timeFilter === "Daily") {
                chartData = new Array(7).fill(0);
                paidSettlements.forEach(s => {
                    const sDate = new Date(s.updatedAt); 
                    if (sDate.toDateString() === now.toDateString()) {
                        const slot = Math.floor(sDate.getHours() / 3.5); 
                        chartData[slot] += s.finalSettlementAmount;
                    }
                });
            } else if (timeFilter === "Weekly") {
                chartData = [0, 0, 0, 0, 0, 0, 0];
                paidSettlements.forEach(s => {
                    const day = new Date(s.updatedAt).getDay();
                    chartData[day] += s.finalSettlementAmount;
                });
            } else if (timeFilter === "Monthly") {
                
                chartData = new Array(4).fill(0);
                paidSettlements.forEach(s => {
                    const d = new Date(s.updatedAt);
                    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                        const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
                        chartData[week] += s.finalSettlementAmount;
                    }
                });
            }
            setWeeklySalesData(chartData);

            
            const productMap = {};
            myOrders.forEach(order => {
                order.items.forEach(item => {
                    const pid = item.productId?._id || item.productId;
                    if ((item.sellerId?._id || item.sellerId) === sellerId) {
                        if (!productMap[pid]) productMap[pid] = { name: item.name, count: 0 };
                        productMap[pid].count += item.quantity;
                    }
                });
            });
            setTopProducts(Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 7));

            
            setSellerProfile(dashboardRes.data.data.seller);
        }
    } catch (err) {
        console.error("Critical Dashboard Revenue Sync Error:", err);
        toast.error("Financial data sync failed!");
    } finally {
        setIsLoading(false);
    }
};
    useEffect(() => {
    fetchSellerLiveStats();
}, [timeFilter]);

    const sidebarControl = () => setSidebarActive(!sidebarActive);
    const mobileMenuControl = () => setMobileMenu(!mobileMenu);
    const handleLogout = () => { localStorage.clear(); navigate("/sign-in"); };

const getProfileImg = () => {
    
    const profile = sellerProfile?.seller || sellerProfile; 
    const imgPath = profile?.profileImage || profile?.shopLogo;

    if (imgPath) {
        
        return imgPath.startsWith('http') ? imgPath : `${IMAGE_BASE}${imgPath}`;
    }
    
    
    return `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.shopName || 'Seller'}`;
};

    const lineData = { 
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], 
        datasets: [{ 
            fill: true, data: weeklySalesData, 
            borderColor: "#485EC4", backgroundColor: "rgba(72, 94, 196, 0.1)", tension: 0.4 
        }] 
    };

const getChartConfig = () => {
    let labels = [];
    if (timeFilter === "Daily") {
        labels = ["6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am"]; 
    } else if (timeFilter === "Weekly") {
        labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    } else if (timeFilter === "Monthly") {
        labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    }

    return {
        labels: labels,
        datasets: [{
            fill: true,
            data: weeklySalesData, 
            borderColor: "#485EC4",
            backgroundColor: "rgba(72, 94, 196, 0.1)",
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "#485EC4"
        }]
    };
};
const renderDashboard = () => (
    <div className="animate__animated animate__fadeIn">
        <div className="row gy-4 mb-24">
            {/* 🌟 Placed Box */}
             <StatCard label="New Orders" val={stats.new} btn="View Orders" onClick={() => setActiveTab("orders")} color="primary" />
            <StatCard label="Placed" val={stats.new} />
            
            {/* 🌟 Cancelled Box (Replacing Pending/Packed) */}
            <StatCard label="Cancelled" val={stats.cancelled} color="danger" />
            
            <StatCard label="Shipped" val={stats.shipped} color="secondary" />
            <StatCard label="Delivered" val={stats.delivered} color="success" />
            {/* Change your Revenue card call to this */}
<StatCard 
    label={`${timeFilter} Revenue`} 
    val={`₹${weeklySalesData.reduce((a, b) => a + b, 0).toLocaleString()}`} 
    color="success" 
/>
        </div>

            <div className="row gy-4">
                <div className="col-lg-8">
    <div className="card radius-12 border-0 shadow-sm p-24 h-100">
        <div className="d-flex align-items-center justify-content-between mb-20">
            <h6 className="fw-bold mb-0 text-primary-light">Revenue Analytics</h6>
            
            {/* 🌟 41. Professional Time Filter Buttons */}
            <div className="d-flex gap-2 bg-light p-4 radius-8">
                {["Daily", "Weekly", "Monthly"].map(f => (
                    <button 
                        key={f}
                        onClick={() => setTimeFilter(f)}
                        className={`btn btn-xs px-12 py-4 radius-6 fw-bold transition-all ${timeFilter === f ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary'}`}
                        style={{ fontSize: '10px' }}
                    >
                        {f.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
        
        <div style={{ height: "300px" }}>
    {/* 🚀 THE FIX: Use getChartConfig() instead of lineData */}
    <Line 
        data={getChartConfig()} 
        options={{ 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { callback: (val) => '₹' + val } 
                } 
            } 
        }} 
    />
</div>
    </div>
</div>
                <div className="col-lg-4">
                    <div className="card radius-12 border-0 shadow-sm p-24  h-100">
                        <h6 className="fw-bold mb-20 text-primary-light">Top 7 Selling Items</h6>
                        {topProducts.length > 0 ? topProducts.map((p, i) => (
                            <div key={i} className="d-flex align-items-center justify-content-between mb-16 border-bottom-dashed pb-8">
                                <span className="text-sm fw-bold text-dark text-truncate" style={{maxWidth: '160px'}}>{p.name}</span>
                                <span className="badge bg-primary-50 text-primary-600">{p.count} Sold</span>
                            </div>
                        )) : <p className="text-center py-50 text-muted">No sales data yet</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <section className={mobileMenu ? "overlay active" : "overlay"}>
            {mobileMenu && <div className="sidebar-overlay" onClick={mobileMenuControl}></div>}
            <aside className={`sidebar ${sidebarActive ? "active" : ""} ${mobileMenu ? "sidebar-open" : ""}`}>
                <button onClick={mobileMenuControl} type='button' className='sidebar-close-btn'><Icon icon='radix-icons:cross-2' /></button>
                <div className="p-24 border-bottom text-center">
                    <img src='/assets/images/auth/logo-dash-seller.png' alt='logo' style={{ width: '120px' }} />
                </div>
                <div className='sidebar-menu-area'>
                    <ul className='sidebar-menu'>
                        <li onClick={() => {setActiveTab("dashboard"); setMobileMenu(false)}} className={activeTab === 'dashboard' ? 'active-page' : ''}>
                            <Link to='#'><Icon icon='solar:home-smile-angle-outline' className='menu-icon' /> <span>Dashboard</span></Link>
                        </li>
                        <li onClick={() => {setActiveTab("orders"); setMobileMenu(false)}} className={activeTab === 'orders' ? 'active-page' : ''}>
                            <Link to='#'><Icon icon='solar:clipboard-list-bold' className='menu-icon' /> <span>My Orders</span></Link>
                        </li>
                        <li onClick={() => {setActiveTab("add"); setMobileMenu(false)}} className={activeTab === 'add' ? 'active-page' : ''}>
                            <Link to='#'><Icon icon='solar:add-circle-bold' className='menu-icon' /> <span>Inventory Management</span></Link>
                        </li>
                        <li onClick={() => {setActiveTab("reels"); setMobileMenu(false)}} className={activeTab === 'reels' ? 'active-page' : ''}>
                            <Link to='#'><Icon icon='ri:play-circle-line' className='menu-icon' /> <span>My Reels</span></Link>
                        </li>
                        <li onClick={() => {setActiveTab("analytics"); setMobileMenu(false)}} className={activeTab === 'analytics' ? 'active-page' : ''}>
    <Link to='#'>
        <Icon icon='solar:chart-2-bold-duotone' className='menu-icon' /> 
        <span>Business Analytics</span>
    </Link>
</li>
<li onClick={() => {setActiveTab("finance"); setMobileMenu(false)}} className={activeTab === 'finance' ? 'active-page' : ''}>
    <Link to='#'>
        <Icon icon='solar:wallet-money-bold-duotone' className='menu-icon' /> 
        <span>Finance</span>
    </Link>
</li>
                    </ul>
                </div>
            </aside>

            <main className={sidebarActive ? "dashboard-main active" : "dashboard-main"}>
                <div className='navbar-header px-24 py-16 border-bottom sticky-top'>
                    <div className='row align-items-center justify-content-between'>
                        <div className='col-auto d-flex align-items-center gap-3'>
                            <button className='sidebar-mobile-toggle d-lg-none border-0 bg-transparent' onClick={mobileMenuControl}><Icon icon='heroicons:bars-3-solid' className='text-2xl' /></button>
                            <button className='sidebar-toggle d-none d-lg-block border-0 bg-transparent' onClick={sidebarControl}><Icon icon={sidebarActive ? 'iconoir:arrow-right' : 'heroicons:bars-3-solid'} className='text-2xl' /></button>
                            <h6 className="mb-0 fw-bold text-primary-600 d-none d-md-block uppercase ls-1">Seller Hub</h6>
                        </div>
                        <div className='col-auto d-flex align-items-center gap-3'>
                            <ThemeToggleButton />
                            <div className="dropdown">
                                <button className="border-0 bg-transparent p-0" data-bs-toggle="dropdown">
                                    {/* 🌟 DYNAMIC PROFILE IMAGE LOGIC */}
                                    <div className="w-44-px h-44-px rounded-circle border-2 border-primary-100 shadow-sm overflow-hidden bg-light d-flex align-items-center justify-content-center">
                                        <img 
                                            src={getProfileImg()} 
                                            className="w-100 h-100 object-fit-cover" 
                                            alt="profile" 
                                            onError={(e) => { e.target.src = "https://api.dicebear.com/7.x/initials/svg?seed=Seller"; }}
                                        />
                                    </div>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 radius-12 p-12">
                                    <li className="p-12 border-bottom">
                                        <h6 className="text-sm mb-0 text-dark fw-bold">{sellerProfile?.shopName || "Loading..."}</h6>
<small className="text-primary-600 fw-bold text-xxs">Verified Seller</small>
                                    </li>
                                    <li><button onClick={() => setActiveTab("profile")} className="dropdown-item radius-8 py-8 mt-2 d-flex align-items-center gap-2"><Icon icon="solar:user-bold" /> My Profile</button></li>
                                    <li><button onClick={handleLogout} className="dropdown-item text-danger py-8 d-flex align-items-center gap-2"><Icon icon="solar:logout-3-bold" /> Log Out</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className='dashboard-main-body p-24'>
                    <div className="mb-24">
                        <h5 className="fw-bold mb-0">Welcome back, {sellerProfile?.name || "Seller"}!</h5>
                    </div>
                    {isLoading && <div className="text-center py-20"><div className="spinner-border text-primary"></div></div>}
                    {activeTab === "dashboard" && renderDashboard()}
                    {activeTab === "orders" && <MyOrders />} 
                    {activeTab === "add" && <AddProduct />}
                    {activeTab === "reels" && <ReelsPage />} 
                    
                    {activeTab === "profile" && <ProfilePage />}
{activeTab === "analytics" && <BusinessAnalytics setActiveTab={setActiveTab} />} 
{activeTab === "finance" && <FinanceForSeller />}
               </div>

                <footer className='d-footer p-24 border-top  mt-auto'>
                    <p className='mb-0 text-secondary text-sm'>© 2026 oxplow Seller Hub. All Rights Reserved.</p>
                </footer>
            </main>
        </section>
    );
};

const StatCard = ({ label, val, btn, onClick, color }) => (
    <div className="col-xxl-2 col-sm-6 col-md-4">
        <div className={`card radius-12 border-0 shadow-sm p-16 h-100  border-start border-4 border-${color}`}>
            <small className="text-secondary fw-bold text-xxs uppercase">{label}</small>
            <h4 className="fw-bold my-12 text-dark">{val}</h4>
            {btn && <button onClick={onClick} className="btn btn-primary-600 btn-xs radius-8 w-100 py-8 fw-bold text-white" style={{fontSize: '10px'}}>{btn}</button>}
        </div>
    </div>
);

export default SellerDashboard;