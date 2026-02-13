import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const sellerId = sellerData.id || sellerData._id;
    const token = localStorage.getItem("userToken");
    
    const API_BASE = "https://api.zhopingo.in/api/v1";

    const fetchOrders = async () => {
        if (!sellerId) return;
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // 🌟 Syncing with your plural order route
            const response = await axios.get(`${API_BASE}/orders/all`, config);
            
            if (response.data.success) {
                // Filter orders for this specific seller
                const myOrders = response.data.data.filter(order => 
                    order.sellerSplitData?.some(split => split.sellerId === sellerId)
                );
                setOrders(myOrders);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Failed to load orders!");
        } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, [sellerId]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.put(`${API_BASE}/order/update-status/${orderId}`, {
                status: newStatus
            }, config);

            if (res.data.success) {
                toast.success(`Status updated to ${newStatus}`);
                fetchOrders(); 
            }
        } catch (err) { toast.error("Status update failed!"); }
    };

    return (
        <div className='card h-100 p-0 radius-12 border-0 shadow-sm animate__animated animate__fadeIn'>
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between'>
                <h6 className='text-lg fw-semibold mb-0'>Your Order Bookings</h6>
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-100 text-primary-600 px-12 py-6 radius-8">Total Orders: {orders.length}</span>
                </div>
            </div>

            <div className='card-body p-24'>
                <div className='table-responsive'>
                    <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                        <thead className="bg-light">
                            <tr>
                                <th>Booking ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total Share</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="8" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
                            ) : orders.length > 0 ? (
                                orders.map((order) => {
                                    const sellerShare = order.sellerSplitData?.find(s => s.sellerId === sellerId);
                                    return (
                                        <tr key={order._id}>
                                            <td className="fw-bold">#{order._id.slice(-8).toUpperCase()}</td>
                                            <td className="text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="text-sm fw-bold text-dark">{order.customerId?.name || "Zhopingo User"}</span>
                                                    <span className="text-xxs text-secondary">{order.customerId?.phone}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-1">
                                                    {order.items.filter(i => (i.sellerId?._id || i.sellerId) === sellerId).map((item, idx) => (
                                                        <span key={idx} className="text-xxs fw-medium text-dark-light">• {item.name} (x{item.quantity})</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fw-900 text-primary-600 text-sm">₹{sellerShare?.sellerSubtotal || 0}</span>
                                            </td>
                                            <td>
                                                <span className="badge bg-info-50 text-info-main text-xxs px-8 py-4 radius-4">{order.paymentMethod}</span>
                                            </td>
                                            <td>
                                                <span className={`badge px-12 py-6 radius-pill text-xxs ${
                                                    order.status === 'Delivered' ? 'bg-success-focus text-success-main' :
                                                    order.status === 'Cancelled' ? 'bg-danger-focus text-danger-main' : 'bg-warning-focus text-warning-main'
                                                }`}>{order.status}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex gap-2 justify-content-center">
                                                    {order.status === 'Placed' && (
                                                        <button onClick={() => handleUpdateStatus(order._id, 'Shipped')} className="btn btn-primary-600 btn-xs radius-8 py-6 px-12 fw-bold text-white shadow-sm">Ship Now</button>
                                                    )}
                                                    {order.status === 'Shipped' && (
                                                        <button onClick={() => handleUpdateStatus(order._id, 'Delivered')} className="btn btn-success-600 btn-xs radius-8 py-6 px-12 fw-bold text-white shadow-sm">Mark Delivered</button>
                                                    )}
                                                    <button className="btn btn-outline-neutral btn-xs radius-8 py-6 px-12"><Icon icon="solar:eye-bold" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-80">
                                        <Icon icon="solar:clipboard-remove-bold" className="text-6xl text-neutral-200 mb-16" />
                                        <p className="text-secondary fw-bold">No orders found for your shop.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyOrders;