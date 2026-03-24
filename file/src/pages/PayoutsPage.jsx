import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PayoutsPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("settlements");
    const [sellers, setSellers] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [orders, setOrders] = useState([]);
    const [weeksList, setWeeksList] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState("");

    const [financeSettings, setFinanceSettings] = useState({ 
        commissionPercent: 10, 
        gstOnCommissionPercent: 18, 
        tdsPercent: 2 
    });
    

    const token = localStorage.getItem("userToken");
    const API_BASE = "https://api.zhopingo.in/api/v1";

    useEffect(() => { fetchMasterData(); }, []);

    const fetchMasterData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [resS, resSell] = await Promise.all([
                axios.get(`${API_BASE}/admin/finance-settings`, config),
                axios.get(`${API_BASE}/admin/sellers`, config)
            ]);
            if (resS.data.success) setFinanceSettings(resS.data.data);
            if (resSell.data.success) setSellers(resSell.data.data);
        } catch (err) { console.error("Master Data Sync Error"); }
    };

    const generateWeeks = (joiningDate) => {
        const start = new Date(joiningDate || "2024-01-01");
        const today = new Date();
        const weeks = [];
        let current = new Date(start);
        let weekCount = 1;

        while (current <= today) {
            let weekEnd = new Date(current);
            weekEnd.setDate(current.getDate() + 6);
            weeks.push({
                label: `Week ${weekCount} (${current.toLocaleDateString('en-IN')} - ${weekEnd.toLocaleDateString('en-IN')})`,
                start: new Date(current).toISOString(),
                end: new Date(weekEnd).toISOString(),
                weekNo: weekCount
            });
            current.setDate(current.getDate() + 7);
            weekCount++;
        }
        return weeks.reverse();
    };

    const handleSellerChange = (e) => {
        const seller = sellers.find(s => s._id === e.target.value);
        if (!seller) return setSelectedSeller(null);
        setSelectedSeller(seller);
        const generated = generateWeeks(seller.createdAt);
        setWeeksList(generated);
        const currentWeekStr = JSON.stringify(generated[0]);
        setSelectedWeek(currentWeekStr);
        fetchFilteredOrders(seller._id, generated[0]);
    };

    const handleWeekChange = (e) => {
        const weekStr = e.target.value;
        setSelectedWeek(weekStr);
        fetchFilteredOrders(selectedSeller._id, JSON.parse(weekStr));
    };

