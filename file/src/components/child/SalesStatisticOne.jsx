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

    const API_BASE = "https://api.zhopingo.in/api/v1/orders/all";
    const token = localStorage.getItem("userToken");

    useEffect(() => {
        fetchRealIncomeAnalytics();
    }, []);

    const fetchRealIncomeAnalytics = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(API_BASE, config);
            
            if (res.data.success) {
                const allOrders = res.data.data;
                
                // 1. Calculate Total Income (Only Delivered Orders)
                const totalRevenue = allOrders
                    .filter(o => o.status === "Delivered")
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                // 2. Monthly Analytics Logic
                const monthlyRevenue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                
                allOrders.filter(o => o.status === "Delivered").forEach(order => {
                    const orderDate = new Date(order.createdAt);
                    const monthIndex = orderDate.getMonth(); // Jan = 0, Dec = 11
                    monthlyRevenue[monthIndex] += (order.totalAmount || 0);
                });

                setIncomeData({
                    total: totalRevenue.toLocaleString(),
                    series: [{ name: 'Income', data: monthlyRevenue }]
                });
            }
        } catch (err) {
            console.error("Income analytics error:", err);
        } finally {
            setIsLoaded(true);
        }
    };

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
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
                        <h6 className='text-lg mb-0 fw-bold text-primary-light'>Total Incomes</h6>
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