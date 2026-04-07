import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from "@iconify/react";
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom'; 



const BusinessAnalytics = ({ setActiveTab }) => { 
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null);
    
    
    const [revFilter, setRevFilter] = useState('Weekly');
    const [orderFilter, setOrderFilter] = useState('Weekly');
    const [hubFilter, setHubFilter] = useState('Weekly');
    const [reelFilter, setReelFilter] = useState('Weekly');

    const [showFullOutOfStock, setShowFullOutOfStock] = useState(false);

    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const sellerId = sellerData.id || sellerData._id;
    const token = localStorage.getItem("userToken");
    const API_BASE = "https://api.zhopingo.in/api/v1";

    const COLORS = ['#28C76F', '#485EC4', '#FF9F43', '#EA5455'];

    
    const processChartData = (dataArray, dateKey, valueKey, filterType) => {
        const now = new Date();
        const result = [];

        if (filterType === 'Daily') {
            const slots = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM", "12AM"];
            slots.forEach((s, i) => result.push({ name: s, value: 0 }));
            dataArray.forEach(item => {
                const date = new Date(item[dateKey]);
                if (date.toDateString() === now.toDateString()) {
                    const hour = date.getHours();
                    const slotIndex = Math.min(Math.floor(hour / 3.4), 6);
                    result[slotIndex].value += (item[valueKey] || 1);
                }
            });
        } else if (filterType === 'Weekly') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(d => result.push({ name: d, value: 0 }));
            dataArray.forEach(item => {
                const date = new Date(item[dateKey]);
                result[date.getDay()].value += (item[valueKey] || 1);
            });
        } else if (filterType === 'Monthly') {
            const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            weeks.forEach(w => result.push({ name: w, value: 0 }));
            dataArray.forEach(item => {
                const date = new Date(item[dateKey]);
                if (date.getMonth() === now.getMonth()) {
                    const week = Math.min(Math.floor((date.getDate() - 1) / 7), 3);
                    result[week].value += (item[valueKey] || 1);
                }
            });
        } else if (filterType === 'Yearly') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            months.forEach(m => result.push({ name: m, value: 0 }));
            dataArray.forEach(item => {
                const date = new Date(item[dateKey]);
                if (date.getFullYear() === now.getFullYear()) {
                    result[date.getMonth()].value += (item[valueKey] || 1);
                }
            });
        }
        return result;
    };
   
const fetchFullAnalytics = async () => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 🚀 1. Parallel Data Fetching (Including new Settlement API)
        const [dashRes, ordersRes, productsRes, reelsRes, settlementRes] = await Promise.all([
            axios.get(`${API_BASE}/seller/dashboard/${sellerId}`, config),
            axios.get(`${API_BASE}/orders/all`, config),
            axios.get(`${API_BASE}/seller/products/${sellerId}`, config),
            axios.get(`${API_BASE}/reels`, config),
            axios.get(`${API_BASE}/admin/finance/settlements/${sellerId}`, config) 
        ]);

        // 🎯 2. Scoping All Data
        const allProducts = productsRes.data.data || [];
        const myOrders = (ordersRes.data.data || []).filter(o => 
            o.sellerSplitData?.some(s => (s.sellerId?._id || s.sellerId) === sellerId)
        );
        const myReels = (reelsRes.data.data || []).filter(r => 
            (r.sellerId?._id || r.sellerId) === sellerId
        );

        // 💰 3. REVENUE SYNC LOGIC: Strictly from "Paid" Settlements
        const paidSettlements = (settlementRes.data.data || []).filter(s => s.status === 'Paid');
        
        // Use 'updatedAt' because that's when Admin clicked "Mark as Paid"
        const revenueTrendRaw = paidSettlements.map(s => ({ 
            date: s.updatedAt, 
            amt: s.finalSettlementAmount || 0 
        }));

        
        const getFilteredOrders = (filter) => {
            const now = new Date();
            return myOrders.filter(o => {
                const orderDate = new Date(o.createdAt);
                if (filter === 'Daily') return orderDate.toDateString() === now.toDateString();
                if (filter === 'Weekly') {
                    const lastWeek = new Date(); lastWeek.setDate(now.getDate() - 7);
                    return orderDate >= lastWeek;
                }
                if (filter === 'Monthly') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                if (filter === 'Yearly') return orderDate.getFullYear() === now.getFullYear();
                return true;
            });
        };

        const hubFiltered = getFilteredOrders(hubFilter);
        const ordersTrendRaw = myOrders.map(o => ({ date: o.createdAt, count: 1 }));
        const reelsTrendRaw = myReels.map(r => ({ date: r.createdAt, views: r.views || 0 }));


