import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast } from "react-toastify";

const FinanceForSeller = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [payouts, setPayouts] = useState([]);
    const [expandedSettlement, setExpandedSettlement] = useState(null); 
    const [breakdownData, setBreakdownData] = useState([]);

    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const sellerId = sellerData.id || sellerData._id;
    const token = localStorage.getItem("userToken");
    const API_BASE = "https://api.zhopingo.in/api/v1";

    useEffect(() => {
        if (sellerId) fetchPayoutHistory();
    }, [sellerId]);

    const fetchPayoutHistory = async () => {
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE}/seller/dashboard/${sellerId}`, config);
            if (res.data.success) {
                const historyRes = await axios.get(`${API_BASE}/admin/finance/settlements/${sellerId}`, config);
                if (historyRes.data.success) {
                    const paidOnly = historyRes.data.data.filter(s => s.status === 'Paid');
                    setPayouts(paidOnly.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
                }
            }
        } catch (err) {
            toast.error("Finance records sync failed!");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBreakdown = async (settlementId) => {
        if (expandedSettlement === settlementId) return setExpandedSettlement(null);
        
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE}/admin/settlements/breakdown/${settlementId}`, config);
            if (res.data.success) {
                setBreakdownData(res.data.data); 
                setExpandedSettlement(settlementId);
            }
        } catch (err) {
            toast.error("Failed to load detailed breakdown");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
<div className="row g-3 mb-20"> 
    <div className="col-md-6">
        <div className="card radius-12 border-0 shadow-sm p-12 bg-white h-100"> {/* p-16 -> p-12 (Ultra tight) */}
            <div className="d-flex align-items-center gap-2"> {/* gap-3 -> gap-2 */}
                <div className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                    <Icon icon="solar:wad-of-money-bold" style={{ fontSize: '16px' }} /> {/* fs-4 -> 16px */}
                </div>
                <div>
                    <h6 className="mb-0 fw-black uppercase ls-1 text-secondary" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Paid Settlements Breakdown</h6>
                    <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '13px' }}>Item-wise Financials</h5>
                </div>
            </div>
        </div>
    </div>


    <div className="col-md-6">
        <div className="card radius-12 border-0 shadow-sm p-12 bg-primary-600 text-white h-100">
            <div className="d-flex align-items-center gap-2">
                <div className="w-32-px h-32-px bg-white-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <Icon icon="solar:checklist-minimalistic-bold" style={{ fontSize: '16px' }} className="text-white" />
                </div>
                <div>
                    <small className="text-white-50 fw-bold uppercase ls-1 d-block" style={{ fontSize: '9px' }}>Total Completed Cycles:</small>
                    <h5 className="fw-900 mb-0" style={{ fontSize: '14px' }}>{payouts.length} Settlements</h5>
                </div>
            </div>
        </div>
    </div>
</div>

            {payouts.length > 0 ? payouts.map((p, idx) => (
                <div key={p._id} className="card radius-16 border-0 shadow-sm mb-20 overflow-hidden border-start border-4 border-primary-600">
                    {/* Settlement Header Row - Bigger Fonts */}
                    <div className="p-24 d-flex justify-content-between align-items-center bg-white cursor-pointer transition-all hover-bg-light" onClick={() => fetchBreakdown(p._id)}>
                        <div className="d-flex align-items-center gap-4">
                            <span className="badge bg-dark text-white px-16 py-8 radius-8 fw-bold" style={{ fontSize: '11px' }}>CYCLE: {p.weekRange}</span>
                            <h5 className="mb-0 fw-900 text-primary-600" style={{ fontSize: '22px' }}>₹{p.finalSettlementAmount.toLocaleString()}</h5>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-secondary fw-bold text-xs">Click to view details</span>
                            <Icon icon={expandedSettlement === p._id ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"} className="fs-3 text-primary-600" />
                        </div>
                    </div>

                    {/* 🌟 THE ADMIN-STYLE TABLE: Bigger Fonts & Better Spacing */}
                    {expandedSettlement === p._id && (
                        <div className="table-responsive animate__animated animate__fadeIn border-top">
                            <table className="table table-hover mb-0 align-middle">
                                <thead className="bg-neutral-50">
                                    <tr className="text-xxs fw-black uppercase text-secondary">
                                        <th className="ps-24 py-16">S.No</th>
                                        <th>Order Date</th>
                                        <th>Status Date</th>
                                        <th>Order ID</th>
                                        <th>Product</th>
                                        <th>Total Paid</th>
                                        <th>Product Amt</th>
                                        <th className="text-center">Status</th>
                                        <th>Comm + GST</th>
                                        <th>Delivery Ded.</th>
                                        <th className="pe-24 text-end">Final Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdownData.map((row, i) => (
                                        <tr key={i} className={row.status === 'RETURNED' ? 'bg-danger-focus' : ''} style={{ height: '70px' }}>
                                            <td className="ps-24 fw-black text-secondary">{i + 1}</td>
                                            {/* 🚀 FONT FIX: Order Date & Status Date increased to 14px and bold */}
                                            <td className="fw-bold text-dark" style={{ fontSize: '14px' }}>{new Date(row.orderDate).toLocaleDateString('en-GB')}</td>
                                            <td className="fw-bold text-primary-600" style={{ fontSize: '14px' }}>{new Date(row.statusDate).toLocaleDateString('en-GB')}</td>
                                            
                                            <td className="fw-black text-secondary" style={{ fontSize: '13px' }}>#{row.orderId.toString().slice(-6).toUpperCase()}</td>
                                            
                                            <td className="fw-black text-dark" style={{ maxWidth: '180px', whiteSpace: 'normal', fontSize: '14px', lineHeight: '1.2' }}>
                                                {row.productName}
                                            </td>

                                            <td className="fw-900 text-dark" style={{ fontSize: '14px' }}>₹{row.totalCustomerPaid}</td>
                                            <td className="fw-900 text-info-main" style={{ fontSize: '14px' }}>₹{row.productAmountOnly}</td>
                                            
                                            <td className="text-center">
                                                <span className={`badge radius-pill px-16 py-8 text-xxs fw-black uppercase shadow-sm ${row.status === 'RETURNED' ? 'bg-danger text-white' : 'bg-success-focus text-success-main'}`}>
                                                    {row.status}
                                                </span>
                                            </td>

                                            <td className="text-danger-main fw-black" style={{ fontSize: '14px' }}>- ₹{row.commissionAndGst}</td>
                                            
                                            <td className={`${row.status === 'RETURNED' ? 'text-success-main' : 'text-danger-main'} fw-black`} style={{ fontSize: '14px' }}>
                                                {row.status === 'RETURNED' ? `+ ₹${row.deliveryDeduction}` : `- ₹${row.deliveryDeduction}`}
                                            </td>

                                            {/* 🚀 FONT FIX: Final Share Amount increased to 16px and Heavy Weight */}
                                            <td className={`pe-24 text-end fw-900 ${row.finalShare < 0 ? 'text-danger' : 'text-dark'}`} style={{ fontSize: '16px' }}>
                                                ₹{row.finalShare.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )) : (
                <div className="text-center py-100 bg-white radius-24 border">
                    <Icon icon="solar:bill-list-linear" className="display-1 text-neutral-200 mb-3" />
                    <h6 className="text-secondary fw-bold">No Paid Settlements Found</h6>
                    <p className="text-muted text-xs">Once Admin marks your payout as 'Paid', it will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default FinanceForSeller;