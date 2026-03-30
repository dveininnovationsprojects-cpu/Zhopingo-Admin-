import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const TotalSubscriberOne = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [orderStats, setOrderStats] = useState({
        totalCount: "0",
        series: [{ name: 'Orders', data: [0, 0, 0, 0, 0, 0, 0] }]
    });


    const API_BASE = "https://api.zhopingo.in/api/v1/orders/all";
    const token = localStorage.getItem("userToken");

        const [timeFilter, setTimeFilter] = useState("Weekly");

useEffect(() => {
    fetchRealOrderAnalytics();
}, [timeFilter]); 
const fetchRealOrderAnalytics = async () => {
    setIsLoaded(false);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(API_BASE, config);
        
        if (res.data.success) {
            const allOrders = res.data.data;
            const now = new Date();
            let chartData = [];

            if (timeFilter === "Daily") {
                // 🕒 Daily: 3-hour chunks (8 slots)
                chartData = new Array(8).fill(0);
                const todayOrders = allOrders.filter(o => 
                    new Date(o.createdAt).toDateString() === now.toDateString()
                );
                todayOrders.forEach(o => {
                    const hour = new Date(o.createdAt).getHours();
                    const slot = Math.floor(hour / 3); 
                    chartData[slot] += 1;
                });
            } else if (timeFilter === "Weekly") {
                // 📅 Weekly: Sun to Sat
                chartData = [0, 0, 0, 0, 0, 0, 0];
                allOrders.forEach(o => {
                    const day = new Date(o.createdAt).getDay();
                    chartData[day] += 1;
                });
            } else if (timeFilter === "Monthly") {
                // 🗓️ Monthly: 4 Weeks logic strictly for Admin
                chartData = [0, 0, 0, 0];
                allOrders.forEach(o => {
                    const orderDate = new Date(o.createdAt);
                    if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
                        const date = orderDate.getDate();
                        const weekIdx = Math.min(Math.floor((date - 1) / 7), 3);
                        chartData[weekIdx] += 1;
                    }
                });
            }

            setOrderStats({
                totalCount: allOrders.length.toLocaleString(),
                series: [{ name: 'Orders', data: chartData }]
            });
        }
    } catch (err) { console.error("Order analytics error", err); } 
    finally { setIsLoaded(true); }
};

    const barChartOptions = {
        chart: {
            type: 'bar',
            height: 264,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '40%',
                distributed: false,
            }
        },
        dataLabels: { enabled: false },
        colors: ['#485EC4'], // Professional Blue Theme
       xaxis: {
        categories: 
            timeFilter === "Daily" ? ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"] :
            timeFilter === "Weekly" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] :
            ["Week 1", "Week 2", "Week 3", "Week 4"],
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
        grid: { borderColor: '#f1f1f1', strokeDashArray: 3 },
        yaxis: { show: true }
    };
    

    return (
        <div className='col-xxl-3 col-xl-6'>
            <div className='card h-100 radius-12 border-0 shadow-sm'>
                <div className='card-body p-24'>
    <div className='d-flex align-items-center justify-content-between mb-12'>
        <h6 className='fw-bold text-lg text-primary-light mb-0'>Total Orders</h6>
        
        {/* 🌟 Professional Compact Dropdown Filter */}
        <select 
            className="form-select form-select-sm w-auto border-0 bg-light fw-bold text-xxs radius-8 shadow-none cursor-pointer"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ fontSize: '10px', padding: '4px 24px 4px 8px' }}
        >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
        </select>
    </div>

    <div className='d-flex align-items-center gap-2 mb-20'>
        <h4 className='fw-bold mb-0'>{orderStats.totalCount}</h4>
    </div>

                    <div id="orderBarChart" style={{ minHeight: '264px' }}>
                        {isLoaded ? (
                            <ReactApexChart
                                options={barChartOptions}
                                series={orderStats.series}
                                type='bar'
                                height={264}
                            />
                        ) : (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '264px' }}>
                                <div className="spinner-border text-primary"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TotalSubscriberOne;