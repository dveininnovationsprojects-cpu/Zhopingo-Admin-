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

  // Production API Base URL
  const API_BASE_URL = "http://54.157.210.26/api/v1/admin/sellers";

  // 1. FETCH ALL SELLERS
  const fetchAllSellers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_BASE_URL);
      if (response.data.success) {
        // Moththa sellers-ahyum set pannuthu
        setSellers(response.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error.message);
      toast.error("Failed to load sellers list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSellers();
  }, []);

  // Filter logic based on Search
  const filteredSellers = sellers.filter((seller) => 
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.shopName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MasterLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <div className='card h-100 p-0 radius-12'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
          <h6 className='text-lg fw-semibold mb-0'>All Registered Sellers</h6>
          
          <div className="position-relative" style={{ maxWidth: '300px' }}>
            <input 
              type="text" 
              className="form-control radius-8 ps-40" 
              placeholder="Search Name / Shop..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Icon icon="lucide:search" className="position-absolute start-0 top-50 translate-middle-y ms-12 text-secondary" />
          </div>
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
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.length > 0 ? filteredSellers.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.shopName || "N/A"}</td>
                    <td>{item.phone}</td>
                    <td>{item.email || "N/A"}</td>
                    <td>
                      {/* Status coloring logic */}
                      <span className={`badge px-12 py-4 radius-4 text-xs ${
                        item.kycStatus === 'approved' ? 'bg-success-focus text-success-main' : 
                        item.kycStatus === 'pending' ? 'bg-warning-focus text-warning-main' : 
                        'bg-danger-focus text-danger-main'
                      }`}>
                        {item.kycStatus.charAt(0).toUpperCase() + item.kycStatus.slice(1)}
                      </span>
                    </td>
                  </tr>
                )) : (
                   <tr><td colSpan="6" className="text-center py-4">No sellers found in database.</td></tr>
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