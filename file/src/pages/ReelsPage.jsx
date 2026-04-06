import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const THEME_BLUE = '#485EC4'; 

const ReelsPage = () => {
    const [reels, setReels] = useState([]);
    const [myProducts, setMyProducts] = useState([]); 
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [description, setDescription] = useState("");
    const [selectedProductId, setSelectedProductId] = useState(""); 
    const [viewReel, setViewReel] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    // 🌟 41 & 43. New States for Likers, Viewers & Product Details
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [currentUsersList, setCurrentUsersList] = useState([]);
    const [listTitle, setListTitle] = useState("");
    const [showProductInfo, setShowProductInfo] = useState(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    const API_BASE = "https://api.zhopingo.in/api/v1"; 
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = localStorage.getItem("userToken");
    const sellerId = userData.id || userData._id; 
    // 🌟 41. Pagination States for Reels (Admin Sync)
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(12); // Grid layout-ku 12 standard

    const fetchReels = async () => {
        try {
            const res = await axios.get(`${API_BASE}/reels`);
            if (res.data.success) {
                // 🌟 Filter only my reels and Sort by Latest First
                const myReels = res.data.data
                    .filter(r => r.sellerId === sellerId || r.sellerId?._id === sellerId)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setReels(myReels);
            }
        } catch (err) { console.error("Fetch Reels Error", err); }
    };

    const fetchSellerProducts = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE}/products/my-products`, config);
            if (res.data.success) setMyProducts(res.data.data);
        } catch (err) { console.error("Fetch Products Error", err); }
    };

    useEffect(() => {
        if (sellerId) {
            fetchReels();
            fetchSellerProducts();
        }
    }, [sellerId]);

    // 🌟 41. Combined logic for Viewers & Likers with Latest First Sort
    const openUserList = (e, userList, title) => {
        e.stopPropagation();
        const latestFirstList = userList ? [...userList].reverse() : [];
        setCurrentUsersList(latestFirstList); 
        setListTitle(title); 
        setShowViewerModal(true);
    };

    // 🌟 41. Open Modal with Product & Seller Info
    const openProductInfo = (e, product, seller) => {
        e.stopPropagation();
        setShowProductInfo({ ...product, seller });
    };

    const toggleDescription = (e, id) => {
        e.stopPropagation(); 
        setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDeleteClick = (e, reelId) => {
        e.stopPropagation(); 
        setDeleteModal({ show: true, id: reelId });
    };

    const confirmDelete = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.delete(`${API_BASE}/reels/${deleteModal.id}`, config);
        
        if (res.data.success) {
            toast.success("Reel deleted successfully!");
            fetchReels(); // UI automatically updates
        }
    } catch (err) {
        console.error("Delete Error Details:", err.response?.data);
        // 🌟 Real-world standard: Show exact backend error message
        toast.error(err.response?.data?.message || "Internal Server Error during delete");
    } finally {
        setDeleteModal({ show: false, id: null });
    }
};

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!videoFile) return toast.error("Please select a video");
        if (!selectedProductId) return toast.error("Please link a product");
        setLoading(true);
        const formData = new FormData();
        formData.append("video", videoFile);
        formData.append("sellerId", sellerId); 
        formData.append("description", description);
        formData.append("productId", selectedProductId);

        try {
            const config = { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } };
            const res = await axios.post(`${API_BASE}/reels/upload`, formData, config);
            if (res.data.success) {
                toast.success("Reel Posted Successfully!");
                setShowModal(false);
                fetchReels();
                resetForm();
            }
        } catch (err) { toast.error("Upload Failed!"); } 
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setVideoFile(null);
        setVideoPreview(null);
        setDescription("");
        setSelectedProductId("");
    };
    // 🌟 41. Advanced Pagination Calculation Logic
const indexOfLastItem = currentPage * rowsPerPage;
const indexOfFirstItem = indexOfLastItem - rowsPerPage;
const currentReels = reels.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(reels.length / rowsPerPage);

// Reset to page 1 if total reels count changes (Filter sync)
useEffect(() => {
    setCurrentPage(1);
}, [reels.length]);

    return (
        <div className="animate__animated animate__fadeIn">
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className="d-flex justify-content-between align-items-center mb-24 p-20 radius-12 shadow-sm border bg-white position-relative" style={{ zIndex: 1 }}>
                <div>
                    <h5 className="fw-bold mb-0 text-primary-600 uppercase ls-1">My Reels</h5>
                    <p className="text-secondary text-xs mb-0 fw-bold">Active Reels: {reels.length}</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary-600 d-flex align-items-center gap-2 text-white radius-8 px-24 py-12 fw-bold shadow-sm">
                    <Icon icon="solar:videocamera-add-bold" className="text-xl" /> CREATE NEW REEL
                </button>
            </div>

           <div className="row gy-4">
    {currentReels.length > 0 ? currentReels.map((reel) => (
                    <div className="col-sm-6 col-md-4 col-xl-3" key={reel._id}>
                        <div className="card radius-16 border-0 overflow-hidden shadow-sm bg-black position-relative cursor-pointer transition-all hover-scale" 
                             style={{ height: '420px', zIndex: 0 }} onClick={() => setViewReel(reel)}>
                            
                            <button onClick={(e) => handleDeleteClick(e, reel._id)} className="position-absolute top-0 end-0 m-12 btn btn-danger w-32-px h-32-px p-0 rounded-8 d-flex align-items-center justify-content-center z-1 opacity-75 hover-opacity-100 shadow-lg border-0">
                                <Icon icon="solar:trash-bin-minimalistic-bold" />
                            </button>
                            {/* 🌟 BLOCKED LABEL (If Admin blocked this reel) */}
{reel.isBlocked && (
    <div className="position-absolute top-0 start-0 m-12 z-2 badge bg-danger text-white px-12 py-6 radius-4 shadow-lg animate__animated animate__pulse animate__infinite">
        <Icon icon="solar:shield-warning-bold" className="me-1" /> BLOCKED BY ADMIN
    </div>
)}

                            <video src={reel.videoUrl} className="w-100 h-100 object-fit-cover" loop muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                            
                            <div className="position-absolute bottom-0 w-100 p-16" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', zIndex: 1 }}>
                                {/* 🌟 41. Clickable Linked Product [sync with Admin] */}
                                {reel.productId && (
                                    <div className="p-8 radius-10 mb-8 border border-white-10 d-flex align-items-center gap-2 cursor-pointer transition-all hover-bg-white-20" 
                                         style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)' }}
                                         onClick={(e) => openProductInfo(e, reel.productId, userData)}>
                                        <Icon icon="solar:box-bold" className="text-primary-200 fs-6" /> 
                                        <p className="mb-0 text-xxs fw-black text-white text-truncate uppercase ls-1">{reel.productId.name}</p>
                                    </div>
                                )}

                                {/* 🌟 Scrollable Grid Description */}
                                <div className="text-white text-xs mb-12 px-1 opacity-90" 
                                     style={{ maxHeight: expandedDescriptions[reel._id] ? '100px' : '38px', overflowY: expandedDescriptions[reel._id] ? 'auto' : 'hidden', transition: 'all 0.3s ease' }}>
                                    {reel.description && reel.description.length > 40 && !expandedDescriptions[reel._id] ? (
                                        <p className="mb-0">{reel.description.substring(0, 40)}... <span onClick={(e) => toggleDescription(e, reel._id)} className="text-primary-200 fw-black ms-1 cursor-pointer">Read More</span></p>
                                    ) : (
                                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{reel.description} {reel.description?.length > 40 && <span onClick={(e) => toggleDescription(e, reel._id)} className="text-primary-200 fw-black ms-2 cursor-pointer small">Show Less</span>}</p>
                                    )}
                                </div>

                             {/* 🌟 Removed White Line for Seller Reels */}
<div className="d-flex align-items-center justify-content-between text-white pt-4">
    <div className="d-flex align-items-center gap-1 cursor-pointer hover-text-primary-200" onClick={(e) => openUserList(e, reel.likedBy, "Reel Likers")}>
        <Icon icon="solar:heart-linear" className="text-white opacity-75" />
        <small className="fw-bold opacity-80 text-xxs">{reel.likes || 0} Likes</small>
    </div>
    <div className="d-flex align-items-center gap-1 cursor-pointer hover-text-primary-200" onClick={(e) => openUserList(e, reel.viewers, "Reel Viewers")}>
        <Icon icon="solar:eye-linear" className="text-white opacity-75" />
        <small className="fw-bold opacity-80 text-xxs">{reel.views || 0} Views</small>
    </div>
</div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-80 bg-white radius-16 shadow-sm w-100 mx-3 border">
                        <Icon icon="solar:videocamera-off-broken" className="text-6xl text-neutral-200 mb-16" />
                        <p className="text-secondary fw-bold">No promotion reels created yet.</p>
                    </div>
                )}
            </div>
            <div className="card-footer bg-white border radius-12 mt-24 py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap shadow-sm" style={{ position: 'relative', zIndex: 10 }}>
                
                {/* Rows Selection */}
                <div className="d-flex align-items-center gap-2 border-end pe-3">
                    <span className="text-xs text-secondary fw-bold">Rows per page:</span>
                    <select 
                        className="form-select form-select-sm w-auto radius-8 border-0 fw-bold bg-light shadow-none" 
                        value={rowsPerPage} 
                        onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                    </select>
                </div>

                {/* Page Navigation */}
                <div className="d-flex align-items-center gap-2">
                    <button 
                        disabled={currentPage === 1} 
                        onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
                        className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"
                    >
                        <Icon icon="solar:alt-arrow-left-linear" />
                    </button>

                    <div className="d-flex gap-1 align-items-center px-2">
                        <span className="text-xs fw-bold text-dark">Page {currentPage} of {totalPages || 1}</span>
                    </div>

                    <button 
                        disabled={currentPage >= totalPages} 
                        onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
                        className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"
                    >
                        <Icon icon="solar:alt-arrow-right-linear" />
                    </button>
                </div>
            </div>

            {/* 🌟 USER INTERACTION MODAL (Likers/Viewers with Scroll) */}
            {showViewerModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content radius-24 border-0 shadow-lg bg-white overflow-hidden">
                            <div className="modal-header border-bottom p-20 bg-light">
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2"><Icon icon="solar:users-group-rounded-bold" className="text-primary-600" /> {listTitle}</h6>
                                <button onClick={() => setShowViewerModal(false)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {currentUsersList.length > 0 ? currentUsersList.map((user, idx) => (
                                    <div key={idx} className="d-flex align-items-center gap-3 p-16 border-bottom">
                                        <div className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"><Icon icon="solar:user-bold" className="text-primary-600" /></div>
                                        <div className="overflow-hidden"><p className="mb-0 text-sm fw-bold text-dark text-truncate">{user.name || "oxplow User"}</p><small className="text-secondary text-xxs">{user.phone || "No Phone"}</small></div>
                                    </div>
                                )) : <div className="text-center py-40 text-muted opacity-50"><Icon icon="solar:ghost-broken" className="fs-1 mb-2" /><p className="text-xs fw-bold">No interactions found.</p></div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 LINKED PRODUCT PROFILE MODAL */}
            {showProductInfo && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 99999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom p-20 bg-primary-50">
                                <h6 className="mb-0 fw-bold text-primary-600 uppercase ls-1">Linked Product Info</h6>
                                <button onClick={() => setShowProductInfo(null)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-24">
                                <div className="d-flex gap-3 mb-20 border-bottom pb-16 align-items-center">
                                    <div className="w-60-px h-60-px bg-light radius-12 d-flex align-items-center justify-content-center border"><Icon icon="solar:box-bold" className="text-primary-600 fs-2" /></div>
                                    <div><h5 className="mb-1 fw-black text-dark uppercase">{showProductInfo.name}</h5><p className="mb-0 text-success-main fw-black">Selling Price: ₹{showProductInfo.price}</p></div>
                                </div>
                                <label className="text-xxs fw-bold text-muted uppercase d-block mb-8 ls-1">Your Store Info</label>
                                <div className="p-16 radius-16 bg-light border"><h6 className="text-sm fw-bold mb-1 text-dark">@{userData.shopName}</h6><p className="text-xs text-primary-600 fw-bold mb-0">Owner: {userData.name}</p></div>
                            </div>
                            <div className="modal-footer border-0 p-16 pt-0"><button className="btn btn-primary-600 w-100 radius-12 fw-bold" onClick={() => setShowProductInfo(null)}>CLOSE PROFILE</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL ZOOM REEL MODAL (Design preserved) */}
            {viewReel && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" 
                     style={{ backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999 }} onClick={() => setViewReel(null)}>
                    <div className="position-relative animate__animated animate__zoomIn" style={{ width: '100%', maxWidth: '380px', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
                        <button className="position-absolute top-0 end-0 m-16 btn btn-white rounded-circle p-8 d-flex z-3 shadow" onClick={() => setViewReel(null)}>
                            <Icon icon="solar:close-circle-bold" className="text-2xl text-primary-600" />
                        </button>
                        <video src={viewReel.videoUrl} className="w-100 h-100 radius-24 shadow-lg" style={{ objectFit: 'cover' }} controls autoPlay loop />
                        {viewReel.isBlocked && (
    <div className="badge bg-danger mb-12 d-inline-block">
        BLOCKED: {viewReel.blockReason || "Content Violation"}
    </div>
)}
                        <div className="position-absolute bottom-0 w-100 p-24" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.98))', borderRadius: '0 0 24px 24px' }}>
                             <h6 className="text-white fw-bold mb-4">@{userData.shopName}</h6>
                             <div className="text-white-50 text-xs mb-16 px-1 custom-scroll" style={{ maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{viewReel.description}</div>
                             {viewReel.productId && (
                                <div className="p-12 radius-16 d-flex align-items-center shadow-lg border border-white-10 cursor-pointer" 
                                     style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(15px)' }}
                                     onClick={(e) => openProductInfo(e, viewReel.productId, userData)}>
                                    <div className="w-40-px h-40-px radius-8 bg-white d-flex align-items-center justify-content-center me-12"><Icon icon="solar:box-bold" className="text-primary-600 fs-5" /></div>
                                    <div className="overflow-hidden text-white"><p className="mb-0 text-xs fw-bold text-truncate">{viewReel.productId.name}</p><p className="mb-0 text-xxs fw-bold opacity-75">Price: ₹{viewReel.productId.price}</p></div>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

           {/* DELETE MODAL (Strictly Centered Icon Fix) */}
{deleteModal.show && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 99999 }}>
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
            <div className="modal-content radius-24 border-0 shadow-lg bg-white">
                <div className="modal-body text-center p-40">
                    
                    {/* 🌟 THE FIX: Added d-flex, justify-content-center & mx-auto */}
                    <div className="d-flex justify-content-center mb-24">
                        <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-flex justify-content-center align-items-center animate__animated animate__shakeX">
                            <Icon icon="solar:trash-bin-minimalistic-bold" className="text-4xl" />
                        </div>
                    </div>

                    <h5 className="mb-12 fw-bold text-dark">Delete Reel?</h5>
                    <p className="text-secondary-light mb-32 text-sm">Are you sure you want to delete this reel? This action cannot be undone.</p>
                    
                    <div className="d-flex justify-content-center gap-3">
                        <button onClick={() => setDeleteModal({show:false, id:null})} className="btn btn-light px-24 py-12 radius-12 fw-bold text-dark border-0">Cancel</button>
                        <button onClick={confirmDelete} className="btn btn-danger-600 px-24 py-12 radius-12 fw-bold shadow-sm uppercase ls-1">Yes, Delete</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}

            {/* CREATE REEL MODAL (Functionality preserved) */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-0 p-24 pb-0 d-flex justify-content-between">
                                <h5 className="fw-bold mb-0 text-dark">Publish Promotion Reel</h5>
                                <button onClick={() => {setShowModal(false); resetForm();}} className="btn-close shadow-none"></button>
                            </div>
                            <form onSubmit={handleUpload} className="modal-body p-24">
                                <div className="radius-16 mb-20 d-flex flex-column align-items-center justify-content-center cursor-pointer overflow-hidden position-relative bg-light border border-dashed border-primary-200" style={{ height: '240px' }} onClick={() => document.getElementById('reelVideo').click()}>
                                    {videoPreview ? <video src={videoPreview} className="w-100 h-100" style={{ objectFit: 'contain' }} /> : 
                                    <div className="text-center text-primary-600"><Icon icon="solar:videocamera-add-bold" className="display-4 mb-8" /><p className="text-xs fw-bold">Upload MP4 Video Promo</p></div>}
                                    <input type="file" id="reelVideo" hidden accept="video/*" onChange={handleVideoChange} />
                                </div>
                                <div className="mb-20">
                                    <label className="fw-bold text-xs mb-8 uppercase text-secondary ls-1">Description</label>
                                    <textarea className="form-control radius-12 p-12 text-sm border-light-gray shadow-none" rows="3" placeholder="Describe your product promo..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                                </div>
                                <div className="mb-32">
                                    <label className="fw-bold text-xs mb-12 uppercase text-secondary ls-1">Link Your Product *</label>
                                    <div className="d-flex gap-2 overflow-x-auto pb-12 scroll-hide">
                                        {myProducts.map((prod) => (
                                            <div key={prod._id} className={`p-12 radius-12 border cursor-pointer flex-shrink-0 transition-all ${selectedProductId === prod._id ? 'border-primary-600 bg-primary-50' : 'bg-white'}`} style={{ minWidth: '140px' }} onClick={() => setSelectedProductId(prod._id)}>
                                                <p className="mb-0 text-xxs fw-bold text-dark text-truncate">{prod.name}</p><p className="mb-0 text-xxs text-primary-600 fw-black">₹{prod.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary-600 w-100 py-16 radius-12 text-white fw-bold shadow-lg uppercase ls-1" style={{ backgroundColor: '#485EC4' }}>
                                    {loading ? (<div className="d-flex align-items-center justify-content-center gap-2"><span className="spinner-border spinner-border-sm text-white"></span><span className="text-white">POSTING...</span></div>) : 
                                    (<div className="d-flex align-items-center justify-content-center gap-2"><Icon icon="solar:upload-minimalistic-bold" className="fs-5 text-white" /><span className="text-white">POST REEL</span></div>)}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReelsPage;