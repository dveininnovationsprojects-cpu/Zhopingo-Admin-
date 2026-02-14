import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const ProfilePage = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const token = localStorage.getItem("userToken");
  const sellerId = userData.id || userData._id;
  
  const [sellerDetails, setSellerDetails] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🌟 Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ field: "", label: "", value: "" });

  const API_BASE = "https://api.zhopingo.in/api/v1";
  const IMAGE_BASE = "https://api.zhopingo.in/uploads/";

  useEffect(() => {
    if (sellerId) {
        fetchProfileData();
        fetchSellerRevenue();
    }
  }, [sellerId]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/seller/dashboard/${sellerId}`);
      if (res.data.success) setSellerDetails(res.data.data);
    } catch (err) { console.error("Profile Load Error:", err); } 
    finally { setIsLoading(false); }
  };

  const fetchSellerRevenue = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_BASE}/orders/all`, config);
        if (res.data.success) {
            const myOrders = res.data.data.filter(order => order.sellerSplitData?.some(split => split.sellerId === sellerId));
            const revenue = myOrders.filter(o => o.status === "Delivered").reduce((acc, curr) => {
                const split = curr.sellerSplitData.find(s => s.sellerId === sellerId);
                return acc + (split?.sellerSubtotal || 0);
            }, 0);
            setTotalRevenue(revenue);
        }
    } catch (err) { console.error("Revenue Fetch Error", err); }
  };

  const handleUpdateField = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
        const res = await axios.put(`${API_BASE}/seller/update-profile/${sellerId}`, 
            { [editData.field]: editData.value },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
            toast.success(`${editData.label} Updated!`);
            fetchProfileData();
            setShowEditModal(false);
        }
    } catch (err) { toast.error("Update failed"); } 
    finally { setIsUpdating(false); }
  };

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
      if (res.data.success) { toast.success("Store Logo Updated!"); fetchProfileData(); }
    } catch (err) { toast.error("Logo upload failed"); } 
    finally { setIsUpdating(false); }
  };

  const displayData = sellerDetails || userData;

  const openEditor = (field, label, value) => {
    setEditData({ field, label, value });
    setShowEditModal(true);
  };

  return (
    <div className="animate__animated animate__fadeIn pb-50">
      <ToastContainer position="top-right" theme="colored" />
      
      <div className="row gy-4">
        {/* --- HEADER --- */}
        <div className="col-12">
          <div className="card radius-16 border-0 shadow-sm p-40 text-center">
            <div className="position-relative d-inline-block mb-12">
              <div className="position-relative">
                <img 
                  src={displayData.profileImage && displayData.profileImage !== "sellers/default-avatar.png" 
                        ? `${IMAGE_BASE}${displayData.profileImage}` 
                        : "https://api.dicebear.com/7.x/initials/svg?seed=" + (displayData.shopName || "S")} 
                  className="rounded-circle border border-4 border-white shadow-lg" 
                  style={{ width: "120px", height: "120px", objectFit: 'cover' }}
                  alt="shop-logo" 
                />
                <label className="position-absolute bottom-0 end-0 btn btn-primary rounded-circle p-8 d-flex border-2 border-white shadow-sm cursor-pointer">
                   <Icon icon="solar:camera-add-bold" className="text-lg text-white" />
                   <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <p className="text-primary-600 fw-bold text-xxs mb-20 uppercase ls-1">
                <Icon icon="solar:info-circle-bold" className="me-1" /> Only Use Company Logo/Brand Images
            </p>

            <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
               <h3 className="fw-bold mb-0 text-dark">{displayData.shopName}</h3>
               {/* 🌟 Shop Name Edit Icon */}
               <button onClick={() => openEditor("shopName", "Shop Name", displayData.shopName)} className="btn p-4 text-primary-600 hover-bg-primary-50 radius-8">
                  <Icon icon="solar:pen-bold" className="text-lg" />
               </button>
            </div>
            
            <div className="d-flex justify-content-center">
               <span className="badge bg-primary-focus text-primary-600 radius-pill px-20 py-10 fw-bold text-xs">VERIFIED PARTNER</span>
            </div>
          </div>
        </div>

        {/* --- ACCOUNT INFO --- */}
        <div className="col-12">
          <div className="card radius-16 border-0 shadow-sm p-32">
            <h6 className="fw-bold mb-24 uppercase text-primary-600 ls-1" style={{fontSize: '13px'}}>Account Information</h6>
            <div className="row g-4">
              <DetailBox label="Full Name" value={displayData.name} icon="solar:user-id-bold" onEdit={() => openEditor("name", "Full Name", displayData.name)} />
              <DetailBox label="Email Address" value={displayData.email} icon="solar:letter-bold" onEdit={() => openEditor("email", "Email Address", displayData.email)} />
              <DetailBox label="Mobile Number" value={displayData.phone} icon="solar:phone-bold" onEdit={() => openEditor("phone", "Mobile Number", displayData.phone)} />
              <div className="col-md-3">
                <div className="d-flex align-items-center gap-3 p-16 radius-12 border bg-neutral-50 h-100">
                   <div className="w-40-px h-40-px radius-10 d-flex justify-content-center align-items-center shadow-xs bg-white"><Icon icon="solar:shield-check-bold" className="text-primary-600 text-xl" /></div>
                   <div><small className="text-xxs fw-bold text-secondary-light uppercase">Store Status</small><p className="mb-0 text-xs fw-bold text-success">ACTIVE</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- REVENUE --- */}
        <div className="col-lg-12">
            <div className="card radius-16 border-0 shadow-sm p-32">
                <h6 className="fw-bold mb-24 uppercase text-secondary-light" style={{fontSize: '12px'}}>Settlement Summary</h6>
                <div className="p-24 radius-12 d-flex justify-content-between align-items-center bg-primary-50 border border-primary-100">
                    <div>
                        <span className="text-primary-600 text-xs fw-bold uppercase">Total Revenue</span>
                        <h2 className="fw-900 mb-0 mt-4 text-dark">₹ {totalRevenue.toLocaleString()}</h2>
                    </div>
                    <Icon icon="solar:wallet-money-bold" className="text-4xl text-primary-600 opacity-25" />
                </div>
            </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg p-12">
              <div className="modal-header border-0">
                <h5 className="fw-bold">Update {editData.label}</h5>
                <button className="btn-close shadow-none" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateField} className="modal-body">
                <div className="mb-20">
                    <label className="form-label text-xs fw-bold uppercase text-secondary">New {editData.label}</label>
                    <input type="text" className="form-control h-48-px radius-12" value={editData.value} onChange={(e) => setEditData({...editData, value: e.target.value})} required autoFocus />
                </div>
                <button type="submit" disabled={isUpdating} className="btn btn-primary-600 w-100 py-12 radius-12 fw-bold">
                    {isUpdating ? <span className="spinner-border spinner-border-sm me-2"></span> : "SAVE CHANGES"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component
const DetailBox = ({ label, value, icon, onEdit }) => (
  <div className="col-md-3">
    <div className="d-flex align-items-center justify-content-between p-16 radius-12 border bg-neutral-50 h-100 transition-all hover-border-primary">
      <div className="d-flex align-items-center gap-3 overflow-hidden">
        <div className="w-40-px h-40-px radius-10 d-flex justify-content-center align-items-center shadow-xs bg-white flex-shrink-0">
            <Icon icon={icon} className="text-primary-600 text-xl" />
        </div>
        <div className="overflow-hidden">
            <small className="text-xxs fw-bold text-secondary-light uppercase">{label}</small>
            <p className="mb-0 text-xs fw-bold text-dark text-truncate">{value || "---"}</p>
        </div>
      </div>
      <button onClick={onEdit} className="btn p-4 text-primary-600 hover-bg-primary-50 radius-8 flex-shrink-0">
         <Icon icon="solar:pen-bold" className="text-lg" />
      </button>
    </div>
  </div>
);

export default ProfilePage;