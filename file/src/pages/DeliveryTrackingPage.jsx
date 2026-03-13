import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";

const DeliveryTrackingPage = () => {
  return (
    <MasterLayout>
      <div className="card h-100 p-24 radius-12 border-0 shadow-sm">
        <h6 className="text-primary-600 fw-bold">Shipment & Delivery Status</h6>
        <p className="text-secondary-light">Track your outgoing products in real-time.</p>
      </div>
    </MasterLayout>
  );
};
export default DeliveryTrackingPage;