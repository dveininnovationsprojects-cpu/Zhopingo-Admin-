import React, { useState, useEffect } from 'react';
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const THEME_BLUE = '#485EC4'; 

const AdminReels = () => {
    const [reels, setReels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewReel, setViewReel] = useState(null); 
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    // 🌟 Read More State
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    const API_BASE = "https://api.zhopingo.in/api/v1";
    const token = localStorage.getItem("userToken");

    const fetchAllReels = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/reels`);
            if (res.data.success) {
                setReels(res.data.data);
            }
        } catch (err) {
            console.error("Fetch Reels Error", err);
            toast.error("Failed to load reels");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReels();
    }, []);

    // 🌟 Scrollable Toggle Function
    const toggleDescription = (e, id) => {
        e.stopPropagation();
        setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openDeleteModal = (e, id) => {
        e.stopPropagation(); 
        setDeleteModal({ show: true, id: id });
    };

    const confirmDelete = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.delete(`${API_BASE}/reels/${deleteModal.id}`, config);
            if (res.data.success) {
                toast.success("Reel deleted permanently!");
                fetchAllReels();
            }
        } catch (err) {
            toast.error("Delete operation failed");
        } finally {
            setDeleteModal({ show: false, id: null });
        }
    };

    return (
        <MasterLayout>
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className='card h-100 p-0 radius-12 overflow-hidden border-0 shadow-sm' style={{ position: 'relative', zIndex: 1 }}>
                {/* 🌟 Header: Added z-index fix for profile dropdown overlap */}
                <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between' style={{ position: 'relative', zIndex: 10 }}>
                    <div>
                        <h6 className='text-lg fw-semibold mb-0 text-primary-600 uppercase ls-1'>Store Reels Manager</h6>
                        <small className="text-secondary-light text-xs">Review and manage all uploaded store reels</small>
                    </div>
                    {/* 🌟 Badge Visibility Fix */}
                    <span className="badge bg-primary-600 text-white px-16 py-8 radius-pill fw-bold shadow-sm">
                        Total Reels: {reels.length}
                    </span>
                </div>

                <div className='card-body p-24 bg-light-gray'>
                    {isLoading ? (
                        <div className="text-center py-50">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : (
                        <div className='row gy-4'>
                            {reels.length > 0 ? reels.map((reel) => (
                                <div className='col-xxl-3 col-md-4 col-sm-6' key={reel._id}>
                                    <div 
                                        className='card border-0 bg-black radius-16 overflow-hidden shadow-sm h-100 position-relative cursor-pointer transition-all hover-scale'
                                        style={{ height: '400px', zIndex: 0 }}
                                        onClick={() => setViewReel(reel)}
                                    >
                                        {/* 🗑️ DELETE ICON (Internal Stability Fix) */}
                                        <button 
                                            onClick={(e) => openDeleteModal(e, reel._id)}
                                            className='btn btn-danger w-36-px h-36-px d-flex justify-content-center align-items-center position-absolute top-0 end-0 m-12 z-1 radius-8 shadow-lg border-0 opacity-75 hover-opacity-100'
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            <Icon icon='solar:trash-bin-minimalistic-bold' className="text-lg" />
                                        </button>

                                        <video 
                                            src={reel.videoUrl} 
                                            className='w-100 h-100 object-fit-cover'
                                            loop muted
                                            onMouseOver={e => e.target.play()}
                                            onMouseOut={e => e.target.pause()}
                                        />

                                        <div className="position-absolute bottom-0 w-100 p-16" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', zIndex: 2 }}>
                                            
                                            {reel.productId && (
                                                <div className="p-8 radius-10 mb-8 border border-white-10 d-flex align-items-center gap-2" 
                                                     style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
                                                    <Icon icon="solar:box-bold" className="text-primary-200 fs-6" /> 
                                                    <p className="mb-0 text-xxs fw-bold text-white text-truncate uppercase ls-1">
                                                        {reel.productId.name}
                                                    </p>
                                                </div>
                                            )}

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
            {/* 🌟 'e.stopPropagation' is crucial here to stop video opening */}
            <span 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpandedDescriptions(prev => ({ ...prev, [reel._id]: true }));
                }} 
                className="text-primary-200 fw-black ms-1 cursor-pointer"
                style={{ textDecoration: 'none', borderBottom: '1px solid transparent' }}
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

                                            <div className="d-flex align-items-center gap-2 mb-8">
                                                <small className="text-white-50 fw-bold text-truncate text-xxs">@{reel.sellerId?.shopName || "Zhopingo Store"}</small>
                                            </div>

                                            <div className="d-flex align-items-center text-white gap-2">
                                                <Icon icon="solar:heart-linear" className="text-white opacity-75" />
                                                <small className="fw-bold opacity-80 text-xxs">{reel.likes || 0} Likes</small>
                                            </div>
                                        </div>
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

            {/* FULL VIEW MODAL */}
            {viewReel && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 99999 }} onClick={() => setViewReel(null)}>
                    <div className="position-relative animate__animated animate__zoomIn" style={{ width: '100%', maxWidth: '380px', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
                        <button className="position-absolute top-0 end-0 m-16 btn btn-white rounded-circle p-8 d-flex z-3 shadow" onClick={() => setViewReel(null)}>
                            <Icon icon="solar:close-circle-bold" className="text-2xl text-primary-600" />
                        </button>
                        <video src={viewReel.videoUrl} className="w-100 h-100 radius-24 shadow-lg" style={{ objectFit: 'cover' }} controls autoPlay loop />
                        <div className="position-absolute bottom-0 w-100 p-24 radius-24" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.95))' }}>
                            <div className="d-flex align-items-center gap-2 mb-12"><Icon icon="solar:heart-linear" className="text-white text-xl opacity-75" /><span className="text-white fw-bold text-sm">{viewReel.likes || 0} Likes</span></div>
                            <h6 className="text-white fw-bold mb-4">@{viewReel.sellerId?.shopName || "Store"}</h6>
                            <div className="text-white-50 text-xs mb-16 px-1" style={{ maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{viewReel.description}</div>
                            {viewReel.productId && (
                                <div className="p-12 radius-16 d-flex align-items-center shadow-lg border border-white-10" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(15px)' }}>
                                    <div className="w-44-px h-44-px radius-8 bg-white d-flex align-items-center justify-content-center me-12"><Icon icon="solar:box-bold" className="text-primary-600 text-xl" /></div>
                                    <div className="overflow-hidden text-white"><p className="mb-0 text-xs fw-bold text-truncate">{viewReel.productId.name}</p><p className="mb-0 text-xxs fw-bold opacity-75">MRP: ₹{viewReel.productId.price}</p></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
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
        </MasterLayout>
    );
};

export default AdminReels;