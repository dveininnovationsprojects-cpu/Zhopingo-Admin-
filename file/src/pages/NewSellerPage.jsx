import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";

const NewSellerPage = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // UI Confirmation
  const [isLoading, setIsLoading] = useState(false);

  // 1. API CONNECTION LOGIC (AWS DUMMY) - Inga thaan actual API link pannanum
  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true);
      try {
        // ENGA CHANGE PANNANUM: Intha line-la unga AWS server API link-ah podunga
        // const response = await fetch("https://your-aws-api-endpoint/sellers/pending");
        // const data = await response.json();
        
        const dummyData = [
          { id: 1, name: "Arun Kumar", shopName: "Tuty Store", phone: "9876543210", email: "arun@example.com", 
            docs: { msme: "msme_001.pdf", pan: "ABCDE1234F", gstNumber: "33AAAAA0000A1Z5", fssai: "fssai_99.pdf" } },
          { id: 2, name: "Navin", shopName: "Doms Shop", phone: "9988776655", email: "navin@example.com", 
            docs: { msme: "msme_002.pdf", pan: "FGHIJ5678K", gstNumber: "33BBBBB0000B2Z6", fssai: "fssai_100.pdf" } }
        ];
        setSellers(dummyData);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSellers();
  }, []);

  // 2. VERIFY LOGIC (Triggered from UI Modal)
  const confirmAndVerify = async () => {
    setIsLoading(true);
    try {
      // API TESTING: Inga Postman-la test panra email trigger API call pannanum
      console.log(`Email trigger API sent to: ${selectedSeller.email}`);
      
      // Update local state
      setSellers(sellers.filter(s => s.id !== selectedSeller.id));
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Verification error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MasterLayout>
      <div className='card h-100 p-0 radius-12'>
        <div className='card-header border-bottom bg-base py-16 px-24'>
          <h6 className='text-lg fw-semibold mb-0'>New Seller Requests</h6>
        </div>
        
        <div className='card-body p-24 position-relative'>
          {isLoading && (
            <div className="position-absolute top-50 start-50 translate-middle z-3 bg-white w-100 h-100 d-flex justify-content-center align-items-center opacity-75">
              <div className="spinner-border text-primary"></div>
            </div>
          )}

          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 text-nowrap'>
              <thead>
                <tr>
                  <th>S.no</th><th>Name</th><th>Shop Name</th><th>Phone</th><th>Email</th><th>Details</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.shopName}</td>
                    <td>{item.phone}</td> {/* Phone Number Column Added */}
                    <td>{item.email}</td>
                    <td>
                      <button onClick={() => { setSelectedSeller(item); setIsDrawerOpen(true); }}
                        className="btn btn-primary-100 text-primary-600 px-12 py-6 radius-4 d-flex align-items-center gap-2">
                        <Icon icon="lucide:eye" /> View
                      </button>
                    </td>
                    <td>
                      <button onClick={() => { setSelectedSeller(item); setShowConfirmModal(true); }}
                        className="btn btn-success-600 text-white px-16 py-6 radius-4 text-sm">
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SELLER DOCUMENTS DRAWER */}
      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} 
           style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '500px', zIndex: 1060 }} tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 d-flex align-items-center justify-content-between'>
          <h6 className='offcanvas-title fw-semibold'>Seller Verification Documents</h6>
          <button type='button' className='btn-close' onClick={() => setIsDrawerOpen(false)}></button>
        </div>
        <div className='offcanvas-body p-24'>
          {selectedSeller && (
            <div className="row gy-4">
              <div className="col-12"><h6 className="text-md fw-bold mb-16 text-primary-600">Main Documents</h6></div>
              
              <div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-8">
                 <div><h6 className="text-sm mb-0">MSME Document</h6><small>{selectedSeller.docs.msme}</small></div>
                 <button className="btn btn-sm btn-outline-primary">View Doc</button>
              </div>

              <div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-8">
                 <div><h6 className="text-sm mb-0">PAN Number</h6><h6 className="text-primary-600 mb-0">{selectedSeller.docs.pan}</h6></div>
                 <button className="btn btn-sm btn-outline-primary">View Card</button>
              </div>

              {/* OPTIONAL SECTION AS REQUESTED */}
              <div className="col-12 mt-16"><h6 className="text-md fw-bold mb-16 text-warning-main">Optional Documents</h6></div>

             {/* GST SECTION - Updated with Number and View Button */}
<div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-8">
   <div>
      <h6 className="text-sm mb-0">GST Number</h6>
      {/* Dynamic GST Number like PAN */}
      <h6 className="text-primary-600 mb-0">{selectedSeller.docs.gstNumber || "33AAAAA0000A1Z5"}</h6>
   </div>
   <button className="btn btn-sm btn-outline-primary">View Doc</button>
</div>

              <div className="col-12 d-flex justify-content-between align-items-center bg-neutral-50 p-16 radius-8">
                 <div><h6 className="text-sm mb-0">FSSAI License</h6><small>{selectedSeller.docs.fssai}</small></div>
                 <button className="btn btn-sm btn-outline-primary">View Doc</button>
              </div>
              
              <div className="col-12 mt-24">
                 <button className="btn btn-primary-600 w-100 py-12" onClick={() => { setIsDrawerOpen(false); setShowConfirmModal(true); }}>Verify Now</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROFESSIONAL CONFIRMATION POPUP */}
      {showConfirmModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-16 border-0 shadow">
              <div className="modal-body text-center p-40">
                <div className="w-80-px h-80-px bg-success-focus text-success-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24">
                  <Icon icon="lucide:check-circle" className="text-4xl" />
                </div>
                <h5 className="mb-8 fw-semibold">Verify Seller?</h5>
                <p className="text-secondary-light mb-32">Confirming this will verify the seller and automatically send an email to <b>{selectedSeller?.email}</b>.</p>
                <div className="d-flex justify-content-center gap-3">
                  <button onClick={() => setShowConfirmModal(false)} className="btn btn-outline-secondary-light px-32 radius-8">Cancel</button>
                  <button onClick={confirmAndVerify} className="btn btn-success-600 px-32 radius-8 text-white">Confirm & Send Email</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isDrawerOpen || showConfirmModal) && <div className="offcanvas-backdrop fade show" onClick={() => { setIsDrawerOpen(false); setShowConfirmModal(false); }}></div>}
    </MasterLayout>
  );
};

export default NewSellerPage;