const fetchFilteredOrders = async (sId, week) => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_BASE}/orders/all`, config);
        
        if (res.data.success) {
            const filtered = res.data.data.filter(order => {
                const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sId);
                if (!myPackage) return false;

                // 🌟 THE CRITICAL SYNC LOGIC:
                // 1. Intha order intha week window-kulla varudha-nu check panna 'updatedAt' use panrom.
                // 2. Oru order multiple times update aanaalum (Delivered then Return), 
                //    adha 'Last Action Date' vechi dhaan filter pannanum.
                
                const lastActionDate = new Date(order.updatedAt || order.createdAt);
                const isInWeek = lastActionDate >= new Date(week.start) && lastActionDate <= new Date(week.end);

                // Status check: Only show if its current state in THIS week is Delivered or Returned
                const currentStatus = myPackage.packageStatus || order.status;
                const isRelevantStatus = ['Delivered', 'Returned', 'Return Requested'].includes(currentStatus);

                return isRelevantStatus && isInWeek;
            });
            setOrders(filtered);
        }
    } catch (err) { toast.error("Algorithm Sync Failed"); }
    finally { setIsLoading(false); }
};

const calculateOrderPayout = (order) => {
    // 🌟 THE SYNC: Finding seller data strictly
    const split = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === selectedSeller?._id);
    
    const totalPaidByCustomer = order.totalAmount || 0; 
    const productAmount = split?.sellerSubtotal || 0; 
    const deliveryDeduction = totalPaidByCustomer - productAmount;

    const isReturned = order.status === 'Returned' || order.status === 'Return Requested';

    if (isReturned) {
        // Return aana platform commission zero
        return { 
            totalPaid: totalPaidByCustomer, 
            commGst: 0, 
            tds: 0,
            delivery: deliveryDeduction, 
            finalShare: -(totalPaidByCustomer + deliveryDeduction), 
            isReturned: true 
        };
    } else {
        // 🚀 FRONTEND DYNAMIC CALCULATION (Ignoring Backend Values)
        
        // 1. Platform Commission: Product Amount-la irundhu strictly
        const platformComm = (productAmount * (Number(financeSettings.commissionPercent) / 100));

        // 2. GST: Intha Platform Commission-la irundhu (Ex: 18% of platformComm)
        const gstAmount = (platformComm * (Number(financeSettings.gstOnCommissionPercent) / 100));

        // 3. TDS: Intha Platform Commission-la irundhu strictly (Ex: 2% of platformComm)
        const tdsAmount = (platformComm * (Number(financeSettings.tdsPercent) / 100));

        // 🏷️ Total Deduction for Seller
        const totalDeductions = platformComm + gstAmount + tdsAmount;

        return { 
            totalPaid: totalPaidByCustomer, 
            commGst: platformComm + gstAmount, // Commission + GST display-ku
            tds: tdsAmount,
            delivery: deliveryDeduction, 
            finalShare: (totalPaidByCustomer - (totalDeductions + deliveryDeduction)), 
            isReturned: false 
        };
    }
};

const weeklyGrandTotal = orders.reduce((sum, order) => {
    const p = calculateOrderPayout(order);
    return sum + p.finalShare;
}, 0);

const canDownloadReport = () => {
    if (!selectedWeek) return false;
    const weekObj = JSON.parse(selectedWeek);
    const weekEnd = new Date(weekObj.end);
    const now = new Date();
    weekEnd.setHours(23, 59, 59, 999);
    return now > weekEnd;
};

const downloadInvoice = () => {
    const weekObj = JSON.parse(selectedWeek);
    const doc = new jsPDF();
    
    // Header section B&W
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0); // Pure Black
    doc.text("ZHOPINGO WEEKLY SETTLEMENT REPORT", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Shop Name: ${selectedSeller.shopName.toUpperCase()}`, 14, 25);
    doc.text(`Settlement Cycle: ${weekObj.label}`, 14, 30);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 35);
    doc.line(14, 38, 196, 38); // Horizontal Line

