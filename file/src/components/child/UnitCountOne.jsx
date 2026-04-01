import React, { useState, useEffect } from "react";

import { Icon } from "@iconify/react";

import axios from "axios";

import { Link } from "react-router-dom";



const UnitCountOne = () => {

    const [counts, setCounts] = useState({

        totalSellers: 0,

        newSellers: 0,

        totalCustomers: 0,

        totalIncomes: 0, // 🌟 Live Income

        totalPayout: 0, 

        totalLogistics: 0, // 🌟 Live Payout

    });



    const API_BASE_URL = "https://api.zhopingo.in/api/v1/admin";

    const ORDERS_API = "https://api.zhopingo.in/api/v1/orders/all";

    const token = localStorage.getItem("userToken");



    useEffect(() => {

        fetchDashboardData();

    }, []);



const fetchDashboardData = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [sellerRes, customerRes, settlementRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/sellers`, config),
            axios.get(`${API_BASE_URL}/customers`, config),
            axios.get(`${API_BASE_URL}/settlements/all`, config) 
        ]);

        const sellerCount = sellerRes.data.success ? sellerRes.data.data.length : 0;
        const pendingCount = sellerRes.data.success ? sellerRes.data.data.filter(s => s.kycStatus === "pending").length : 0;
        const customerCount = customerRes.data.success ? customerRes.data.data.length : 0;

        let adminNetIncome = 0;
        let totalSellersPayout = 0;
        let totalLogisticsBill = 0; // 🚚 Logistics total

        if (settlementRes.data.success) {
            const allSettlements = settlementRes.data.data;
            allSettlements.forEach(s => {
                // 💰 Admin real income logic
                adminNetIncome += (s.totalPlatformCommission || 0) + 
                                  (s.totalGstOnCommission || 0) + 
                                  (s.totalTdsDeduction || 0) + 
                                  (s.totalAdminDeliveryProfit || 0);

                // 💸 Payout only if status is Paid
                if (s.status === "Paid") {
                    totalSellersPayout += (s.finalSettlementAmount || 0);
                }

                // 🚚 LOGISTICS SYNC: Strictly summing partner bills across all weeks
                totalLogisticsBill += (s.totalLogisticsPartnerBill || 0);
            });
        }

        setCounts({
            totalSellers: sellerCount,
            newSellers: pendingCount,
            totalCustomers: customerCount,
            totalIncomes: adminNetIncome,
            totalPayout: totalSellersPayout,
            totalLogistics: totalLogisticsBill // 🌟 Synced with Backend
        });
    } catch (error) { console.error("Admin Dashboard Sync Error:", error); }
};



    return (

        <div className='row row-cols-xxxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4'>

            

            {/* 1. Total Sellers */}

            <div className='col'>

                <Link to="/all-sellers" className="text-decoration-none h-100 d-block">

                    <div className='card shadow-none border bg-gradient-start-1 h-100 radius-12'>

                        <div className='card-body p-20'>

                            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>

                                <div>

                                    <p className='fw-medium text-primary-light mb-1'>Total Sellers</p>

                                    <h6 className='mb-0'>{counts.totalSellers.toLocaleString()}</h6>

                                </div>

                                <div className='w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center'>

                                    <Icon icon='gridicons:multiple-users' className='text-white text-2xl' />

                                </div>

                            </div>

                            <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Registered Stores</p>

                        </div>

                    </div>

                </Link>

            </div>



            {/* 2. New Sellers */}

            <div className='col'>

                <Link to="/new-seller" className="text-decoration-none h-100 d-block">

                    <div className='card shadow-none border bg-gradient-start-2 h-100 radius-12'>

                        <div className='card-body p-20'>

                            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>

                                <div>

                                    <p className='fw-medium text-primary-light mb-1'>New Sellers</p>

                                    <h6 className='mb-0'>{counts.newSellers.toLocaleString()}</h6>

                                </div>

                                <div className='w-50-px h-50-px bg-purple rounded-circle d-flex justify-content-center align-items-center'>

                                    <Icon icon='fa-solid:award' className='text-white text-2xl' />

                                </div>

                            </div>

                            <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Pending Approvals</p>

                        </div>

                    </div>

                </Link>

            </div>



            {/* 3. Total Customers */}

            <div className='col'>

                <Link to="/customer" className="text-decoration-none h-100 d-block">

                    <div className='card shadow-none border bg-gradient-start-3 h-100 radius-12'>

                        <div className='card-body p-20'>

                            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>

                                <div>

                                    <p className='fw-medium text-primary-light mb-1'>Total Customers</p>

                                    <h6 className='mb-0'>{counts.totalCustomers.toLocaleString()}</h6>

                                </div>

                                <div className='w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center'>

                                    <Icon icon='fluent:people-20-filled' className='text-white text-2xl' />

                                </div>

                            </div>

                            <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Registered Users</p>

                        </div>

                    </div>

                </Link>

            </div>



            {/* 4. Total Incomes (Admin Profit) - 🌟 Added Link */}
            <div className='col'>
                <Link to="/payouts" className="text-decoration-none h-100 d-block">
                    <div className='card shadow-none border bg-gradient-start-4 h-100 radius-12'>
                        <div className='card-body p-20'>
                            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
                                <div>
                                    <p className='fw-medium text-primary-light mb-1'>Total Incomes</p>
                                    <h6 className='mb-0 text-success-main'>₹{counts.totalIncomes.toLocaleString()}</h6>
                                </div>
                                <div className='w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center'>
                                    <Icon icon='solar:wallet-bold' className='text-white text-2xl' />
                                </div>
                            </div>
                            <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Platform Revenue</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* 5. Total Payout (Settled to Sellers) - 🌟 Added Link */}
            <div className='col'>
                <Link to="/payouts" className="text-decoration-none h-100 d-block">
                    <div className='card shadow-none border bg-gradient-start-5 h-100 radius-12'>
                        <div className='card-body p-24'>
                            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
                                <div>
                                    <p className='fw-medium text-primary-light mb-1'>Total Payout</p>
                                    <h6 className='mb-0 text-danger-main'>₹{counts.totalPayout.toLocaleString()}</h6>
                                </div>
                                <div className='w-50-px h-50-px bg-red rounded-circle d-flex justify-content-center align-items-center'>
                                    <Icon icon='fa6-solid:file-invoice-dollar' className='text-white text-2xl' />
                                </div>
                            </div>
                            <p className='fw-medium text-sm text-primary-light mt-12 mb-0'>Settled to Sellers</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* 6. Total Logistics (Delivery Partner Bill) - 🌟 Added Link */}
            <div className='col'>
                <Link to="/payouts" className="text-decoration-none h-100 d-block">
                    <div className='card shadow-none border h-100 radius-12' style={{ background: 'linear-gradient(135deg, #FFF4E5 0%, #FFF9F2 100%)' }}>
                        <div className='card-body p-24'>
                            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
                                <div>
                                    <p className='fw-medium text-warning-main mb-1'>Logistics Bill</p>
                                    <h6 className='mb-0 text-warning-main'>₹{counts.totalLogistics.toLocaleString()}</h6>
                                </div>
                                <div className='w-50-px h-50-px bg-warning-main rounded-circle d-flex justify-content-center align-items-center shadow-sm'>
                                    <Icon icon='mdi:truck-delivery' className='text-white text-3xl' />
                                </div>
                            </div>
                            <p className='fw-medium text-sm text-warning-main mt-12 mb-0'>Payable to Partners</p>
                        </div>
                    </div>
                </Link>
            </div>



        </div>

    );

};



export default UnitCountOne;