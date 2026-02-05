import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import ReelsPage from "./ReelsPage"; // Unga file path-padi
import MyOrders from "./MyOrders";
import AddProduct from "./AddProduct";
import ProfilePage from "./ProfilePage"; // Same folder-la iruntha intha path correct

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [salesFilter, setSalesFilter] = useState("Weekly");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");

  const THEME_GREEN = "#064E3B"; 
  const MINT_GREEN = "#98c9b9";  

  // ... (Chart Data logic stays the same) ...
  const lineData = { labels: ["6a", "10a", "2p", "6p", "10p"], datasets: [{ fill: true, data: [20, 45, 28, 80, 99], borderColor: MINT_GREEN, backgroundColor: "rgba(16, 185, 129, 0.1)", tension: 0.4 }] };
  const barData = { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [{ label: "Revenue", data: [45, 70, 55, 90, 80, 100, 65], backgroundColor: THEME_GREEN, borderRadius: 6 }] };

  // Pazhaya code-ai ithanaal replace seiyavum
const StatCard = ({ label, val, btn, dots, onClick }) => (
  <div className="col-6 col-md-4 col-xl-2">
    <div className="card radius-20 border-0 shadow-sm p-16 h-100 bg-white">
      <div className="d-flex justify-content-between align-items-start mb-12">
        <small className="text-secondary fw-bold text-xs uppercase" style={{ fontSize: '10px' }}>{label}</small>
        {dots && <div className="d-flex gap-1">{dots.map((d, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d }} />)}</div>}
      </div>
      <h3 className="fw-bold mb-12">{val}</h3>
      {btn && (
        <button 
          onClick={onClick} // Inga thaan button click-ai connect panrom
          className="btn btn-success-600 btn-xs radius-8 w-100 py-6 text-white fw-bold" 
          style={{ fontSize: '11px', backgroundColor: '#10B981' }}
        >
          {btn}
        </button>
      )}
    </div>
  </div>
);

  // Sub-render functions (Dashboard and Analytics sections)
  const renderDashboard = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="row gy-4 mb-24 mt-2">
        <StatCard 
        label="New Orders" 
        val="12" 
        btn="View Orders" 
        color="primary" 
        onClick={() => setActiveTab("orders")} // Intha line thaan orders page-ku kootti sellum
      />
        <StatCard label="Pending Orders" val="08" dots={["#F59E0B", "#F59E0B"]} />
        <StatCard label="Packed Orders" val="05" dots={["#F59E0B", "#F59E0B"]} />
        <StatCard label="Shipped Orders" val="07" dots={[MINT_GREEN, MINT_GREEN]} />
        <StatCard label="Delivered Orders" val="20" dots={[MINT_GREEN, MINT_GREEN]} />
        <StatCard label="Returns" val="02" dots={["#EF4444", "#EF4444"]} />
      </div>
      <div className="row gy-4">
        <div className="col-lg-8">
          <div className="card radius-20 border-0 shadow-sm p-24 bg-white h-100">
            <div className="d-flex justify-content-between mb-20">
              <h6 className="fw-bold">Sales Overview</h6>
              <div className="btn-group bg-neutral-100 p-4 radius-10">
                {["Daily", "Weekly", "Monthly"].map(f => (<button key={f} onClick={() => setSalesFilter(f)} className={`btn btn-sm border-0 radius-8 px-12 ${salesFilter === f ? 'bg-white shadow-sm fw-bold' : 'text-secondary'}`}>{f}</button>))}
              </div>
            </div>
            <h3 className="fw-bold text-dark">₹ 35,420 <small className="text-secondary text-xs">This {salesFilter}</small></h3>
            <div style={{ height: "220px" }}><Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false } } }} /></div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card radius-20 border-0 shadow-sm p-24 bg-white h-100">
            <h6 className="fw-bold mb-20">Top Products</h6>
            {["Organic Honey", "Fresh Apples", "Millet Flour", "Herbal Oil"].map((p, i) => (<div key={i} className="d-flex align-items-center justify-content-between mb-16 border-bottom-dashed pb-8"><span className="text-sm fw-medium">{p}</span><Icon icon="solar:alt-arrow-right-linear" className="text-secondary-light" /></div>))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="animate__animated animate__fadeIn mt-4">
      <div className="card radius-24 border-0 shadow-sm p-32 mb-24 bg-white">
        <h6 className="fw-bold mb-4">Revenue Growth</h6>
        <h2 className="fw-900 text-dark mb-8">₹ 1,24,500.00</h2>
        <p className="fw-bold text-sm mb-24" style={{ color: MINT_GREEN }}>+12.5% from last period</p>
        <div style={{ height: "280px" }}><Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
      </div>
      <div className="row gy-4 mb-32">
        <MetricBox label="Avg. Order Value" value="₹ 1,250" trend="+5%" color="#3B82F6" />
        <MetricBox label="Conversion Rate" value="3.2%" trend="+0.8%" color={MINT_GREEN} />
        <MetricBox label="Repeat Customers" value="24%" trend="+2%" color={THEME_GREEN} />
        <MetricBox label="Return Rate" value="1.5%" trend="-0.4%" color="#EF4444" />
      </div>
      <div className="card radius-24 border-0 shadow-sm p-24 bg-white"><h6 className="fw-bold mb-24 text-uppercase">Traffic Sources</h6><SourceRow label="Direct Search" pct="45%" color={THEME_GREEN} /><SourceRow label="Reels / Video" pct="35%" color={MINT_GREEN} /><SourceRow label="Social Media" pct="20%" color="#3B82F6" /></div>
    </div>
  );

  return (
<div className="min-vh-100 bg-neutral-50 pb-50 position-relative">
  {/* 🌟 FIXED GREEN HEADER UI */}
  <nav 
    className="navbar sticky-top shadow-sm px-32" 
    style={{ 
      backgroundColor: THEME_GREEN, 
      height: '80px', // Standard fixed height
      borderBottomLeftRadius: '24px', 
      borderBottomRightRadius: '24px',
      zIndex: 1000 // To stay above all content
    }}
  >
    <div className="d-flex align-items-center justify-content-between w-100">
      <div className="d-flex align-items-center gap-3">
        <div 
          className="p-8 radius-8 hover-bg-white-10 cursor-pointer d-flex" 
          onClick={() => setIsMenuOpen(true)}
        >
          <Icon icon="ci:hamburger-lg" className="text-white text-2xl" />
        </div>
        <div className="ms-2">
          <h5 className="mb-0 fw-bold text-white ls-1">Zhopingo</h5>
          <p className="mb-0 text-xxs fw-medium" style={{ color: '#6EE7B7' }}>SELLER CENTER</p>
        </div>
      </div>

   <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <p className="mb-0 text-white text-xs fw-bold">{sellerData.shopName || "Store"}</p>
              <p className="mb-0 text-xxs fw-medium" style={{ color: '#6EE7B7' }}>Verified Seller</p>
            </div>
            {/* 🌟 PROFILE ICON CLICK LOGIC */}
            <div className="cursor-pointer" onClick={() => setActiveTab("profile")}>
              <img 
                src="https://i.pravatar.cc/100" 
                className={`rounded-circle border border-2 ${activeTab === 'profile' ? 'border-success' : 'border-white-50'}`} 
                style={{ width: "42px", height: "42px", objectFit: 'cover' }} 
                alt="profile" 
              />
            </div>
          </div>
        </div>
      </nav>

  {/* Existing Sidebar Drawer and Content logic stays the same... */}

      {/* 🌟 GREEN & WHITE SIDEBAR DRAWER */}
      {isMenuOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 z-3" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setIsMenuOpen(false)}>
           <div className="bg-white h-100 shadow-lg animate__animated animate__slideInLeft" style={{ width: '280px' }} onClick={e => e.stopPropagation()}>
              {/* Drawer Top Header - Green */}
              <div className="p-32 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ffffff' }}>
                 <div>
                   <h5 className="text-white mb-0 fw-bold">Seller Menu</h5>
                   <small style={{ color: '#6EE7B7' }}></small>
                 </div>
                 <Icon icon="solar:close-circle-bold" className="text-white text-2xl cursor-pointer" onClick={() => setIsMenuOpen(false)} />
              </div>
              
              {/* Drawer List - White Background with Green Hover */}
              <div className="p-16">
                 <ul className="list-unstyled">
                    {[
                      { id: 'dashboard', icon: 'solar:home-2-bold', label: 'Dashboard' },
                      { id: 'orders', icon: 'solar:clipboard-list-bold', label: 'My Orders' },
                      { id: 'add', icon: 'solar:add-circle-bold', label: 'Add Product' },
                      { id: 'reels', icon: 'solar:play-circle-bold', label: 'My Reels' },
                      { id: 'analytics', icon: 'solar:chart-2-bold', label: 'Analytics' }
                    ].map(m => (
                      <li 
                        key={m.id} 
                        className={`p-16 radius-12 cursor-pointer d-flex align-items-center gap-3 mb-8 transition-all ${activeTab === m.id ? 'bg-success-focus text-success-main fw-bold border-start border-4 border-success-main' : 'text-secondary hover-bg-neutral-50'}`} 
                        onClick={() => { setActiveTab(m.id); setIsMenuOpen(false); }}
                      >
                         <Icon icon={m.icon} className="text-2xl" /> 
                         <span className="text-sm uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>{m.label}</span>
                      </li>
                    ))}
                 </ul>
              </div>
              
            
           </div>
        </div>
      )}

    <div className="container-fluid max-w-1100-px mx-auto pt-32 px-24">
        {/* Dynamic Title based on Active Tab */}
        <h2 className="fw-bold mb-4">
          {activeTab === "reels" ? "Store Reels" : 
           activeTab === "analytics" ? "Business Analytics" : 
           activeTab === "orders" ? "My Orders" : 
           activeTab === "add" ? "Add Product" : 
           activeTab === "profile" ? "My Profile" : "Dashboard"}
        </h2>

        {/* Conditional Content Rendering */}
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "analytics" && renderAnalytics()}
        {activeTab === "reels" && <ReelsPage />} 
        {activeTab === "orders" && <MyOrders />} 
        {activeTab === "add" && <AddProduct />}
        {activeTab === "profile" && <ProfilePage onLogout={() => { localStorage.clear(); navigate("/"); }} />}
      </div>
    </div>
  );
};

