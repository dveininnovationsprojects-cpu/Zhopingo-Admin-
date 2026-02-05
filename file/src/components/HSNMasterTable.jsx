import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Icon } from "@iconify/react";

const HSNMasterTable = () => {
  const [hsnData, setHsnData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHsn, setNewHsn] = useState({ hsnCode: "", description: "", gstRate: "" });
  const toggleHsnStatus = async (id, currentStatus) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, { status: !currentStatus });
    if (response.data.success) {
      toast.success("Status updated!");
      fetchHsnData(); // Refresh table
    }
  } catch (error) {
    toast.error("Failed to update status");
  }
};

  // 🌟 API URL Configuration (Check for correct prefix)
  const API_URL = "http://54.157.210.26/api/v1/catalog/hsn-master";

  // 1. GET METHOD: Fetch all HSN codes from MongoDB
  const fetchHsnData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_URL);
      if (response.data.success) {
        setHsnData(response.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error.response?.status);
      if (error.response?.status === 404) {
        toast.error("API Endpoint not found. Please check backend prefix.");
      } else {
        toast.error("Failed to fetch HSN list");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHsnData();
  }, []);

  // 2. POST METHOD: Add new HSN Code
  const handleAddHsn = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(API_URL, newHsn);
      if (response.status === 201 || response.data.success) {
        toast.success("HSN Code added successfully!");
        setNewHsn({ hsnCode: "", description: "", gstRate: "" });
        setShowModal(false);
        fetchHsnData(); // 🌟 Table refresh
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add HSN");
    }
  };
  
  const deleteHsn = async (id) => {
  if (window.confirm("Are you sure you want to delete this HSN?")) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      if (response.data.success) {
        toast.success("HSN Deleted!");
        fetchHsnData(); // Table-ah refresh panna
      }
    } catch (error) {
      toast.error("Failed to delete HSN");
    }
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
          <div className="position-relative">
            <input 
              type="text" 
              className="form-control radius-8 ps-12" 
              style={{ width: '250px' }}
              placeholder="Search HSN / Description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary-600 radius-8 py-8 px-16 d-flex align-items-center gap-2"
            onClick={() => setShowModal(true)}
          >
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
                <tr>
                  <th>S.no</th><th>HSN Code</th><th>Description</th><th>GST Rate</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td><span className="text-primary-600 fw-bold">{item.hsnCode}</span></td>
                    <td className="text-wrap" style={{ minWidth: '300px' }}>{item.description}</td>
                    <td>
                      <span className="badge bg-info-focus text-info-main px-12 py-4 radius-4">
                        {item.gstRate}%
                      </span>
                    </td>
                <td>
  <div className="d-flex align-items-center gap-3">
    {/* Style-ah direct-aa JS object-aa kuduthutaam, so App.css thevai illa */}
    <div 
      onClick={() => toggleHsnStatus(item._id, item.status)}
      style={{
        position: 'relative',
        width: '44px',
        height: '22px',
        backgroundColor: item.status !== false ? '#4489fe' : '#cbd5e0',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div 
        style={{
          content: '""',
          position: 'absolute',
          top: '3px',
          left: '3px',
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRadius: '50%',
          transition: 'transform 0.3s ease',
          transform: item.status !== false ? 'translateX(22px)' : 'translateX(0px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </div>
    
    {/* Delete Button - Side-la side-by-side correct-aa irukum */}
    <button 
      onClick={() => deleteHsn(item._id)} 
      className="text-danger-600 border-0 bg-transparent cursor-pointer text-xl p-0 d-flex align-items-center"
    >
      <Icon icon="lucide:trash-2" />
    </button>
  </div>
</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-secondary">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANUAL ADD HSN MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-16 border-0">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="mb-0 fw-bold">Add New HSN Code</h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleAddHsn}>
                <div className="modal-body py-24 px-24">
                  <div className="mb-16 text-start">
                    <label className="form-label fw-semibold text-sm">HSN Code *</label>
                    <input type="text" className="form-control radius-8 h-48-px" placeholder="e.g. 6109" required 
                      value={newHsn.hsnCode} onChange={(e) => setNewHsn({...newHsn, hsnCode: e.target.value})} />
                  </div>
                  
                  <div className="mb-16 text-start">
                    <label className="form-label fw-semibold text-sm">Description *</label>
                    <textarea className="form-control radius-8" rows="3" placeholder="Enter HSN description" required
                      value={newHsn.description} onChange={(e) => setNewHsn({...newHsn, description: e.target.value})} />
                  </div>
                  <div className="mb-0 text-start">
                    <label className="form-label fw-semibold text-sm">GST Rate (%) *</label>
                    <input type="number" className="form-control radius-8 h-48-px" placeholder="e.g. 12" required
                      value={newHsn.gstRate} onChange={(e) => setNewHsn({...newHsn, gstRate: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer border-top p-24">
                  <button type="button" className="btn btn-neutral-200 radius-8 fw-bold" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-600 radius-8 px-24 fw-bold h-48-px">Save HSN</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HSNMasterTable;