import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const SalesStatisticOne = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [incomeData, setIncomeData] = useState({
        total: "0",
        series: [{
            name: 'Income',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 12 Months
        }]
    });
    const [timeFilter, setTimeFilter] = useState("Weekly"); // Default Weekly

    const API_BASE = "https://api.zhopingo.in/api/v1/orders/all";
    const token = localStorage.getItem("userToken");

    useEffect(() => {
        fetchRealIncomeAnalytics();
    }, []);

const fetchRealIncomeAnalytics = async () => {
    setIsLoaded(false);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 🚀 THE SYNC: Payouts/Settlements collection-ai direct-ah fetch panroam
        const res = await axios.get("https://api.zhopingo.in/api/v1/admin/settlements/all", config);
        
        if (res.data.success) {
            const allSettlements = res.data.data;
            const now = new Date();
            let chartData = [];

            // 🧮 Helper: Calculate Admin Net Profit for each record
            const getAdminProfit = (s) => {
                return (s.totalPlatformCommission || 0) + 
                       (s.totalGstOnCommission || 0) + 
                       (s.totalTdsDeduction || 0) + 
                       (s.totalAdminDeliveryProfit || 0);
            };

            if (timeFilter === "Daily") {
                chartData = new Array(8).fill(0);
                allSettlements.forEach(s => {
                    const sDate = new Date(s.updatedAt);
                    if (sDate.toDateString() === now.toDateString()) {
                        const hour = sDate.getHours();
                        const slot = Math.floor(hour / 3); 
                        chartData[slot] += getAdminProfit(s);
                    }
                });
            } else if (timeFilter === "Weekly") {
                chartData = [0, 0, 0, 0, 0, 0, 0];
                allSettlements.forEach(s => {
                    const sDate = new Date(s.updatedAt);
                    // Check if settlement falls in current week
                    const diff = Math.floor((now - sDate) / (1000 * 60 * 60 * 24));
                    if (diff < 7) {
                        chartData[sDate.getDay()] += getAdminProfit(s);
                    }
                });
            } else if (timeFilter === "Monthly") {
                chartData = [0, 0, 0, 0]; // 4 Weeks
                allSettlements.forEach(s => {
                    const sDate = new Date(s.updatedAt);
                    if (sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear()) {
                        const weekIdx = Math.min(Math.floor((sDate.getDate() - 1) / 7), 3);
                        chartData[weekIdx] += getAdminProfit(s);
                    }
                });
            }

            // 💰 Header Total: Sum of ALL Admin Profits ever generated
            const totalAdminNetIncome = allSettlements.reduce((sum, s) => sum + getAdminProfit(s), 0);

            setIncomeData({
                total: totalAdminNetIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                series: [{ name: 'Net Profit', data: chartData.map(v => Number(v.toFixed(2))) }]
            });
        }
    } catch (err) { 
        console.error("Profit Analytics Sync Error:", err); 
    } finally { 
        setIsLoaded(true); 
    }
};
// 🌟 Re-fetch whenever filter changes
useEffect(() => {
    fetchRealIncomeAnalytics();
}, [timeFilter]);

    const chartOptions = {
        chart: {
            type: 'area',
            height: 264,
            toolbar: { show: false },
            animations: { enabled: true, easing: 'easeinout', speed: 800 }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, colors: ['#485EC4'] },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        grid: { borderColor: '#f1f1f1' },
        xaxis: {
        // 🚀 THE FIX: Dynamic Categories based on Filter
        categories: 
            timeFilter === "Daily" ? ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"] :
            timeFilter === "Weekly" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] :
            ["Week 1", "Week 2", "Week 3", "Week 4"],
    },
        yaxis: {
            labels: {
                formatter: (value) => "₹" + value.toLocaleString()
            }
        },
        colors: ['#485EC4'], 
        tooltip: {
            y: { formatter: (value) => "₹" + value.toLocaleString() }
        }
    };

    return (
        <div className='col-xxl-6 col-xl-12'>
            <div className='card h-100 radius-12 border-0 shadow-sm'>
<div className='card-body p-24'>
    <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
        <h6 className='text-lg mb-0 fw-bold text-primary-light'>Platform Incomes</h6>
        
        {/* 🌟 41. Professional Time Filter Buttons */}
        <div className="d-flex gap-2 bg-light p-4 radius-8 border">
            {["Daily", "Weekly", "Monthly"].map(f => (
                <button 
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`btn btn-xs px-12 py-4 radius-6 fw-bold transition-all border-0 ${timeFilter === f ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary'}`}
                    style={{ fontSize: '10px' }}
                >
                    {f.toUpperCase()}
                </button>
            ))}
        </div>
    
                    </div>
                    
                    <div className='d-flex flex-wrap align-items-center gap-2 mt-12'>
                        <h4 className='mb-0 fw-bold'>₹{incomeData.total}</h4>
                        <span className='text-xs fw-medium text-secondary-light ms-2'>Platform Revenue Status</span>
                    </div>

                    <div id="incomeChart" className="mt-24" style={{ minHeight: '264px' }}>
                        {isLoaded ? (
                            <ReactApexChart
                                options={chartOptions}
                                series={incomeData.series}
                                type='area'
                                height={264}
                            />
                        ) : (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '264px' }}>
                                <div className="spinner-border text-primary-600" role="status"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesStatisticOne;