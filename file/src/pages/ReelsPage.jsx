import React, { useState, useEffect, useRef } from 'react';
import { Icon } from "@iconify/react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const THEME_GREEN = '#064E3B';

const ReelsPage = () => {
    const [reels, setReels] = useState([]);
    const [myProducts, setMyProducts] = useState([]); // 🌟 To store seller products
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [description, setDescription] = useState("");
    const [selectedProductId, setSelectedProductId] = useState(""); // 🌟 Linked Product ID
    
    const [viewReel, setViewReel] = useState(null);
    
    const API_BASE = "http://54.157.210.26/api/v1"; 
    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = localStorage.getItem("userToken");

    const fetchReels = async () => {
        try {
            const res = await axios.get(`${API_BASE}/reels`);
            if (res.data.success) {
                setReels(res.data.data);
            }
        } catch (err) {
            console.error("Fetch Reels Error", err);
        }
    };

    // 🌟 Fetch Seller Products for Linking
    const fetchSellerProducts = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE}/products/my-products`, config);
            if (res.data.success) {
                setMyProducts(res.data.data);
            }
        } catch (err) {
            console.error("Fetch Products Error", err);
        }
    };

    useEffect(() => {
        fetchReels();
        fetchSellerProducts();
    }, []);

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
        if (!selectedProductId) return toast.error("Please link a product to this reel");

        setLoading(true);
        const formData = new FormData();
        formData.append("video", videoFile);
        formData.append("sellerId", sellerData.id || sellerData._id);
        formData.append("description", description);
        formData.append("productId", selectedProductId); // 🌟 Sending selected product ID

        try {
            const res = await axios.post(`${API_BASE}/reels/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                toast.success("Reel Uploaded Successfully!");
                setShowModal(false);
                fetchReels();
                resetForm();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Upload Failed");
        } finally {
            setLoading(false);
        }
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
            <div className="d-flex justify-content-between align-items-center mb-24">
                <h4 className="fw-bold mb-0"></h4>
                <button 
                    onClick={() => setShowModal(true)}
                    className="btn d-flex align-items-center gap-2 text-white radius-12 px-20 py-10 fw-bold"
                    style={{ backgroundColor: THEME_GREEN }}
                >
                    <Icon icon="solar:add-circle-bold" className="text-xl" /> CREATE REEL
                </button>
            </div>

            {/* Reels Grid View */}
            <div className="row gy-4">
                {reels.length > 0 ? reels.map((reel) => (
                    <div className="col-sm-6 col-md-4 col-xl-3" key={reel._id}>
                        <div 
                            className="card radius-20 border-0 overflow-hidden shadow-sm bg-black position-relative cursor-pointer" 
                            style={{ height: '400px' }}
                            onClick={() => setViewReel(reel)}
                        >
                            <video src={reel.videoUrl} className="w-100 h-100" style={{ objectFit: 'cover' }} loop muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                            <div className="position-absolute bottom-0 w-100 p-16" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                                <p className="text-white text-xs mb-4">{reel.description}</p>
                                <div className="d-flex align-items-center text-white gap-1">
                                    <Icon icon="solar:heart-bold" className="text-danger" />
                                    <small>{reel.likes || 0}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-50 w-100">
                        <Icon icon="solar:play-circle-linear" className="text-6xl text-neutral-300 mb-16" />
                        <p className="text-secondary">No reels found.</p>
                    </div>
                )}
            </div>

            {/* 🌟 VIEW REEL MODAL (Center View) */}
            {viewReel && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 99999 }} onClick={() => setViewReel(null)}>
                    <div className="position-relative animate__animated animate__zoomIn" style={{ width: '100%', maxWidth: '400px', height: '80vh' }} onClick={(e) => e.stopPropagation()}>
                        <button className="position-absolute top-0 end-0 m-16 btn btn-light rounded-circle p-8 d-flex z-3 shadow" onClick={() => setViewReel(null)}>
                            <Icon icon="solar:close-circle-bold" className="text-2xl" />
                        </button>
                        <video src={viewReel.videoUrl} className="w-100 h-100 radius-24 shadow-lg" style={{ objectFit: 'cover' }} controls autoPlay loop />
                        
                        <div className="position-absolute bottom-0 w-100 p-24 radius-24" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.95))' }}>
                            <h6 className="text-white fw-bold mb-4">@Zhopingo Store</h6>
                            <p className="text-white-50 text-xs mb-12">{viewReel.description}</p>
                            
                            {/* 🌟 Linked Product Info in View */}
                            {viewReel.productId && (
                                <div className="bg-white p-12 radius-12 d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                        <Icon icon="solar:box-bold" className="text-primary-600 text-xl" />
                                        <div>
                                            <p className="mb-0 text-xs fw-bold text-dark">{viewReel.productId.name}</p>
                                            <p className="mb-0 text-xxs text-secondary">₹{viewReel.productId.price}</p>
                                        </div>
                                    </div>
                                    <button className="btn btn-sm text-white px-12 radius-8 fw-bold" style={{backgroundColor: THEME_GREEN, fontSize: '10px'}}>BUY NOW</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 CREATE REEL MODAL (With Product List Integration) */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg">
                            <div className="modal-header border-0 p-24 pb-0">
                                <h5 className="fw-bold">Create Store Reel</h5>
                                <button onClick={() => setShowModal(false)} className="btn-close shadow-none"></button>
                            </div>
                            <form onSubmit={handleUpload} className="modal-body p-24">
                                {/* Video Selector */}
                                <div className="radius-20 mb-20 d-flex flex-column align-items-center justify-content-center cursor-pointer overflow-hidden position-relative bg-neutral-100" style={{ height: '240px', border: '2px dashed #CBD5E1' }} onClick={() => document.getElementById('reelVideo').click()}>
                                    {videoPreview ? <video src={videoPreview} className="w-100 h-100" style={{ objectFit: 'contain' }} /> : 
                                    <div className="text-center"><Icon icon="solar:videocamera-add-bold" className="text-4xl text-neutral-400 mb-8" /><p className="text-xs text-secondary">Click to upload video</p></div>}
                                    <input type="file" id="reelVideo" hidden accept="video/*" onChange={handleVideoChange} />
                                </div>

                                <div className="mb-16">
                                    <label className="fw-bold text-xs mb-8 uppercase text-secondary">Description</label>
                                    <textarea className="form-control radius-12 p-12 text-sm" rows="2" placeholder="Tell more about this..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                                </div>

                                {/* 🌟 Product Selection Row (Horizontal List) */}
                                <div className="mb-24">
                                    <label className="fw-bold text-xs mb-12 uppercase text-secondary">Link Product *</label>
                                    <div className="d-flex gap-2 overflow-x-auto pb-8" style={{scrollbarWidth: 'none'}}>
                                        {myProducts.length > 0 ? myProducts.map((prod) => (
                                            <div 
                                                key={prod._id}
                                                className={`p-8 radius-12 border cursor-pointer transition-all flex-shrink-0 ${selectedProductId === prod._id ? 'border-success bg-success-focus shadow-sm' : 'bg-white'}`}
                                                style={{ minWidth: '130px', maxWidth: '130px' }}
                                                onClick={() => setSelectedProductId(prod._id)}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <Icon icon={selectedProductId === prod._id ? "solar:check-circle-bold" : "solar:box-linear"} className={selectedProductId === prod._id ? "text-success" : "text-secondary"} />
                                                    <div className="overflow-hidden">
                                                        <p className="mb-0 text-xxs fw-bold text-dark text-truncate">{prod.name}</p>
                                                        <p className="mb-0 text-xxs text-secondary">₹{prod.price}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-xxs text-muted">No products found. Add products first.</p>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="btn w-100 py-16 radius-16 text-white fw-bold shadow-lg" style={{ backgroundColor: THEME_GREEN }}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="solar:upload-minimalistic-bold" className="me-2" />}
                                    {loading ? "POSTING..." : "POST REEL"}
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