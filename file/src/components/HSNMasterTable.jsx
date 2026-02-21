import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Icon } from "@iconify/react";

const HSNMasterTable = () => {
  const [hsnData, setHsnData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false); // 🌟 Edit Flag
  const [editingId, setEditingId] = useState(null);
  
  // 🌟 Professional Delete States
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  const [newHsn, setNewHsn] = useState({ hsnCode: "", description: "", gstRate: "" });

  const API_URL = "https://api.zhopingo.in/api/v1/catalog/hsn-master";

  const fetchHsnData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL);
      if (response.data.success) {
        setHsnData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch HSN list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHsnData();
  }, []);

  const toggleHsnStatus = async (id, currentStatus) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, { status: !currentStatus });
      if (response.data.success) {
        toast.success("Status updated!");
        fetchHsnData();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // 🌟 38. Handle Edit Logic
  const handleEditClick = (item) => {
    setIsUpdate(true);
    setEditingId(item._id);
    setNewHsn({
      hsnCode: item.hsnCode,
      description: item.description,
      gstRate: item.gstRate
    });
    setShowModal(true);
  };

// 🌟 38. Handle Add & Update Logic with correct API Routes
const handleAddHsn = async (e) => {
  e.preventDefault();
  try {
    let response;
    
    if (isUpdate) {
      // 🌟 UPDATED: Route synced with your new backend router (put('/hsn/update/:id'))
      response = await axios.put(`https://api.zhopingo.in/api/v1/catalog/hsn/update/${editingId}`, newHsn);
      toast.success("HSN Code updated successfully!");
    } else {
      // Create logic remains same
      response = await axios.post(API_URL, newHsn);
      toast.success("HSN Code added successfully!");
    }
    
    if (response.data.success || response.status === 201) {
      setNewHsn({ hsnCode: "", description: "", gstRate: "" });
      setShowModal(false);
      setIsUpdate(false);
      fetchHsnData(); // Refresh table
    }
  } catch (error) {
    toast.error(error.response?.data?.error || "Operation failed. Please try again.");
  }
};

  // 🌟 37. Professional Delete Logic
  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`${API_URL}/${deleteModal.id}`);
      if (response.data.success) {
        toast.success("HSN Deleted Successfully!");
        setDeleteModal({ show: false, id: null });
        fetchHsnData();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredData = hsnData.filter(item => 
    item.hsnCode?.toString().includes(searchTerm) || 
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='card h-100 p-0 radius-12 border-0 shadow-sm'>
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      
      <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
        <h6 className='text-lg fw-semibold mb-0'>HSN Master</h6>
        <div className="d-flex align-items-center gap-3">
          <input type="text" className="form-control radius-8 ps-12" style={{ width: '250px' }} placeholder="Search HSN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="btn btn-primary-600 radius-8 py-8 px-16 d-flex align-items-center gap-2" onClick={() => { setIsUpdate(false); setNewHsn({hsnCode:"", description:"", gstRate:""}); setShowModal(true); }}>
            <Icon icon="lucide:plus" /> Add HSN
          </button>
        </div>
      </div>

      <div className='card-body p-24'>
        {isLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 text-nowrap'>
              <thead>
                <tr><th>S.no</th><th>HSN Code</th><th>Description</th><th>GST Rate</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td><span className="text-primary-600 fw-bold">{item.hsnCode}</span></td>
                    <td className="text-wrap" style={{ minWidth: '300px' }}>{item.description}</td>
                    <td><span className="badge bg-info-focus text-info-main px-12 py-4 radius-4">{item.gstRate}%</span></td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {/* 🌟 38. Edit Icon */}
                        <button onClick={() => handleEditClick(item)} className="text-primary-600 border-0 bg-transparent cursor-pointer text-2xl p-0">
                          <Icon icon="solar:pen-new-square-bold" />
                        </button>

                        <div onClick={() => toggleHsnStatus(item._id, item.status)} style={{ position: 'relative', width: '44px', height: '22px', backgroundColor: item.status !== false ? '#4489fe' : '#cbd5e0', borderRadius: '20px', cursor: 'pointer' }}>
                          <div style={{ position: 'absolute', top: '3px', left: '3px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', transition: 'transform 0.3s ease', transform: item.status !== false ? 'translateX(22px)' : 'translateX(0px)' }} />
                        </div>

                        {/* 🌟 37 & 39. Bigger Delete Icon with UI Popup */}
                        <button onClick={() => setDeleteModal({ show: true, id: item._id })} className="text-danger-600 border-0 bg-transparent cursor-pointer text-2xl p-0">
                          <Icon icon="solar:trash-bin-minimalistic-bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🌟 38. ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-16 border-0 shadow-lg">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="mb-0 fw-bold">{isUpdate ? "Update HSN Code" : "Add New HSN Code"}</h6>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleAddHsn}>
                <div className="modal-body py-24 px-24">
                  <div className="mb-16"><label className="form-label fw-bold text-sm">HSN Code *</label><input type="text" className="form-control radius-8 h-48-px" value={newHsn.hsnCode} onChange={(e) => setNewHsn({...newHsn, hsnCode: e.target.value})} required /></div>
                  <div className="mb-16"><label className="form-label fw-bold text-sm">Description *</label><textarea className="form-control radius-8" rows="3" value={newHsn.description} onChange={(e) => setNewHsn({...newHsn, description: e.target.value})} required /></div>
                  <div className="mb-0"><label className="form-label fw-bold text-sm">GST Rate (%) *</label><input type="number" className="form-control radius-8 h-48-px" value={newHsn.gstRate} onChange={(e) => setNewHsn({...newHsn, gstRate: e.target.value})} required /></div>
                </div>
                <div className="modal-footer border-top p-24">
                  <button type="button" className="btn btn-neutral-100 radius-8 fw-bold" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-600 radius-8 px-24 fw-bold">{isUpdate ? "Update HSN" : "Save HSN"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 37. PROFESSIONAL DELETE CONFIRMATION MODAL */}
      {deleteModal.show && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content radius-24 border-0 shadow-2xl bg-white text-center p-32">
                <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24 animate__animated animate__shakeX">
                    <Icon icon="solar:trash-bin-minimalistic-bold" className="display-4" />
                </div>
                <h5 className="mb-8 fw-bold text-dark">Delete HSN Code?</h5>
                <p className="text-secondary-light mb-32">Are you sure you want to permanently delete this HSN? This action cannot be undone.</p>
                <div className="d-flex justify-content-center gap-3">
                    <button onClick={() => setDeleteModal({show: false, id: null})} className="btn btn-neutral-100 px-24 py-12 radius-12 fw-bold text-dark">Cancel</button>
                    <button onClick={confirmDelete} className="btn btn-danger-600 px-24 py-12 radius-12 fw-bold shadow-lg">Confirm Delete</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HSNMasterTable;