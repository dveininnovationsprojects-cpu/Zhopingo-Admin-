import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";

const CustomerPage = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const API_BASE = "https://api.zhopingo.in/api/v1/admin/customers";

    useEffect(() => { fetchCustomers(); }, []);

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

    // Pagination Logic
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(customers.length / rowsPerPage);

    return (
        <MasterLayout>
            <div className='card h-100 p-0 radius-12 border-0 shadow-sm'>
                <div className='card-header border-bottom bg-base py-16 px-24'>
                    <h6 className='text-lg fw-bold mb-0 text-primary-600'>Customers</h6>
                    {/* 🌟 Total count below heading */}
                    <p className="text-secondary-light text-xs mb-0 fw-bold">Total Customers: {customers.length}</p>
                </div>

                <div className='card-body p-24'>
                    <div className='table-responsive'>
                        <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                            <thead className="bg-light">
                                <tr>
                                    <th>S.no</th>
                                    <th>Name</th>
                                    <th>Joined On</th>
                                    <th>Wallet Balance</th>
                                    <th>Total Revenue</th>
                                    <th className="text-center">View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
                                ) : currentCustomers.length > 0 ? (
                                    currentCustomers.map((item, index) => (
                                        <tr key={item._id}>
                                            <td>{indexOfFirstItem + index + 1}</td>
                                            {/* 🌟 Name Stack: Name, Phone, Email (No Icons) */}
                                            <td>
                                                <div className="d-flex flex-column gap-1">
                                                    <span className="fw-bold text-dark text-sm">{item.name || "Zhopingo Customer"}</span>
                                                    <span className="text-secondary text-xs fw-bold">{item.phone || "No Phone"}</span>
                                                    <span className="text-muted text-xxs italic fw-medium">{item.email || "Email Not Provided"}</span>
                                                </div>
                                            </td>
                                            <td className="text-xs text-secondary fw-bold">
                                                {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="fw-900 text-success-main text-sm">₹{item.walletBalance || 0}</td>
                                            {/* 🌟 Total Revenue logic (Total of all orders) */}
                                            <td className="fw-bold text-primary-600">₹{item.totalSpent || 0}</td>
                                            <td className="text-center">
                                                <button onClick={() => { setSelectedUser(item); setModalType('address'); }} className="btn btn-info-focus text-info-main btn-xs radius-8 px-12 fw-bold d-inline-flex align-items-center gap-1">
                                                    <Icon icon="solar:map-point-bold" /> View ({item.addressBook?.length || 0})
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center py-80 text-secondary">No customers found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

             <div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
    <div className="d-flex align-items-center gap-2 border-end pe-3">
        <span className="text-xs text-secondary fw-bold">Rows per page:</span>
        <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold bg-light" value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
    </div>

    <div className="d-flex align-items-center gap-2">
        {/* Previous Button */}
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm">
            <Icon icon="solar:alt-arrow-left-linear" />
        </button>

        {/* Dynamic Page Numbers with Dots Logic */}
        <div className="d-flex gap-1 align-items-center">
            {(() => {
                const totalPagesCount = Math.ceil(customers.length / rowsPerPage);
                const pages = [];
                if (totalPagesCount <= 5) {
                    for (let i = 1; i <= totalPagesCount; i++) pages.push(i);
                } else {
                    pages.push(1);
                    if (currentPage > 3) pages.push('...');
                    if (currentPage > 1 && currentPage < totalPagesCount) {
                        if (currentPage > 2) pages.push(currentPage - 1);
                        pages.push(currentPage);
                        if (currentPage < totalPagesCount - 1) pages.push(currentPage + 1);
                    }
                    if (currentPage < totalPagesCount - 2) pages.push('...');
                    if (totalPagesCount > 1) pages.push(totalPagesCount);
                }
                return [...new Set(pages)].map((p, idx) => (
                    p === '...' ? <span key={idx} className="px-2 text-muted">...</span> :
                    <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>
                        {p}
                    </button>
                ));
            })()}
        </div>

        {/* Next Button */}
        <button disabled={indexOfLastItem >= customers.length} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm">
            <Icon icon="solar:alt-arrow-right-linear" />
        </button>
    </div>
    </div>
    </div>
    </div>

            {/* 🌟 ADDRESS MODAL - Designs sync with Image */}
            {modalType === 'address' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom px-24 py-16 bg-primary-50">
                                <div className="d-flex flex-column">
                                    <h6 className="mb-0 fw-bold text-primary-600">Customer Details</h6>
                                    <small className="text-secondary fw-bold text-xxs">{selectedUser?.name}</small>
                                </div>
                                <button onClick={() => setModalType(null)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-24" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                {selectedUser?.addressBook && selectedUser.addressBook.length > 0 ? (
                                    selectedUser.addressBook.map((addr, i) => (
                                        <div key={i} className="p-16 border rounded-16 mb-16 bg-light border-neutral-200">
                                            <div className="d-flex justify-content-between align-items-start mb-8">
                                                <span className={`badge ${addr.addressType === 'Home' ? 'bg-success-focus text-success-main' : 'bg-info-focus text-info-main'} radius-4 px-12 py-6 text-xxs uppercase fw-bold`}>
                                                    {addr.addressType || 'Home'}
                                                </span>
                                                <Icon icon="solar:home-2-bold" className="text-secondary opacity-25 fs-5" />
                                            </div>
                                            {/* 🌟 Receiver Name fix */}
                                            <p className="mb-1 fw-black text-dark text-sm uppercase ls-1">{addr.receiverName || selectedUser.name}</p>
                                            <p className="mb-1 text-sm text-secondary-light fw-bold">{addr.flatNo}, {addr.addressLine}</p>
                                            <p className="mb-2 text-sm text-secondary-light fw-bold">{addr.area}, {addr.landmark}</p>
                                            <div className="d-flex align-items-center gap-4 border-top pt-12 mt-8">
                                                <div className="d-flex align-items-center gap-1">
                                                    <Icon icon="solar:map-point-bold" className="text-primary-600" />
                                                    <span className="text-xs fw-900 text-dark">{addr.pincode}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-1">
                                                    <Icon icon="solar:phone-bold" className="text-primary-600" />
                                                    <span className="text-xs fw-900 text-dark">{addr.phone || selectedUser.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-40 opacity-50">
                                        <Icon icon="solar:map-point-remove-broken" className="text-5xl mb-12" />
                                        <p className="text-sm fw-bold text-secondary">No Details found.</p>
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