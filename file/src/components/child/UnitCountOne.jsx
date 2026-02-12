import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { Link } from "react-router-dom";

const UnitCountOne = () => {
  const [counts, setCounts] = useState({
    totalSellers: 0,
    newSellers: 0,
    totalCustomers: 0, // 🌟 New state for live customer count
  });

  const API_BASE_URL = "https://api.zhopingo.in/api/v1/admin";

  useEffect(() => {
    fetchDashboardCounts();
  }, []);

  const fetchDashboardCounts = async () => {
    try {
      // 1. Fetch Sellers Data
      const sellerRes = await axios.get(`${API_BASE_URL}/sellers`);
      
      // 🌟 2. Fetch Customers Data
      const customerRes = await axios.get(`${API_BASE_URL}/customers`);

      const sellerCount = sellerRes.data.success ? sellerRes.data.data.length : 0;
      const pendingCount = sellerRes.data.success 
        ? sellerRes.data.data.filter(s => s.kycStatus === "pending").length 
        : 0;
      
      // 🌟 Real Customer Count logic
      const customerCount = customerRes.data.success ? customerRes.data.data.length : 0;

      setCounts({
        totalSellers: sellerCount,
        newSellers: pendingCount,
        totalCustomers: customerCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard counts:", error);
    }
  };

  return (
    <div className='row row-cols-xxxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4'>
      
      {/* 1. Total Sellers - Dynamic */}
      <div className='col'>
        <Link to="/all-sellers" className="text-decoration-none h-100 d-block">
          <div className='card shadow-none border bg-gradient-start-1 h-100'>
            <div className='card-body p-20'>
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
                <div>
                  <p className='fw-medium text-primary-light mb-1'>Total Sellers</p>
                  <h6 className='mb-0'>{counts.totalSellers.toLocaleString()}</h6>
                </div>
                <div className='w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center'>
                  <Icon icon='gridicons:multiple-users' className='text-white text-2xl mb-0' />
                </div>
              </div>
              <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Registered Stores</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 2. New Sellers (Pending) - Dynamic */}
      <div className='col'>
        <Link to="/new-seller" className="text-decoration-none h-100 d-block">
          <div className='card shadow-none border bg-gradient-start-2 h-100'>
            <div className='card-body p-20'>
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
                <div>
                  <p className='fw-medium text-primary-light mb-1'>New Sellers</p>
                  <h6 className='mb-0'>{counts.newSellers.toLocaleString()}</h6>
                </div>
                <div className='w-50-px h-50-px bg-purple rounded-circle d-flex justify-content-center align-items-center'>
                  <Icon icon='fa-solid:award' className='text-white text-2xl mb-0' />
                </div>
              </div>
              <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Pending Approvals</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Total Customers - 🌟 NOW DYNAMIC with Navigation */}
      <div className='col'>
        <Link to="/customer" className="text-decoration-none h-100 d-block">
          <div className='card shadow-none border bg-gradient-start-3 h-100'>
            <div className='card-body p-20'>
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
                <div>
                  <p className='fw-medium text-primary-light mb-1'>Total Customers</p>
                  <h6 className='mb-0'>{counts.totalCustomers.toLocaleString()}</h6>
                </div>
                <div className='w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center'>
                  <Icon icon='fluent:people-20-filled' className='text-white text-2xl mb-0' />
                </div>
              </div>
              <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Registered Users</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 4. Total Incomes - Static for now */}
      <div className='col'>
        <div className='card shadow-none border bg-gradient-start-4 h-100'>
          <div className='card-body p-20'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
              <div>
                <p className='fw-medium text-primary-light mb-1'>Total Incomes</p>
                <h6 className='mb-0'>₹42,000</h6>
              </div>
              <div className='w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center'>
                <Icon icon='solar:wallet-bold' className='text-white text-2xl mb-0' />
              </div>
            </div>
            <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Platform Revenue</p>
          </div>
        </div>
      </div>

      {/* 5. Total Payout - Static for now */}
      <div className='col'>
        <div className='card shadow-none border bg-gradient-start-5 h-100'>
          <div className='card-body p-20'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
              <div>
                <p className='fw-medium text-primary-light mb-1'>Total Payout</p>
                <h6 className='mb-0'>₹30,000</h6>
              </div>
              <div className='w-50-px h-50-px bg-red rounded-circle d-flex justify-content-center align-items-center'>
                <Icon icon='fa6-solid:file-invoice-dollar' className='text-white text-2xl mb-0' />
              </div>
            </div>
            <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Settled to Sellers</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UnitCountOne;