setStats({
    revenueTrend: processChartData(revenueTrendRaw, 'date', 'amt', revFilter),
    ordersTrend: processChartData(ordersTrendRaw, 'date', 'count', orderFilter),
    reelsTrend: processChartData(reelsTrendRaw, 'date', 'views', reelFilter),
    
    statusData: [
    { name: 'Placed', value: hubFiltered.filter(o => {
        const myPackage = o.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        return (myPackage?.packageStatus || o.status) === 'Placed';
    }).length },
    { name: 'Shipped', value: hubFiltered.filter(o => {
        const myPackage = o.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        return (myPackage?.packageStatus || o.status) === 'Shipped';
    }).length },
    { name: 'Delivered', value: hubFiltered.filter(o => {
        const myPackage = o.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        return (myPackage?.packageStatus || o.status) === 'Delivered';
    }).length },
], // 🚀 THE FIX: Removed .filter(d => d.value > 0) to show Zero values

    inventory: {
        outOfStock: allProducts.filter(p => (p.stock || 0) === 0),
        lowStock: allProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10),
        healthyStock: allProducts.filter(p => (p.stock || 0) > 10).sort((a,b) => b.stock - a.stock)
    },

    // 🚀 THE CRITICAL FIX: Direct sum of all PAID settlements for accuracy
    // Admin payout page-la 'Mark as Paid' panna amount ellaame ippo real-time-ah inga kootum
    totalRevenue: paidSettlements.reduce((sum, s) => sum + (s.finalSettlementAmount || 0), 0).toFixed(2),
    
    totalProducts: allProducts.length,
    totalReels: myReels.length,
    totalLikes: myReels.reduce((acc, r) => acc + (r.likes || 0), 0),
    totalViews: myReels.reduce((acc, r) => acc + (r.views || 0), 0),
    totalCustomers: new Set(myOrders.map(o => o.userId?._id || o.userId)).size
});

    } catch (err) { 
        console.error("Critical Analytics Sync Error:", err);
        toast.error("Failed to sync live business data!");
    } finally { 
        setIsLoading(false); 
    }
};

    useEffect(() => { fetchFullAnalytics(); }, [revFilter, orderFilter, reelFilter, hubFilter]);

    if (isLoading) return <div className="text-center py-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="animate__animated animate__fadeIn pb-40">
            
            <div className="row g-4 mb-24">
                <TopMetricCard 
        title="Total Revenue" 
        val={`₹${stats?.totalRevenue}`} 
        icon="solar:wallet-money-bold" 
        color="#485EC4" 
        onClick={() => {
            setActiveTab("finance");
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Visual smooth sync
        }}
    />
                <TopMetricCard title="Active Products" val={stats?.totalProducts} icon="solar:box-bold" color="#28C76F" />
                <TopMetricCard title="Total Customers" val={stats?.totalCustomers} icon="solar:users-group-two-rounded-bold" color="#7367F0" />
                <TopMetricCard title="Total Reels" val={stats?.totalReels} icon="solar:videocamera-record-bold" color="#FF9F43" />
            </div>

            <div className="row g-4">
                
                <div className="col-lg-12">
                    <ChartCard title="Revenue Analytics" filter={revFilter} setFilter={setRevFilter} sub="Real-time earnings flow">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats?.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#485EC4" stopOpacity={0.1}/><stop offset="95%" stopColor="#485EC4" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="value" stroke="#485EC4" strokeWidth={3} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

               
                <div className="col-lg-8">
                    <ChartCard title="Order Volume Trend" filter={orderFilter} setFilter={setOrderFilter} sub="Sales velocity tracking">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.ordersTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#28C76F" radius={[6, 6, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>


<div className="col-lg-4">
    <ChartCard 
        title="Fulfillment Hub" 
        filter={hubFilter} 
        setFilter={setHubFilter} 
        sub="Order lifecycle status"
    >
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie 
                    data={stats?.statusData} 
                    innerRadius={65} 
                    outerRadius={85} 
                    paddingAngle={5} 
                    dataKey="value"
                    animationDuration={800} 
                >
                    {/* 🎨 Strictly 3 Colors: Placed(Green), Shipped(Blue), Delivered(Orange) */}
                    <Cell fill="#28C76F" /> 
                    <Cell fill="#485EC4" />
                    <Cell fill="#FF9F43" />
                </Pie>
                
                {/* 🚀 THE MAGIC: Total count including Zeros */}
                <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fw-900" 
                    style={{ fontSize: '20px', fill: '#485EC4' }}
                >
                    {stats?.statusData?.reduce((acc, curr) => acc + curr.value, 0)}
                    <tspan x="50%" dy="20" style={{ fontSize: '10px', fill: '#999', fontWeight: 'bold' }}>
                        ORDERS
                    </tspan>
                </text>

                <Tooltip />
                <Legend 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} 
                />
            </PieChart>
        </ResponsiveContainer>
    </ChartCard>
