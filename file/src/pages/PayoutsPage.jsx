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
    const [settlementData, setSettlementData] = useState(null); // 🌟 THE MISSING LINE

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
    setOrders([]); // Reset table immediately
    setSettlementData(null); // Reset settlement data

    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const payload = {
            sellerId: sId,
            startDate: week.start.split('T')[0],
            endDate: week.end.split('T')[0]
        };

        console.log("🚀 TRIGGERING SETTLEMENT FOR WEEK:", week.label, payload);

        const res = await axios.post(`${API_BASE}/admin/generate-settlement`, payload, config);

        if (res.data.success) {
            console.log("✅ SETTLEMENT DATA SYNCED:", res.data.data);
            // 🌟 THE SYNC: Backend breakdown list-ai dhaan table-ku anuppuvom
            setOrders(res.data.data.payoutBreakdown || []);
            setSettlementData(res.data.data);
        }
    } catch (err) {
        console.error("❌ SYNC ERROR:", err.response?.status);
        // 🛡️ Handle empty weeks strictly
        if (err.response?.status === 404) {
            toast.info("No Delivered or Returned orders found for this cycle.");
        } else {
            toast.error("Finance API sync failed!");
        }
    } finally {
        setIsLoading(false);
    }
};
const handleMarkAsPaid = async () => {
    if (!settlementData) return;
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const payRes = await axios.put(`${API_BASE}/admin/mark-settlement-paid/${settlementData._id}`, {}, config);
        if (payRes.data.success) {
            toast.success(`Payout of ₹${settlementData.finalSettlementAmount} processed successfully! `);
            setSettlementData({ ...settlementData, status: 'Paid' }); // Local update
        }
    } catch (err) { toast.error("Payment Sync Failed"); }
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
        
        return { 
            totalPaid: totalPaidByCustomer, 
            commGst: 0, 
            tds: 0,
            delivery: deliveryDeduction, 
            finalShare: -(totalPaidByCustomer + deliveryDeduction), 
            isReturned: true 
        };
    } else {
        
        
        
        const platformComm = (productAmount * (Number(financeSettings.commissionPercent) / 100));

        
        const gstAmount = (platformComm * (Number(financeSettings.gstOnCommissionPercent) / 100));

       
        const tdsAmount = (platformComm * (Number(financeSettings.tdsPercent) / 100));

        
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
    if (!selectedSeller || !selectedWeek || orders.length === 0) return;
    
    const weekObj = JSON.parse(selectedWeek);
    const doc = new jsPDF('l', 'mm', 'a4'); // strictly Landscape for space
    
    // 1. Header Branding (Pure Black)
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0); 
    doc.text("ZHOPINGO FINANCIAL SETTLEMENT REPORT", 148, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Merchant: ${selectedSeller.shopName.toUpperCase()}`, 14, 35);
    doc.text(`Settlement Cycle: ${weekObj.label}`, 14, 40);
    doc.text(`Total Settlement: Rs. ${settlementData?.finalSettlementAmount || 0}`, 14, 45);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 282, 45, { align: "right" });
    
    doc.setDrawColor(0); 
    doc.line(14, 50, 282, 50);

    // 2. Data Mapping (Strictly using Rs. to avoid encoding issues)
    const tableBody = orders.map((row, i) => {
        const totalFees = (row.platformCommission + row.gstOnCommission + row.tdsDeduction).toFixed(2);
        // Syncing delivery display with your requirement
        const deliveryTxt = row.type === 'RETURNED' ? `+ Rs. ${row.sellerShippingDeduction || 0}` : `- Rs. ${row.sellerShippingDeduction || 0}`;
        
        return [
            i + 1,
            new Date(row.statusDate).toLocaleDateString(),
            row.orderId.toString().slice(-6).toUpperCase(),
            row.productName || "Product", // Product Name added
            `Rs. ${row.customerPaidTotal}`,
            row.type,
            `Rs. ${totalFees}`,
            deliveryTxt,
            `Rs. ${row.netPayableToSeller}`
        ];
    });

    // 3. AutoTable Configuration (World Class B&W Alignment)
    autoTable(doc, {
        head: [['#', 'Date', 'Order ID', 'Product', 'Cust. Paid', 'Type', 'Platform Fees', 'Delivery', 'Net Share']],
        body: tableBody,
        startY: 55,
        theme: 'grid',
        headStyles: { 
            fillColor: [0, 0, 0], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: { 
            fontSize: 8, 
            cellPadding: 4, 
            textColor: [0, 0, 0], 
            lineColor: [0, 0, 0],
            valign: 'middle'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            4: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
            8: { halign: 'right', fontStyle: 'bold' } // Net Share bold & right aligned
        }
    });

    // 4. Final Total Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(`GRAND TOTAL SETTLEMENT: Rs. ${settlementData?.finalSettlementAmount || 0}`, 282, finalY, { align: "right" });
    
    // File saving logic
    doc.save(`Settlement_${selectedSeller.shopName.replace(/\s+/g, '_')}_W${weekObj.weekNo}.pdf`);
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
                                            <th>Product</th>
                                            <th>Total Paid</th>
                                            <th>Status</th>
                                            <th>Commission + GST</th>
                                            <th>Delivery Deduction</th>
                                            <th className="pe-24 text-end">Final Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
    {isLoading ? (
        <tr><td colSpan="8" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
    ) : orders.length > 0 ? orders.map((row, index) => (
    <tr key={index} className={row.type === 'RETURNED' ? 'bg-danger-focus' : ''}>
        <td className="ps-24 text-xs fw-bold">{new Date(row.statusDate).toLocaleDateString()}</td>
        <td className="text-xs fw-bold text-primary-600">
            {row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : 
             row.returnDate ? new Date(row.returnDate).toLocaleDateString() : "-"}
        </td>
        <td className="fw-bold text-secondary">#{row.orderId.toString().slice(-6).toUpperCase()}</td>
        <td className="fw-bold text-dark text-xs">{row.productName || "Product"}</td> {/* 🌟 Mapping Product Name */}
        <td className="fw-black">₹{row.customerPaidTotal}</td>
        <td>
            <span className={`badge radius-pill px-12 py-6 text-xxs fw-black uppercase ${
                row.type === 'RETURNED' ? 'bg-danger text-white' : 'bg-success-focus text-success-main'
            }`}>
                {row.type}
            </span>
        </td>
        <td className="text-danger-main fw-bold">- ₹{(row.platformCommission + row.gstOnCommission + row.tdsDeduction).toFixed(2)}</td>
        <td className={`fw-bold ${row.type === 'RETURNED' ? 'text-danger-main' : 'text-danger-main'}`}>
            {row.type === 'RETURNED' ? `+ ₹${row.sellerShippingDeduction || 0}` : `- ₹${row.sellerShippingDeduction || 0}`}
        </td>
        <td className={`pe-24 text-end fw-900 ${row.netPayableToSeller < 0 ? 'text-danger' : 'text-dark'}`}>
            ₹{row.netPayableToSeller.toLocaleString()}
        </td>
    </tr>
    )) : (
        <tr><td colSpan="8" className="text-center py-80 text-muted italic">No financial movements in this cycle.</td></tr>
    )}
</tbody>
                                </table>
                            </div>
<div className="card-footer bg-white border-top py-20 px-24 d-flex justify-content-between align-items-center">
    <div className="d-flex align-items-center gap-4">
        <div>
            <span className="text-xxs fw-bold text-secondary uppercase d-block">Cycle Info</span>
            <span className="badge bg-dark text-white text-xxs">WEEK NO: {(selectedWeek && JSON.parse(selectedWeek).weekNo) || 0}</span>
        </div>
        <div className="border-start ps-4">
            <span className="text-xxs fw-bold text-secondary uppercase d-block">Total Payable</span>
            {/* 🚀 THE SYNC: Direct-ah settlementData-la irunthu backend total edukkuroam */}
            <h6 className={`mb-0 fw-900 ${ (settlementData?.finalSettlementAmount || 0) < 0 ? 'text-danger' : 'text-success-main'}`}>
                ₹{settlementData?.finalSettlementAmount?.toLocaleString() || "0"}
            </h6>
        </div>
    </div>

    <div className="d-flex gap-2">
        {orders.length > 0 && (
            <>
                {/* 🌟 Mark as Paid Button: Always visible if orders exist */}
                {settlementData?.status === "Paid" ? (
                    <div className="badge bg-success-focus text-success-main px-16 py-10 radius-8 fw-black border border-success-200">
                        <Icon icon="solar:check-circle-bold" className="me-1" /> SETTLED & PAID
                    </div>
                ) : (
                    <button 
                        onClick={handleMarkAsPaid} 
                        disabled={isLoading}
                        className="btn btn-primary-600 radius-8 fw-bold d-flex align-items-center gap-2 shadow-lg"
                    >
                        {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <Icon icon="solar:wad-of-money-bold" />}
                        MARK AS PAID
                    </button>
                )}
                
                {/* 🌟 Report Button: Restriction removed, any time download pannalam */}
                <button onClick={downloadInvoice} className="btn btn-outline-dark radius-8 fw-bold d-flex align-items-center gap-1">
                    <Icon icon="solar:file-download-bold" /> REPORT
                </button>
            </>
        )}
    </div>
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