import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AllSellersListPage = () => {
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🌟 API URL Configuration
  const API_BASE_URL = "https://api.zhopingo.in/api/v1/admin/sellers";

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

  // 🌟 1. TOGGLE BRAND STATUS (Sync with HSN Logic)
  const handleToggleBrand = async (id, currentStatus) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/toggle-brand/${id}`, { isBrand: !currentStatus });
      if (res.data.success) {
        toast.success("Brand status updated!");
        fetchAllSellers(); // Refresh list
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  useEffect(() => {
    fetchAllSellers();
  }, []);

  const filteredSellers = sellers.filter((seller) => 
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.shopName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MasterLayout>
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      
      <div className='card h-100 p-0 radius-12 border-0 shadow-sm'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
          <h6 className='text-lg fw-semibold mb-0'>All Registered Sellers</h6>
          <div className="position-relative">
            <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary" />
            <input 
              type="text" 
              className="form-control radius-8 ps-40" 
              style={{ maxWidth: '300px' }}
              placeholder="Search Name / Shop..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className='card-body p-24'>
          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 text-nowrap'>
              <thead>
                <tr>
                  <th>S.no</th>
                  <th>Seller Name</th>
                  <th>Shop Name</th>
                  <th>Email</th>
                  <th>KYC Status</th>
                  <th className="text-center">Is Brand?</th>
                </tr>
              </thead>
              <tbody className="position-relative">
                {isLoading ? (
                  // 🌟 Table-kku ullayae loading spinner (Inline Loader)
                  <tr>
                    <td colSpan="6" className="text-center py-80">
                       <div className="spinner-border text-primary"></div>
                       <p className="mt-8 text-secondary text-sm fw-medium">Updating Records...</p>
                    </td>
                  </tr>
                ) : filteredSellers.length > 0 ? (
                  filteredSellers.map((item, index) => (
                    <tr key={item._id}>
                      <td>{index + 1}</td>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.shopName || "N/A"}</td>
                      <td className="text-secondary">{item.email}</td>
                      <td>
                        <span className={`badge px-12 py-6 radius-4 ${item.kycStatus === 'approved' ? 'bg-success-focus text-success-main' : 'bg-warning-focus text-warning-main'}`}>
                          {item.kycStatus?.toUpperCase()}
                        </span>
                      </td>

                      {/* 🌟 2. BRAND BLUE TOGGLE SWITCH */}
                      <td>
                        <div className="d-flex justify-content-center">
                          <div 
                            onClick={() => handleToggleBrand(item._id, item.isBrand)}
                            style={{
                              position: 'relative',
                              width: '46px',
                              height: '24px',
                              backgroundColor: item.isBrand ? '#4489fe' : '#cbd5e0',
                              borderRadius: '24px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div 
                              style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                width: '16px',
                                height: '16px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: item.isBrand ? 'translateX(22px)' : 'translateX(0px)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                   <tr><td colSpan="6" className="text-center py-50 text-secondary">No matching sellers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
};

export default AllSellersListPage;