import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast } from "react-toastify";

const THEME_GREEN = "#064E3B";
const MINT_GREEN = "#10B981";

const ProfilePage = ({ onLogout }) => {
  // LocalStorage-ல் இருந்து லாகின் டேட்டாவை எடுத்தல்
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  
  const [sellerDetails, setSellerDetails] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Production API URL (உங்கள் மற்ற பக்கங்களில் உள்ள அதே URL)
  const API_URL = "http://54.157.210.26/api/v1/admin/sellers";

  // 1. FETCH DYNAMIC SELLER DATA
  const fetchCurrentSellerData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      if (response.data.success) {
        // லாகின் செய்துள்ள செல்லரின் ID-ஐ வைத்து மட்டும் டேட்டாவை பிரித்தெடுத்தல்
        const currentSeller = response.data.data.find(s => s._id === userData._id || s.phone === userData.phone);
        if (currentSeller) {
          setSellerDetails(currentSeller);
        }
      }
    } catch (error) {
      console.error("Profile Fetch Error:", error.message);
      toast.error("Failed to load business details");
    } finally {
      setIsLoading(false);
    }
  };

  // செட்டிங்ஸ் கிளிக் செய்யும் போது மட்டும் டேட்டாவை லோடு செய்தல்
  useEffect(() => {
    if (showSettings) {
      fetchCurrentSellerData();
    }
  }, [showSettings]);

  // Display-க்காக டேட்டாவைத் தேர்ந்தெடுத்தல் (API டேட்டா இல்லையெனில் LocalStorage)
  const displayData = sellerDetails || userData;

  return (
    <div className="animate__animated animate__fadeIn pb-50">
      <div className="row gy-4">
        
        {/* --- 1. HEADER SECTION --- */}
        <div className="col-12">
          <div className="card radius-24 border-0 shadow-sm p-32 bg-white text-center">
            <div className="position-relative d-inline-block mb-16">
              <img 
                src="https://i.pravatar.cc/150" 
                className="rounded-circle border border-4 border-white shadow-sm" 
                style={{ width: "100px", height: "100px", objectFit: 'cover' }}
                alt="profile" 
              />
              {/*<button className="position-absolute bottom-0 end-0 btn btn-primary rounded-circle p-4 d-flex border-2 border-white shadow-sm">
                 <Icon icon="solar:pen-bold" className="text-sm" />
              </button>*/}
            </div>
            <h4 className="fw-bold mb-4">{displayData.shopName || "Zhopingo Store"}</h4>
            <div className="d-flex justify-content-center">
               <span className={`badge ${displayData.kycStatus === 'approved' ? 'bg-success-focus text-success' : 'bg-warning-focus text-warning'} radius-12 px-16 py-8 fw-bold text-xs uppercase`}>
                {displayData.kycStatus === 'approved' ? 'PRO SELLER' : 'APPROVED'}
               </span>
            </div>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-outline-neutral radius-12 px-16 py-8 fw-bold mt-16 text-xs transition-all"
              style={{ color: MINT_GREEN, borderColor: '#E2E8F0', maxWidth: '180px' }}
            >
              {showSettings ? 'CLOSE SETTINGS' : 'PROFILE SETTINGS'}
            </button>
          </div>
        </div>

        {/* --- 2. DYNAMIC PROFILE SETTINGS --- */}
        {showSettings && (
          <div className="col-12 animate__animated animate__fadeInDown">
            <div className="card radius-24 border-0 shadow-sm p-32 bg-white position-relative">
              {isLoading && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white opacity-75 radius-24 z-3">
                  <div className="spinner-border text-success"></div>
                </div>
              )}
              
              <h6 className="fw-bold mb-24 uppercase text-secondary-light" style={{fontSize: '12px'}}>Business Information</h6>
              <div className="row">
                <div className="col-md-6 mb-16">
                  <label className="form-label text-xs fw-bold">SHOP NAME</label>
                  <input type="text" className="form-control radius-12 h-48-px" defaultValue={displayData.shopName} />
                </div>
                <div className="col-md-6 mb-16">
                  <label className="form-label text-xs fw-bold">SELLER NAME</label>
                  <input type="text" className="form-control radius-12 h-48-px" defaultValue={displayData.name} />
                </div>
               {/* <div className="col-md-4 mb-16">
                  <label className="form-label text-xs fw-bold">GST NUMBER</label>
                  <input type="text" className="form-control radius-12 h-48-px" defaultValue={displayData.gstNumber} placeholder="Not Available" />
                </div>
                <div className="col-md-4 mb-16">
                  <label className="form-label text-xs fw-bold">PAN NUMBER</label>
                  <input type="text" className="form-control radius-12 h-48-px" defaultValue={displayData.panNumber} placeholder="Not Available" />
                </div>
                <div className="col-md-4 mb-16">
                  <label className="form-label text-xs fw-bold">HSN / MSME INFO</label>
                  <input type="text" className="form-control radius-12 h-48-px" defaultValue={displayData.hsnCode || ""} placeholder="Not Available" />
                </div>
                <div className="col-md-6 mb-16">
                   <label className="form-label text-xs fw-bold">PHONE NUMBER</label>
                   <div className="input-group">
                      <input type="text" className="form-control radius-12-start h-48-px" defaultValue={displayData.phone} readOnly />
                      <button className="btn btn-success-100 text-success-600 fw-bold px-20 radius-12-end">Verified</button>
                   </div>
                </div>*/}
                <div className="col-md-6 mb-16">
                   <label className="form-label text-xs fw-bold">EMAIL ADDRESS</label>
                   <div className="input-group">
                      <input type="text" className="form-control radius-12-start h-48-px" defaultValue={displayData.email} />
    
                   </div>
                </div>
              </div>
             {/* <button className="btn w-100 py-16 radius-16 text-white fw-bold mt-16 shadow-sm" style={{backgroundColor: MINT_GREEN}}>SAVE CHANGES</button>*/}
            </div>
          </div>
        )}

        {/* --- 3. STORE PERFORMANCE --- */}
        <div className="col-lg-7">
          <div className="card radius-24 border-0 shadow-sm p-32 bg-white h-100">
            <h6 className="fw-bold mb-24 uppercase text-secondary-light" style={{fontSize: '12px'}}>Store Performance and Insights</h6>
            <div className="row align-items-center">
               <div className="col-md-5 text-center border-end">
                  <h1 className="fw-900 mb-0" style={{ fontSize: '56px' }}>4.8</h1>
                  <div className="d-flex justify-content-center gap-1 my-8">
                     {[1,2,3,4,5].map(i => <Icon key={i} icon="solar:star-bold" className="text-warning" />)}
                  </div>
                  <p className="text-secondary-light text-xs fw-bold uppercase mb-0">1,240 Reviews</p>
               </div>
               <div className="col-md-7 ps-32">
                  <RatingBar label="5 Star" width="85%" color={MINT_GREEN} />
                  <RatingBar label="4 Star" width="12%" color={MINT_GREEN} />
                  <RatingBar label="3 Star" width="3%" color={MINT_GREEN} />
                  <RatingBar label="2 Star" width="0%" color={MINT_GREEN} />
                  <RatingBar label="1 Star" width="0%" color={MINT_GREEN} />
               </div>
            </div>
          </div>
        </div>

        {/* --- 4. FINANCIAL SUMMARY --- */}
        <div className="col-lg-5">
           <div className="card radius-24 border-0 shadow-sm p-32 bg-white h-100">
              <h6 className="fw-bold mb-24 uppercase text-secondary-light" style={{fontSize: '12px'}}>Financial Summary</h6>
              <div className="p-24 radius-20 mb-24 d-flex justify-content-between align-items-center" style={{backgroundColor: '#F8FAFC'}}>
                 <div>
                    <span className="text-secondary-light text-xs fw-bold uppercase">Available Balance</span>
                    <h2 className="fw-900 mb-0 mt-4 text-dark">₹ 25,780.00</h2>
                 </div>
            
              </div>
              <div className="d-flex justify-content-between align-items-center p-4">
                 <span className="text-sm fw-medium text-secondary">Pending Settlements</span>
                 <span className="text-sm fw-bold">₹ 4,200.00</span>
              </div>
           </div>
        </div>

        {/* Inventory sections remain static as per requirement 
        <div className="col-lg-6">
           <div className="card radius-24 border-0 shadow-sm p-24 bg-white">
              <h6 className="fw-bold mb-20 uppercase text-secondary-light" style={{fontSize: '12px'}}>Inventory Management</h6>
              <InventoryTile icon="solar:box-minimalistic-bold" title="Product Catalog" sub="View and edit all live products" />
              <InventoryTile icon="solar:bell-bing-bold" title="Low Stock Alerts" sub="5 items need attention" badge="5" />
              <InventoryTile icon="solar:map-point-bold" title="Pickup Locations" sub="Manage warehouse addresses" isLast />
           </div>
        </div>

        <div className="col-lg-6">
           <div className="card radius-24 border-0 shadow-sm p-24 bg-white">
              <h6 className="fw-bold mb-20 uppercase text-secondary-light" style={{fontSize: '12px'}}>Preferences</h6>
              <InventoryTile icon="solar:globus-bold" title="Change Language" sub="Current: English" isLast />
           </div>
        </div>*/}
      </div>
      
      <div className="mt-40 d-flex justify-content-center">
         <button 
           onClick={onLogout} 
           className="btn btn-outline-danger radius-12 py-10 px-32 fw-bold d-flex align-items-center gap-2 border-2"
           style={{ width: 'auto', fontSize: '13px' }}
         >
            <Icon icon="solar:logout-3-bold" className="text-lg" /> LOGOUT ACCOUNT
         </button>
      </div>
    </div>
  );
};

