import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import axios from "axios";

const LatestRegisteredOne = () => {
    const [sellers, setSellers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // 🌟 Active Tab state
    const [activeTab, setActiveTab] = useState("seller"); 

    const API_BASE = "https://api.zhopingo.in/api/v1/admin";

    useEffect(() => {
        fetchAllLatestData();
    }, []);

    const fetchAllLatestData = async () => {
        setIsLoading(true);
        try {
            const sellerRes = await axios.get(`${API_BASE}/sellers`);
            if (sellerRes.data.success) {
                const sortedSellers = sellerRes.data.data
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 7);
                setSellers(sortedSellers);
            }

            const customerRes = await axios.get(`${API_BASE}/customers`);
            if (customerRes.data.success) {
                const sortedCustomers = customerRes.data.data
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 7);
                setCustomers(sortedCustomers);
            }
        } catch (error) {
            console.error("Fetch Error:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getCustomerDisplayName = (user) => {
        return user.name && user.name !== "NA" ? user.name : "oxplow Customer";
    };

    return (
        <div className='col-xxl-9 col-xl-12'>
            <div className='card h-100 radius-12 border-0 shadow-sm'>
                <div className='card-body p-24'>
                    <div className='d-flex flex-wrap align-items-center gap-1 justify-content-between mb-16'>
                        <ul className='nav nav-pills mb-0 bg-neutral-100 radius-8 p-4' id='pills-tab' role='tablist'>
                            <li className='nav-item' role='presentation'>
                                <button 
                                    className={`nav-link d-flex align-items-center radius-8 px-16 py-8 ${activeTab === 'seller' ? 'active bg-primary-600 text-white' : 'text-secondary-light bg-transparent'}`} 
                                    onClick={() => setActiveTab("seller")}
                                    type='button'
                                >
                                    Latest Seller
                                    <span className={`text-xs fw-semibold py-2 px-8 rounded-pill ms-12 ${activeTab === 'seller' ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}`}>
                                        {sellers.length}
                                    </span>
                                </button>
                            </li>
                            <li className='nav-item ms-4' role='presentation'>
                                <button 
                                    className={`nav-link d-flex align-items-center radius-8 px-16 py-8 ${activeTab === 'customer' ? 'active bg-primary-600 text-white' : 'text-secondary-light bg-transparent'}`} 
                                    onClick={() => setActiveTab("customer")}
                                    type='button'
                                >
                                    Latest Customers
                                    <span className={`text-xs fw-semibold py-2 px-8 rounded-pill ms-12 ${activeTab === 'customer' ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}`}>
                                        {customers.length}
                                    </span>
                                </button>
                            </li>
                        </ul>
                        
                        <Link 
                            to={activeTab === "seller" ? '/all-sellers' : '/customer'} 
                            className='text-primary-600 fw-bold d-flex align-items-center gap-1 text-sm'
                        >
                            View All <Icon icon='solar:alt-arrow-right-linear' />
                        </Link>
                    </div>

                    <div className='tab-content'>
                        {/* 🌟 7 Sellers Table - Active only when activeTab is seller */}
                        {activeTab === 'seller' && (
                            <div className='table-responsive scroll-sm animate__animated animate__fadeIn'>
                                <table className='table basic-border-table mb-0'>
                                    <thead>
                                        <tr>
                                            <th>Sellers</th>
                                            <th>Registered On</th>
                                            <th>Shop Name</th>
                                            <th className='text-center'>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!isLoading && sellers.map((item) => (
                                            <tr key={item._id}>
                                                <td>
                                                    <div className='d-flex align-items-center'>
                                                        <div className='w-40-px h-40-px rounded-circle bg-primary-50 d-flex justify-content-center align-items-center me-12'>
                                                            <Icon icon="solar:user-bold" className="text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <h6 className='text-sm mb-0 fw-bold text-dark'>{item.name}</h6>
                                                            <span className='text-xs text-secondary-light'>{item.email || item.phone}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-sm">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                                                <td className="text-sm fw-medium text-primary-600">{item.shopName || "oxplow Store"}</td>
                                                <td className='text-center'>
                                                    <span className={`badge px-16 py-4 radius-pill text-xs ${item.kycStatus === 'approved' ? 'bg-success-focus text-success-main' : 'bg-warning-focus text-warning-main'}`}>
                                                        {item.kycStatus === 'approved' ? 'Active' : 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 🌟 7 Customers Table - Active only when activeTab is customer */}
                        {activeTab === 'customer' && (
                            <div className='table-responsive scroll-sm animate__animated animate__fadeIn'>
                                <table className='table basic-border-table mb-0'>
                                    <thead>
                                        <tr>
                                            <th>Customers</th>
                                            <th>Joined On</th>
                                            <th>Phone</th>
                                            <th className='text-center'>Wallet</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!isLoading && customers.map((cust) => (
                                            <tr key={cust._id}>
                                                <td>
                                                    <div className='d-flex align-items-center'>
                                                        <div className='w-40-px h-40-px rounded-circle bg-info-50 d-flex justify-content-center align-items-center me-12'>
                                                            <Icon icon="solar:user-bold" className="text-info-main" />
                                                        </div>
                                                        <div>
                                                            <h6 className='text-sm mb-0 fw-bold text-dark'>{getCustomerDisplayName(cust)}</h6>
                                                            <span className='text-xs text-secondary-light'>{cust.email || 'No Email'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-sm">{new Date(cust.createdAt).toLocaleDateString('en-GB')}</td>
                                                <td className="text-sm">{cust.phone || "N/A"}</td>
                                                <td className='text-center fw-bold text-success-main'>₹{cust.walletBalance || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {isLoading && <div className="text-center py-50"><div className="spinner-border text-primary"></div></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LatestRegisteredOne;