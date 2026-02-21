import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const MyAccountPage = () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = localStorage.getItem("userToken");
    const adminId = userData.id || userData._id;

    const [adminDetails, setAdminDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // 🌟 Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [editData, setEditData] = useState({ field: "", label: "", value: "" });
    const [passData, setPassData] = useState({ oldPass: "", newPass: "", confirmPass: "" });

    const API_BASE = "https://api.zhopingo.in/api/v1/admin";

    useEffect(() => { if (adminId) fetchAdminProfile(); }, [adminId]);

    const fetchAdminProfile = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/profile/${adminId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setAdminDetails(res.data.data);
        } catch (err) { console.error("Admin Profile Load Error"); }
        finally { setIsLoading(false); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${API_BASE}/update-profile/${adminId}`, 
                { [editData.field]: editData.value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                toast.success(`${editData.label} Updated!`);
                fetchAdminProfile();
                setShowEditModal(false);
            }
        } catch (err) { toast.error("Update failed"); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passData.newPass !== passData.confirmPass) return toast.error("New passwords don't match!");
        try {
            const res = await axios.put(`${API_BASE}/change-password/${adminId}`, passData, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                toast.success("Password Changed Successfully!");
                setShowPassModal(false);
                setPassData({ oldPass: "", newPass: "", confirmPass: "" });
            }
        } catch (err) { toast.error(err.response?.data?.message || "Password change failed"); }
    };

    const display = adminDetails || userData;

    return (
        <MasterLayout>
            <div className="animate__animated animate__fadeIn pb-50">
                <ToastContainer position="top-right" theme="colored" />
                
                <div className="row gy-4">
                    {/* --- ADMIN HEADER --- */}
                    <div className="col-12">
                        <div className="card radius-16 border-0 shadow-sm p-40 text-center bg-base">
                            <div className="position-relative d-inline-block mb-16">
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${display.name}`} className="rounded-circle border border-4 border-white shadow-lg w-100-px h-100-px" alt="admin" />
                               
                            </div>
                            <h4 className="fw-900 text-dark mb-4 uppercase">{display.name}</h4>
                            <p className="text-primary-600 fw-bold text-xs uppercase ls-1">Admin</p>
                        </div>
                    </div>

                    {/* --- ACCOUNT INFO --- */}
                    <div className="col-12">
                        <div className="card radius-16 border-0 shadow-sm p-32">
                            <h6 className="fw-bold mb-24 uppercase text-primary-600 ls-1">Personal Information</h6>
                            <div className="row g-4">
                                <DetailBox label="Full Name" value={display.name} icon="solar:user-bold" onEdit={() => {setEditData({field:"name", label:"Name", value:display.name}); setShowEditModal(true);}} />
                                
                                {/* 🌟 Email with Verified Badge ONLY */}
                                <div className="col-md-3">
                                    <div className="p-16 radius-12 border bg-neutral-50 h-100 d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3 overflow-hidden">
                                            <Icon icon="solar:letter-bold" className="text-primary-600 text-xl" />
                                            <div className="overflow-hidden">
                                                <small className="text-xxs fw-bold text-secondary-light uppercase">Email</small>
                                                <p className="mb-0 text-xs fw-bold text-dark text-truncate">{display.email}</p>
                                            </div>
                                        </div>
                                        <Icon icon="solar:check-circle-bold" className="text-success text-lg" title="Verified" />
                                    </div>
                                </div>

                                <DetailBox label="Phone" value={display.phone} icon="solar:phone-bold" onEdit={() => {setEditData({field:"phone", label:"Phone", value:display.phone}); setShowEditModal(true);}} />
                                <DetailBox label="City" value={display.city} icon="solar:city-bold" onEdit={() => {setEditData({field:"city", label:"City", value:display.city}); setShowEditModal(true);}} />
                                <DetailBox label="State" value={display.state} icon="solar:map-point-bold" onEdit={() => {setEditData({field:"state", label:"State", value:display.state}); setShowEditModal(true);}} />
                                <DetailBox label="Country" value={display.country} icon="solar:global-bold" onEdit={() => {setEditData({field:"country", label:"Country", value:display.country}); setShowEditModal(true);}} />

                                {/* 🌟 Password Section with Eye Icon */}
                                <div className="col-md-6">
                                    <div className="p-16 radius-12 border bg-neutral-50 h-100 d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <Icon icon="solar:lock-password-bold" className="text-primary-600 text-xl" />
                                            <div>
                                                <small className="text-xxs fw-bold text-secondary-light uppercase">Current Password</small>
                                                <p className="mb-0 text-xs fw-bold text-dark">
                                                    {showPassword ? "Admin@123" : "••••••••••••"} 
                                                </p>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => setShowPassword(!showPassword)} className="btn btn-sm p-4 text-secondary"><Icon icon={showPassword ? "solar:eye-closed-bold" : "solar:eye-bold"} className="text-lg" /></button>
                                            <button onClick={() => setShowPassModal(true)} className="btn btn-primary-600 btn-xs radius-8 fw-bold">CHANGE PASSWORD</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- EDIT INFO MODAL --- */}
                {showEditModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content radius-24 border-0 p-12 shadow-lg">
                                <div className="modal-header border-0"><h5 className="fw-bold">Update {editData.label}</h5><button className="btn-close" onClick={() => setShowEditModal(false)}></button></div>
                                <form onSubmit={handleUpdateProfile} className="modal-body">
                                    <input type="text" className="form-control h-48-px radius-12 mb-20" value={editData.value} onChange={(e)=>setEditData({...editData, value:e.target.value})} required />
                                    <button type="submit" className="btn btn-primary-600 w-100 py-12 radius-12 fw-bold">SAVE CHANGES</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CHANGE PASSWORD MODAL --- */}
                {showPassModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1200 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content radius-24 border-0 p-12 shadow-lg">
                                <div className="modal-header border-0"><h5 className="fw-black text-primary-600 uppercase ls-1">Change Account Password</h5><button className="btn-close" onClick={() => setShowPassModal(false)}></button></div>
                                <form onSubmit={handleChangePassword} className="modal-body">
                                    <div className="mb-16"><label className="text-xxs fw-bold uppercase text-muted">Old Password</label><input type="password" title="Enter old password" placeholder="••••••••" className="form-control h-44-px radius-12" value={passData.oldPass} onChange={(e)=>setPassData({...passData, oldPass:e.target.value})} required /></div>
                                    <div className="mb-16"><label className="text-xxs fw-bold uppercase text-muted">New Password</label><input type="password" title="Enter new password" placeholder="••••••••" className="form-control h-44-px radius-12" value={passData.newPass} onChange={(e)=>setPassData({...passData, newPass:e.target.value})} required /></div>
                                    <div className="mb-24"><label className="text-xxs fw-bold uppercase text-muted">Confirm New Password</label><input type="password" title="Confirm new password" placeholder="••••••••" className="form-control h-44-px radius-12" value={passData.confirmPass} onChange={(e)=>setPassData({...passData, confirmPass:e.target.value})} required /></div>
                                    <button type="submit" className="btn btn-primary-600 w-100 py-12 radius-12 fw-bold shadow-sm">UPDATE PASSWORD NOW</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MasterLayout>
    );
};

const DetailBox = ({ label, value, icon, onEdit }) => (
    <div className="col-md-3">
        <div className="p-16 radius-12 border bg-neutral-50 h-100 d-flex align-items-center justify-content-between transition-all hover-border-primary">
            <div className="d-flex align-items-center gap-3 overflow-hidden">
                <div className="w-40-px h-40-px radius-10 d-flex justify-content-center align-items-center bg-white shadow-xs flex-shrink-0"><Icon icon={icon} className="text-primary-600 text-xl" /></div>
                <div className="overflow-hidden"><small className="text-xxs fw-bold text-secondary-light uppercase">{label}</small><p className="mb-0 text-xs fw-bold text-dark text-truncate">{value || "---"}</p></div>
            </div>
            <button onClick={onEdit} className="btn p-4 text-primary-600 hover-bg-primary-50 radius-8 flex-shrink-0"><Icon icon="solar:pen-bold" className="text-lg" /></button>
        </div>
    </div>
);

export default MyAccountPage;