const tableBody = orders.map((o, i) => {
    const p = calculateOrderPayout(o);
    // Find individual status for PDF
    const myPkg = o.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === selectedSeller?._id);
    const currentStatus = myPkg?.packageStatus || o.status;

    return [
        i+1, 
        new Date(o.createdAt).toLocaleDateString(), 
        o.updatedAt ? new Date(o.updatedAt).toLocaleDateString() : "-", 
        o._id.slice(-6).toUpperCase(), 
        `Rs. ${p.totalPaid}`, 
        currentStatus.toUpperCase(), // 🌟 Updated individual status
        `Rs. ${Math.ceil(p.commGst + p.tds)}`, 
        `Rs. ${p.delivery}`, 
        `Rs. ${p.finalShare.toFixed(2)}`
    ];
});

    autoTable(doc, {
        head: [['#', 'Order Date','Status Date','Order ID', 'Total Paid', 'Status', 'Comm+GST', 'Delivery', 'Net Share']],
        body: tableBody,
        startY: 42,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }, // Black header, White text
        styles: { textColor: [0, 0, 0], lineColor: [0, 0, 0] }, // Black text & borders
    });

    // Final Total at the end of PDF
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont(undefined, 'bold');
    doc.text(`WEEKLY SETTLEMENT TOTAL: Rs. ${weeklyGrandTotal.toLocaleString()}`, 196, finalY, { align: "right" });
    
    doc.save(`Settlement_${selectedSeller.shopName}_W${weekObj.weekNo}.pdf`);
};

    return (
        <MasterLayout>
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className="card p-24 radius-16 border-0 shadow-sm mb-24 bg-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-black mb-0 text-primary-600 uppercase ls-1">Financial Settlements</h5>
                    <div className="d-flex gap-2">
                        <button onClick={() => setActiveTab("settlements")} className={`btn btn-sm px-20 radius-8 fw-bold ${activeTab === 'settlements' ? 'btn-primary-600' : 'btn-light'}`}>SETTLEMENTS</button>
                        <button onClick={() => setActiveTab("settings")} className={`btn btn-sm px-20 radius-8 fw-bold ${activeTab === 'settings' ? 'btn-primary-600' : 'btn-light'}`}>FINANCE SETTINGS</button>
                    </div>
                </div>
            </div>

            {activeTab === "settlements" ? (
                <div className="row gy-4">
                    <div className="col-md-5">
                        <div className="card p-20 radius-12 border-0 shadow-sm">
                            <label className="text-xxs fw-bold uppercase text-secondary mb-8">1. Select Seller Profile</label>
                            <select className="form-select radius-8 fw-bold" onChange={handleSellerChange}>
                                <option value="">Select Shop...</option>
                                {sellers.map(s => <option key={s._id} value={s._id}>{s.shopName}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedSeller && (
                        <div className="col-md-7 animate__animated animate__fadeIn">
                            <div className="card p-20 radius-12 border-0 shadow-sm bg-primary-50">
                                <label className="text-xxs fw-bold uppercase text-primary-600 mb-8">2. Settlement Period (7 Days Cycle)</label>
                                <select className="form-select radius-8 border-primary-200 fw-bold" value={selectedWeek} onChange={handleWeekChange}>
                                    {weeksList.map((w, i) => <option key={i} value={JSON.stringify(w)}>{w.label}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="col-12">
                        <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                            <div className="table-responsive">
                                <table className="table basic-border-table mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-24">Order Date</th>
                                            <th className="text-primary-600">Status Date</th>
                                            <th>Order ID</th>
                                            <th>Total Paid</th>
                                            <th>Status</th>
                                            <th>Commission + GST</th>
                                            <th>Delivery Deduction</th>
                                            <th className="pe-24 text-end">Final Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr><td colSpan="7" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
                                        ) : orders.length > 0 ? orders.map((order) => {
    const p = calculateOrderPayout(order);
    
    // 🌟 THE MISSING LINE (Grey Screen Fix)
    const statusDateDisplay = order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString();

    return (
       <tr key={order._id} style={p.isReturned ? { backgroundColor: '#fff5f5' } : {}}>
    <td className="ps-24 text-xs fw-bold">{new Date(order.createdAt).toLocaleDateString()}</td>
    <td className="text-xs fw-bold text-primary-600">{order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : "-"}</td>
    <td className="fw-bold text-secondary">#{order._id.slice(-6).toUpperCase()}</td>
    <td className="fw-black">₹{p.totalPaid}</td> 
<td>
        {(() => {
            // Find this seller's specific package status
            const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === selectedSeller?._id);
            const currentStatus = myPackage?.packageStatus || order.status;
            const isRtn = currentStatus === 'Returned' || currentStatus === 'Return Requested';

            return (
                <span className={`badge radius-pill px-12 py-6 text-xxs fw-black uppercase ${isRtn ? 'bg-danger-focus text-danger-main' : 'bg-success-focus text-success-main'}`}>
                    {currentStatus}
                </span>
            );
        })()}
    </td>
    
    {/* 🌟 COMMISSION: Return-na Blur panni 0 kaatuvom */}
    <td className={`fw-bold ${p.isReturned ? 'text-muted opacity-25' : 'text-danger-main'}`}>
        {p.isReturned ? '₹ 0' : `- ₹${Math.ceil(p.commGst + p.tds)}`}
    </td>
    
    {/* 🌟 DELIVERY: Delivered-ku Minus, Returned-ku Plus */}
    <td className={`fw-bold ${p.isReturned ? 'text-danger-main' : 'text-danger-main'}`}>
        {p.isReturned ? `+ ₹${p.delivery}` : `- ₹${p.delivery}`}
    </td>

    {/* 💸 FINAL SHARE */}
    <td className={`pe-24 text-end fw-900 ${p.finalShare < 0 ? 'text-danger' : 'text-dark'}`}>
        {p.finalShare < 0 ? `- ₹${Math.abs(p.finalShare).toLocaleString()}` : `₹${p.finalShare.toLocaleString()}`}
    </td>
</tr>
    );
                                        }) : (
                                            <tr><td colSpan="7" className="text-center py-80 text-muted italic">No Settlements found for this cycle.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                           <div className="card-footer bg-white border-top py-20 px-24 d-flex justify-content-between align-items-center">
    <div className="d-flex align-items-center gap-4">
        <div>
            <span className="text-xxs fw-bold text-secondary uppercase d-block">Settlement Cycle</span>
            <span className="badge bg-dark text-white">WEEK NO: {(selectedWeek && JSON.parse(selectedWeek).weekNo) || 0}</span>
        </div>
        {/* 🌟 NEW: Weekly Grand Total Display */}
        <div className="border-start ps-4">
            <span className="text-xxs fw-bold text-secondary uppercase d-block">Weekly Grand Total</span>
            <h6 className={`mb-0 fw-black ${weeklyGrandTotal < 0 ? 'text-danger' : 'text-dark'}`}>
                ₹{weeklyGrandTotal.toLocaleString()}
            </h6>
        </div>
    </div>

    {orders.length > 0 && canDownloadReport() ? (
        <button onClick={downloadInvoice} className="btn btn-dark radius-8 fw-bold d-flex align-items-center gap-2 shadow-sm">
            <Icon icon="solar:file-download-bold" className="text-lg" /> DOWNLOAD REPORT
        </button>
    ) : orders.length > 0 && (
        <div className="text-muted text-xs fw-bold italic border p-2 radius-8 bg-light">
            <Icon icon="solar:clock-circle-bold" className="me-1" />
            Report will be available after week ends.
        </div>
    )}
</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row justify-content-center">
                    <div className="col-lg-6">
                        <div className="card radius-24 border-0 shadow-sm p-32">
                            <h6 className="fw-black mb-24 text-center border-bottom pb-12 uppercase text-primary-600">Master Finance Configuration</h6>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    const config = { headers: { Authorization: `Bearer ${token}` } };
                                    await axios.put(`${API_BASE}/admin/finance-settings`, financeSettings, config);
                                    toast.success("Algorithm Rules Updated Strictly!");
                                } catch (err) { toast.error("Sync Failed!"); }
                            }}>
                                <div className="mb-20">
                                    <label className="text-xxs fw-bold uppercase mb-8 d-block text-secondary">Platform Commission (%)</label>
                                    <input type="number" className="form-control radius-12 h-48-px fw-bold" value={financeSettings.commissionPercent} onChange={e => setFinanceSettings({...financeSettings, commissionPercent: e.target.value})} />
                                </div>
                                <div className="row g-3 mb-24">
                                    <div className="col-6">
                                        <label className="text-xxs fw-bold uppercase mb-8 d-block text-secondary">TDS (%)</label>
                                        <input type="number" className="form-control radius-12 h-48-px fw-bold" value={financeSettings.tdsPercent} onChange={e => setFinanceSettings({...financeSettings, tdsPercent: e.target.value})} />
                                    </div>
                                    <div className="col-6">
                                        <label className="text-xxs fw-bold uppercase mb-8 d-block text-secondary">GST on Commission (%)</label>
                                        <input type="number" className="form-control radius-12 h-48-px fw-bold" value={financeSettings.gstOnCommissionPercent} onChange={e => setFinanceSettings({...financeSettings, gstOnCommissionPercent: e.target.value})} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary-600 w-100 py-16 radius-12 fw-black shadow-sm uppercase ls-1">Apply Algorithm Updates</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default PayoutsPage;