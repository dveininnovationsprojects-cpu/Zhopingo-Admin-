import React, { useState, useEffect } from 'react';
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const AdminReels = () => {
    const [reels, setReels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const API_BASE = "https://api.zhopingo.in/api/v1";

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

    const openDeleteModal = (id) => {
        setDeleteModal({ show: true, id: id });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ show: false, id: null });
    };

    const confirmDelete = async () => {
        try {
            const res = await axios.delete(`${API_BASE}/reels/${deleteModal.id}`);
            if (res.data.success) {
                toast.success("Reel deleted permanently!");
                fetchAllReels();
            }
        } catch (err) {
            toast.error("Delete operation failed");
        } finally {
            closeDeleteModal();
        }
    };

    return (
        <MasterLayout>
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className='card h-100 p-0 radius-12 overflow-hidden border-0 shadow-sm'>
                <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between'>
                    <h6 className='text-lg fw-semibold mb-0 text-primary-600'>Store Reels Manager</h6>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary-focus text-primary-main px-12 py-6 radius-4">
                            Count: {reels.length}
                        </span>
                    </div>
                </div>

                <div className='card-body p-24 bg-light-50'>
                    {isLoading ? (
                        <div className="text-center py-50">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : (
                        <div className='row gy-4'>
                            {reels.length > 0 ? reels.map((reel) => (
                                <div className='col-xxl-3 col-md-4 col-sm-6' key={reel._id}>
                                    <div className='border-0 bg-base radius-16 overflow-hidden shadow-sm h-100 position-relative animate__animated animate__fadeIn'>
                                        
                                        {/* 🎥 Video Section - Sound Fixed */}
                                        <div className='position-relative bg-black' style={{ height: '320px' }}>
                                            <video 
                                                src={reel.videoUrl} 
                                                className='w-100 h-100 object-fit-cover'
                                                /* 🌟 Sound fix: 'muted' attribute-ah thookittaen, ippo mouse vecha sound-oda play aagum */
                                                loop
                                                onMouseOver={e => {
                                                    e.target.muted = false; // Mouse veikkum pothu sound on pannum
                                                    e.target.play();
                                                }}
                                                onMouseOut={e => {
                                                    e.target.pause();
                                                }}
                                            />
                                            <button 
                                                onClick={() => openDeleteModal(reel._id)}
                                                className='btn btn-danger-600 w-36-px h-36-px d-flex justify-content-center align-items-center position-absolute top-0 end-0 m-12 z-1 radius-8 shadow-lg border-white border-2'
                                            >
                                                <Icon icon='lucide:trash-2' className="text-lg" />
                                            </button>
                                        </div>

                                        <div className='p-16'>
                                            <div className="d-flex align-items-center gap-2 mb-12 pb-8 border-bottom">
                                                <Icon icon="solar:shop-bold-duotone" className="text-primary-600 text-2xl" />
                                                <h6 className='text-sm fw-bold mb-0 text-dark text-truncate'>
                                                    {reel.sellerId?.shopName || reel.sellerId?.name || "Zhopingo Store"}
                                                </h6>
                                            </div>
                                            
                                            <p className='text-secondary-light mb-16 text-xs' style={{ minHeight: '32px' }}>
                                                {reel.description || "Video showcasing store products."}
                                            </p>

                                            {reel.productId && (
                                                <div className="bg-primary-50 p-10 radius-12 d-flex align-items-center gap-3 border border-primary-100">
                                                    <div className="w-40-px h-40-px bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm">
                                                        <Icon icon="solar:box-bold" className="text-success-600 text-xl" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="mb-0 text-xxs fw-900 text-dark text-truncate">{reel.productId.name}</p>
                                                        <p className="mb-0 text-xxs fw-bold text-primary-600">₹{reel.productId.price}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-50 w-100 bg-white radius-16 shadow-sm">
                                    <Icon icon="solar:videocamera-off-broken" className="text-6xl text-neutral-200 mb-16" />
                                    <p className="text-secondary fw-semibold">No Reels Found in Database.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {deleteModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
                        <div className="modal-content radius-24 border-0 shadow-lg animate__animated animate__zoomIn">
                            <div className="modal-body text-center p-40">
                                <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24">
                                    <Icon icon="lucide:alert-triangle" className="text-4xl" />
                                </div>
                                <h5 className="mb-12 fw-bold text-dark">Delete this Reel?</h5>
                                <div className="d-flex justify-content-center gap-3">
                                    <button onClick={closeDeleteModal} className="btn btn-outline-secondary-light px-24 radius-12 fw-bold">No, Keep it</button>
                                    <button onClick={confirmDelete} className="btn btn-danger-600 px-24 radius-12 fw-bold">Yes, Delete</button>
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