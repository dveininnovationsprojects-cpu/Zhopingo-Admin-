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
  const [kycDocs, setKycDocs] = useState(null); // 🌟 KYC Docs state
const [showDocModal, setShowDocModal] = useState(false); // 🌟 Doc update modal
const [uploadingDoc, setUploadingDoc] = useState({ field: "", label: "" });
const [showAddressModal, setShowAddressModal] = useState(false);
const [addressForm, setAddressForm] = useState({
    receiverName: "",
    flatNo: "",
    area: "",
    pincode: ""
});

  // 🌟 Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ field: "", label: "", value: "" });

  const API_BASE = "https://api.zhopingo.in/api/v1";
  // 🚀 THE FIX: CloudFront URL for Store Logo
const IMAGE_BASE = "https://d1utzn73483swp.cloudfront.net/";

useEffect(() => {
    if (sellerId) {
        fetchProfileData(); // Idhuvey Revenue-aiyum fetch pannidum
    }
}, [sellerId]);


const fetchProfileData = async () => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 🚀 Parallel Fetching for better performance
        const [dashRes, kycRes] = await Promise.all([
            axios.get(`${API_BASE}/seller/dashboard/${sellerId}`, config),
            axios.get(`${API_BASE}/seller/my-kyc?id=${sellerId}`, config)
        ]);

        // 1. Handle Dashboard & Revenue Data
        if (dashRes.data.success) {
            const data = dashRes.data.data;
            const profile = data.seller;
            
            setSellerDetails({
                ...profile,
                // 🚀 THE FIX: Syncing image keys and address keys from backend
                profileImage: profile.profileImage || profile.shopLogo, 
                shopAddress: profile.shopAddress || profile.address || {} 
            });

            setTotalRevenue(data.revenue || 0);
        }

        // 2. Handle KYC Documents Data 🌟
        if (kycRes.data.success) {
            setKycDocs(kycRes.data.data);
        }

    } catch (err) { 
        console.error("Profile Data Sync Error:", err);
        toast.error("Failed to sync profile information");
    } finally { 
        setIsLoading(false); 
    }
};
const handleAddressUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
        const url = `${API_BASE}/seller/add-address/${sellerId}`;
        const res = await axios.put(url, addressForm, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            toast.success("Pickup Address Updated!");
            fetchProfileData();
            setShowAddressModal(false);
        }
    } catch (err) {
        toast.error(err.response?.data?.message || "Address update failed");
    } finally {
        setIsUpdating(false);
    }
};
const handleDocUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(uploadingDoc.field, file);
    formData.append("sellerId", sellerId);

    setIsUpdating(true);
    try {
        const res = await axios.put(`${API_BASE}/seller/update-kyc`, formData, {
            headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
            toast.success(`${uploadingDoc.label} Updated!`);
            fetchProfileData();
        }
    } catch (err) { toast.error("Update failed"); }
    finally { setIsUpdating(false); }
};
// 2. Updated Display References (Around Line 100)
// short-circuiting use panni undefined values-ai thadukka
const displayData = sellerDetails || userData || {};
const shopAddress = {
    receiverName: displayData.shopAddress?.receiverName || displayData.name || "",
    flatNo: displayData.shopAddress?.flatNo || "",
    area: displayData.shopAddress?.area || "",
    pincode: displayData.shopAddress?.pincode || ""
};
// ProfilePage.jsx - fetchSellerRevenue update
const fetchSellerRevenue = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Direct dashboard sync
        const res = await axios.get(`${API_BASE}/seller/dashboard/${sellerId}`, config);
        if (res.data.success) {
            setTotalRevenue(res.data.data.revenue || 0);
        }
    } catch (err) { 
        console.error("Revenue Fetch Error", err); 
    }
};

