import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";

const OrderPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [orderStep, setOrderStep] = useState(1);

  
  // Tag-style dropdown state
  const [selectedStatuses, setSelectedStatuses] = useState(["New Order", "Accepted", "Ready to Ship"]);
  const statusOptions = ["New Order", "Accepted", "Ready to Ship", "In Transit", "Delivered", "Rejected"];

  // Loading function logic
  const handleFilterChange = (status) => {
    if (!selectedStatuses.includes(status)) {
      setIsLoading(true);
      setSelectedStatuses([...selectedStatuses, status]);
      setTimeout(() => setIsLoading(false), 800);
    }
  };
const [isLoading, setIsLoading] = useState(false); 

// Intha function-ah dropdown change aagura idathula call pannunga
const triggerLoading = () => {
  setIsLoading(true);
  // 800ms loading kaattiittu automatic-ah stop aagum
  setTimeout(() => {
    setIsLoading(false);
  }, 800);
};
  const removeStatus = (status) => {
    setIsLoading(true);
    setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    setTimeout(() => setIsLoading(false), 800);
  };

  return (
    <MasterLayout>
      <div className='card h-100 p-0 radius-12'>
        {/* HEADER - ALL ELEMENTS IN ONE LINE */}
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-nowrap gap-3 overflow-x-auto'>
          <div className="d-flex align-items-center gap-3 flex-nowrap">
            <h6 className='text-lg fw-semibold mb-0 text-nowrap'>Order Bookings</h6>
            
           {/* SEARCH INPUT - Updated placeholder and size as per image_26bb59.png */}
    <input 
      type="text" 
      className="form-control radius-8" 
      placeholder="Search By Number" 
      style={{ width: '200px', height: '42px' }} 
    />
            
            {/* TAG-STYLE DROPDOWN WITH +N LOGIC */}
            <div className="d-flex align-items-center border radius-8 px-12 py-6 bg-white gap-2 position-relative" style={{ minWidth: '320px' }}>
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                {selectedStatuses.slice(0, 2).map(status => (
                  <span key={status} className="badge bg-primary-50 text-primary-600 d-flex align-items-center gap-1 px-8 py-4 radius-4 text-xs fw-medium border border-primary-100 text-nowrap">
                    {status}
                    <Icon icon="lucide:x" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); removeStatus(status); }} />
                  </span>
                ))}
                {selectedStatuses.length > 2 && (
                  <span className="text-primary-600 fw-bold text-xs bg-primary-50 px-8 py-4 radius-4 border border-primary-100 text-nowrap">
                    +{selectedStatuses.length - 2}
                  </span>
                )}
              </div>
              <select 
                className="border-0 outline-0 flex-grow-1 text-sm bg-transparent cursor-pointer" 
                style={{ width: '100%', opacity: 0, position: 'absolute', left: 0 }} 
                onChange={(e) => handleFilterChange(e.target.value)} 
                value=""
              >
                <option value="" disabled></option>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <Icon icon="lucide:chevron-down" className="text-secondary-light ms-auto" />
            </div>

            {/* DROP DOWNS */}
            <select className="form-select w-auto radius-8">
              <option>Last 7 Days</option>
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 3 Days</option>
              <option>Last 15 Days</option>
              <option>Last 30 Days</option>
              <option>Month</option>
            </select>

            <select className="form-select w-auto radius-8">
              <option>whatsapp</option>
              <option>website</option>
              <option>offline</option>
            </select>
          </div>

          <button onClick={() => { setIsDrawerOpen(true); setOrderStep(1); }} className="btn btn-primary-600 text-sm d-flex align-items-center gap-2 text-nowrap">
            <Icon icon="lucide:plus" /> Create Order
          </button>
        </div>
        
        <div className='card-body p-24 position-relative' style={{ minHeight: '400px' }}>
          
      {isLoading && (
    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
         style={{ backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, borderRadius: '12px' }}>
       <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
       </div>
    </div>
  )}

          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 text-nowrap'>
              <thead>
                <tr>
                  <th>S.no</th><th>Booking Id</th><th>Booked Date</th><th>Payment</th>
                  <th>User</th><th>Phone Number</th><th>Items</th><th>Total</th>
                  <th>Payment Type</th><th>Products</th><th>Address</th><th>Status</th>
                  <th>Detail</th><th>Tracking</th><th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="15" className="text-center py-40">
                     <Icon icon="fluent:box-24-regular" className="text-6xl text-secondary-light mb-8" />
                     <p className="text-secondary-light">No data</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PAGINATION - ONLY NUMBER 1 */}
          <div className="d-flex justify-content-end align-items-center gap-2 mt-24">
            <button className="btn btn-sm btn-outline-secondary-light radius-8 p-1 d-flex align-items-center justify-content-center">
              <Icon icon="lucide:chevron-left" />
            </button>
            <div className="d-flex gap-2">
              <span className="bg-primary-600 text-white px-12 py-4 radius-4 cursor-pointer">1</span>
            </div>
            <button className="btn btn-sm btn-outline-secondary-light radius-8 p-1 d-flex align-items-center justify-content-center">
              <Icon icon="lucide:chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Section logic remains */}
      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} 
           style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '500px', zIndex: 1060 }}
           tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 d-flex align-items-center justify-content-between'>
          <h6 className='offcanvas-title fw-semibold'>Add New Order</h6>
          <button type='button' className='btn-close' onClick={() => setIsDrawerOpen(false)}></button>
        </div>
        <div className='offcanvas-body p-24'>
          {orderStep === 1 ? (
            <div className="row gy-4">
              <div className="col-12"><label className="form-label fw-semibold">Name</label><input type="text" className="form-control" placeholder="Enter Name" /></div>
              <div className="col-12"><label className="form-label fw-semibold">Mobile</label><input type="text" className="form-control" placeholder="Enter Mobile" /></div>
              <div className="col-12 d-flex justify-content-end gap-3 mt-4">
                <button className="btn btn-outline-secondary-light px-24" onClick={() => setIsDrawerOpen(false)}>Cancel</button>
                <button className="btn btn-primary-600 px-32" onClick={() => setOrderStep(2)}>Next</button>
              </div>
            </div>
          ) : (
            <div className="row gy-4">
              <div className="col-12 text-center border p-24 radius-8 bg-neutral-50 mb-16"><p className="mb-8 fw-medium">No Address Available</p><button className="btn btn-sm btn-outline-primary-600">+ Add New Address</button></div>
              <div className="col-12 d-flex justify-content-end gap-3 mt-4">
                <button className="btn btn-outline-secondary-light px-24" onClick={() => setOrderStep(1)}>Back</button>
                <button className="btn btn-primary-600 px-32" onClick={() => setIsDrawerOpen(false)}>Create Order</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {isDrawerOpen && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => setIsDrawerOpen(false)}></div>}
    </MasterLayout>
  );
};

export default OrderPage;