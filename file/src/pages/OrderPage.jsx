import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const OrderPage = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filter States
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [selectedDays, setSelectedDays] = useState("All Time");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal States
    const [viewOrder, setViewOrder] = useState(null);
    const [multiSellerView, setMultiSellerView] = useState(null);

    const API_BASE = "https://api.zhopingo.in/api/v1/orders/all"; 

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("userToken");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(API_BASE, config);
            if (res.data.success) setOrders(res.data.data);
        } catch (err) { console.error("Fetch error", err); } 
        finally { setIsLoading(false); }
    };

    // 🌟 1. SYNCED FILTER LOGIC
    useEffect(() => {
        let results = [...orders];

        if (startDate && endDate) {
            results = results.filter(o => {
                const date = new Date(o.createdAt).toISOString().split('T')[0];
                return date >= startDate && date <= endDate;
            });
        } 
        else if (selectedDays !== "All Time") {
            const now = new Date();
            results = results.filter(o => {
                const orderDate = new Date(o.createdAt);
                const diffDays = Math.ceil(Math.abs(now - orderDate) / (1000 * 60 * 60 * 24));
                if (selectedDays === "Today") return orderDate.toDateString() === now.toDateString();
                if (selectedDays === "Yesterday") {
                    const yesterday = new Date();
                    yesterday.setDate(now.getDate() - 1);
                    return orderDate.toDateString() === yesterday.toDateString();
                }
                if (selectedDays === "Last 7 Days") return diffDays <= 7;
                if (selectedDays === "Last 30 Days") return diffDays <= 30;
                return true;
            });
        }

        if (statusFilter !== "All Status") results = results.filter(o => o.status === statusFilter);
       // Filter logic kulla intha update-ai check pannunga
if (searchQuery) {
    results = results.filter(o => 
        o._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) // 🌟 Payment mode search-um add pannittaen
    );
}

        setFilteredOrders(results);
        setCurrentPage(1);
    }, [searchQuery, statusFilter, selectedDays, startDate, endDate, orders]);

    // 🌟 2. HEADER STATS CALCULATIONS (Online vs Wallet)
// 🌟 41. Fixed Header Stats Calculation to handle Case Sensitivity
const onlinePayments = filteredOrders.filter(o => o.paymentMethod?.toUpperCase() === "ONLINE").length;
const walletPayments = filteredOrders.filter(o => o.paymentMethod?.toUpperCase() === "WALLET").length;