// Helper components logic stays same as previously provided...
const StatCard = ({ label, val, btn, dots }) => ( <div className="col-6 col-md-4 col-xl-2"><div className="card radius-20 border-0 shadow-sm p-16 h-100 bg-white"><div className="d-flex justify-content-between align-items-start mb-12"><small className="text-secondary fw-bold text-xs uppercase" style={{ fontSize: '10px' }}>{label}</small>{dots && <div className="d-flex gap-1">{dots.map((d, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d }} />)}</div>}</div><h3 className="fw-bold mb-12">{val}</h3>{btn && <button className="btn btn-success-600 btn-xs radius-8 w-100 py-6 text-white fw-bold" style={{ fontSize: '11px', backgroundColor: '#10B981' }}>{btn}</button>}</div></div>);
const MetricBox = ({ label, value, trend, color }) => (<div className="col-md-6 col-xl-3"><div className="card radius-20 border-0 shadow-sm p-20 bg-white h-100 border-soft"><small className="text-secondary fw-bold text-xs uppercase mb-8 d-block">{label}</small><h4 className="fw-900 mb-4" style={{ color: color }}>{value}</h4><small className="fw-bold" style={{ color: '#10B981' }}>{trend}</small></div></div>);
const SourceRow = ({ label, pct, color }) => (<div className="mb-20"><div className="d-flex justify-content-between mb-8"><small className="fw-bold text-secondary">{label}</small><small className="fw-900" style={{ color: "#064E3B" }}>{pct}</small></div><div className="progress radius-10" style={{ height: 10, backgroundColor: '#F1F5F9' }}><div className="progress-bar" style={{ width: pct, backgroundColor: color }} /></div></div>);

export default SellerDashboard;