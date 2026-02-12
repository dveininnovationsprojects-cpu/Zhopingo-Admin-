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

    useEffect(() => {
        fetchRealOrderAnalytics();
    }, []);

    const fetchRealOrderAnalytics = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(API_BASE, config);
            
            if (res.data.success) {
                const allOrders = res.data.data;
                
                // 1. Total Order Count
                const totalCount = allOrders.length.toLocaleString();

                // 2. Daily Analytics Logic (Sun-Sat)
                const dailyCounts = [0, 0, 0, 0, 0, 0, 0]; // Index 0 is Sunday
                
                allOrders.forEach(order => {
                    const orderDate = new Date(order.createdAt);
                    const dayIndex = orderDate.getDay(); // Returns 0-6
                    dailyCounts[dayIndex] += 1;
                });

                setOrderStats({
                    totalCount: totalCount,
                    series: [{ name: 'Orders', data: dailyCounts }]
                });
            }
        } catch (err) {
            console.error("Order analytics error", err);
        } finally {
            setIsLoaded(true);
        }
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
            categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
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
                    <h6 className='mb-12 fw-bold text-lg text-primary-light'>Total Orders</h6>
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