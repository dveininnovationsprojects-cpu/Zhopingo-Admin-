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

    // 🌟 Read More State to handle vertical expansion
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    const API_BASE = "https://api.zhopingo.in/api/v1"; 
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = localStorage.getItem("userToken");
    const sellerId = userData.id || userData._id; 

    const fetchReels = async () => {
        try {
            const res = await axios.get(`${API_BASE}/reels`);
            if (res.data.success) {
                const myReels = res.data.data.filter(r => r.sellerId === sellerId || r.sellerId?._id === sellerId);
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

    // 🌟 Scrollable Toggle Function
    const toggleDescription = (e, id) => {
        e.stopPropagation(); // Prevents reel from opening/closing
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
                fetchReels();
            }
        } catch (err) { toast.error("Delete Failed!"); }
        finally { setDeleteModal({ show: false, id: null }); }
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

    return (
        <div className="animate__animated animate__fadeIn">
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className="d-flex justify-content-between align-items-center mb-24 p-20 radius-12 shadow-sm border  position-relative" style={{ zIndex: 1 }}>
                <div>
                    <h5 className="fw-bold mb-0 text-primary-600 uppercase ls-1">My Reels Manager</h5>
                    <p className="text-secondary text-xs mb-0">Review and manage your store promotions</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary-600 d-flex align-items-center gap-2 text-white radius-8 px-24 py-12 fw-bold shadow-sm">
                    <Icon icon="solar:videocamera-add-bold" className="text-xl" /> CREATE REEL
                </button>
            </div>

            <div className="row gy-4">
                {reels.length > 0 ? reels.map((reel) => (
                    <div className="col-sm-6 col-md-4 col-xl-3" key={reel._id}>
                        <div className="card radius-16 border-0 overflow-hidden shadow-sm bg-black position-relative cursor-pointer transition-all hover-scale" 
                             style={{ height: '400px', zIndex: 0 }} onClick={() => setViewReel(reel)}>
                            
                            <button onClick={(e) => handleDeleteClick(e, reel._id)} className="position-absolute top-0 end-0 m-12 btn btn-danger p-8 rounded-circle d-flex z-1 opacity-75 hover-opacity-100 shadow-lg border-0">
                                <Icon icon="solar:trash-bin-minimalistic-bold" className="text-lg" />
                            </button>

                            <video src={reel.videoUrl} className="w-100 h-100 object-fit-cover" loop muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                            
                            <div className="position-absolute bottom-0 w-100 p-16" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', zIndex: 1 }}>
                                {reel.productId && (
                                    <div className="p-8 radius-10 mb-8 border border-white-10 d-flex align-items-center gap-2" 
                                         style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
                                        <Icon icon="solar:box-bold" className="text-primary-200 fs-6" /> 
                                        <p className="mb-0 text-xxs fw-bold text-white text-truncate uppercase ls-1">{reel.productId.name}</p>
                                    </div>
                                )}

                                {/* 🌟 Grid Vertical Scroll logic */}
                               {/* 🌟 Grid Vertical Scroll Description Fix */}
<div className="text-white text-xs mb-8 px-1 opacity-90" 
     style={{ 
        maxHeight: expandedDescriptions[reel._id] ? '100px' : '38px', 
        overflowY: expandedDescriptions[reel._id] ? 'auto' : 'hidden',
        transition: 'all 0.3s ease-in-out',
        lineHeight: '1.4',
        cursor: 'default'
     }}>
    {reel.description && reel.description.length > 40 && !expandedDescriptions[reel._id] ? (
        <p className="mb-0">
            {reel.description.substring(0, 40)}... 
            {/* 🌟 StopPropagation here stops video modal from opening */}
            <span 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpandedDescriptions(prev => ({ ...prev, [reel._id]: true }));
                }} 
                className="text-primary-200 fw-black ms-1 cursor-pointer"
                style={{ textDecoration: 'none' }}
            >
                Read More
            </span>
        </p>
    ) : (
        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
            {reel.description}
            {reel.description && reel.description.length > 40 && (
                <span 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedDescriptions(prev => ({ ...prev, [reel._id]: false }));
                    }} 
                    className="text-primary-200 fw-black ms-2 cursor-pointer small"
                    style={{ textDecoration: 'none' }}
                >
                    Show Less
                </span>
            )}
        </p>
    )}
</div>

                                <div className="d-flex align-items-center text-white gap-2">
                                    <Icon icon="solar:heart-linear" className="text-white opacity-75" />
                                    <small className="fw-bold opacity-80 text-xxs">{reel.likes || 0} Likes</small>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-80  radius-12 shadow-sm w-100 mx-3 border">
                        <Icon icon="solar:videocamera-off-broken" className="text-6xl text-neutral-200 mb-16" />
                        <p className="text-secondary fw-bold">No reels found in your store.</p>
                    </div>
                )}
            </div>

            {/* FULL VIEW MODAL */}
            {viewReel && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999 }}>
                    <div className="position-relative animate__animated animate__zoomIn" style={{ width: '100%', maxWidth: '380px', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
                        <button className="position-absolute top-0 end-0 m-16 btn btn-white rounded-circle p-8 d-flex z-3 shadow" onClick={() => setViewReel(null)}>
                            <Icon icon="solar:close-circle-bold" className="text-2xl text-primary-600" />
                        </button>
                        <video src={viewReel.videoUrl} className="w-100 h-100 radius-24 shadow-lg" style={{ objectFit: 'cover' }} controls autoPlay loop />
                        <div className="position-absolute bottom-0 w-100 p-24 radius-24" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.95))' }}>
                            <div className="d-flex align-items-center gap-2 mb-12"><Icon icon="solar:heart-linear" className="text-white text-xl opacity-75" /><span className="text-white fw-bold text-sm">{viewReel.likes || 0} Likes</span></div>
                            <h6 className="text-white fw-bold mb-4">@{userData.shopName || "Store"}</h6>
                            
                            {/* 🌟 Modal Vertical Scroll Description */}
                            <div className="text-white-50 text-xs mb-16 px-1 custom-scroll" style={{ maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                                {viewReel.description}
                            </div>

                            {viewReel.productId && (
                                <div className="p-12 radius-16 d-flex align-items-center shadow-lg border border-white-10" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(15px)' }}>
                                    <div className="w-44-px h-44-px radius-8  d-flex align-items-center justify-content-center me-12"><Icon icon="solar:box-bold" className="text-primary-600 text-xl" /></div>
                                    <div className="overflow-hidden text-white"><p className="mb-0 text-xs fw-bold text-truncate">{viewReel.productId.name}</p><p className="mb-0 text-xxs fw-bold opacity-75">Price: ₹{viewReel.productId.price}</p></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
                        <div className="modal-content radius-24 border-0 shadow-lg ">
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

            {/* CREATE REEL MODAL */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-0 p-24"><h5 className="fw-bold mb-0 text-dark">Publish New Reel</h5><button onClick={() => setShowModal(false)} className="btn-close shadow-none"></button></div>
                            <form onSubmit={handleUpload} className="modal-body p-24 pt-0 ">
                                <div className="radius-16 mb-20 d-flex flex-column align-items-center justify-content-center cursor-pointer overflow-hidden position-relative bg-light border border-dashed border-primary-200" style={{ height: '260px' }} onClick={() => document.getElementById('reelVideo').click()}>
                                    {videoPreview ? <video src={videoPreview} className="w-100 h-100" style={{ objectFit: 'contain' }} /> : 
                                    <div className="text-center text-primary-600"><Icon icon="solar:videocamera-add-bold" className="display-4 mb-8" /><p className="text-xs fw-bold">Click to select promotion video</p></div>}
                                    <input type="file" id="reelVideo" hidden accept="video/*" onChange={handleVideoChange} />
                                </div>
                                <div className="mb-20">
                                    <label className="fw-bold text-xs mb-8 uppercase text-secondary">Video Caption</label>
                                    <textarea className="form-control radius-12 p-12 text-sm" rows="3" placeholder="Tell something..." value={description} onChange={e => setDescription(e.target.value)} style={{ whiteSpace: 'pre-wrap' }}></textarea>
                                </div>
                                <div className="mb-32">
                                    <label className="fw-bold text-xs mb-12 uppercase text-secondary">Select Linked Product *</label>
                                    <div className="d-flex gap-2 overflow-x-auto pb-12 scroll-hide">
                                        {myProducts.map((prod) => (
                                            <div key={prod._id} className={`p-12 radius-12 border cursor-pointer flex-shrink-0 ${selectedProductId === prod._id ? 'border-primary-600 bg-primary-50 shadow-sm' : ''}`} style={{ minWidth: '140px' }} onClick={() => setSelectedProductId(prod._id)}>
                                                <p className="mb-0 text-xxs fw-bold text-dark text-truncate">{prod.name}</p><p className="mb-0 text-xxs text-primary-600 fw-900">₹{prod.price}</p>
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