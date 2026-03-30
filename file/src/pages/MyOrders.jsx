import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    // 🌟 41. Pagination States for Seller Orders
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10); // Detail view modal
    
const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
const sellerId = sellerData.id || sellerData._id;
const token = localStorage.getItem("userToken");
const [statusFilter, setStatusFilter] = useState("All"); // 🌟 New: Status Filter State
const API_BASE = "https://api.zhopingo.in/api/v1";


    const fetchOrders = async () => {
        if (!sellerId) return;
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // 🌟 Using specific seller orders route
            const response = await axios.get(`${API_BASE}/orders/seller/${sellerId}`, config);
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Failed to load orders!");
        } finally { setIsLoading(false); }
    };
    

    useEffect(() => { fetchOrders(); }, [sellerId]);
// 🚚 1. Ship Now Logic (Added sellerId in payload)
const handleShipOrder = async (orderId) => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.put(`${API_BASE}/orders/update-status/${orderId}`, {
            status: 'Shipped',
            sellerId: sellerId, // 🌟 EXTREMELY CRITICAL
            awbNumber: "128374922" // Oru vaelai manual AWB kudukanum-na inga add pannalam
        }, config);

        if (res.data.success) {
            toast.success("Your package is Shipped!");
            fetchOrders(); 
        }
    } catch (err) { toast.error("Shipping trigger failed!"); }
};

// ✅ MARK DELIVERED Logic (Postman Sync)
const handleMarkDelivered = async (orderId) => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 🚀 THE CRITICAL FIX: URL strictly matching Postman
        const res = await axios.put(`${API_BASE}/seller/update-order-status`, {
            orderId: orderId,
            sellerId: sellerId,
            status: 'Delivered'
        }, config);

        if (res.data.success) {
            toast.success("Package Delivered & Date Logged! ✅");
            fetchOrders(); 
        }
    } catch (err) { 
        console.error("Sync Error:", err.response?.data);
        toast.error(err.response?.data?.message || "Delivery sync failed!"); 
    } finally {
        setIsLoading(false);
    }
};

// 🔄 RETURN ACTION Logic (Postman Sync)
const handleReturnAction = async (orderId, approvalStatus) => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Same endpoint as Postman strictly
        const res = await axios.put(`${API_BASE}/seller/update-order-status`, {
            orderId: orderId,
            sellerId: sellerId,
            status: approvalStatus === 'Approved' ? 'Returned' : 'Delivered'
        }, config);

        if (res.data.success) {
            toast.success(`Return Action Sync Success! ✅`);
            fetchOrders(); 
        }
    } catch (err) { 
        toast.error("Return sync failed!"); 
    } finally {
        setIsLoading(false);
    }
};
// 🌟 1. First: Filter based on Selected Status
const filteredOrders = orders.filter(order => {
    // Current seller data mapping
    const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
    const currentStatus = myPackage?.packageStatus || order.status;

    if (statusFilter === "All") return true;
    return currentStatus === statusFilter;
});

// 🌟 2. Second: Apply Pagination on Filtered Results
const indexOfLastOrder = currentPage * rowsPerPage;
const indexOfFirstOrder = indexOfLastOrder - rowsPerPage;
const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

