import React, { useState, useEffect } from 'react';
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const AdminReels = () => {
    const [reels, setReels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewReel, setViewReel] = useState(null); 
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    // 🌟 viewer list modal-kaga pudhu states
const [showViewerModal, setShowViewerModal] = useState(false);
const [currentViewers, setCurrentViewers] = useState([]);
// 🌟 41. State for Product & Seller Details Pop-up
const [showProductInfo, setShowProductInfo] = useState(null);
// 🌟 41. Show views count and Show liked   customers list logic
// 🌟 combined state for list title
const [listTitle, setListTitle] = useState("Viewers List");

// 🌟 41. combined logic for Viewers & Likers
// 🌟 43. combined logic for Viewers & Likers with Latest First Sort
const openUserList = (e, userList, title) => {
    e.stopPropagation();
    
    // 🌟 [.reverse()] use panni latest view/like panna customers-ai top-la kondu varugirom
    const latestFirstList = userList ? [...userList].reverse() : [];
    
    setCurrentViewers(latestFirstList); 
    setListTitle(title); 
    setShowViewerModal(true);
};
    const API_BASE = "https://api.zhopingo.in/api/v1";
    const token = localStorage.getItem("userToken");

   const fetchAllReels = async () => {
    setIsLoading(true);
    try {
        const res = await axios.get(`${API_BASE}/reels`);
        if (res.data.success) {
            // 🌟 Sort by Date before setting state (Latest First)
            const sortedReels = res.data.data.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setReels(sortedReels);
        }
    } catch (err) { toast.error("Failed to load reels"); } 
    finally { setIsLoading(false); }
};

    useEffect(() => {
        fetchAllReels();
    }, []);

    const toggleDescription = (e, id) => {
        e.preventDefault();
        e.stopPropagation(); 
        setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openDeleteModal = (e, id) => {
        e.stopPropagation(); 
        setDeleteModal({ show: true, id: id });
    };

const confirmDelete = async () => {
    try {
        // 🌟 AUTH SYNC: Backend 'protect' middleware-ku Token thevai
        const config = { 
            headers: { Authorization: `Bearer ${token}` } 
        };
        
        // 🌟 Path matching your router: router.delete('/:id', ...)
        const res = await axios.delete(`${API_BASE}/reels/${deleteModal.id}`, config);
        
        if (res.data.success) {
            toast.success("Reels deleted successfully!");
            fetchAllReels(); // Refresh table instantaneous-ah nadakkum
        }
    } catch (err) {
        console.error("Delete Error Details:", err.response?.data);
        toast.error(err.response?.data?.message || "Internal Server Error during delete");
    } finally {
        setDeleteModal({ show: false, id: null });
    }
};
    // 🌟 41. Open Modal with Product & Seller Info
const openProductInfo = (e, product, seller) => {
    e.stopPropagation(); // Reel zoom modal open aaguratha thadukka
    setShowProductInfo({ ...product, seller });
};

    return (
        
        <MasterLayout>
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className='card h-100 p-0 radius-12 overflow-hidden border-0 shadow-sm' style={{ position: 'relative', zIndex: 1 }}>
                <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between' style={{ position: 'relative', zIndex: 10 }}>
                    <div>
                        <h6 className='text-lg fw-semibold mb-0 text-primary-600 uppercase ls-1'>Store Reels Manager</h6>
                        <small className="text-secondary-light text-xs">Review and manage all uploaded store reels</small>
                    </div>
                    {/* 🌟 Count Badge Visibility Fix */}
                    <span className="badge bg-primary-600 text-white px-16 py-8 radius-pill fw-bold shadow-sm">
                        Total Reels: {reels.length}
                    </span>
                </div>

                <div className='card-body p-24 bg-light-gray'>
                    {isLoading ? (
                        <div className="text-center py-50"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <div className='row gy-4'>
                            {reels.length > 0 ? reels.map((reel) => (
                                <div className='col-xxl-3 col-md-4 col-sm-6' key={reel._id}>
                                    <div 
                                        className='card border-0 bg-black radius-16 overflow-hidden shadow-sm h-100 position-relative cursor-pointer transition-all hover-scale'
                                        style={{ height: '420px', zIndex: 0 }}
                                        onClick={() => setViewReel(reel)}
                                    >
                                        {/* 🌟 BLOCKED LABEL (If Backend isBlocked is true) */}
                                        {reel.isBlocked && (
                                            <div className="position-absolute top-0 start-0 m-12 z-2 badge bg-danger text-white px-12 py-6 radius-4 shadow-lg animate__animated animate__pulse animate__infinite">
                                                <Icon icon="solar:shield-warning-bold" className="me-1" /> BLOCKED
                                            </div>
                                        )}

                                        <button 
                                            onClick={(e) => openDeleteModal(e, reel._id)}
                                            className='btn btn-danger w-36-px h-36-px d-flex justify-content-center align-items-center position-absolute top-0 end-0 m-12 z-1 radius-8 shadow-lg border-0 opacity-75 hover-opacity-100'
                                        >
                                            <Icon icon='solar:trash-bin-minimalistic-bold' className="text-lg" />
                                        </button>

                                        <video src={reel.videoUrl} className='w-100 h-100 object-fit-cover' loop muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />

                                        <div className="position-absolute bottom-0 w-100 p-16" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', zIndex: 2 }}>
                                          {/* 🌟 41. Clickable Product & Seller Info Area */}
{reel.productId && (
    <div 
        className="p-8 radius-10 mb-8 border border-white-10 d-flex align-items-center gap-2 cursor-pointer transition-all hover-bg-white-20" 
        style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}
        onClick={(e) => openProductInfo(e, reel.productId, reel.sellerId)}
    >
        <Icon icon="solar:box-bold" className="text-primary-200 fs-6" /> 
        <div className="overflow-hidden">
            <p className="mb-0 text-xxs fw-black text-white text-truncate uppercase ls-1">{reel.productId.name}</p>
            <small className="text-white-50 fw-bold" style={{ fontSize: '9px' }}>By: {reel.sellerId?.shopName || "Store"}</small>
        </div>
    </div>
)}

                                            {/* 🌟 Desktop & Mobile Fixed Read More Logic */}
                                            <div className="text-white text-xs mb-8 px-1 opacity-90" 
                                                 style={{ 
                                                    maxHeight: expandedDescriptions[reel._id] ? '120px' : '38px', 
                                                    overflowY: expandedDescriptions[reel._id] ? 'auto' : 'hidden',
                                                    transition: 'all 0.3s ease'
                                                 }}>
                                                {reel.description && reel.description.length > 40 && !expandedDescriptions[reel._id] ? (
                                                    <p className="mb-0">
                                                        {reel.description.substring(0, 40)}... 
                                                        <span onClick={(e) => toggleDescription(e, reel._id)} className="text-primary-200 fw-black ms-1 cursor-pointer">Read More</span>
                                                    </p>
                                                ) : (
                                                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {reel.description}
                                                        {reel.description && reel.description.length > 40 && (
                                                            <span onClick={(e) => toggleDescription(e, reel._id)} className="text-primary-200 fw-black ms-2 cursor-pointer small">Show Less</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="d-flex align-items-center gap-2 mb-8">
                                                <small className="text-white-50 fw-bold text-truncate text-xxs">@{reel.sellerId?.shopName || "Store"}</small>
                                            </div>
                                            {/* 🌟 Clickable Likes Area */}
{/* 🌟 41. Fixed Alignment - Removed White Line */}
<div className="d-flex align-items-center justify-content-between text-white pt-4">
    
    {/* 🌟 Likes - Left Side */}
    <div 
        className="d-flex align-items-center gap-1 cursor-pointer hover-text-primary-200"
        onClick={(e) => openUserList(e, reel.likedBy, "Liked Customers List")} 
    >
        <Icon icon="solar:heart-linear" className="text-white opacity-75" style={{ fontSize: '18px' }} />
        <small className="fw-bold opacity-80 text-xxs">{reel.likes || 0} Likes</small>
    </div>

    {/* 🌟 Views - Right Side */}
    <div 
        className="d-flex align-items-center gap-1 cursor-pointer hover-text-primary-200"
        onClick={(e) => openUserList(e, reel.viewers, "Viewed Customers List")} 
    >
        <Icon icon="solar:eye-linear" className="text-white opacity-75" style={{ fontSize: '18px' }} />
        <small className="fw-bold opacity-80 text-xxs">{reel.views || 0} Views</small>
    </div>
</div>                       </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-80 w-100 bg-white radius-16 shadow-sm border mx-3">
                                    <Icon icon="solar:videocamera-off-broken" className="text-6xl text-neutral-200 mb-16" />
                                    <p className="text-secondary fw-semibold">No Reels Found in Database.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* FULL VIEW MODAL & DELETE MODAL (Design preserved) */}
            {viewReel && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 99999 }} onClick={() => setViewReel(null)}>
                    <div className="position-relative animate__animated animate__zoomIn" style={{ width: '100%', maxWidth: '380px', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
                        <button className="position-absolute top-0 end-0 m-16 btn btn-white rounded-circle p-8 d-flex z-3 shadow" onClick={() => setViewReel(null)}>
                            <Icon icon="solar:close-circle-bold" className="text-2xl text-primary-600" />
                        </button>
                        <video src={viewReel.videoUrl} className="w-100 h-100 radius-24 shadow-lg" style={{ objectFit: 'cover' }} controls autoPlay loop />
                        <div className="position-absolute bottom-0 w-100 p-24 radius-24" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.95))' }}>
                            {viewReel.isBlocked && <div className="badge bg-danger mb-2">BLOCKED: {viewReel.blockReason || "Content Violation"}</div>}
                            <div className="d-flex align-items-center gap-2 mb-12"><Icon icon="solar:heart-linear" className="text-white text-xl opacity-75" /><span className="text-white fw-bold text-sm">{viewReel.likes || 0} Likes</span></div>
                            <h6 className="text-white fw-bold mb-4">@{viewReel.sellerId?.shopName || "Store"}</h6>
                            <div className="text-white-50 text-xs mb-16 px-1" style={{ maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{viewReel.description}</div>
                            {/* 🌟 41. Inside Zoom Reel Modal - Clickable Product Info */}
{viewReel.productId && (
    <div 
        className="p-12 radius-16 d-flex align-items-center shadow-lg border border-white-10 cursor-pointer transition-all hover-bg-white-20" 
        style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(15px)' }}
        // 🌟 Ippo zoom modal-la irundhu click pannaalum same details modal open aagum
        onClick={(e) => openProductInfo(e, viewReel.productId, viewReel.sellerId)}
    >
        <div className="w-44-px h-44-px radius-8 bg-white d-flex align-items-center justify-content-center me-12 shadow-sm">
            <Icon icon="solar:box-bold" className="text-primary-600 text-xl" />
        </div>
        <div className="overflow-hidden text-white">
            <p className="mb-0 text-xs fw-black text-truncate uppercase ls-1">{viewReel.productId.name}</p>
            <p className="mb-0 text-xxs fw-bold opacity-90">MRP: ₹{viewReel.productId.price}</p>
            <small className="text-white-50 fw-bold" style={{ fontSize: '9px' }}>Tap for Seller Details</small>
        </div>
    </div>
)}
                        </div>
                    </div>
                </div>
            )}

            {deleteModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 99999 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
                        <div className="modal-content radius-24 border-0 shadow-lg bg-white">
                            <div className="modal-body text-center p-40">
                                <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24"><Icon icon="solar:trash-bin-minimalistic-bold" className="text-4xl" /></div>
                                <h5 className="mb-12 fw-bold text-dark">Delete Reel?</h5>
                                <div className="d-flex justify-content-center gap-3">
                                    <button onClick={() => setDeleteModal({show:false, id:null})} className="btn btn-outline-neutral px-24 radius-12 fw-bold">Cancel</button>
                                    <button onClick={confirmDelete} className="btn btn-danger-600 px-24 radius-12 fw-bold shadow-sm">Yes, Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 🌟 Viewer List Modal UI */}
{/* 🌟 Viewer/Liker List Modal UI with Internal Scroll */}
{showViewerModal && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999999 }}>
        <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content radius-24 border-0 shadow-lg bg-white overflow-hidden">
                <div className="modal-header border-bottom p-20 bg-light">
                    <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                        <Icon icon="solar:users-group-rounded-bold" className="text-primary-600" /> 
                        {listTitle}
                    </h6>
                    <button onClick={() => setShowViewerModal(false)} className="btn-close shadow-none"></button>
                </div>
                
                {/* 🌟 Scroll logic: list perusa pona modal body-kullaeye scroll aagum */}
                <div className="modal-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {currentViewers.length > 0 ? (
                        <ul className="list-group list-group-flush">
                            {currentViewers.map((user, idx) => (
                                <li key={idx} className="list-group-item d-flex align-items-center gap-3 p-16 border-bottom">
                                    <div className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                        <Icon icon="solar:user-bold" className="text-primary-600" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="mb-0 text-sm fw-bold text-dark text-truncate">
                                            {user.name || "Zhopingo User"}
                                        </p>
                                        <small className="text-secondary text-xxs">
                                            {user.phone || "No Phone"}
                                        </small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-40 opacity-50">
                            <Icon icon="solar:ghost-broken" className="text-4xl mb-2" />
                            <p className="text-sm fw-bold">No interactions recorded yet.</p>
                        </div>
                    )}
                </div>
                <div className="modal-footer p-12 bg-light border-top text-center">
                    <small className="text-xxs fw-bold text-muted uppercase">Total: {currentViewers.length}</small>
                </div>
            </div>
        </div>
    </div>
)}
{/* 🌟 41. PRODUCT & SELLER DETAILS POP-UP MODAL */}
{showProductInfo && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999999 }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                <div className="modal-header border-bottom p-20 bg-primary-50">
                    <h6 className="mb-0 fw-bold text-primary-600 uppercase ls-1">Product Details</h6>
                    <button onClick={() => setShowProductInfo(null)} className="btn-close shadow-none"></button>
                </div>
                <div className="modal-body p-24">
                    {/* Product Summary */}
                    <div className="d-flex align-items-center gap-3 mb-20 border-bottom pb-16">
                        <div className="w-60-px h-60-px bg-neutral-100 radius-12 d-flex align-items-center justify-content-center border">
                            <Icon icon="solar:box-bold" className="text-primary-600 fs-2" />
                        </div>
                        <div>
                            <h5 className="mb-1 fw-black text-dark uppercase" style={{ fontSize: '16px' }}>{showProductInfo.name}</h5>
                            <span className="badge bg-success-focus text-success-main radius-4 text-xxs">PRICE: ₹{showProductInfo.price}</span>
                        </div>
                    </div>

                    {/* Seller Details */}
                    <label className="text-xxs fw-bold text-muted uppercase mb-8 d-block">Store Information</label>
                    <div className="p-16 radius-16 bg-light border border-neutral-200 shadow-sm">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <Icon icon="solar:shop-bold" className="text-primary-600" />
                            <span className="text-sm fw-bold text-dark">{showProductInfo.seller?.shopName || "Zhopingo Store"}</span>
                        </div>
                        <p className="mb-0 text-xs text-secondary-light fw-medium">
                            <b>Owner:</b> {showProductInfo.seller?.name || "Admin"}
                        </p>
                    </div>
                </div>
                <div className="modal-footer border-top p-16">
                    <button className="btn btn-primary-600 w-100 radius-12 fw-bold uppercase" onClick={() => setShowProductInfo(null)}>Close Details</button>
                </div>
            </div>
        </div>
    </div>
)}
        </MasterLayout>
    );
};

export default AdminReels;