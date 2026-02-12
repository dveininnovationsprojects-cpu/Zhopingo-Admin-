import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";

const OrderPage = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // 🌟 Filter States
    const [selectedStatuses, setSelectedStatuses] = useState([]); // Empty means ALL
    const [selectedDays, setSelectedDays] = useState("Last 7 Days");

    const API_BASE = "https://api.zhopingo.in/api/v1/orders/all"; 

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("userToken");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(API_BASE, config);
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err) { console.error("Order fetch error:", err); } 
        finally { setIsLoading(false); }
    };

    // 🌟 1. ADVANCED FILTER LOGIC (Status + Days + Search)
    useEffect(() => {
        let results = [...orders];

        // Search Filter
        if (searchQuery) {
            results = results.filter(o => 
                o._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                o.customerId?.phone?.includes(searchQuery)
            );
        }

        // Status Tag Filter
        if (selectedStatuses.length > 0) {
            results = results.filter(o => selectedStatuses.includes(o.status));
        }

        // Days Filter Logic
        const now = new Date();
        if (selectedDays !== "All Time") {
            results = results.filter(o => {
                const orderDate = new Date(o.createdAt);
                const diffTime = Math.abs(now - orderDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (selectedDays === "Today") return orderDate.toDateString() === now.toDateString();
                if (selectedDays === "Yesterday") {
                    const yesterday = new Date();
                    yesterday.setDate(now.getDate() - 1);
                    return orderDate.toDateString() === yesterday.toDateString();
                }
                if (selectedDays === "Last 3 Days") return diffDays <= 3;
                if (selectedDays === "Last 7 Days") return diffDays <= 7;
                if (selectedDays === "Last 15 Days") return diffDays <= 15;
                if (selectedDays === "Last 30 Days") return diffDays <= 30;
                return true;
            });
        }

        setFilteredOrders(results);
    }, [searchQuery, selectedStatuses, selectedDays, orders]);

    // UI Helper Functions
    const toggleStatus = (status) => {
        setSelectedStatuses(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    return (
        <MasterLayout>
            <div className='card h-100 p-0 radius-12 border-0 shadow-sm'>
                {/* 🌟 HEADER WITH SYNCED FILTERS */}
                <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <h6 className='text-lg fw-semibold mb-0'>Order Bookings</h6>
                        
                        <input 
                            type="text" className="form-control radius-8" placeholder="Search ID / Phone" 
                            style={{ width: '200px' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {/* Status Multi-Select Tags */}
                        <div className="d-flex gap-2 flex-wrap">
                            {["Placed", "Shipped", "Delivered", "Cancelled", "Pending"].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => toggleStatus(status)}
                                    className={`btn btn-sm radius-8 px-12 py-6 border ${selectedStatuses.includes(status) ? 'btn-primary text-white' : 'btn-outline-primary-100 text-primary-600 bg-primary-50'}`}
                                >
                                    {status} {selectedStatuses.includes(status) && <Icon icon="lucide:check" className="ms-1" />}
                                </button>
                            ))}
                        </div>

                        {/* Days Dropdown */}
                        <select 
                            className="form-select w-auto radius-8" 
                            value={selectedDays} 
                            onChange={(e) => setSelectedDays(e.target.value)}
                        >
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>Last 3 Days</option>
                            <option>Last 7 Days</option>
                            <option>Last 15 Days</option>
                            <option>Last 30 Days</option>
                            <option>All Time</option>
                        </select>
                    </div>
                </div>

                <div className='card-body p-24 position-relative'>
                    {isLoading && <div className="text-center py-50"><div className="spinner-border text-primary"></div></div>}
                    
                    <div className='table-responsive'>
                        <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                            <thead>
                                <tr>
                                    <th>S.no</th><th>Booking Id</th><th>Booked Date</th><th>Customer</th>
                                    <th>Phone</th><th>Items</th><th>Total</th><th>Payment</th>
                                    <th>Address</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order, index) => (
                                        <tr key={order._id}>
                                            <td>{index + 1}</td>
                                            <td className="fw-bold">#{order._id.slice(-8).toUpperCase()}</td>
                                            <td className="text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                                            <td>{order.customerId?.name || "Zhopingo User"}</td>
                                            <td>{order.customerId?.phone || "N/A"}</td>
                                            <td className="text-center"><span className="badge bg-neutral-100 text-neutral-800">{order.items?.length} Items</span></td>
                                            <td className="fw-900 text-primary-600">₹{order.totalAmount}</td>
                                            <td><span className="text-xs fw-bold px-8 py-4 radius-4 bg-info-50 text-info-main">{order.paymentMethod}</span></td>
                                            <td className="text-xs">{order.shippingAddress?.pincode}</td>
                                            <td>
                                                <span className={`badge px-12 py-6 radius-pill text-xs ${
                                                    order.status === 'Delivered' ? 'bg-success-focus text-success-main' :
                                                    order.status === 'Cancelled' ? 'bg-danger-focus text-danger-main' : 'bg-warning-focus text-warning-main'
                                                }`}>{order.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="10" className="text-center py-80 text-muted">No orders match these filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
};

export default OrderPage;