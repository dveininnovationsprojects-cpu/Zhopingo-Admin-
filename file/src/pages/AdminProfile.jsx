import React from 'react';
import MasterLayout from "../masterLayout/MasterLayout";

const AdminProfile = () => {
    // Unga fixed admin details
    const adminEmail = "admin@gmail.com";
    const adminName = "oxplow Admin";

    return (
        <MasterLayout>
            <div className="card radius-12 p-24 border-0 shadow-sm">
                <h5 className="mb-24 fw-bold">Admin Profile Settings</h5>
                
                <div className="d-flex align-items-center gap-4 mb-32 p-16 radius-12 bg-light">
                   <img 
    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
    alt="Admin"
    className="w-100-px h-100-px rounded-circle border p-4 bg-white shadow-sm" 
/>
                    <div>
                        <h4 className="mb-4 fw-bold text-primary-600">{adminName}</h4>
                        <span className="badge bg-primary-focus text-primary-main px-12 py-6">System Administrator</span>
                    </div>
                </div>

                <div className="row gy-4">
                    <div className="col-md-6">
                        <label className="form-label text-secondary-light fw-bold">Full Name</label>
                        <div className="p-12 radius-8 border bg-light text-dark">
                            {adminName}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-secondary-light fw-bold">Email ID</label>
                        <div className="p-12 radius-8 border bg-light text-dark">
                            {adminEmail}
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
};

export default AdminProfile;