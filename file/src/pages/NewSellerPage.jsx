import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NewSellerPage = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 🌟 Pagination States
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

  // Production API Base URL
  const API_BASE_URL = "https://api.zhopingo.in/api/v1/admin";
  
  // 🌟 Base URL for direct file access
  const FILE_BASE_URL = "http://54.157.210.26"; 

  // 1. FETCH ALL SELLERS
  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sellers`); 
      if (response.data.success) {
        const pendingRequests = response.data.data.filter(s => s.kycStatus === "pending");
        setSellers(pendingRequests);
      }
    } catch (error) {
      console.error("Fetch Error:", error.message);
      toast.error("Failed to load seller requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // 2. VERIFY SELLER STATUS
  const updateSellerStatus = async (status) => {
    setIsLoading(true);
    try {
      const payload = {
        sellerId: selectedSeller._id,
        status: status,
        reason: status === "rejected" ? "Documents are not clear or incomplete" : ""
      };

      const response = await axios.post(`${API_BASE_URL}/verify-seller`, payload);

      if (response.data.success) {
        toast.success(response.data.message);
        fetchSellers();
        setShowConfirmModal(false);
        setIsDrawerOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification update failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MasterLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <div className='card h-100 p-0 radius-12'>
        {/* 🌟 Header with Total Request Count */}
<div className='card-header border-bottom bg-base py-16 px-24'>
    <h6 className='text-lg fw-semibold mb-0'>New Seller Requests</h6>
    <p className="text-secondary-light text-xs mb-0 fw-bold">Total requests: {sellers.length}</p>
</div>
        
        <div className='card-body p-24 position-relative' style={{ minHeight: '400px' }}>
          {isLoading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white opacity-75 z-3">
              <div className="spinner-border text-primary"></div>
            </div>
          )}
          

          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 text-nowrap'>
              <thead>
                <tr>
                  <th>S.no</th>
                  <th>Seller Name</th>
                  <th>Shop Name</th>
                  <th>Email / Phone</th>
                  <th>Status</th>
                  <th>KYC Docs</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
               {/* 🌟 Pagination Logic Integration */}
{(() => {
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = sellers.slice(indexOfFirstItem, indexOfLastItem);

    return currentItems.length > 0 ? currentItems.map((item, index) => (
        <tr key={item._id}>
            <td>{indexOfFirstItem + index + 1}</td>
            <td className="fw-bold">{item.name}</td>
            <td className="text-primary-600 fw-bold">{item.shopName || "N/A"}</td>
            {/* Rest of the TD remains same... */}
            <td>
                <div className="d-flex flex-column">
                    <span className="text-sm fw-medium">{item.email}</span>
                    <span className="text-xs text-secondary">{item.phone}</span>
                </div>
            </td>
            <td><span className="badge bg-warning-focus text-warning-main px-12 py-4 radius-4 text-xs">Pending Review</span></td>
            <td>
                <button onClick={() => { setSelectedSeller(item); setIsDrawerOpen(true); }}
                    className="btn btn-primary-100 text-primary-600 px-12 py-6 radius-4 d-flex align-items-center gap-2">
                    <Icon icon="lucide:file-text" /> Review Docs
                </button>
            </td>
            <td>
                <button onClick={() => { setSelectedSeller(item); setShowConfirmModal(true); }}
                    className="btn btn-success-600 text-white px-16 py-6 radius-4 text-sm shadow-sm">
                    Verify
                </button>
            </td>
        </tr>
    )) : (
        <tr><td colSpan="7" className="text-center py-80 text-secondary italic">No pending seller verification requests.</td></tr>
    );
})()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* KYC DRAWER - Updated for Folder-based PDF Links */}
      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} 
           style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '500px', zIndex: 1060 }} tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 d-flex align-items-center justify-content-between bg-base'>
          <h6 className='offcanvas-title fw-semibold'>Seller Document Verification</h6>
          <button type='button' className='btn-close shadow-none' onClick={() => setIsDrawerOpen(false)}></button>
        </div>
        <div className='offcanvas-body p-24'>
          {selectedSeller && (
            <div className="row gy-4">
              <div className="col-12"><h6 className="text-md fw-bold mb-16 text-primary-600 border-bottom pb-2">Mandatory Documents</h6></div>
              
              {/* MSME Document - Direct API Link based on your sample */}
              <div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-12 border">
                 <div>
                     <h6 className="text-sm mb-0">MSME Certificate</h6>
                     <small className="text-secondary">File: {selectedSeller.kycDocuments?.msmeDoc?.fileName || "Pending"}</small>
                 </div>
                 {selectedSeller.kycDocuments?.msmeDoc?.fileName && (
                   <a 
                    href={`${FILE_BASE_URL}/uploads/kyc/msme/${selectedSeller.kycDocuments.msmeDoc.fileName}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-sm btn-outline-primary radius-8 d-flex align-items-center gap-1"
                   >
                     <Icon icon="bi:file-earmark-pdf" /> View PDF
                   </a>
                 )}
              </div>

              {/* PAN Card - Folder /pan/ */}
              <div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-12 border">
                 <div>
                     <h6 className="text-sm mb-0">PAN Card</h6>
                     <h6 className="text-primary-600 mb-0 mt-1">{selectedSeller.panNumber}</h6>
                 </div>
                 {selectedSeller.kycDocuments?.panDoc?.fileName && (
                   <a 
                    href={`${FILE_BASE_URL}/uploads/kyc/pan/${selectedSeller.kycDocuments.panDoc.fileName}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-sm btn-outline-primary radius-8 d-flex align-items-center gap-1"
                   >
                     <Icon icon="bi:file-earmark-pdf" /> View PAN
                   </a>
                 )}
              </div>

              <div className="col-12 mt-16"><h6 className="text-md fw-bold mb-16 text-warning-main border-bottom pb-2">GST & Other Info</h6></div>

              {/* GST Document - Folder /gst/ */}
              <div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-12 border">
                 <div>
                     <h6 className="text-sm mb-0">GST Registration</h6>
                     <h6 className="text-primary-600 mb-0 mt-1">{selectedSeller.gstNumber || "N/A"}</h6>
                 </div>
                 {selectedSeller.kycDocuments?.gstDoc?.fileName && (
                   <a 
                    href={`${FILE_BASE_URL}/uploads/kyc/gst/${selectedSeller.kycDocuments.gstDoc.fileName}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-sm btn-outline-primary radius-8 d-flex align-items-center gap-1"
                   >
                     <Icon icon="bi:file-earmark-pdf" /> View GST
                   </a>
                 )}
              </div>

              {/* FSSAI - Folder /fssai/ */}
 {/* FSSAI License Section */}
<div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-12 border">
    <div>
        <h6 className="text-sm mb-0">FSSAI License</h6>
        <h6 className="text-primary-600 mb-0 mt-1">{selectedSeller.fssaiNumber || "N/A"}</h6>
    </div>
    
    {/* 🌟 Document Fetching Logic */}
    {selectedSeller.kycDocuments?.fssaiDoc?.fileName ? (
      <a 
        href={`${FILE_BASE_URL}/uploads/kyc/fssai/${selectedSeller.kycDocuments.fssaiDoc.fileName}`} 
        target="_blank" 
        rel="noreferrer" 
        className="btn btn-sm btn-outline-primary radius-8 d-flex align-items-center gap-2 px-12"
      >
        <Icon icon="bi:file-earmark-pdf" className="text-lg" /> 
        <span>View FSSAI</span>
      </a>
    ) : (
      <span className="text-xs text-secondary-light italic">No Document Uploaded</span>
    )}
</div>
              
              <div className="col-12 mt-32 d-flex gap-3">
                 <button className="btn btn-danger-600 flex-grow-1 py-12" onClick={() => updateSellerStatus("rejected")}>Reject Request</button>
                 <button className="btn btn-success-600 flex-grow-1 py-12" onClick={() => updateSellerStatus("approved")}>Approve Seller</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal logic remains same */}
      {showConfirmModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-16 border-0 shadow-lg">
              <div className="modal-body text-center p-40">
                <div className="w-80-px h-80-px bg-success-focus text-success-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24 animate__animated animate__zoomIn">
                  <Icon icon="lucide:check-circle" className="text-4xl" />
                </div>
                <h5 className="mb-8 fw-semibold text-dark">Verify {selectedSeller?.shopName}?</h5>
                <p className="text-secondary-light mb-32">Approving this seller will verify their account and allow them to list products.</p>
                <div className="d-flex justify-content-center gap-3">
                  <button onClick={() => setShowConfirmModal(false)} className="btn btn-outline-secondary-light px-32 radius-8">Cancel</button>
                  <button onClick={() => updateSellerStatus("approved")} className="btn btn-success-600 px-32 radius-8 text-white shadow-sm">Confirm Approval</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isDrawerOpen || showConfirmModal) && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => { setIsDrawerOpen(false); setShowConfirmModal(false); }}></div>}
      {/* 🌟 Advanced Dynamic Pagination */}
<div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
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
                const totalPagesCount = Math.ceil(sellers.length / rowsPerPage);
                const pages = [];
                if (totalPagesCount <= 5) { for (let i = 1; i <= totalPagesCount; i++) pages.push(i); }
                else {
                    pages.push(1);
                    if (currentPage > 3) pages.push('...');
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPagesCount - 1, currentPage + 1); i++) { pages.push(i); }
                    if (currentPage < totalPagesCount - 2) pages.push('...');
                    if (totalPagesCount > 1) pages.push(totalPagesCount);
                }
                return [...new Set(pages)].map((p, idx) => (
                    p === '...' ? <span key={idx} className="px-2 text-muted">...</span> :
                    <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>{p}</button>
                ));
            })()}
        </div>

        <button disabled={currentPage >= Math.ceil(sellers.length / rowsPerPage)} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
    </div>
</div>
    </MasterLayout>
  );
};

export default NewSellerPage;