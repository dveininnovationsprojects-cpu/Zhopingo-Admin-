import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";

const CustomerPage = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // 🌟 API Config - Synced with adminController routes
    const API_BASE = "https://api.zhopingo.in/api/v1/admin/customers";

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_BASE);
            if (response.data.success) {
                setCustomers(response.data.data);
            }
        } catch (error) {
            console.error("Fetch Error:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Default Name Logic
    const getDisplayName = (user) => {
        return user.name && user.name !== "NA" ? user.name : "Zhopingo Customer";
    };

    return (
        <MasterLayout>
            <div className='card h-100 p-0 radius-12 border-0 shadow-sm'>
                <div className='card-header border-bottom bg-base py-16 px-24 d-flex justify-content-between align-items-center'>
                    <h6 className='text-lg fw-semibold mb-0 text-primary-600'>Active Customers</h6>
                    <span className="badge bg-primary-100 text-primary-600 px-12 py-6 radius-8">Total: {customers.length}</span>
                </div>

                <div className='card-body p-24'>
                    <div className='table-responsive'>
                        <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                            <thead>
                                <tr>
                                    <th>S.no</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Wallet</th>
                                    <th>Joined On</th>
                                    <th>Email</th>
                                    <th>Cart</th>
                                    <th>Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="8" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
                                ) : customers.length > 0 ? (
                                    customers.map((item, index) => (
                                        <tr key={item._id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="w-32-px h-32-px bg-neutral-100 rounded-circle d-flex justify-content-center align-items-center">
                                                        <Icon icon="solar:user-bold" className="text-secondary" />
                                                    </div>
                                                    <span className="fw-bold text-dark">{getDisplayName(item)}</span>
                                                </div>
                                            </td>
                                            <td className="text-sm">{item.phone || "N/A"}</td>
                                            <td className="fw-900 text-success-main">₹{item.walletBalance || 0}</td>
                                            <td className="text-xs text-secondary">{new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="text-sm">{item.email || "-"}</td>
                                            <td>
                                                <button onClick={() => { setSelectedUser(item); setModalType('cart'); }} className="btn btn-outline-primary btn-sm radius-4 px-12">
                                                    View ({item.cart?.length || 0})
                                                </button>
                                            </td>
                                            <td>
                                                <button onClick={() => { setSelectedUser(item); setModalType('address'); }} className="btn btn-outline-info btn-sm radius-4 px-12">
                                                    Address
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="8" className="text-center py-50 text-secondary">No customers registered yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🌟 ADDRESS MODAL - Real Logic */}
            {modalType === 'address' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-16 border-0 shadow-lg">
                            <div className="modal-header border-bottom px-24 py-16 bg-light radius-top-16">
                                <h6 className="mb-0 fw-bold">Customer Address Book</h6>
                                <button onClick={() => setModalType(null)} className="btn-close"></button>
                            </div>
                            <div className="modal-body p-24">
                                {selectedUser?.addressBook && selectedUser.addressBook.length > 0 ? (
                                    selectedUser.addressBook.map((addr, i) => (
                                        <div key={i} className="p-16 border rounded-12 mb-12 bg-info-50 border-info-focus">
                                            <span className="badge bg-info-main text-white mb-8">{addr.addressType || 'Home'}</span>
                                            <p className="mb-1 fw-bold text-dark">{addr.flatNo}, {addr.addressLine}</p>
                                            <p className="mb-0 text-sm text-secondary">{addr.landmark} - {addr.pincode}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted py-20">No address details provided.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 CART MODAL - Real Logic */}
            {modalType === 'cart' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 border-0">
                            <div className="modal-header border-bottom px-24 py-16 bg-light radius-top-16">
                                <h6 className="mb-0 fw-bold">Live Cart Items</h6>
                                <button onClick={() => setModalType(null)} className="btn-close"></button>
                            </div>
                            <div className="modal-body p-24">
                                {selectedUser?.cart && selectedUser.cart.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table border mb-0 text-start align-middle">
                                            <thead className="bg-neutral-50 text-xs uppercase">
                                                <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
                                            </thead>
                                            <tbody>
                                                {selectedUser.cart.map((c, i) => (
                                                    <tr key={i}>
                                                        <td className="fw-medium text-dark">{c.product?.name || "Product Item"}</td>
                                                        <td><span className="badge bg-success-focus text-success-main">{c.quantity}</span></td>
                                                        <td className="fw-bold">₹{c.price || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-40 text-secondary">
                                        <Icon icon="solar:cart-cross-bold" className="text-5xl mb-12 opacity-25" />
                                        <p>This customer's cart is empty.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default CustomerPage;