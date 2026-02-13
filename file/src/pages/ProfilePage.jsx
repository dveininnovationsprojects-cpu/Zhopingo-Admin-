import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const ProfilePage = ({ onLogout }) => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const token = localStorage.getItem("userToken");
  const sellerId = userData.id || userData._id;
  
  const [sellerDetails, setSellerDetails] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0); // 🌟 Sync with Dashboard Revenue
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🌟 API Config - Synced with your latest update
  const API_BASE = "https://api.zhopingo.in/api/v1";
  const IMAGE_BASE = "https://api.zhopingo.in/uploads/";

  useEffect(() => {
    if (sellerId) {
        fetchProfileData();
        fetchSellerRevenue(); // Dashboard logic-ah ingaiyum connect panrom
    }
  }, [sellerId]);

  // 1. FETCH PROFILE DATA
  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/seller/dashboard/${sellerId}`);
      if (res.data.success) {
        setSellerDetails(res.data.data);
      }
    } catch (err) {
      console.error("Profile Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. REVENUE SYNC LOGIC (Dashboard-la ulla adhe logic)
  const fetchSellerRevenue = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_BASE}/orders/all`, config);
        if (res.data.success) {
            const myOrders = res.data.data.filter(order => 
                order.sellerSplitData?.some(split => split.sellerId === sellerId)
            );
            const revenue = myOrders
                .filter(o => o.status === "Delivered")
                .reduce((acc, curr) => {
                    const split = curr.sellerSplitData.find(s => s.sellerId === sellerId);
                    return acc + (split?.sellerSubtotal || 0);
                }, 0);
            setTotalRevenue(revenue);
        }
    } catch (err) { console.error("Revenue Fetch Error", err); }
  };

  // 3. IMAGE UPLOAD LOGIC
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    setIsUpdating(true);
    try {
      const res = await axios.put(`${API_BASE}/seller/update-profile/${sellerId}`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Store Logo Updated!");
        fetchProfileData(); 
      }
    } catch (err) {
      toast.error("Logo upload failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const displayData = sellerDetails || userData;

  return (
    <div className="animate__animated animate__fadeIn pb-50">
      <ToastContainer position="top-right" theme="colored" />
      <div className="row gy-4">
        
        {/* --- 1. HEADER SECTION (Admin Blue UI) --- */}
        <div className="col-12">
          <div className="card radius-16 border-0 shadow-sm p-40 bg-white text-center">
            <div className="position-relative d-inline-block mb-24">
              <div className="position-relative">
                <img 
                  /* 🌟 Fixed Image Path Logic */
                  src={displayData.profileImage && displayData.profileImage !== "sellers/default-avatar.png" 
                        ? `${IMAGE_BASE}${displayData.profileImage}` 
                        : "https://api.dicebear.com/7.x/initials/svg?seed=" + (displayData.shopName || "S")} 
                  className="rounded-circle border border-4 border-white shadow-lg bg-light" 
                  style={{ width: "120px", height: "120px", objectFit: 'cover' }}
                  alt="shop-logo" 
                  onError={(e) => { e.target.src = "https://api.dicebear.com/7.x/initials/svg?seed=Z"; }}
                />
                <label className="position-absolute bottom-0 end-0 btn btn-primary rounded-circle p-8 d-flex border-2 border-white shadow-sm cursor-pointer">
                   <Icon icon="solar:camera-add-bold" className="text-lg text-white" />
                   <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={isUpdating} />
                </label>
              </div>
              {isUpdating && <div className="mt-2 small text-primary fw-bold">Updating Logo...</div>}
            </div>

            <h3 className="fw-bold mb-4 text-dark">{displayData.shopName || "Store Name"}</h3>
            <p className="text-secondary mb-16">{displayData.description || "Verified Zhopingo Merchant Partner"}</p>
            
            <div className="d-flex justify-content-center">
               <span className={`badge ${displayData.isVerified ? 'bg-primary-focus text-primary-600' : 'bg-warning-focus text-warning-main'} radius-pill px-20 py-10 fw-bold text-xs uppercase`}>
                 <Icon icon={displayData.isVerified ? "solar:verified-check-bold" : "solar:clock-circle-bold"} className="me-1" />
                 {displayData.isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
               </span>
            </div>
          </div>
        </div>

        {/* --- 2. BUSINESS DETAILS (Admin UI - GST/PAN removed) --- */}
        <div className="col-lg-12">
          <div className="card radius-16 border-0 shadow-sm p-32 bg-white">
            <h6 className="fw-bold mb-24 uppercase text-primary-600 ls-1" style={{fontSize: '13px'}}>Account Information</h6>
            <div className="row g-4">
              <DetailBox label="Full Name" value={displayData.name} icon="solar:user-id-bold" />
              <DetailBox label="Email Address" value={displayData.email} icon="solar:letter-bold" />
              <DetailBox label="Mobile Number" value={displayData.phone} icon="solar:phone-bold" />
              <DetailBox label="Store Status" value={displayData.kycStatus?.toUpperCase()} icon="solar:shield-check-bold" isStatus />
            </div>
          </div>
        </div>

        {/* --- 3. PERFORMANCE & FINANCE (Sync with Dashboard) --- */}
        <div className="col-lg-7">
          <div className="card radius-16 border-0 shadow-sm p-32 bg-white h-100">
            <h6 className="fw-bold mb-24 uppercase text-secondary-light" style={{fontSize: '12px'}}>Performance Metrics</h6>
            <div className="row align-items-center">
               <div className="col-md-5 text-center border-end">
                  <h1 className="fw-900 mb-0 text-primary-600" style={{ fontSize: '56px' }}>4.9</h1>
                  <div className="d-flex justify-content-center gap-1 my-8">
                     {[1,2,3,4,5].map(i => <Icon key={i} icon="solar:star-bold" className="text-warning text-lg" />)}
                  </div>
                  <p className="text-secondary-light text-xs fw-bold uppercase mb-0 ls-1">Overall Rating</p>
               </div>
               <div className="col-md-7 ps-32">
                  <RatingBar label="Quality" width="95%" color="#485EC4" />
                  <RatingBar label="Service" width="88%" color="#485EC4" />
                  <RatingBar label="Delivery" width="92%" color="#485EC4" />
               </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
           <div className="card radius-16 border-0 shadow-sm p-32 bg-white h-100">
              <h6 className="fw-bold mb-24 uppercase text-secondary-light" style={{fontSize: '12px'}}>Settlement Summary</h6>
              <div className="p-24 radius-12 mb-16 d-flex justify-content-between align-items-center bg-primary-50 border border-primary-100">
                 <div>
                    <span className="text-primary-600 text-xs fw-bold uppercase">Total Revenue</span>
                    {/* 🌟 Dynamically synced with Dashboard Revenue */}
                    <h2 className="fw-900 mb-0 mt-4 text-dark">₹ {totalRevenue.toLocaleString()}</h2>
                 </div>
                 <Icon icon="solar:wallet-money-bold" className="text-4xl text-primary-600 opacity-25" />
              </div>
           </div>
        </div>

      </div>
    
    </div>
  );
};

// Helper Components
const DetailBox = ({ label, value, icon, isStatus }) => (
  <div className="col-md-3">
    <div className="d-flex align-items-center gap-3 p-16 radius-12 border bg-neutral-50 h-100">
      <div className="w-40-px h-40-px radius-10 bg-white d-flex justify-content-center align-items-center shadow-xs">
        <Icon icon={icon} className="text-primary-600 text-xl" />
      </div>
      <div className="overflow-hidden">
        <small className="text-xxs fw-bold text-secondary-light uppercase ls-1">{label}</small>
        <p className={`mb-0 text-xs fw-bold text-truncate ${isStatus ? 'text-primary-600' : 'text-dark'}`}>{value || "---"}</p>
      </div>
    </div>
  </div>
);

const RatingBar = ({ label, width, color }) => (
  <div className="d-flex align-items-center gap-3 mb-8">
    <span className="text-xxs fw-bold text-secondary-light" style={{ minWidth: '50px' }}>{label}</span>
    <div className="progress flex-grow-1 radius-pill" style={{ height: '8px', backgroundColor: '#F1F5F9' }}>
      <div className="progress-bar radius-pill" style={{ width, backgroundColor: color }} />
    </div>
  </div>
);

export default ProfilePage;