// Helper Components
const RatingBar = ({ label, width, color }) => (
  <div className="d-flex align-items-center gap-3 mb-4">
    <span className="text-xxs fw-bold text-secondary-light" style={{ minWidth: '40px' }}>{label}</span>
    <div className="progress flex-grow-1 radius-10" style={{ height: '6px', backgroundColor: '#F1F5F9' }}>
      <div className="progress-bar radius-10" style={{ width, backgroundColor: color }} />
    </div>
  </div>
);

const InventoryTile = ({ icon, title, sub, badge, isLast }) => (
  <div className={`d-flex align-items-center justify-content-between py-16 ${!isLast ? 'border-bottom' : ''} cursor-pointer hover-bg-neutral-50 transition-all`}>
    <div className="d-flex align-items-center gap-3">
      <div className="p-10 radius-12 bg-neutral-50">
         <Icon icon={icon} className="text-xl" style={{ color: MINT_GREEN }} />
      </div>
      <div>
         <div className="d-flex align-items-center gap-2">
            <h6 className="mb-0 text-sm fw-bold text-dark">{title}</h6>
            {badge && <span className="badge bg-danger text-white rounded-circle p-4 text-xxs" style={{width: '18px', height: '18px', display:'flex', alignItems:'center', justifyContent:'center'}}>{badge}</span>}
         </div>
         <p className="mb-0 text-xxs text-secondary-light">{sub}</p>
      </div>
    </div>
    <Icon icon="solar:alt-arrow-right-linear" className="text-secondary-light" />
  </div>
);

export default ProfilePage;