</div>

               
<div className="col-lg-6">
    <div className="card radius-16 border-0 shadow-sm p-24 h-100">
        <h6 className="fw-black text-dark mb-20 d-flex align-items-center gap-2">
            <Icon icon="solar:Box-bold-duotone" className="text-primary-600" />
            Inventory Health Tracker
        </h6>
        
        
        <div className="mb-24">
            <label className="badge bg-danger-focus text-danger-main mb-12 px-12 uppercase fw-bold">Out of Stock ({stats?.inventory.outOfStock.length})</label>
            {stats?.inventory.outOfStock.slice(0, 5).map((p, i) => (
                <div key={i} className="d-flex justify-content-between border-bottom py-2"><small className="fw-bold text-secondary">{p.name}</small><small className="text-danger fw-black">0 Left</small></div>
            ))}
            
            {stats?.inventory.outOfStock.length > 5 && (
                <button className="btn btn-sm text-primary-600 fw-black p-0 mt-2 d-flex align-items-center gap-1 transition-all hover-translate-x-2" onClick={() => navigate('/seller-dashboard')}>
                    VIEW ALL INVENTORY <Icon icon="solar:alt-arrow-right-bold" />
                </button>
            )}
        </div>

        
        <div className="mb-24">
            <label className="badge bg-warning-focus text-warning-main mb-12 px-12 uppercase fw-bold">Low Stock</label>
            {stats?.inventory.lowStock.slice(0, 5).map((p, i) => (
                <div key={i} className="d-flex justify-content-between border-bottom py-2"><small className="fw-bold text-secondary">{p.name}</small><small className="text-warning fw-black">{p.stock} Left</small></div>
            ))}
           
        </div>


        

        
        <div>
            <label className="badge bg-success-focus text-success-main mb-12 px-12 uppercase fw-bold">Top Stocked Items</label>
            {stats?.inventory.healthyStock.slice(0, 5).map((p, i) => (
                <div key={i} className="d-flex justify-content-between border-bottom py-2"><small className="fw-bold text-secondary">{p.name}</small><small className="text-success fw-black">{p.stock} Units</small></div>
            ))}
            
        </div>
        

{stats?.inventory.lowStock.length > 5 && (
    <button 
        className="btn btn-sm text-primary-600 fw-black p-0 mt-2 d-flex align-items-center gap-1 transition-all hover-translate-x-2" 
        onClick={() => {
            setActiveTab("add"); 
            window.scrollTo({top: 0, behavior: 'smooth'});
        }}
    >
        VIEW ALL INVENTORY <Icon icon="solar:arrow-right-bold" />
    </button>
)}
    </div>
</div>

               
                <div className="col-lg-6">
                    <div className="card radius-16 border-0 shadow-sm p-24 bg-dark h-100">
                        <div className="d-flex justify-content-between align-items-center mb-24">
                            <div>
                                <h6 className="fw-bold text-white mb-0">Reels Insights Hub</h6>
                                <small className="text-white-50">Combined reach of all promos</small>
                            </div>
                            <select className="form-select form-select-sm w-auto bg-secondary text-white border-0" value={reelFilter} onChange={e => setReelFilter(e.target.value)}>
                                <option>Daily</option><option>Weekly</option><option>Monthly</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={stats?.reelsTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="name" stroke="#fff" tick={{fontSize: 10}} />
                                <YAxis stroke="#fff" tick={{fontSize: 10}} />
                                <Tooltip contentStyle={{backgroundColor: '#333', border: 'none', color: '#fff'}} />
                                <Line type="monotone" dataKey="value" stroke="#FF9F43" strokeWidth={4} dot={{fill: '#FF9F43', r: 5}} />
                            </LineChart>
                        </ResponsiveContainer>
                        
<div className="mt-32 d-flex justify-content-around text-white border-top border-white-10 pt-20">
    <div className="text-center">
        <Icon icon="solar:heart-bold" className="text-danger fs-3 mb-1" />
        <small className="d-block text-white opacity-75 uppercase fw-bold" style={{fontSize: '9px'}}>Total Likes</small>
        <h4 className="mb-0 fw-black text-white mt-1">{stats?.totalLikes}</h4> 
    </div>
    <div className="text-center">
        <Icon icon="solar:eye-bold" className="text-warning fs-3 mb-1" />
        <small className="d-block text-white opacity-75 uppercase fw-bold" style={{fontSize: '9px'}}>Total Views</small>
        <h4 className="mb-0 fw-black text-white mt-1">{stats?.totalViews}</h4> 
    </div>
</div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ChartCard = ({ title, sub, filter, setFilter, children }) => (
    <div className="card radius-16 border-0 shadow-sm p-24">
        <div className="d-flex justify-content-between align-items-center mb-24">
            <div>
                <h6 className="fw-black text-dark mb-0">{title}</h6>
                <small className="text-secondary">{sub}</small>
            </div>
            <select className="form-select form-select-sm w-auto radius-8 border-light shadow-none" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
            </select>
        </div>
        {children}
    </div>
);

const TopMetricCard = ({ title, val, icon, color, onClick }) => (
    <div className={`col-xl-3 col-sm-6 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div className="card radius-16 border-0 shadow-sm p-20 h-100 border-bottom border-4 transition-all hover-translate-y-2" 
             style={{ borderBottomColor: color }}>
            <div className="d-flex align-items-center gap-3">
                <div className="w-48-px h-48-px rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ backgroundColor: `${color}15`, color: color }}>
                    <Icon icon={icon} className="text-2xl" />
                </div>
                <div>
                    <small className="text-secondary fw-bold uppercase ls-1" style={{ fontSize: '10px' }}>{title}</small>
                    <h4 className="fw-900 mb-0 mt-1">{val}</h4>
                </div>
            </div>
        </div>
    </div>
);

export default BusinessAnalytics;