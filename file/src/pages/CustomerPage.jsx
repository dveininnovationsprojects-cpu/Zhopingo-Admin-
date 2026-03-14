import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";

const CustomerPage = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [allOrders, setAllOrders] = useState([]); // 🌟 Client Req: For order filtering
    const [isLoading, setIsLoading] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const API_BASE = "https://api.zhopingo.in/api/v1/admin";

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("userToken");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // 🌟 Fetching both Customers and Orders to show "Orders Table at Bottom"
            const [custRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE}/customers`, config),
                axios.get(`https://api.zhopingo.in/api/v1/orders/all`, config)
            ]);

            if (custRes.data.success) {
                setCustomers(custRes.data.data);
                setFilteredCustomers(custRes.data.data);
            }
            if (orderRes.data.success) setAllOrders(orderRes.data.data);

        } catch (error) {
            console.error("Fetch Error:", error.message);
        } finally { setIsLoading(false); }
    };

    // SEARCH FILTER LOGIC
    useEffect(() => {
        const results = customers.filter(customer => 
            customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCustomers(results);
        setCurrentPage(1);
    }, [searchTerm, customers]);

    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentCustomersList = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);

    // 🌟 Helper: Filter orders for specific customer
    const getCustomerOrders = (userId) => {
        return allOrders.filter(order => (order.customerId?._id || order.customerId) === userId);
    };

    return (
        <MasterLayout>
            <div className='card h-100 p-0 radius-12 border-0 shadow-sm'>
                <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
                    <div>
                        <h6 className='text-lg fw-bold mb-0 text-primary-600'>Customers</h6>
                        <p className="text-secondary-light text-xs mb-0 fw-bold">Total Customers: {filteredCustomers.length}</p>
                    </div>

                    <div className="position-relative">
                        <input type="text" className="form-control form-control-sm radius-8 ps-32" style={{ width: '280px', height: '40px' }} placeholder="Search Name, Phone or Email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Icon icon="solar:magnifer-linear" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary" style={{ fontSize: '18px' }} />
                    </div>
                </div>

                <div className='card-body p-24'>
                    <div className='table-responsive'>
                        <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                            <thead className="bg-light">
                                <tr>
                                    <th>S.no</th><th>Name</th><th>Joined On</th><th>Wallet Balance</th><th className="text-center">View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
                                ) : currentCustomersList.length > 0 ? (
                                    currentCustomersList.map((item, index) => (
                                        <tr key={item._id}>
                                            {/* 🌟 42. Customer List Serial Number Descending logic */}
<td>
    <span className="fw-bold text-secondary-light">
        {filteredCustomers.length - (indexOfFirstItem + index)}
    </span>
</td>
                                            {/* 🌟 Handle Empty Name in Table */}
<td>
    <div className="d-flex flex-column gap-1">
        {/* Name illai na 'User' nu kaattum */}
        <span className="fw-bold text-dark text-sm">
            {item.name && item.name.trim() !== "" ? item.name : "User"}
        </span>
        <span className="text-secondary text-xs fw-bold">{item.phone}</span>
        <span className="text-muted text-xxs italic fw-medium">{item.email || "No Email"}</span>
    </div>
</td>
                                            <td className="text-xs text-secondary fw-bold">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                                            <td className="fw-900 text-success-main text-sm">₹{item.walletBalance || 0}</td>
                                           
                                            <td className="text-center">
                                                <button onClick={() => { setSelectedUser(item); setModalType('details'); }} className="btn btn-info-focus text-info-main btn-sm radius-8 px-12 fw-bold d-inline-flex align-items-center gap-1">
                                                    <Icon icon="solar:eye-bold" /> View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center py-80 text-secondary italic">No matching customers found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="card-footer bg-white border-top py-16 px-0 d-flex align-items-center justify-content-end gap-3 flex-wrap">
                        <div className="d-flex align-items-center gap-2 border-end pe-3">
                            <span className="text-xs text-secondary fw-bold">Rows:</span>
                            <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold bg-light" value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                            </select>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-left-linear" /></button>
                            <div className="d-flex gap-1 align-items-center">
                                {(() => {
                                    const pages = [];
                                    const total = Math.ceil(filteredCustomers.length / rowsPerPage);
                                    if (total <= 5) { for (let i = 1; i <= total; i++) pages.push(i); }
                                    else {
                                        pages.push(1);
                                        if (currentPage > 3) pages.push('...');
                                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(total - 1, currentPage + 1); i++) { pages.push(i); }
                                        if (currentPage < total - 2) pages.push('...');
                                        if (total > 1) pages.push(total);
                                    }
                                    return [...new Set(pages)].map((p, idx) => (
                                        p === '...' ? <span key={idx} className="px-2 text-muted text-xs">...</span> :
                                        <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>{p}</button>
                                    ));
                                })()}
                            </div>
                            <button disabled={currentPage >= Math.ceil(filteredCustomers.length / rowsPerPage)} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
                        </div>
                    </div>
                </div>
            </div>
{/* 🌟 360° CUSTOMER DETAILS MODAL (Address + Order History) */}
{modalType === 'details' && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
               {/* 🌟 Modal Header Name Fix */}
<div className="modal-header border-bottom px-24 py-16 bg-primary-50">
    <h6 className="mb-0 fw-bold text-primary-600">
        Customer Profile: {selectedUser?.name && selectedUser.name.trim() !== "" ? selectedUser.name : "User"}
    </h6>
    <button onClick={() => setModalType(null)} className="btn-close shadow-none"></button>
</div>
                <div className="modal-body p-32" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* 📞 TOP: CONTACT & PROFILE INFO */}
    <div className="p-20 radius-16 bg-light border mb-32 shadow-sm">
        <label className="text-xxs fw-bold text-primary-600 uppercase mb-12 d-block ls-1">Contact Information</label>
        <div className="row">
            <div className="col-md-6 border-end">
                {/* 🌟 Contact Section Name Fix */}
<div className="d-flex align-items-center gap-2 mb-8">
    <Icon icon="solar:user-bold" className="text-primary-600" />
    <span className="text-sm fw-black text-dark uppercase">
        {selectedUser?.name && selectedUser.name.trim() !== "" ? selectedUser.name : "User"}
    </span>
</div>
                <div className="d-flex align-items-center gap-2 mb-0">
                    <Icon icon="solar:phone-bold" className="text-primary-600" />
                    <span className="text-sm fw-bold text-dark">{selectedUser?.phone || "N/A"}</span>
                </div>
            </div>
            <div className="col-md-6 ps-md-4">
                <div className="d-flex align-items-center gap-2">
                    <Icon icon="solar:letter-bold" className="text-primary-600" />
                    <span className="text-sm fw-bold text-dark text-break">{selectedUser?.email || "Email Not Provided"}</span>
                </div>
                <small className="text-xxs text-secondary-light fw-bold d-block mt-8 uppercase">Customer Since: {new Date(selectedUser?.createdAt).toLocaleDateString()}</small>
            </div>
        </div>
    </div>
                    
                    {/* 🏠 TOP: SAVED ADDRESSES */}
                    <label className="text-xxs fw-bold text-primary-600 uppercase mb-16 d-block ls-1">Saved Addresses</label>
                    <div className="row g-3 mb-32">
                        {selectedUser?.addressBook && selectedUser.addressBook.length > 0 ? (
                            selectedUser.addressBook.map((addr, i) => (
                                <div key={i} className="col-md-6">
                                    <div className="p-16 border rounded-16 bg-light h-100 shadow-sm border-neutral-200">
                                        <span className={`badge ${addr.addressType === 'Home' ? 'bg-success-focus text-success-main' : 'bg-info-focus text-info-main'} mb-8`}>{addr.addressType}</span>
                                        <p className="mb-1 fw-bold text-dark text-xs uppercase">{addr.receiverName}</p>
                                        <p className="mb-0 text-xxs text-secondary fw-medium">{addr.flatNo}, {addr.area}, {addr.pincode}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            /* 🌟 Empty Address Fallback */
                            <div className="col-12 text-center py-24 bg-neutral-50 radius-12 border border-dashed">
                                <Icon icon="solar:map-point-remove-bold" className="text-neutral-300 fs-2 mb-2" />
                                <p className="text-secondary fw-bold mb-0">No address found</p>
                            </div>
                        )}
                    </div>

                    {/* 📦 BOTTOM: ORDER HISTORY TABLE */}
                    <label className="text-xxs fw-bold text-success-600 uppercase mb-16 d-block ls-1">Order History Summary</label>
                    <div className="table-responsive border rounded-16 shadow-sm overflow-hidden">
                        <table className="table table-sm mb-0 align-middle">
                            <thead className="bg-success-50">
                                <tr className="text-xxs fw-black text-success-main">
                                    <th className="ps-16 py-12">ORDER ID</th>
                                    <th>BOOKED DATE</th>
                                    <th>AMOUNT</th>
                                    <th className="text-center">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getCustomerOrders(selectedUser?._id).length > 0 ? getCustomerOrders(selectedUser?._id).map((order, i) => (
                                    <tr key={i} className="text-xs border-bottom last-border-0">
                                        <td className="fw-bold ps-16 py-12 text-primary-600">#{order._id.slice(-6).toUpperCase()}</td>
                                        <td className="text-secondary fw-medium">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td className="fw-black text-dark">₹{order.totalAmount}</td>
                                        <td className="text-center">
                                            {/* 🌟 4 & 5. Dynamic Status Colors */}
                                            <span className={`badge px-12 py-6 radius-pill text-xxs fw-black uppercase ls-1`}
                                                style={{
                                                    backgroundColor: 
                                                        order.status === 'Delivered' ? '#E7F7EF' : // Green
                                                        order.status === 'Placed' ? '#FFF4E5' :    // Orange
                                                        order.status === 'Shipped' ? '#E8EFFF' : 
                                                        order.status === 'Cancelled' ? '#FCEAEA' :
                                                        order.status === 'Return Requested' ? '#F4EBFF' :  // Blue
                                                        '#F2F4F7',
                                                    color: 
                                                        order.status === 'Delivered' ? '#28C76F' : 
                                                        order.status === 'Placed' ? '#FF9F43' :    
                                                        order.status === 'Shipped' ? '#485EC4' :  
                                                        order.status === 'Cancelled' ? '#EA5455' : 
                                                        order.status === 'Return Requested' ? '#7F56D9' :
                                                        '#5E6366'
                                                }}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="text-center py-40 text-muted italic">No previous orders found for this customer.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
        </MasterLayout>
    );
};

export default CustomerPage;