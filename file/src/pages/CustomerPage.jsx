import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";

const CustomerPage = () => {
  const [modalType, setModalType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [customers] = useState([
    { id: 1, name: "NA", userId: "5b456df95", phone: "9898798433", purchase: "₹0", wallet: "₹0.00", joined: "15-Jan-26 5:25", address: "3/352 vendhoni,paramakudi, Ramanathapuram district." }
  ]);

  return (
    <MasterLayout>
      <div className='card h-100 p-0 radius-12'>
        <div className='card-header border-bottom bg-base py-16 px-24'>
          <h6 className='text-lg fw-semibold mb-0'>Customers</h6>
        </div>
        
        <div className='card-body p-24'>
          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 text-nowrap'>
              <thead>
                <tr>
                  <th scope='col'>S.no</th>
                  <th scope='col'>Name</th>
                  <th scope='col'>User ID</th>
                  <th scope='col'>Phone</th>
                  <th scope='col'>Total Purchase</th>
                  <th scope='col'>Wallet Balance</th>
                  <th scope='col'>Date of joining</th>
                  <th scope='col'>Email</th>
                  <th scope='col'>Cart</th>
                  <th scope='col'>Address</th>
                  <th scope='col' className="text-center">Change Password</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.userId}</td>
                    <td>{item.phone}</td>
                    <td>{item.purchase}</td>
                    <td className="fw-bold">{item.wallet}</td>
                    <td>{item.joined}</td>
                    <td>-</td>
                    <td>
                      <button onClick={() => setModalType('cart')} className="btn btn-primary-100 text-primary-600 px-16 py-4 radius-4">View</button>
                    </td>
                    <td>
                      <button onClick={() => { setModalType('address'); setSelectedUser(item); }} className="btn btn-primary-100 text-primary-600 px-16 py-4 radius-4">View</button>
                    </td>
                    <td className="text-center">
                      {/* FIX: Change Password button now matches View button style */}
                      <button 
                        onClick={() => setModalType('password')} 
                        className="btn btn-primary-100 text-primary-600 px-16 py-4 radius-4"
                      >
                         Change Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

      {/* Popups (Cart, Address, Password) */}
      {modalType === 'cart' && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-12 border-0">
              <div className="modal-header border-bottom px-24 py-16">
                <h6 className="mb-0 fw-semibold">Cart Items</h6>
                <button onClick={() => setModalType(null)} className="btn-close"></button>
              </div>
              <div className="modal-body p-24 text-center">
                <div className="table-responsive">
                    <table className="table border mb-0 text-start">
                        <thead className="bg-light">
                            <tr><th>S.no</th><th>Product</th><th>Quantity</th><th>Price</th></tr>
                        </thead>
                    </table>
                </div>
                <div className="py-40">
                    <Icon icon="fluent:box-24-regular" className="text-6xl text-secondary-light mb-8" />
                    <p className="text-secondary-light">No data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'address' && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12 border-0 shadow">
              <div className="modal-header border-bottom px-24 py-16">
                <h6 className="mb-0 fw-semibold">Address Details</h6>
                <button onClick={() => setModalType(null)} className="btn-close"></button>
              </div>
              <div className="modal-body p-24">
                <p className="text-secondary-light mb-0">{selectedUser?.address}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'password' && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12 border-0 shadow">
              <div className="modal-header border-bottom px-24 py-16">
                <h6 className="mb-0 fw-semibold">Change Password</h6>
                <button onClick={() => setModalType(null)} className="btn-close"></button>
              </div>
              <div className="modal-body p-24">
                <div className="mb-16 position-relative">
                    <input type="password" placeholder="New Password" className="form-control" />
                    <Icon icon="lucide:eye-off" className="position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light" />
                </div>
                <div className="mb-24 position-relative">
                    <input type="password" placeholder="Confirm Password" className="form-control" />
                    <Icon icon="lucide:eye-off" className="position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light" />
                </div>
                <div className="d-flex justify-content-end gap-2">
                    <button onClick={() => setModalType(null)} className="btn btn-outline-secondary-light">Cancel</button>
                    <button className="btn btn-primary-600 px-32">OK</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  );
};

export default CustomerPage;