const downloadInvoice = (order) => {
    const doc = new jsPDF();
    
    // 1. Header Section - Clean Black Text
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0); // Pure Black
    doc.setFont(undefined, 'bold');
    doc.text("TAX INVOICE", 105, 20, { align: "center" });

    // 2. Branding Placeholder (Zhopingo)
    doc.setFontSize(12);
    doc.text("ZHOPINGO - INDIA'S FIRST ORGANIC APP", 14, 30);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32); // Horizontal Divider

    // 3. Order Metadata (Left Side)
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice No: #INV-${order._id.slice(-6).toUpperCase()}`, 14, 42);
    doc.text(`Order ID: #${order._id.slice(-8).toUpperCase()}`, 14, 47);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, 14, 52);
    doc.text(`Payment Mode: ${order.paymentMethod?.toUpperCase()}`, 14, 57);

    // 4. Seller & Shipping Address Section (Side-by-Side)
    // 🏠 SELLER DETAILS (Fetching Pickup Address)
    doc.setFont(undefined, 'bold');
    doc.text("SOLD BY (SELLER):", 14, 70);
    doc.setFont(undefined, 'normal');
    const seller = order.items?.[0]?.sellerId;
    doc.text(`${seller?.shopName || "Zhopingo Store"}`, 14, 75);
    // 🌟 SELLER SHIPPING ADDRESS FETCH
    const sAddr = seller?.shopAddress;
    const sellerFullAddr = sAddr ? `${sAddr.flatNo}, ${sAddr.area}, ${sAddr.pincode}` : "Pickup Address Not Set";
    doc.text(sellerFullAddr, 14, 80, { maxWidth: 80 });
    doc.text(`GSTIN: ${seller?.gstNumber || "N/A"}`, 14, 90);

    // 👤 BILL TO (CUSTOMER DETAILS)
    doc.setFont(undefined, 'bold');
    doc.text("BILL TO (CUSTOMER):", 120, 70);
    doc.setFont(undefined, 'normal');
    doc.text(`${order.customerId?.name || "Customer"}`, 120, 75);
    const cAddr = order.shippingAddress;
    const custFullAddr = `${cAddr?.flatNo}, ${cAddr?.addressLine}, ${cAddr?.pincode}`;
    doc.text(custFullAddr, 120, 80, { maxWidth: 80 });
    doc.text(`Phone: ${order.customerId?.phone || "N/A"}`, 120, 90);

    // 5. Products Table - B&W Theme
    const tableHeaders = [['S.No', 'Description of Goods', 'Qty', 'Unit Price', 'Total Amount']];
    const tableData = order.items.map((item, index) => [
        index + 1,
        item.product?.name || item.name,
        item.quantity,
        `Rs. ${item.price.toLocaleString()}`,
        `Rs. ${(item.price * item.quantity).toLocaleString()}`
    ]);

    autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 100,
        theme: 'grid', // Solid Grid for Professional Look
        headStyles: { 
            fillColor: [0, 0, 0], // Black Header
            textColor: [255, 255, 255], // White Text
            fontSize: 10,
            halign: 'center'
        },
        styles: { 
            fontSize: 9, 
            cellPadding: 5, 
            textColor: [0, 0, 0], // Black Body Text
            lineColor: [0, 0, 0] // Black Border Lines
        },
        columnStyles: {
            0: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        }
    });

    // 6. Summary Section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`GRAND TOTAL (Incl. GST): Rs. ${order.totalAmount.toLocaleString()}`, 196, finalY, { align: "right" });

    // 7. Footer - Signature Placeholder
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text("This is a computer-generated invoice and does not require a physical signature.", 105, finalY + 25, { align: "center" });
    
    // Final Save
    doc.save(`Invoice_${order._id.slice(-8).toUpperCase()}.pdf`);
};

// Pagination Logic - Idhai oru vaati verify pannunga
const rowsPerPageInt = parseInt(rowsPerPage); // Ensure it's a number
const indexOfLastOrder = currentPage * rowsPerPageInt;
const indexOfFirstOrder = indexOfLastOrder - rowsPerPageInt;

