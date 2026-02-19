import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewOrder, setViewOrder] = useState(null); // Detail view modal
    
    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const sellerId = sellerData.id || sellerData._id;
    const token = localStorage.getItem("userToken");
    
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

    // 🚚 1. Ship Now Logic (Delhivery Integration via update-status)
    const handleShipOrder = async (orderId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Admin/Seller can update to Shipped to trigger Delhivery
            const res = await axios.put(`${API_BASE}/orders/update-status/${orderId}`, {
                status: 'Shipped'
            }, config);

            if (res.data.success) {
                toast.success("Order Shipped & Waybill Generated!");
                fetchOrders(); 
            }
        } catch (err) { toast.error("Shipping trigger failed!"); }
    };

    // ✅ 2. Mark Delivered Logic (Triggers Payout)
    const handleMarkDelivered = async (orderId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.put(`${API_BASE}/orders/update-status/${orderId}`, {
                status: 'Delivered'
            }, config);

            if (res.data.success) {
                toast.success("Order Marked Delivered! Payout Generated.");
                fetchOrders(); 
            }
        } catch (err) { toast.error("Delivery status update failed!"); }
    };

    return (
        <div className='card h-100 p-0 radius-12 border-0 shadow-sm animate__animated animate__fadeIn'>
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between'>
                <div>
                    <h6 className='text-lg fw-semibold mb-0 text-primary-600'>Shop Order Bookings</h6>
                    <small className="text-secondary-light">Manage your products shipping and delivery</small>
                </div>
                <span className="badge bg-primary-600 text-white px-16 py-8 radius-pill fw-bold">Total Orders: {orders.length}</span>
            </div>

            <div className='card-body p-24'>
                <div className='table-responsive'>
                    <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                        <thead className="bg-light">
                            <tr>
                                <th>Order ID</th><th>Customer</th><th>Products</th>
                                <th>Total Share</th><th>Tracking</th><th>Status</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
                            ) : orders.length > 0 ? orders.map((order) => {
                                const sellerShare = order.sellerSplitData?.find(s => s.sellerId === sellerId);
                                return (
                                    <tr key={order._id}>
                                        <td className="fw-bold text-primary-600">#{order._id.slice(-8).toUpperCase()}</td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-sm fw-bold text-dark">{order.customerId?.name || "Customer"}</span>
                                                <small className="text-secondary">{order.shippingAddress?.pincode}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column gap-1">
                                                {order.items.filter(i => (i.sellerId?._id || i.sellerId) === sellerId).map((item, idx) => (
                                                    <span key={idx} className="text-xxs fw-bold text-dark-light">• {item.name} (x{item.quantity})</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td><span className="fw-900 text-dark">₹{sellerShare?.sellerSubtotal || 0}</span></td>
                                        
                                        {/* 🚚 Tracking Info */}
                                        <td>
                                            {order.awbNumber ? (
                                                <div className="d-flex flex-column">
                                                    <span className="badge bg-info-50 text-info-main text-xxs">AWB: {order.awbNumber}</span>
                                                    <small className="text-xxs text-primary-600 fw-bold mt-1">ETA: {order.arrivedIn}</small>
                                                </div>
                                            ) : <span className="text-muted text-xxs italic">Not Shipped</span>}
                                        </td>

                                        <td>
                                            <span className={`badge px-12 py-6 radius-pill text-xxs ${
                                                order.status === 'Delivered' ? 'bg-success-focus text-success-main' :
                                                order.status === 'Cancelled' ? 'bg-danger-focus text-danger-main' : 
                                                order.status === 'Shipped' ? 'bg-info-focus text-info-main' : 'bg-warning-focus text-warning-main'
                                            }`}>{order.status}</span>
                                        </td>
                                        
                                        <td className="text-center">
                                            <div className="d-flex gap-2 justify-content-center">
                                                {/* Placed aana udane Ship Now varum */}
                                                {order.status === 'Placed' && (
                                                    <button onClick={() => handleShipOrder(order._id)} className="btn btn-primary-600 btn-xs radius-8 py-6 px-12 fw-bold d-flex align-items-center gap-1">
                                                        <Icon icon="solar:delivery-bold" /> Ship Now
                                                    </button>
                                                )}
                                                
                                                {/* Shipped aana udane Delivered Mark panna mudiyum */}
                                                {order.status === 'Shipped' && (
                                                    <button onClick={() => handleMarkDelivered(order._id)} className="btn btn-success-600 btn-xs radius-8 py-6 px-12 fw-bold">
                                                        Mark Delivered
                                                    </button>
                                                )}
                                                <button onClick={() => setViewOrder(order)} className="btn btn-outline-neutral btn-xs radius-8 py-6 px-10"><Icon icon="solar:eye-bold" /></button>
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
            {/* Modal details loop item fix: neenga keta maari item.name product name theriyaum */}
        </div>
    );
};

export default MyOrders;