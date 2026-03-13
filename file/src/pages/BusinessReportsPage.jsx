import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";

const BusinessReportsPage = () => {
  return (
    <MasterLayout>
      <div className="card h-100 p-24 radius-12 border-0 shadow-sm">
        <h6 className="text-primary-600 fw-bold">Analytical Business Reports</h6>
        <p className="text-secondary-light">View your sales and performance metrics.</p>
      </div>
    </MasterLayout>
  );
};
export default BusinessReportsPage;