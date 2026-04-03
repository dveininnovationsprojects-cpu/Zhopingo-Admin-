import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom"; // 🌟 For redirection
import "react-toastify/dist/ReactToastify.css";



const AllSellersListPage = () => {
    const [sellers, setSellers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSeller, setSelectedSeller] = useState(null); // 🌟 Detail modal state
    const navigate = useNavigate();
    const [kycView, setKycView] = useState(null); // 🌟 KYC View state
// 🚀 THE FIX: Cloudfront URL for fast and secure document access
const IMAGE_BASE = "https://d1utzn73483swp.cloudfront.net/"; // 🌟 Documents base URL

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const API_BASE_URL = "https://api.zhopingo.in/api/v1/admin/sellers";

    useEffect(() => { fetchAllSellers(); }, []);

    const fetchAllSellers = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_BASE_URL);
            if (response.data.success) {
                setSellers(response.data.data);
            }
        } catch (error) {
            toast.error("Failed to load sellers list");
        } finally {
            setIsLoading(false);
        }
    };

    // 🌟 Updated Brand Toggle with KYC Approval Check
const handleToggleBrand = async (item) => {
    // 1. Seller approve aagala na error message kaattu
    if (item.kycStatus !== 'approved') {
        return toast.error("Seller not approved! Brand status can only be updated for approved sellers.");
    }

    // 2. Approve aagi irundha mattum API call panni update pannu
    try {
        const res = await axios.put(`${API_BASE_URL}/toggle-brand/${item._id}`, { isBrand: !item.isBrand });
        if (res.data.success) {
            toast.success("Brand status updated successfully!");
            fetchAllSellers();
        }
    } catch (error) { 
        toast.error("Update failed. Please try again."); 
    }
};

 const handleToggleActive = async (id, currentStatus) => {
    try {
        const token = localStorage.getItem("userToken"); // 🌟 Fetch token
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        // 🌟 Path must match router: /api/v1/admin/sellers/:id
        const res = await axios.put(
            `https://api.zhopingo.in/api/v1/admin/sellers/${id}`, 
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } } // 🌟 Important for 'protect' middleware
        );

        if (res.data.success) {
            toast.success(`Seller is now ${newStatus.toUpperCase()}`);
            fetchAllSellers(); 
        }
    } catch (error) { 
        console.error("Status update error:", error.response?.data);
        toast.error(error.response?.data?.message || "Status update failed"); 
    }
};

    const filteredSellers = sellers.filter((seller) => 
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.shopName?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const pendingRequestsCount = sellers.filter(s => s.kycStatus === 'pending').length;

    // 🌟 Advanced Pagination Logic
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredSellers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSellers.length / rowsPerPage);
    

    return (
        <MasterLayout>
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className='card h-100 p-0 radius-12 border-0 shadow-sm'>
                {/* 🌟 Header with New Request Button & Total Count */}
                <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
                    <div>
                        <h6 className='text-lg fw-semibold mb-0'>Sellers</h6>
                        <small className="text-secondary fw-bold">Total sellers: {sellers.length}</small>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* 🌟 New Seller Requests Button with Red Notification Badge */}
                        <button 
                            onClick={() => navigate("/new-seller")} 
                            className="btn btn-primary-600 btn-sm radius-8 px-16 d-flex align-items-center gap-2 position-relative"
                        >
                            <Icon icon="solar:user-plus-bold" /> 
                            <span>New Requests</span>
                            
                            {/* 🔴 RED NOTIFICATION BADGE */}
                            {pendingRequestsCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white animate__animated animate__pulse animate__infinite" 
                                      style={{ fontSize: '10px', padding: '4px 6px', zIndex: '1' }}>
                                    {pendingRequestsCount}
                                </span>
                            )}
                        </button>

                        <div className="position-relative">
                            <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary" />
                            <input 
                                type="text" className="form-control radius-8 ps-40" 
                                style={{ maxWidth: '250px' }} placeholder="Search..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                <div className='card-body p-24'>
                    <div className='table-responsive'>
                        <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                            <thead className="bg-light">
                                <tr>
                                    <th>S.no</th><th>Sellers Name</th><th>Shop Name</th>
                                    <th>Email & Phone</th><th>KYC Status</th><th className="text-center">KYC Docs</th><th className="text-center">View Details</th>
                                    <th className="text-center">Is Brand</th><th className="text-center">Shop Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="8" className="text-center py-50"><div className="spinner-border text-primary"></div></td></tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((item, index) => (
                                        <tr key={item._id}>

<td>
    <span className="fw-bold text-secondary-light">
        {indexOfFirstItem + index + 1}
    </span>
</td>
                                           {/* 🌟 16. Seller name to be in full Capital Letters */}
<td className="fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {item.name}
</td>
                                            <td className="text-primary-600 fw-bold">{item.shopName || "N/A"}</td>
                                            {/* 🌟 Email & Phone stacked */}
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="text-xs fw-bold text-dark">{item.email}</span>
                                                    <span className="text-xxs text-secondary">{item.phone || "No Phone"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge px-12 py-6 radius-pill text-xxs fw-bold uppercase ${item.kycStatus === 'approved' ? 'bg-success-focus text-success-main' : 'bg-warning-focus text-warning-main'}`}>
                                                    {item.kycStatus}
                                                </span>
                                            </td>
                                            <td className="text-center">
    <button 
        onClick={() => setKycView(item)} 
        className="btn btn-outline-primary btn-sm radius-8 px-12 fw-bold d-flex align-items-center gap-1 mx-auto"
        style={{ fontSize: '10px' }}
    >
        <Icon icon="solar:document-bold" /> VIEW DOCS
    </button>
</td>
                                            {/* 🌟 View Details Action */}
                                            <td className="text-center">
                                                <button onClick={() => setSelectedSeller(item)} className="btn btn-info-focus text-info-main p-6 radius-8 shadow-sm border-0">
                                                    <Icon icon="solar:eye-bold" className="fs-5" />
                                                </button>
                                            </td>

                                            {/* IS BRAND TOGGLE */}
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center">
                                                    {/* 🌟 Pass full item object for validation check */}
<div onClick={() => handleToggleBrand(item)} 
     style={{ 
        position: 'relative', 
        width: '46px', 
        height: '24px', 
        backgroundColor: item.isBrand ? '#4489fe' : '#cbd5e0', 
        borderRadius: '24px', 
        cursor: item.kycStatus === 'approved' ? 'pointer' : 'not-allowed', // Change cursor for UI feedback
        transition: '0.3s',
        opacity: item.kycStatus === 'approved' ? 1 : 0.6 // Make it look disabled if not approved
     }}>
    <div style={{ position: 'absolute', top: '4px', left: '4px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s', transform: item.isBrand ? 'translateX(22px)' : 'translateX(0px)' }} />
</div>
                                                </div>
                                            </td>

                                           {/* 🌟 40. Seller Shop Status Toggle (Red/Green logic) */}
<td className="text-center">
    <div className="d-flex justify-content-center">
        <div 
            onClick={() => handleToggleActive(item._id, item.status)} 
            style={{ 
                position: 'relative', 
                width: '50px', 
                height: '24px', 
                // 🌟 Green if 'active', Red if 'inactive'
                backgroundColor: item.status === 'active' ? '#28C76F' : '#EA5455', 
                borderRadius: '24px', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)'
            }}
        >
            {/* Toggle Circle */}
            <div style={{ 
                position: 'absolute', 
                top: '3px', 
                left: '3px', 
                width: '18px', 
                height: '18px', 
                backgroundColor: 'white', 
                borderRadius: '50%', 
                transition: 'all 0.3s ease', 
                // 🌟 Move circle to right if active
                transform: item.status === 'active' ? 'translateX(26px)' : 'translateX(0px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </div>
    </div>
    {/* 🌟 Optional: Small text label for clarity */}
    <small className={`fw-bold d-block mt-1 ${item.status === 'active' ? 'text-success' : 'text-danger'}`} style={{ fontSize: '9px' }}>
        {item.status?.toUpperCase()}
    </small>
</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="8" className="text-center py-50 text-secondary">No matching sellers found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* 🌟 KYC DOCUMENTS VIEWER MODAL */}
{kycView && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg">
                <div className="modal-header border-bottom p-24 bg-light">
                    <h6 className="mb-0 fw-black text-primary-600 uppercase ls-1">Verification Documents: {kycView.shopName}</h6>
                    <button onClick={() => setKycView(null)} className="btn-close shadow-none"></button>
                </div>
                <div className="modal-body p-32">
                    <div className="row g-4">
                        {[
                            { label: "PAN CARD", doc: kycView.kycDocuments?.panDoc, num: kycView.panNumber },
                            { label: "GST CERTIFICATE", doc: kycView.kycDocuments?.gstDoc, num: kycView.gstNumber },
                            { label: "FSSAI LICENSE", doc: kycView.kycDocuments?.fssaiDoc, num: kycView.fssaiNumber || "N/A" },
                            { label: "MSME", doc: kycView.kycDocuments?.msmeDoc}
                        ].map((d, i) => (
                            <div className="col-md-6" key={i}>
                               {/* 🌟 Inside mapping of kycView documents */}
<div className="p-16 radius-16 border bg-light h-100">
    <label className="text-xxs fw-black text-secondary uppercase d-block mb-8">{d.label}</label>
    
    {/* 🚀 THE FIX: Only show the "No:" line if a number actually exists */}
    {d.num && d.num !== "N/A" ? (
        <p className="fw-bold text-dark text-xs mb-12">No: {d.num}</p>
    ) : (
        <div className="mb-12" style={{ height: '18px' }}></div> // Spacer to maintain UI height consistency
    )}
    
    {d.doc?.fileUrl ? (
        <a 
            href={`${IMAGE_BASE}${d.doc.fileUrl}`} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-sm btn-white w-100 radius-8 border shadow-sm d-flex align-items-center justify-content-center gap-2 text-primary-600 fw-bold transition-all hover-scale"
        >
            <Icon icon="solar:eye-bold" /> Open {d.label}
        </a>
    ) : (
        <div className="text-muted text-xxs italic border-top pt-8 mt-4 animate__animated animate__fadeIn">
            Document not uploaded
        </div>
    )}

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="modal-footer border-0 p-24 pt-0">
                    <button onClick={() => setKycView(null)} className="btn btn-secondary w-100 radius-12 fw-bold">CLOSE VIEWER</button>
                </div>
            </div>
        </div>
    </div>
)}

                    {/* 🌟 ADVANCED DYNAMIC PAGINATION */}
                    <div className="card-footer bg-white border-top py-16 px-0 d-flex align-items-center justify-content-end gap-3 flex-wrap">
                        <div className="d-flex align-items-center gap-2 border-end pe-3">
                            <span className="text-xs text-secondary fw-bold">Rows:</span>
                            <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold bg-light" value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                            </select>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light border-0 shadow-sm"><Icon icon="solar:alt-arrow-left-linear" /></button>
                            <div className="d-flex gap-1 align-items-center">
                                {(() => {
                                    const pages = [];
                                    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
                                    else {
                                        pages.push(1);
                                        if (currentPage > 3) pages.push('...');
                                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) { pages.push(i); }
                                        if (currentPage < totalPages - 2) pages.push('...');
                                        pages.push(totalPages);
                                    }
                                    return [...new Set(pages)].map((p, idx) => (
                                        p === '...' ? <span key={idx} className="px-2 text-muted text-xs">...</span> :
                                        <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>{p}</button>
                                    ));
                                })()}
                            </div>
                            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
                        </div>
                    </div>
                </div>
            </div>
            

            {/* 🌟 SELLER SUMMARY MODAL */}
            {selectedSeller && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom px-32 py-20 bg-primary-50">
                                <h6 className="mb-0 fw-black text-primary-600 uppercase ls-1">Seller Details</h6>
                                <button onClick={() => setSelectedSeller(null)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-32">
                                <div className="text-center mb-24">
                                    <div className="w-80-px h-80-px bg-neutral-100 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-16 border border-primary-100">
                                        <Icon icon="solar:shop-bold" className="text-primary-600 display-6" />
                                    </div>
                                    <h5 className="fw-900 text-dark mb-4">{selectedSeller.shopName}</h5>
                                    <span className="badge bg-success-focus text-success-main radius-pill px-16 py-4 text-xxs fw-bold uppercase">{selectedSeller.status}</span>
                                </div>
                                <div className="row gy-4 border-top pt-24">
                                    <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">Owner Name</label><p className="fw-bold text-dark mb-0">{selectedSeller.name}</p></div>
                                    <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">Contact Phone</label><p className="fw-bold text-dark mb-0">{selectedSeller.phone || "N/A"}</p></div>
                                    <div className="col-12"><label className="text-xxs fw-bold text-muted uppercase">Email Address</label><p className="fw-bold text-dark mb-0 text-break">{selectedSeller.email}</p></div>
                                    <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">KYC Status</label><p className="fw-bold text-warning-main mb-0">{selectedSeller.kycStatus?.toUpperCase()}</p></div>
                                    <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">Brand Verified</label><p className="fw-bold text-primary-600 mb-0">{selectedSeller.isBrand ? "YES" : "NO"}</p></div>
                                </div>
                            </div>
                            <div className="modal-footer border-top p-24 bg-light">
                                <button onClick={() => setSelectedSeller(null)} className="btn btn-primary-600 w-100 radius-12 fw-bold uppercase ls-1">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default AllSellersListPage;