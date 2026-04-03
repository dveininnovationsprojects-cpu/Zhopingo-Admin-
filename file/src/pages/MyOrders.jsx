import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    // 🌟 41. Pagination States for Seller Orders
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);
const [selectedOrders, setSelectedOrders] = useState([]); // 🌟 Bulk selection check // Detail view modal
  const [sellerProfile, setSellerProfile] = useState(null);  
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
            
            toast.error("Failed to load orders!");
        } finally { setIsLoading(false); }
    };
    

    useEffect(() => {
    if (sellerId) {
        fetchOrders();
        fetchSellerProfile(); 
    }
}, [sellerId]);
const fetchSellerProfile = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Profile API moolama full address edukkuroam
        const res = await axios.get(`${API_BASE}/seller/dashboard/${sellerId}`, config);
        if (res.data.success) {
            setSellerProfile(res.data.data.seller);
        }
    } catch (err) {  }
};
    const handleBulkInvoice = () => {
    if (selectedOrders.length === 0) return toast.warn("Select at least one order!");

    const doc = new jsPDF();
    const ordersToProcess = orders.filter(o => selectedOrders.includes(o._id));

    ordersToProcess.forEach((order, index) => {
        const sellerItems = order.items.filter(i => (i.sellerId?._id || i.sellerId) === sellerId);
        const sellerShare = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);

        // 1. Header Section
        doc.setFontSize(22);
        doc.text("INVOICE", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`Order ID: #${order._id.toUpperCase()}`, 14, 30);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35);
        doc.line(14, 40, 196, 40);

        // 🚀 2. THE SYNC: SOLD BY (SELLER ADDRESS FROM PROFILE)
        doc.setFont("helvetica", "bold");
        doc.text("SOLD BY (SELLER):", 14, 50);
        doc.setFont("helvetica", "normal");
        doc.text(`${sellerProfile?.shopName || "Our Store"}`, 14, 55);
        
        // Dynamic Address extraction strictly from profile state
        const sAddr = sellerProfile?.shopAddress;
        const sellerFullAddr = sAddr 
            ? `${sAddr.flatNo || ""}, ${sAddr.area || ""}, ${sAddr.city || ""}, ${sAddr.pincode || ""}` 
            : "Pickup Address Details Syncing...";
        
        doc.text(sellerFullAddr, 14, 60, { maxWidth: 85 });

        // 👤 3. SHIP TO (CUSTOMER DETAILS)
        doc.setFont("helvetica", "bold");
        doc.text("SHIP TO:", 120, 50);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.shippingAddress?.receiverName}`, 120, 55);
        doc.text(`${order.shippingAddress?.flatNo}, ${order.shippingAddress?.area}`, 120, 60, { maxWidth: 80 });
        doc.text(`${order.shippingAddress?.city}, ${order.shippingAddress?.pincode}`, 120, 70);

        // 4. Products Table
        const tableRows = sellerItems.map((item, idx) => [
            idx + 1, item.name, `X ${item.quantity}`, `Rs. ${item.price}`, `Rs. ${item.price * item.quantity}`
        ]);

        autoTable(doc, {
            startY: 85,
            head: [['S.No', 'Product Name', 'Qty', 'Unit Price', 'Subtotal']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0] },
        });

        // 5. Total Section
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.text(`Seller Total: Rs. ${sellerShare?.sellerSubtotal || 0}`, 196, finalY, { align: "right" });

        // 🚀 THE MAGIC: Add page break for all except last order
        if (index < ordersToProcess.length - 1) {
            doc.addPage();
        }
    });

    doc.save(`Bulk_Invoices_${new Date().getTime()}.pdf`);
    toast.success(`${selectedOrders.length} Invoices Downloaded in 1 PDF! ✅`);
};

// Bulk Ship Logic
const handleBulkShip = async () => {
    if (selectedOrders.length === 0) return toast.warn("Select orders to ship!");
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Backend loops panni update panna manual-ah multiple calls or single bulk route use pannalam
        await Promise.all(selectedOrders.map(id => 
            axios.put(`${API_BASE}/orders/update-status/${id}`, { status: 'Shipped', sellerId }, config)
        ));
        toast.success("All selected orders marked as Shipped!");
        setSelectedOrders([]);
        fetchOrders();
    } catch (err) { toast.error("Bulk shipping failed!"); }
    finally { setIsLoading(false); }
};
   const generateInvoice = (order) => {
    try {
        const doc = new jsPDF();
        const sellerItems = order.items.filter(i => (i.sellerId?._id || i.sellerId) === sellerId);
        const sellerShare = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);

        // 1. Header (Professional Clean Look)
        doc.setFontSize(22);
        doc.text("INVOICE", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.text("Platform: Zhopingo ", 14, 30);
        doc.text(`Order ID: #${order._id.toUpperCase()}`, 14, 35);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 40);

        // 🚀 THE SYNC: SOLD BY (SELLER ADDRESS FROM PROFILE)
        doc.setFont("helvetica", "bold");
        doc.text("SOLD BY (SELLER):", 14, 50);
        doc.setFont("helvetica", "normal");
        doc.text(`${sellerProfile?.shopName || "Our Store"}`, 14, 55);
        
        // Address parameters extraction
        const sAddr = sellerProfile?.shopAddress;
        const sellerFullAddr = sAddr 
            ? `${sAddr.flatNo || ""}, ${sAddr.area || ""}, ${sAddr.city || ""}, ${sAddr.pincode || ""}` 
            : "Pickup Address Not Found";
        
        doc.text(sellerFullAddr, 14, 60, { maxWidth: 85 });

        // 2. Shipping Details (CUSTOMER)
        doc.line(14, 75, 196, 75);
        doc.setFont("helvetica", "bold");
        doc.text("SHIP TO:", 14, 82);
        doc.setFont("helvetica", "normal");
        doc.text(`${order.shippingAddress?.receiverName}`, 14, 87);
        doc.text(`${order.shippingAddress?.flatNo}, ${order.shippingAddress?.area}`, 14, 92);
        doc.text(`${order.shippingAddress?.city}, ${order.shippingAddress?.pincode}`, 14, 97);

        // 3. Product Table
        const tableRows = sellerItems.map((item, index) => [
            index + 1,
            item.name,
            `X ${item.quantity}`,
            `Rs. ${item.price}`,
            `Rs. ${item.price * item.quantity}`
        ]);

        autoTable(doc, {
            startY: 105,
            head: [['S.No', 'Product Name', 'Qty', 'Unit Price', 'Subtotal']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            styles: { fontSize: 9, cellPadding: 3 },
        });

        // 4. Totals
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.text(`Total Earnings: Rs. ${sellerShare?.sellerSubtotal || 0}`, 196, finalY, { align: "right" });

        // 5. Save/Download
        doc.save(`Invoice_${order._id.slice(-6).toUpperCase()}.pdf`);
        toast.success("Invoice Downloaded!");

    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF.");
    }
};
const handleShipOrder = async (orderId) => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // 🚀 THE REAL-TIME SYNC: Delhivery AWB generation API
        const res = await axios.post(`${API_BASE}/logistics/create-shipment`, {
            orderId: orderId,
            sellerId: sellerId
        }, config);

        if (res.data.success) {
            toast.success(`AWB Generated: ${res.data.awb} ✅`);
            fetchOrders(); // Table refresh panna instantaneous-ah AWB theryum
        }
    } catch (err) { 
        console.error("AWB Sync Error:", err.response?.data);
        toast.error(err.response?.data?.message || "Delhivery API Timeout!"); 
    } finally {
        setIsLoading(false);
    }
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
        
        toast.error(err.response?.data?.message || "Delivery sync failed!"); 
    } finally {
        setIsLoading(false);
    }
};
const handleSchedulePickup = async (orderId) => {
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // 🚀 THE LOGISTICS HANDSHAKE: Triggering Delhivery Pickup API
        const res = await axios.post(`${API_BASE}/logistics/schedule-pickup`, {
            sellerId: sellerId,
            orderId: orderId // Backend mapping purpose
        }, config);

        if (res.data.success) {
            toast.success(`Pickup Scheduled for ${res.data.message.split('Date: ')[1]} ✅`);
            fetchOrders(); // Refresh status
        }
    } catch (err) {
        
        toast.error(err.response?.data?.details?.data?.message?.[0] || "Logistics Sync Failed!");
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
// 📄 1. Fetch Shipping Label (For Packed/Shipped orders)
const handleDownloadLabel = async (awb) => {
    try {
        const res = await axios.get(`${API_BASE}/logistics/label/${awb}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success && res.data.labelUrl) {
            window.open(res.data.labelUrl, '_blank');
        } else {
            toast.info("Label is generating, please wait 30 seconds.");
        }
    } catch (err) { toast.error("Logistics Label error!"); }
};

// 📝 2. Fetch POD (Proof of Delivery - only for Delivered orders)
const handleDownloadPOD = async (awb) => {
    try {
        const res = await axios.get(`${API_BASE}/logistics/documents/${awb}`, { headers: { Authorization: `Bearer ${token}` } });
        // Delhivery POD response usually contains a direct link
        const podLink = res.data.documents?.[awb]?.pod_link;
        if (podLink) {
            window.open(podLink, '_blank');
        } else {
            toast.warn("POD not uploaded by delivery boy yet.");
        }
    } catch (err) { toast.error("POD fetch failed!"); }
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
    {selectedOrders.length > 0 && (
        <div className="animate__animated animate__fadeIn d-flex gap-2 border-end pe-3">
            <button onClick={handleBulkInvoice} className="btn btn-dark btn-sm radius-8 d-flex align-items-center gap-1 fw-bold">
                <Icon icon="solar:file-download-bold" className="fs-5" /> BULK INVOICE ({selectedOrders.length})
            </button>
            <button onClick={handleBulkShip} className="btn btn-primary-600 btn-sm radius-8 d-flex align-items-center gap-1 fw-bold">
                <Icon icon="solar:delivery-bold" className="fs-5" /> BULK SHIP
            </button>
        </div>
    )}
            <div className="d-flex align-items-center gap-3">
                <select 
                    className="form-select form-select-sm radius-8 border-primary-100 fw-bold bg-light" 
                    style={{ width: '160px', height: '38px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Placed">Placed</option>
                    {/* 🌟 41. New Filter Option: Packed (Ready for logistics) */}
                    <option value="Packed">Packed</option> 
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
        </div>

        <div className='card-body p-24'>
            <div className='table-responsive'>
                <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                    <thead className="bg-light">
    <tr>
        {/* 🌟 BULK CHECKBOX & S.NO BOTH INTEGRATED */}
        <th className="ps-24" style={{ width: '80px' }}>
            <div className="d-flex align-items-center gap-3">
                <input 
                    type="checkbox" 
                    className="form-check-input shadow-none cursor-pointer"
                    onChange={(e) => {
                        if (e.target.checked) setSelectedOrders(currentOrders.map(o => o._id));
                        else setSelectedOrders([]);
                    }}
                    checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                />
                <span className="text-xxs fw-bold uppercase text-secondary">S.No</span>
            </div>
        </th>
                             
                            <th>Order ID</th>
                            <th>Order Date</th>
                            <th>Customer (Receiver)</th>
                            <th>Address</th>
                            <th>Products</th>
                            <th>Total Share</th>
                            <th>Tracking</th>
                            <th>Status</th>
                            <th className="text-center">Invoice</th>
                            <th className="text-center">Action</th>
                            <th className="text-center">Shipping Label</th>
        <th className="text-center">Proof (POD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        
{isLoading ? (
        <tr><td colSpan="9" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
    ) : currentOrders.length > 0 ? currentOrders.map((order, index) => {
        const sellerShare = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        
        return (
<tr key={`${order._id}-${index}`}>
    {/* 🌟 INDIVIDUAL ROW: Checkbox + Ascending S.No (1, 2, 3...) */}
    <td className="ps-24">
        <div className="d-flex align-items-center gap-3">
            <input 
                type="checkbox" 
                className="form-check-input shadow-none cursor-pointer"
                checked={selectedOrders.includes(order._id)}
                onChange={() => {
                    if (selectedOrders.includes(order._id)) {
                        setSelectedOrders(selectedOrders.filter(id => id !== order._id));
                    } else {
                        setSelectedOrders([...selectedOrders, order._id]);
                    }
                }}
            />
            {/* 🚀 THE FIX: (Previous Pages Count + Current Index + 1) */}
            <span className="fw-bold text-secondary">
                {indexOfFirstOrder + index + 1}
            </span>
        </div>
    </td>
                <td className="fw-bold text-primary-600">#{order._id.slice(-8).toUpperCase()}</td>
                <td>
    <div className="d-flex flex-column">
        <span className="text-sm fw-bold text-dark" style={{ fontSize: '13px' }}>
            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })}
        </span>
        
    </div>
</td>
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
                                        
                                       {/* 🚚 Real-time AWB Mapping from DB */}
<td>
    {(() => {
        const mySplit = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        return mySplit?.awbNumber ? (
            <div className="d-flex flex-column">
                <span className="badge bg-info-50 text-info-main text-xxs fw-bold">
                    ID: {mySplit.awbNumber}
                </span>
                <small className="text-primary-600 fw-bold italic" style={{fontSize: '9px'}}>Auto-Tracking Active</small>
            </div>
        ) : (
            <span className="text-muted text-xxs italic">Waiting for Packing</span>
        );
    })()}
</td>
                                        {/* Invoice Column - Add this before Action <td> */}


<td className="text-center">
    {(() => {
        const myItems = order.items?.filter(i => (i.sellerId?._id || i.sellerId) === sellerId);
        const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        
        // 🌟 MASTER SYNC: Detecting status priority
        const hasReturnRequest = myItems.some(i => i.itemStatus === 'Return Requested');
        const currentStatus = hasReturnRequest ? 'Return Requested' : (myPackage?.packageStatus || order.status);

        let badgeClass = "bg-neutral-600 text-white"; // Fallback

        // 🎨 9-STATUS FULL COLOR MAPPING (Strictly using utility classes)
        switch (currentStatus) {
            case 'Placed':
                badgeClass = "bg-warning-600 text-white"; // Bright Yellow/Orange
                break;
            case 'Packed':
                badgeClass = "bg-info-main text-white"; // Light Blue
                break;
            case 'Shipped':
                badgeClass = "bg-primary-600 text-white"; // Brand Blue
                break;
            case 'Delivered':
                badgeClass = "bg-success-600 text-white"; // Solid Green
                break;
            case 'Return Requested':
                badgeClass = "bg-magenta-600 text-white"; // Purple/Pink Mix
                break;
            case 'Return Approved':
                badgeClass = "bg-lilac-600 text-white"; // Deep Violet
                break;
            case 'Return In Progress':
                badgeClass = "bg-orange-600 text-white"; // Pure Orange
                break;
            case 'Returned':
                badgeClass = "bg-danger-600 text-white"; // Solid Red (Matches your Image)
                break;
            case 'Cancelled':
                badgeClass = "bg-secondary text-white"; // Solid Grey
                break;
            default:
                badgeClass = "bg-neutral-600 text-white";
        }

        return (
            <span className={`badge px-16 py-10 radius-pill fw-black uppercase ls-1 shadow-sm ${badgeClass}`} 
                  style={{ fontSize: '10px', minWidth: '110px', display: 'inline-block' }}>
                {currentStatus}
            </span>
        );
    })()}
</td>
<td className="text-center">
                <button 
                    onClick={() => generateInvoice(order)}
                    className="btn btn-sm btn-outline-dark p-8 radius-8 shadow-none transition-all hover-bg-dark hover-text-white"
                    title="Download Black & White Invoice"
                >
                    <Icon icon="solar:file-download-bold" className="fs-5" />
                </button>
            </td>


<td className="text-center">
    <div className="d-flex gap-2 justify-content-center align-items-center">
        {(() => {
            const myItems = order.items?.filter(i => (i.sellerId?._id || i.sellerId) === sellerId);
            const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
            
            // 🌟 THE SYNC: Priority check for Return Requests
            const hasReturnRequested = myItems.some(i => i.itemStatus === 'Return Requested') || myPackage?.packageStatus === 'Return Requested';
            const myStatus = myPackage?.packageStatus || order.status;

            // 🔙 1. REVERSE LOGISTICS: Always highest priority if customer asks for return
            if (hasReturnRequested && myStatus !== 'Returned') {
                return (
                    <div className="d-flex flex-column gap-1 bg-primary-50 p-8 radius-8 border border-primary-100">
                        <small className="text-primary-600 fw-black uppercase" style={{fontSize: '9px'}}>Return Approval Needed</small>
                        <div className="d-flex gap-2 justify-content-center">
                            <button onClick={() => handleReturnAction(order._id, 'Approved')} className="btn btn-success btn-sm radius-8 py-4 px-12 fw-bold text-xxs shadow-sm">ACCEPT</button>
                            <button onClick={() => handleReturnAction(order._id, 'Rejected')} className="btn btn-outline-danger btn-sm radius-8 py-4 px-12 fw-bold text-xxs">REJECT</button>
                        </div>
                    </div>
                );
            }

            // 🚚 2. SHIPMENT TRIGGER: Ready for Delhivery Pickup
            if (myStatus === 'Packed') {
                return (
                    <button 
                        onClick={() => handleSchedulePickup(order._id)} 
                        disabled={isLoading}
                        className="btn btn-warning-600 btn-sm radius-8 fw-bold d-flex align-items-center gap-1 px-16 shadow-sm"
                    >
                        {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <Icon icon="solar:delivery-bold" />}
                        READY TO SHIP
                    </button>
                );
            }

            // 📦 3. PRE-PACKING: Order received but not yet packed by seller
            if (myStatus === 'Placed') {
                return (
                    <div className="text-secondary-light d-flex align-items-center gap-1">
                        <Icon icon="solar:box-minimalistic-bold" className="fs-5" />
                        <span className="fw-bold text-xxs uppercase">Wait for Packing</span>
                    </div>
                );
            }

            // 📡 4. AUTO-TRACKING STATES: Webhook updates from Delhivery
            // Inime "Mark Delivered" button thevai illai, webhook automatic-ah andha work-ai mudikkum.
            if (myStatus === 'Shipped' || myStatus === 'In Transit' || myStatus === 'Dispatched') {
                return (
                    <div className="text-info-main fw-black text-xxs uppercase d-flex flex-column align-items-center gap-1">
                        <div className="d-flex align-items-center gap-1">
                            <Icon icon="solar:delivery-bold" className="fs-5" />
                            <span>In Transit</span>
                        </div>
                        <small className="text-dark fw-bold lowercase" style={{fontSize: '8px', opacity: 0.6}}>Syncing from Logistics...</small>
                    </div>
                );
            }

            // ✅ 5. TERMINAL STATES: Completed or Finalized
            if (myStatus === 'Delivered') return <div className="text-success fw-black text-xxs uppercase d-flex align-items-center gap-1"><Icon icon="solar:check-circle-bold" className="fs-5" /> COMPLETED</div>;
            if (myStatus === 'Returned') return <div className="text-danger fw-black text-xxs uppercase d-flex align-items-center gap-1"><Icon icon="solar:back-bold" className="fs-5" /> RETURNED</div>;
            if (myStatus === 'Cancelled') return <div className="text-secondary fw-black text-xxs uppercase">CANCELLED</div>;

            return <span className="text-secondary-light fw-bold">---</span>;
        })()}
    </div>
</td>
{/* 🌟 1. Shipping Label Column */}
<td className="text-center">
    {(() => {
        const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        const canLabel = myPackage?.awbNumber && ['Packed', 'Shipped', 'Delivered'].includes(myPackage.packageStatus);
        
        return canLabel ? (
            <button onClick={() => handleDownloadLabel(myPackage.awbNumber)} className="btn btn-sm btn-info-focus text-info-main p-8 radius-8 border-0 shadow-sm" title="Download Label">
                <Icon icon="solar:printer-bold" className="fs-5" />
            </button>
        ) : <span className="text-muted text-xxs italic">Not Ready</span>;
    })()}
</td>

{/* 🌟 2. POD Column */}
<td className="text-center">
    {(() => {
        const myPackage = order.sellerSplitData?.find(s => (s.sellerId?._id || s.sellerId) === sellerId);
        const isDelivered = myPackage?.packageStatus === 'Delivered';
        
        return isDelivered ? (
            <button onClick={() => handleDownloadPOD(myPackage.awbNumber)} className="btn btn-sm btn-success-focus text-success-main p-8 radius-8 border-0 shadow-sm" title="View Proof of Delivery">
                <Icon icon="solar:document-bold" className="fs-5" />
            </button>
        ) : <span className="text-muted text-xxs italic">---</span>;
    })()}
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