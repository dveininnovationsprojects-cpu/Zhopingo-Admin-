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
    setIsLoaded(false); // Reset loader on filter change
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(API_BASE, config);
        
        if (res.data.success) {
            const allOrders = res.data.data.filter(o => o.status === "Delivered");
            const now = new Date();
            let chartData = [];

            if (timeFilter === "Daily") {
                // 🕒 Daily: 3-hour slots (8 slots for 24 hours)
                chartData = new Array(8).fill(0);
                const todayOrders = allOrders.filter(o => 
                    new Date(o.createdAt).toDateString() === now.toDateString()
                );
                todayOrders.forEach(o => {
                    const hour = new Date(o.createdAt).getHours();
                    const slot = Math.floor(hour / 3); 
                    chartData[slot] += (o.totalAmount || 0);
                });
            } else if (timeFilter === "Weekly") {
                // 📅 Weekly: Sun to Sat (7 Days)
                chartData = [0, 0, 0, 0, 0, 0, 0];
                allOrders.forEach(o => {
                    const day = new Date(o.createdAt).getDay();
                    chartData[day] += (o.totalAmount || 0);
                });
            } else if (timeFilter === "Monthly") {
                // 🗓️ Monthly: 4 Weeks (Admin requirement)
                chartData = [0, 0, 0, 0];
                allOrders.forEach(o => {
                    const orderDate = new Date(o.createdAt);
                    if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
                        const date = orderDate.getDate();
                        const weekIdx = Math.min(Math.floor((date - 1) / 7), 3);
                        chartData[weekIdx] += (o.totalAmount || 0);
                    }
                });
            }

            const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            setIncomeData({
                total: totalRevenue.toLocaleString(),
                series: [{ name: 'Income', data: chartData }]
            });
        }
    } catch (err) { console.error("Income error:", err); } 
    finally { setIsLoaded(true); }
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