// Filtered data-vai ippo slice panrom
const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    return (
        <MasterLayout>
            <div className='card h-100 p-0 radius-12 border-0 shadow-sm overflow-hidden'>
                {/* 🌟 DYNAMIC HEADER WITH STATS */}
                <div className='card-header border-bottom bg-white py-20 px-24'>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-16">
                        <div>
                            <h5 className='mb-0 fw-bold'>Orders</h5>
                            <div className="d-flex align-items-center gap-3 mt-4">
                                <span className="text-secondary text-xs fw-bold border-end pe-3">Total: {filteredOrders.length}</span>
                                <span className="text-success-main text-xs fw-bold border-end pe-3">Online: {onlinePayments}</span>
                                <span className="text-info-main text-xs fw-bold">Wallet: {walletPayments}</span>
                                   
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <div className="d-flex align-items-center gap-2 bg-light p-4 radius-8 border">
                                <input type="date" className="form-control-sm border-0 bg-transparent text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <span className="text-muted text-xs">to</span>
                                <input type="date" className="form-control-sm border-0 bg-transparent text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <select className="form-select form-select-sm w-auto radius-8" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option>All Status</option><option>Placed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option><option>Returned</option>
                            </select>
                            <select className="form-select form-select-sm w-auto radius-8" value={selectedDays} onChange={e => setSelectedDays(e.target.value)}>
                                <option>All Time</option><option>Today</option><option>Yesterday</option><option>Last 7 Days</option><option>Last 30 Days</option>
                            </select>
                            <div className="position-relative">
                                <input type="text" className="form-control form-control-sm radius-8 ps-32" placeholder="Search Order ID / Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                <Icon icon="solar:magnifer-linear" className="position-absolute top-50 start-0 translate-middle-y ms-10 text-secondary" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                            <thead className="bg-light">
                                <tr>
                                    <th>S.No</th><th>Order Id</th><th>Order Date</th><th> Product Name</th>
                                    <th>Customer Name</th><th>Seller Details</th><th>Phone Number</th>
                                    <th>Address Details</th><th>Payment Mode</th><th>Total Amount</th>
                                    <th>Status</th><th>View Invoice</th><th>View Details</th>
                                </tr>
                            </thead>
<tbody>
    {isLoading ? (
        <tr><td colSpan="13" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
    ) : currentOrders.length > 0 ? currentOrders.map((order, index) => (
        <tr key={`${order._id}-${index}`}>
            {/* 🌟 42. Order Serial Number Ascending Fix */}
            {/* Start from 1 and sync with pagination (Ex: Page 2 starts from 11) */}
            <td>
                <span className="fw-bold text-secondary-light">
                    {indexOfFirstOrder + index + 1}
                </span>
            </td>
            
            {/* Rest of the columns remain the same */}
            <td className="fw-bold text-primary-600">#{order._id.slice(-8).toUpperCase()}</td>
                                        <td className="text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td>
                                            <button onClick={() => setViewOrder({ ...order, showDownload: false })} className="btn btn-sm radius-8 px-12 py-6 border-0 d-flex align-items-center gap-1" style={{ backgroundColor: '#F2F4F7', color: '#344054', fontSize: '11px', fontWeight: '700' }}>
                                                <Icon icon="solar:box-minimalistic-bold" className="text-secondary" /> {order.items?.length || 0} Items
                                            </button>
                                        </td>
                                        
                                        <td><div className="fw-bold text-dark text-sm">{order.customerId?.name || "User"}</div></td>
                                        
                                       {/* 🌟 15. Advanced Seller Details Sync */}
{/* 🌟 Updated Seller Details Column (Single Seller Only) */}
<td>
    {order.items && order.items.length > 0 ? (
        <div className="d-flex flex-column gap-1">
            <div className="text-xs fw-bold text-primary-600">
                {order.items[0].sellerId?.name || "Store Owner"}
            </div>
            <small className="text-muted italic d-block" style={{ fontSize: '10px' }}>
                {order.items[0].sellerId?.shopName || "Admin Hub"}
            </small>
        </div>
    ) : (
        <span className="text-xs text-secondary italic">No Seller Info</span>
    )}
</td>
                                        
                                        <td className="text-sm">{order.customerId?.phone || "N/A"}</td>
                                        
                                        {/* 🌟 ADDRESS DETAILS COLUMN */}
                                        <td>
                                            <div className="d-flex flex-column" style={{ maxWidth: '180px', whiteSpace: 'normal' }}>
                                                <span className="text-xxs fw-bold text-dark">{order.shippingAddress?.receiverName}</span>
                                                <small className="text-muted" style={{ fontSize: '10px' }}>{order.shippingAddress?.flatNo}, {order.shippingAddress?.pincode}</small>
                                            </div>
                                        </td>

                                        {/* 🌟 41. Professional Payment Badge Sync */}
<td>
    <span className={`badge px-12 py-6 radius-4 text-xxs uppercase fw-black shadow-none ${
        order.paymentMethod?.toUpperCase() === 'ONLINE' 
            ? 'bg-success-focus text-success-main' 
            : 'bg-info-focus text-info-main'
    }`}>
        {/* 🌟 Database-la lowercase-la irundhaalum inga Uppercase-la thaan theryum */}
        {order.paymentMethod?.toUpperCase() || "N/A"}
    </span>
</td>
                                        <td className="fw-900 text-sm">₹{order.totalAmount}</td>
                                    {/* 🌟 4 & 5. Status color sync */}
{/* 🌟 4 & 5. Status Colors & Shadow Design Sync */}
{/* 🌟 Admin Status Logic: Synced with Seller Split */}
<td>
    {(() => {
        // Step A: Find the status for this specific seller in this row
        const mySellerId = order.seller?._id || order.seller;
        const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === mySellerId);
        
        // Priority: Split status first, then global status
        const currentStatus = myPackage?.packageStatus || order.status;

        // Step B: Return Badge with correct color logic
        return (
            <span className={`badge px-16 py-8 radius-pill text-xxs fw-black uppercase ls-1 shadow-sm animate__animated animate__fadeIn`}
                style={{
                    backgroundColor: 
                        currentStatus === 'Delivered' ? '#E7F7EF' : 
                        currentStatus === 'Placed' ? '#FFF4E5' :    
                        currentStatus === 'Shipped' ? '#E8EFFF' :
                        currentStatus === 'Cancelled' ? '#FCEAEA' : 
                        currentStatus === 'Returned' || currentStatus === 'Return Requested' ? '#F4EBFF' : 
                        '#F2F4F7',
                    color: 
                        currentStatus === 'Delivered' ? '#28C76F' : 
                        currentStatus === 'Placed' ? '#FF9F43' :    
                        currentStatus === 'Shipped' ? '#485EC4' :
                        currentStatus === 'Cancelled' ? '#EA5455' :
                        currentStatus === 'Returned' || currentStatus === 'Return Requested' ? '#7F56D9' : 
                        '#5E6366',
                    minWidth: '90px',
                    textAlign: 'center'
                }}
            >
                {currentStatus}
            </span>
        );
    })()}
</td>                                
                                        {/* 🌟 INVOICE & DETAILS ACTIONS */}
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <button onClick={() => setViewOrder({ ...order, showDownload: true })} className="btn btn-sm btn-info-focus text-info-main p-6 radius-8 border-0 shadow-sm"><Icon icon="solar:eye-bold" /></button>
                                                <button onClick={() => downloadInvoice(order)} className="btn btn-sm btn-outline-primary p-6 radius-8 shadow-sm"><Icon icon="solar:download-bold" /></button>
                                            </div>
                                        </td>
                                        <td>
                                            <button onClick={() => setViewOrder({ ...order, showDownload: true })} className="btn btn-sm btn-primary-600 p-6 radius-8 shadow-sm"><Icon icon="solar:eye-bold" /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="13" className="text-center py-80 text-muted">No matching orders found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

               {/* 🌟 Advanced Dynamic Pagination */}
<div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
    <div className="d-flex align-items-center gap-2 border-end pe-3">
        <span className="text-xs text-secondary fw-bold">Rows:</span>
        <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold" value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}>
            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
    </div>

    <div className="d-flex align-items-center gap-2">
        {/* Previous Button */}
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-left-linear" /></button>

        {/* Dynamic Page Numbers with Dots */}
        <div className="d-flex gap-1 align-items-center">
            {(() => {
                const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
                const pages = [];
                if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                    pages.push(1);
                    if (currentPage > 3) pages.push('...');
                    if (currentPage > 1 && currentPage < totalPages) {
                        if (currentPage > 2) pages.push(currentPage - 1);
                        pages.push(currentPage);
                        if (currentPage < totalPages - 1) pages.push(currentPage + 1);
                    }
                    if (currentPage < totalPages - 2) pages.push('...');
                    if (totalPages > 1) pages.push(totalPages);
                }
                return [...new Set(pages)].map((p, idx) => (
                    p === '...' ? <span key={idx} className="px-2 text-muted">...</span> :
                    <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>{p}</button>
                ));
            })()}
        </div>

        {/* Next Button */}
        <button disabled={indexOfLastOrder >= filteredOrders.length} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
    </div>
</div>
            </div>

            {/* 🌟 FULL DETAILED VIEW MODAL */}
            {viewOrder && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom px-32 py-20 d-flex justify-content-between align-items-center bg-light">
                                <h6 className="mb-0 fw-900 uppercase ls-1">Order Summary: #{viewOrder._id.slice(-8).toUpperCase()}</h6>
                                <button onClick={() => setViewOrder(null)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-32">
                                <div className="row gy-4 mb-32 border-bottom pb-24">
                                    <div className="col-md-6 border-end">
                                        <label className="text-xxs fw-bold text-primary-600 uppercase mb-4">Customer & Address</label>
                                        <p className="fw-900 mb-2 text-dark" style={{ fontSize: '15px' }}>{viewOrder.customerId?.name}</p>
                                        <p className="text-xs mb-1 fw-bold text-secondary"><Icon icon="solar:phone-bold" className="me-1" /> {viewOrder.customerId?.phone}</p>
                                        <p className="text-xs text-muted"><Icon icon="solar:map-point-bold" className="me-1" /> {viewOrder.shippingAddress?.flatNo}, {viewOrder.shippingAddress?.addressLine}, {viewOrder.shippingAddress?.pincode}</p>
                                    </div>

<div className="col-md-6 ps-md-4">
    <label className="text-xxs fw-bold text-success-600 uppercase mb-4">Order Information</label>
    <p className="text-xs mb-1">
        <b>Package Status:</b> 
        {(() => {
            const sId = viewOrder.seller?._id || viewOrder.seller;
            const split = viewOrder.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sId);
            return <span className="badge bg-primary-focus text-primary-600 ms-1">{split?.packageStatus || viewOrder.status}</span>;
        })()}
    </p>
                                        <p className="text-xs mb-1"><b>Booked On:</b> {new Date(viewOrder.createdAt).toLocaleString()}</p>
                                        <p className="text-xs mb-1"><b>Expected Date:</b> <span className="text-dark fw-bold">{viewOrder.expectedDelivery || "3-5 Working Days"}</span></p>
                                        <p className="text-xs mb-0"><b>Primary Seller:</b> <span className="text-primary-600 fw-bold">{viewOrder.items[0]?.sellerId?.shopName || "Admin Hub"}</span></p>
                                    </div>
                                </div>
                                <div className="table-responsive rounded-12 border">
                                    <table className="table border-0 mb-0 align-middle">
                                        <thead className="bg-primary-50">
                                            <tr><th className="text-xxs fw-bold text-primary-700">ITEM NAME</th><th className="text-xxs fw-bold text-primary-700">QTY</th><th className="text-xxs fw-bold text-primary-700">PRICE</th><th className="text-xxs fw-bold text-primary-700 text-end">TOTAL</th></tr>
                                        </thead>
                                        <tbody>
                                            {viewOrder.items.map((item, i) => (
                                                <tr key={i}><td className="text-xs fw-bold">{item.product?.name || item.name}</td><td className="text-xs">{item.quantity}</td><td className="text-xs">₹{item.price}</td><td className="text-xs fw-900 text-end">₹{item.price * item.quantity}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-24 text-end">
                                    <p className="text-xs text-muted mb-0">GST Included</p>
                                    <h4 className="fw-900 text-primary-600">Grand Total: ₹{viewOrder.totalAmount}</h4>
                                </div>
                            </div>
                         
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 MULTI-SELLER MODAL */}
            {multiSellerView && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom px-24 py-16 bg-primary-50">
                                <h6 className="mb-0 fw-bold text-primary-600 d-flex align-items-center gap-2"><Icon icon="solar:users-group-rounded-bold" /> Order Sellers</h6>
                                <button onClick={() => setMultiSellerView(null)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-24" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {/* 🌟 Inside Multi-Seller Modal body */}
{[...new Map(multiSellerView.map(item => [item.sellerId?._id, item.sellerId])).values()].map((seller, idx) => (
    <div key={idx} className="p-12 border-bottom last-border-0 d-flex align-items-center gap-3">
        <div className="w-32-px h-32-px bg-primary-100 rounded-circle d-flex align-items-center justify-content-center">
            <Icon icon="solar:shop-bold" className="text-primary-600" />
        </div>
        <div>
            {/* Populated seller name and shop name like Product page */}
            <p className="mb-0 text-sm fw-bold text-dark">{seller?.name || "Seller"}</p>
            <small className="text-muted text-xxs italic">{seller?.shopName || "Zhopingo Store"}</small>
        </div>
    </div>
))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default OrderPage;