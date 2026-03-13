import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const PayoutsPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("settlements"); // settlements | settings | ledger
    const [showGenModal, setShowGenModal] = useState(false); 
    
    // Data States
    const [settlements, setSettlements] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [financeSettings, setFinanceSettings] = useState({
        commissionPercent: 10,
        gstOnCommissionPercent: 18,
        tdsPercent: 2,
        deductForwardDelivery: true,
        deductReturnDelivery: true
    });

    // Generate Form State
    const [genForm, setGenForm] = useState({ sellerId: "", startDate: "", endDate: "" });

    const token = localStorage.getItem("userToken");
    const API_BASE = "https://api.zhopingo.in/api/v1/admin";

    // 🌟 1. FETCH LOGIC (Sync with your Backend API)
    const fetchFinanceData = async () => {
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [resSettings, resSettlements, resSellers] = await Promise.all([
                axios.get(`${API_BASE}/finance-settings`, config),
                // 🚀 CALLING YOUR NEW BACKEND GET ROUTE
                axios.get(`${API_BASE}/settlements/all`, config),
                axios.get(`${API_BASE}/sellers`, config)
            ]);

            if (resSettings.data.success) setFinanceSettings(resSettings.data.data);
            if (resSettlements.data.success) setSettlements(resSettlements.data.data);
            if (resSellers.data.success) setSellers(resSellers.data.data);
            
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Database sync failed!");
        } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchFinanceData(); }, []);

    // 🚀 2. GENERATE NEW SETTLEMENT (POST logic)
    const handleGenerate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`${API_BASE}/generate-settlement`, genForm, config);

            if (res.data.success) {
                toast.success("Settlement Processed Successfully!");
                setShowGenModal(false);
                fetchFinanceData(); // instantaneous-ah table update aagum
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Generation failed");
        } finally { setIsLoading(false); }
    };

    // ⚙️ 3. UPDATE SETTINGS (PUT logic)
    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.put(`${API_BASE}/finance-settings`, financeSettings, config);
            if (res.data.success) toast.success("Finance Master Rules Updated!");
        } catch (err) { toast.error("Update failed!"); }
    };

    return (
        <MasterLayout>
            <div className="p-0 animate__animated animate__fadeIn">
                <ToastContainer position="top-right" autoClose={2000} theme="colored" />

                {/* 🚀 Header Block with Tabs */}
                <div className="d-flex align-items-center justify-content-between mb-24 p-24 radius-12 border bg-white shadow-sm">
                    <div>
                        <h5 className="fw-bold mb-0 text-primary-600 uppercase ls-1">Finance & Payouts</h5>
                        <p className="text-secondary text-xs mb-0 fw-bold">Settlement Cycle: Weekly (Mon-Sun)</p>
                    </div>
                    <div className="d-flex gap-2 bg-light p-4 radius-12">
                        <button onClick={() => setActiveTab("settlements")} className={`btn btn-sm px-20 py-10 radius-8 fw-bold border-0 ${activeTab === 'settlements' ? 'btn-white shadow-sm text-primary-600' : 'text-secondary'}`}>Settlements</button>
                        <button onClick={() => setActiveTab("settings")} className={`btn btn-sm px-20 py-10 radius-8 fw-bold border-0 ${activeTab === 'settings' ? 'btn-white shadow-sm text-primary-600' : 'text-secondary'}`}>Settings</button>
                        <button onClick={() => setActiveTab("ledger")} className={`btn btn-sm px-20 py-10 radius-8 fw-bold border-0 ${activeTab === 'ledger' ? 'btn-white shadow-sm text-primary-600' : 'text-secondary'}`}>Ledger</button>
                    </div>
                </div>

                {/* 💰 TAB 1: WEEKLY SETTLEMENTS */}
                {activeTab === "settlements" && (
                    <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                        <div className="card-header bg-white border-bottom py-16 px-24 d-flex justify-content-between">
                            <h6 className="mb-0 fw-bold">Bank Settlement History</h6>
                            <button onClick={() => setShowGenModal(true)} className="btn btn-primary-600 btn-sm radius-8 fw-bold px-16">Generate New Settlement</button>
                        </div>
                        <div className="table-responsive">
                            <table className="table basic-border-table mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr className="text-xxs fw-black uppercase text-secondary">
                                        <th className="ps-24">Shop Name</th>
                                        <th>Week Range</th>
                                        <th>Deductions</th>
                                        <th>Final Payable</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settlements.length > 0 ? settlements.map((item, index) => (
                                        <tr key={item._id} className="hover-bg-neutral-50 transition-all">
                                            <td className="ps-24">
                                                <span className="fw-bold text-dark">{item.sellerId?.shopName || "Syncing..."}</span>
                                            </td>
                                            <td><span className="text-xs fw-bold">{item.weekRange}</span></td>
                                            <td>
                                                <div className="d-flex flex-column text-danger-600 fw-bold" style={{fontSize: '10px'}}>
                                                    <span>COMM: -₹{item.commissionTotal}</span>
                                                    <span>GST: -₹{item.gstTotal}</span>
                                                </div>
                                            </td>
                                            <td><span className="text-success-main fw-900 fs-5">₹{item.finalPayable?.toFixed(2)}</span></td>
                                            <td><span className={`badge radius-pill ${item.status === 'Paid' ? 'bg-success-focus text-success-main' : 'bg-warning-focus text-warning-main'}`}>{item.status}</span></td>
                                        </tr>
                                    )) : <tr><td colSpan="5" className="text-center py-80 text-muted">No data found in database.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ⚙️ TAB 2: FINANCE SETTINGS */}
                {activeTab === "settings" && (
                    <div className="row justify-content-center">
                        <div className="col-lg-6">
                            <div className="card radius-16 border-0 shadow-sm p-32 bg-white">
                                <h6 className="fw-bold mb-24 border-bottom pb-12">Global Settlement Rules</h6>
                                <form onSubmit={handleUpdateSettings}>
                                    <div className="mb-20">
                                        <label className="text-xs fw-bold text-secondary uppercase mb-8 d-block">Commission (%)</label>
                                        <input type="number" className="form-control radius-10 h-48-px fw-bold" value={financeSettings.commissionPercent} onChange={e => setFinanceSettings({...financeSettings, commissionPercent: e.target.value})} />
                                    </div>
                                    <div className="row g-3 mb-24">
                                        <div className="col-6">
                                            <label className="text-xs fw-bold text-secondary uppercase mb-8 d-block">GST on Comm (%)</label>
                                            <input type="number" className="form-control radius-10" value={financeSettings.gstOnCommissionPercent} onChange={e => setFinanceSettings({...financeSettings, gstOnCommissionPercent: e.target.value})} />
                                        </div>
                                        <div className="col-6">
                                            <label className="text-xs fw-bold text-secondary uppercase mb-8 d-block">TDS (%)</label>
                                            <input type="number" className="form-control radius-10" value={financeSettings.tdsPercent} onChange={e => setFinanceSettings({...financeSettings, tdsPercent: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="p-16 radius-12 bg-light mb-24 border border-dashed">
                                        <div className="form-check form-switch mb-12">
                                            <input className="form-check-input" type="checkbox" checked={financeSettings.deductForwardDelivery} onChange={e => setFinanceSettings({...financeSettings, deductForwardDelivery: e.target.checked})} />
                                            <label className="ms-2 fw-medium text-sm">Deduct Forward Delivery</label>
                                        </div>
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" checked={financeSettings.deductReturnDelivery} onChange={e => setFinanceSettings({...financeSettings, deductReturnDelivery: e.target.checked})} />
                                            <label className="ms-2 fw-medium text-sm">Deduct Return Delivery</label>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary-600 w-100 py-12 radius-12 fw-black uppercase">Update Rules</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            

            {/* 🌟 GENERATE MODAL */}
            {showGenModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1200 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '450px' }}>
                        <div className="modal-content radius-24 border-0 p-32 shadow-lg bg-white">
                            <h5 className="fw-bold mb-24 text-center">New Settlement Record</h5>
                            <form onSubmit={handleGenerate}>
                                <div className="mb-16">
                                    <label className="text-xxs fw-bold text-secondary uppercase mb-8 d-block">Target Seller Shop</label>
                                    <select className="form-select radius-12" value={genForm.sellerId} onChange={e => setGenForm({...genForm, sellerId: e.target.value})} required>
                                        <option value="">Select Shop...</option>
                                        {sellers.map(s => <option key={s._id} value={s._id}>{s.shopName}</option>)}
                                    </select>
                                </div>
                                <div className="row g-2 mb-24">
                                    <div className="col-6"><label className="text-xxs fw-bold uppercase">Start Date</label><input type="date" className="form-control radius-12" value={genForm.startDate} onChange={e => setGenForm({...genForm, startDate: e.target.value})} required /></div>
                                    <div className="col-6"><label className="text-xxs fw-bold uppercase">End Date</label><input type="date" className="form-control radius-12" value={genForm.endDate} onChange={e => setGenForm({...genForm, endDate: e.target.value})} required /></div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="button" onClick={() => setShowGenModal(false)} className="btn btn-light flex-grow-1 radius-12 fw-bold">Cancel</button>
                                    <button type="submit" className="btn btn-primary-600 flex-grow-1 radius-12 fw-black shadow-sm">Confirm & Generate</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default PayoutsPage;