const handleUpdateField = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
        const isAddressField = ["flatNo", "area", "pincode", "receiverName"].includes(editData.field);
        
        let payload = {};
        let url = "";

        if (isAddressField) {
            url = `${API_BASE}/seller/add-address/${sellerId}`;
            // 🌟 IMPORTANT: Backend expects ALL fields for validation
            // Namma existing data-voda serthu anuppanum
            payload = {
                receiverName: editData.field === "receiverName" ? editData.value : (sellerDetails?.shopAddress?.receiverName || "Seller"),
                flatNo: editData.field === "flatNo" ? editData.value : (sellerDetails?.shopAddress?.flatNo || "N/A"),
                area: editData.field === "area" ? editData.value : (sellerDetails?.shopAddress?.area || "N/A"),
                pincode: editData.field === "pincode" ? editData.value : (sellerDetails?.shopAddress?.pincode || ""),
                phone: sellerDetails?.phone || userData?.phone
            };
        } else {
            url = `${API_BASE}/seller/update-profile/${sellerId}`;
            payload = { [editData.field]: editData.value };
        }

        const res = await axios.put(url, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            toast.success("Updated Successfully!");
            fetchProfileData();
            setShowEditModal(false);
        }
    } catch (err) {
        console.error("Update Error:", err.response?.data);
        toast.error(err.response?.data?.message || "Update failed");
    } finally {
        setIsUpdating(false);
    }
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
    src={
        displayData.profileImage 
            ? (displayData.profileImage.startsWith('http') 
                ? displayData.profileImage // Case 1: Direct URL (already has http)
                : `${IMAGE_BASE}${displayData.profileImage}`) // Case 2: S3 Key (Add CloudFront Base)
            : (displayData.shopLogo 
                ? (displayData.shopLogo.startsWith('http') 
                    ? displayData.shopLogo 
                    : `${IMAGE_BASE}${displayData.shopLogo}`)
                : `https://api.dicebear.com/7.x/initials/svg?seed=${displayData.shopName || 'S'}`)
    } 
    className="rounded-circle border border-4 border-white shadow-lg" 
    style={{ width: "120px", height: "120px", objectFit: 'cover' }}
    alt="shop-logo"
    onError={(e) => {
        // Fallback if image fails to load
        e.target.onerror = null; 
        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${displayData.shopName || 'S'}`;
    }} 
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
        {/* --- PICKUP ADDRESS SECTION (New) --- */}
{/* --- PICKUP ADDRESS SECTION --- */}
<div className="col-12 mt-4">
  <div className="card radius-16 border-0 shadow-sm p-32">
    <div className="d-flex justify-content-between align-items-center mb-24">
        <div>
            <h6 className="fw-bold mb-0 uppercase text-primary-600 ls-1" style={{fontSize: '13px'}}>Pickup & Shipping Address</h6>
            <small className="text-secondary text-xxs">All fields are mandatory for Delhivery sync</small>
        </div>
        <button 
            onClick={() => {
                setAddressForm({
                    receiverName: shopAddress.receiverName,
                    flatNo: shopAddress.flatNo,
                    area: shopAddress.area,
                    pincode: shopAddress.pincode
                });
                setShowAddressModal(true);
            }} 
            className="btn btn-primary-600 btn-sm radius-8 px-16 fw-bold d-flex align-items-center gap-2"
        >
            <Icon icon="solar:pen-bold" /> UPDATE ADDRESS
        </button>
    </div>
    
    <div className="row g-4">
        <DetailDisplayBox label="Receiver Name" value={shopAddress.receiverName} icon="solar:user-speak-bold" />
        <DetailDisplayBox label="Pincode" value={shopAddress.pincode} icon="solar:streets-navigation-bold" />
        <DetailDisplayBox label="Flat / Building No" value={shopAddress.flatNo} icon="solar:home-bold" />
        <DetailDisplayBox label="Area / Street" value={shopAddress.area} icon="solar:map-point-bold" />
    </div>
  </div>
</div>
{/* --- KYC DOCUMENTS SECTION --- */}
{/* --- KYC DOCUMENTS SECTION --- */}
<div className="col-12 mt-4">
  <div className="card radius-16 border-0 shadow-sm p-32">
    <h6 className="fw-bold mb-24 uppercase text-primary-600 ls-1" style={{fontSize: '13px'}}>Verification Documents</h6>
    <div className="row g-4">
        {[
            { label: "PAN Card", field: "pan_doc", numField: "panNumber", data: kycDocs?.kycDocuments?.panDoc, num: kycDocs?.panNumber },
            { label: "GST Certificate", field: "gst_doc", numField: "gstNumber", data: kycDocs?.kycDocuments?.gstDoc, num: kycDocs?.gstNumber },
            { label: "FSSAI License", field: "fssai_doc", numField: "fssaiNumber", data: kycDocs?.kycDocuments?.fssaiDoc, num: kycDocs?.fssaiNumber },
            { label: "MSME", field: "msme_doc", numField: "msmeNumber", data: kycDocs?.kycDocuments?.msmeDoc, num: kycDocs?.msmeNumber }
        ].map((doc, idx) => (
            <div className="col-md-3" key={idx}>
                <div className="p-16 radius-12 border bg-neutral-50 h-100 transition-all hover-border-primary">
                    <div className="d-flex justify-content-between align-items-start mb-12">
                        <div className="w-40-px h-40-px radius-10 d-flex justify-content-center align-items-center shadow-xs bg-white">
                            <Icon icon="solar:document-bold" className="text-primary-600 text-xl" />
                        </div>
                        
                        {/* 🌟 ACTION HUB: File Update + Number Update Icons */}
                        <div className="d-flex gap-1">
                            {/* Number Edit Icon (MSME-ku kidayathu strictly) */}
                            {doc.numField !== "msmeNumber" && (
                                <button onClick={() => openEditor(doc.numField, `${doc.label} Number`, doc.num)} 
                                        className="btn p-4 text-primary-600 hover-bg-primary-50 radius-8">
                                    <Icon icon="solar:pen-new-square-bold" className="text-lg" />
                                </button>
                            )}
                            
                            {/* File Upload Icon */}
                            <label className="btn p-4 text-info-600 hover-bg-info-50 radius-8 cursor-pointer mb-0">
                                <Icon icon="solar:upload-bold" className="text-lg" />
                                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" 
                                       onChange={(e) => {
                                           setUploadingDoc({ field: doc.field, label: doc.label });
                                           handleDocUpdate(e);
                                       }} 
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <small className="text-xxs fw-bold text-secondary-light uppercase">{doc.label}</small>
                        
                        {/* 🚀 THE FIX: Hide Number strictly for MSME */}
                        {doc.numField !== "msmeNumber" ? (
                            <p className="mb-8 text-xs fw-bold text-dark text-truncate" title={doc.num}>
                                {doc.num || "---"}
                            </p>
                        ) : (
                            <div className="mb-8" style={{ height: '18px' }}></div> // Spacer for MSME
                        )}

                        {doc.data?.fullUrl ? (
                            <a href={doc.data.fullUrl} target="_blank" rel="noreferrer" 
                               className="text-primary-600 fw-bold text-xxs d-flex align-items-center gap-1 text-decoration-none transition-all hover-translate-x-2">
                                <Icon icon="solar:eye-bold" /> VIEW DOCUMENT
                            </a>
                        ) : (
                            <span className="text-danger text-xxs fw-medium italic">Not Uploaded</span>
                        )}
                    </div>
                </div>
            </div>
        ))}
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
    


{showAddressModal && (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg p-12">
                <div className="modal-header border-0">
                    <h5 className="fw-bold">Update Pickup Address</h5>
                    <button className="btn-close shadow-none" onClick={() => setShowAddressModal(false)}></button>
                </div>
                <form onSubmit={handleAddressUpdate} className="modal-body">
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label text-xs fw-bold uppercase">Receiver/Contact Name</label>
                            <input type="text" className="form-control radius-12" value={addressForm.receiverName} onChange={(e) => setAddressForm({...addressForm, receiverName: e.target.value})} required />
                        </div>
                        <div className="col-12">
                            <label className="form-label text-xs fw-bold uppercase">Pincode</label>
                            <input type="text" className="form-control radius-12" value={addressForm.pincode} onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})} required />
                        </div>
                        <div className="col-12">
                            <label className="form-label text-xs fw-bold uppercase">Flat / Building / House No</label>
                            <input type="text" className="form-control radius-12" value={addressForm.flatNo} onChange={(e) => setAddressForm({...addressForm, flatNo: e.target.value})} required />
                        </div>
                        <div className="col-12">
                            <label className="form-label text-xs fw-bold uppercase">Area / Street / Colony</label>
                            <input type="text" className="form-control radius-12" value={addressForm.area} onChange={(e) => setAddressForm({...addressForm, area: e.target.value})} required />
                        </div>
                    </div>
                    <button type="submit" disabled={isUpdating} className="btn btn-primary-600 w-100 py-16 radius-12 fw-bold mt-24">
                        {isUpdating ? "SAVING..." : "SAVE FULL ADDRESS"}
                    </button>
                </form>
            </div>
        </div>
    </div>

)}
        </div> // 🌟 Idhu dhaan main container close panra line. Modals-ku apparam varanum.
    );
}; // 🌟 Function strictly closes here ippo


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
const DetailDisplayBox = ({ label, value, icon }) => (
    <div className="col-md-3">
        <div className="d-flex align-items-center gap-3 p-16 radius-12 border bg-neutral-50 h-100">
            <div className="w-40-px h-40-px radius-10 d-flex justify-content-center align-items-center shadow-xs bg-white flex-shrink-0">
                <Icon icon={icon} className="text-primary-600 text-xl" />
            </div>
            <div className="overflow-hidden">
                <small className="text-xxs fw-bold text-secondary-light uppercase">{label}</small>
                <p className="mb-0 text-xs fw-bold text-dark text-truncate">{value || "---"}</p>
            </div>
        </div>
    </div>
);

export default ProfilePage;