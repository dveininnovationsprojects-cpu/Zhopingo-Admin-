import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const THEME_GREEN = "#064E3B";
const ACCENT_MINT = "#10B981";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("Placed"); // Backend status: 'Placed', 'Shipped', 'Delivered'
  const [isLoading, setIsLoading] = useState(false);
  
  // Login panna seller details-ah edukkarom
  const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
  const sellerId = sellerData.id || sellerData._id;
  
  const API_BASE = "http://54.157.210.26/api/v1";

  // 1. FETCH ORDERS (Neenga kudutha dynamic seller ID API logic)
  const fetchOrders = async () => {
    if (!sellerId) return;
    
    setIsLoading(true);
    try {
      /** * Neenga kudutha dynamic route use pannappadugirathu:
       * router.get("/new-orders/:sellerId", sellerCtrl.getSellerNewOrders);
       */
      const response = await axios.get(`${API_BASE}/seller/new-orders/${sellerId}`);
      
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Waiting for orders to arrive!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [sellerId]);

  // 2. UPDATE STATUS (Backend route: /update-order-status)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      /**
       * Neenga kudutha backend route:
       * router.put("/update-order-status", sellerCtrl.updateSellerOrderStatus);
       */
      const res = await axios.put(`${API_BASE}/seller/update-order-status`, {
        orderId: orderId,
        status: newStatus
      });

      if (res.data.success) {
        toast.success(`Order status ${newStatus}-ku maathiyachu!`);
        fetchOrders(); // List-ai refresh pannuvom
      }
    } catch (err) {
      toast.error("Status update failed!");
    }
  };

  // UI-la filter panna (Backend status-oda match aagum)
  const filteredOrders = orders.filter(o => o.status === activeFilter);

  return (
    <div className="animate__animated animate__fadeIn">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />

      {/* 🌟 Tab Navigation */}
      <div className="d-flex gap-3 mb-24 bg-white p-8 radius-16 shadow-sm overflow-x-auto">
        {[
          { label: "New Orders", value: "Placed", icon: "solar:cart-large-minimalistic-bold" },
          { label: "Shipped", value: "Shipped", icon: "solar:delivery-bold" },
          { label: "Delivered", value: "Delivered", icon: "solar:check-circle-bold" }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`btn d-flex align-items-center gap-2 px-20 py-10 radius-12 fw-bold transition-all ${
              activeFilter === tab.value ? "text-white" : "text-secondary bg-neutral-100"
            }`}
            style={{ backgroundColor: activeFilter === tab.value ? THEME_GREEN : "" }}
          >
            <Icon icon={tab.icon} className="text-xl" /> {tab.label}
          </button>
        ))}
      </div>

      {/* 🌟 Orders View */}
      <div className="row gy-4">
        {isLoading ? (
          <div className="text-center py-50"><div className="spinner-border" style={{ color: THEME_GREEN }}></div></div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div className="col-12" key={order._id}>
              <div className="card radius-20 border-0 shadow-sm p-24 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-16 border-bottom pb-12">
                  <div>
                    <span className="text-xs fw-bold text-secondary uppercase ls-1">Order Ref</span>
                    <h6 className="mb-0 fw-900 text-dark">#{order._id.slice(-8).toUpperCase()}</h6>
                  </div>
                  <span className="badge radius-8 px-12 py-6 text-xs fw-bold" 
                    style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: THEME_GREEN }}>
                    {order.paymentMethod}
                  </span>
                </div>

                <div className="row align-items-center">
                  <div className="col-md-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-3 mb-8">
                        <Icon icon="solar:box-bold" className="text-2xl" style={{ color: THEME_GREEN }} />
                        <div>
                          <p className="mb-0 fw-bold text-sm">{item.name}</p>
                          <small className="text-secondary fw-medium">Qty: {item.quantity} • Price: ₹{item.price}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="col-md-3 text-center border-start border-end">
                    <span className="text-xs text-secondary d-block mb-4">Total Amount</span>
                    <h5 className="fw-900 mb-0" style={{ color: THEME_GREEN }}>₹{order.totalAmount}</h5>
                  </div>
                  <div className="col-md-3 d-flex flex-column gap-2 ps-24">
                    {/* Status Actions based on Controller logic */}
                    {order.status === "Placed" && (
                      <button onClick={() => handleUpdateStatus(order._id, "Shipped")} 
                        className="btn text-white radius-12 fw-bold py-10 shadow-sm border-0" 
                        style={{ backgroundColor: ACCENT_MINT }}>
                        MARK AS SHIPPED
                      </button>
                    )}
                    {order.status === "Shipped" && (
                      <button onClick={() => handleUpdateStatus(order._id, "Delivered")} 
                        className="btn text-white radius-12 fw-bold py-10 shadow-sm border-0" 
                        style={{ backgroundColor: THEME_GREEN }}>
                        MARK AS DELIVERED
                      </button>
                    )}
                    {order.status === "Delivered" && (
                       <div className="text-success fw-bold text-center border border-success radius-12 py-8 text-xs">
                          <Icon icon="solar:check-circle-bold" className="me-1"/> DELIVERED
                       </div>
                    )}
                    <button className="btn btn-outline-neutral radius-12 text-xs fw-bold py-8">VIEW DETAILS</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-80 bg-white radius-24 shadow-sm w-100 mx-3">
            <Icon icon="solar:clipboard-remove-bold" className="text-6xl text-neutral-200 mb-16" />
            <p className="text-secondary fw-bold h5">No {activeFilter} orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;