// Reset to page 1 if filter changes
useEffect(() => {
    setCurrentPage(1);
}, [statusFilter]);
// 🌟 41. Professional Confirmation Modal State
const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    orderId: null, 
    type: '', // 'Ship' or 'Deliver'
    title: '',
    message: ''
});
return (
    <div className='card h-100 p-0 radius-12 border-0 shadow-sm animate__animated animate__fadeIn'>
        <ToastContainer position="top-right" autoClose={2000} theme="colored" />
        
        {/* 🌟 HEADER: Flexbox structure update pannittaen */}
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
            <div>
                <h6 className='text-lg fw-semibold mb-0 text-primary-600'>Shop Order Bookings</h6>
                <small className="text-secondary-light">Manage your products shipping and delivery</small>
            </div>

            {/* 🚀 THE SYNC: Filter ippo Total Orders-ku Left-la katchithama vandhirum */}
            <div className="d-flex align-items-center gap-3">
                <select 
                    className="form-select form-select-sm radius-8 border-primary-100 fw-bold bg-light" 
                    style={{ width: '160px', height: '38px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Placed">Placed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Returned">Returned</option>
                    <option value="Cancelled">Cancelled</option>
                </select>

                <span className="badge bg-primary-600 text-white px-16 py-10 radius-pill fw-bold shadow-sm">
                    Total Orders: {filteredOrders.length}
                </span>
            </div>
        </div>

        <div className='card-body p-24'>
            <div className='table-responsive'>
                <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                    <thead className="bg-light">
                        <tr>
                            <th className="ps-24">S.No</th> 
                            <th>Order ID</th>
                            <th>Customer (Receiver)</th>
                            <th>Address</th>
                            <th>Products</th>
                            <th>Total Share</th>
                            <th>Tracking</th>
                            <th>Status</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        
{isLoading ? (
        <tr><td colSpan="9" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
    ) : currentOrders.length > 0 ? currentOrders.map((order, index) => {
        const sellerShare = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        
        return (
            <tr key={`${order._id}-${index}`}>
                <td className="ps-24 fw-bold text-secondary">{orders.length - (indexOfFirstOrder + index)}</td>
                <td className="fw-bold text-primary-600">#{order._id.slice(-8).toUpperCase()}</td>
{/* Customer Column */}
<td>
    <div className="d-flex flex-column">
        <span className="text-md fw-black text-dark uppercase" style={{ fontSize: '14px' }}>
            {order.shippingAddress?.receiverName || "User"}
        </span>
        
    </div>
</td>

{/* Address Column */}
<td style={{ minWidth: '180px' }}>
    <div className="text-dark fw-medium" style={{ fontSize: '13px', lineHeight: '1.4' }}>
        {order.shippingAddress?.flatNo}, {order.shippingAddress?.area} <br/>
        <span className="fw-black text-primary-600">{order.shippingAddress?.pincode}</span>
    </div>
</td>

{/* 🌟 2. New Address & Contact Column */}

                                        {/* Products Column */}
<td>
    <div className="d-flex flex-column gap-2 py-8">
        {order.items.filter(i => (i.sellerId?._id || i.sellerId) === sellerId).map((item, idx) => (
            <div key={idx} className="d-flex align-items-center gap-2">
                <Icon icon="solar:round-alt-arrow-right-bold" className="text-primary-600" />
                <span className="text-sm fw-bold text-dark" style={{ fontSize: '13px' }}>
                    {item.name} 
                    <span className="text-primary-600 ms-2">x {item.quantity}</span>
                </span>
            </div>
        ))}
    </div>
</td>
                                        <td>
    <div className="d-flex flex-column">
        <span className="fw-900 text-dark" style={{ fontSize: '15px' }}>
            ₹{sellerShare?.sellerSubtotal || 0}
        </span>
        <small className="text-muted fw-bold" style={{ fontSize: '10px' }}>Earnings</small>
    </div>
</td>
                                        
                                        {/* 🚚 Tracking Info */}
                                        <td>
                                            {order.awbNumber ? (
                                                <div className="d-flex flex-column">
                                                    <span className="badge bg-info-50 text-info-main text-xxs">AWB: {order.awbNumber}</span>
                                                    
                                                </div>
                                            ) : <span className="text-muted text-xxs italic">Not Shipped</span>}
                                        </td>

<td>
    {(() => {
        // 🌟 THE CRITICAL FIX: Check individual item status first
        const myItems = order.items?.filter(i => (i.sellerId?._id || i.sellerId) === sellerId);
        
        // Items-la eadhachum "Return Requested" irundha adhai prioritise pannanum
        const hasReturnRequest = myItems.some(i => i.itemStatus === 'Return Requested');
        const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        
        const currentStatus = hasReturnRequest ? 'Return Requested' : (myPackage?.packageStatus || order.status);

        let badgeClass = "bg-neutral-200 text-secondary";
        let customStyle = {};

        if (currentStatus === 'Delivered') badgeClass = "bg-success-focus text-success-main";
        else if (currentStatus === 'Returned') badgeClass = "bg-danger-focus text-danger-main";
        else if (currentStatus === 'Shipped') badgeClass = "bg-info-focus text-info-main";
        else if (currentStatus === 'Placed') badgeClass = "bg-warning-focus text-warning-main";
        else if (currentStatus === 'Return Requested') {
            customStyle = { backgroundColor: '#F4EBFF', color: '#7F56D9', border: '1px solid #E9D7FE' };
        }

        return (
            <td className="text-center">
    <span className={`badge px-16 py-8 radius-pill text-xs fw-black uppercase ls-1 ${badgeClass}`} 
          style={{ ...customStyle, fontSize: '11px', minWidth: '100px' }}>
        {currentStatus}
    </span>
</td>
        );
    })()}
</td>

{/* 🌟 Action Logic: Synced with Seller Part Only */}
<td className="text-center">
    <div className="d-flex gap-2 justify-content-center align-items-center">
        {(() => {
            const myItems = order.items?.filter(i => (i.sellerId?._id || i.sellerId) === sellerId);
            const hasReturnRequest = myItems.some(i => i.itemStatus === 'Return Requested');
            const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
            const myStatus = myPackage?.packageStatus || order.status;

            // 1. If Placed -> Show SHIP NOW
            if (myStatus === 'Placed') {
                return (
                    <button 
                        onClick={() => setConfirmModal({ 
                            show: true, orderId: order._id, type: 'Ship', 
                            title: 'Confirm Shipment', 
                            message: 'Ship only your products from this order?' 
                        })} 
                        className="btn btn-primary-600 btn-sm radius-8 fw-bold d-flex align-items-center gap-1 px-16 shadow-sm"
                    >
                        <Icon icon="solar:delivery-bold" /> SHIP NOW
                    </button>
                );
            }
            
            // 2. If Shipped -> Show MARK DELIVERED
            if (myStatus === 'Shipped') {
                return (
                    <button 
                        onClick={() => setConfirmModal({ 
                            show: true, orderId: order._id, type: 'Deliver', 
                            title: 'Mark as Delivered', 
                            message: 'Confirm your items reached the customer?' 
                        })} 
                        className="btn btn-success-600 btn-sm radius-8 fw-bold px-16 shadow-sm"
                    >
                        MARK DELIVERED
                    </button>
                );
            }
            // 🌟 3. RETURN REQUESTED (New Logic)
            if (hasReturnRequest) {
                return (
                    <div className="d-flex flex-column gap-1">
                        <small className="text-primary-600 fw-bold" style={{fontSize: '9px'}}>RETURN REQUESTED</small>
                        <div className="d-flex gap-2 justify-content-center">
                            <button onClick={() => handleReturnAction(order._id, 'Approved')} className="btn btn-success btn-sm radius-8 py-4 px-12 fw-bold text-xxs">ACCEPT</button>
                            <button onClick={() => handleReturnAction(order._id, 'Rejected')} className="btn btn-outline-danger btn-sm radius-8 py-4 px-12 fw-bold text-xxs">REJECT</button>
                        </div>
                    </div>
                );
            }

// 3. FINAL BADGES
            if (myStatus === 'Delivered') return <div className="text-success fw-black text-xxs uppercase"><Icon icon="solar:check-circle-bold" className="fs-5" /> COMPLETED</div>;
            if (myStatus === 'Returned') return <div className="text-danger fw-black text-xxs uppercase"><Icon icon="solar:back-bold" className="fs-5" /> RETURNED</div>;

            return <span className="text-secondary-light fw-bold">—</span>;
        })()}
    </div>
</td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" className="text-center py-80"><p className="text-secondary fw-bold">No orders found for your shop.</p></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {confirmModal.show && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
                        <div className="modal-content radius-24 border-0 shadow-lg p-32 text-center bg-white">
                            <div className="d-flex justify-content-center mb-24">
                                <div className={`w-80-px h-80-px ${confirmModal.type === 'Ship' ? 'bg-primary-focus text-primary-600' : 'bg-success-focus text-success-600'} rounded-circle d-flex justify-content-center align-items-center`}>
                                    <Icon icon={confirmModal.type === 'Ship' ? "solar:delivery-bold" : "solar:check-circle-bold"} className="text-4xl" />
                                </div>
                            </div>
                            <h4 className="mb-8 fw-900 text-dark">{confirmModal.title}</h4>
                            <p className="text-secondary-light mb-32 fw-medium">{confirmModal.message}</p>
                            <div className="d-flex justify-content-center gap-3">
                                <button onClick={() => setConfirmModal({ show: false })} className="btn btn-light px-32 py-12 radius-12 fw-bold">Cancel</button>
                                <button 
                                    onClick={async () => {
                                        if (confirmModal.type === 'Ship') await handleShipOrder(confirmModal.orderId);
                                        else await handleMarkDelivered(confirmModal.orderId);
                                        setConfirmModal({ show: false });
                                    }} 
                                    className={`btn ${confirmModal.type === 'Ship' ? 'btn-primary-600' : 'btn-success-600'} px-32 py-12 radius-12 fw-bold text-white uppercase`}
                                >
                                    Confirm Action
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 🌟 41. Advanced Dynamic Pagination Footer for Seller */}
<div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
    <div className="d-flex align-items-center gap-2 border-end pe-3">
        <span className="text-xs text-secondary fw-bold">Rows:</span>
        <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold shadow-none" 
                value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
    </div>

    <div className="d-flex align-items-center gap-2">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} 
                className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm">
            <Icon icon="solar:alt-arrow-left-linear" />
        </button>

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
                    p === '...' ? <span key={idx} className="px-2 text-muted text-xs">...</span> :
                    <button key={idx} onClick={() => setCurrentPage(p)} 
                            className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 fw-bold ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>
                        {p}
                    </button>
                ));
            })()}
        </div>

        <button disabled={indexOfLastOrder >= filteredOrders.length} onClick={() => setCurrentPage(prev => prev + 1)} 
                className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm">
            <Icon icon="solar:alt-arrow-right-linear" />
        </button>
    </div>
</div>
            {/* Modal details loop item fix: neenga keta maari item.name product name theriyaum */}
        </div>
    );
};


export default MyOrders;