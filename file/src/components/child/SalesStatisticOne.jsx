import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const SalesStatisticOne = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [incomeData, setIncomeData] = useState({
    total: "42,000", // Defaulting to the value in your header
    series: [{
      name: 'Income',
      data: [12000, 18000, 15000, 25000, 18000, 32000, 22000, 30000, 20000, 24000, 18000, 28000]
    }]
  });

  const API_BASE_URL = "https://api.zhopingo.in/api/v1/admin";

  useEffect(() => {
    // 🌟 Simulate data fetch or connect to your revenue API here
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
    colors: ['#485EC4'], // Theme blue color
    tooltip: {
      y: { formatter: (value) => "₹" + value.toLocaleString() }
    }
  };

  return (
    <div className='col-xxl-6 col-xl-12'>
      <div className='card h-100 radius-12 border-0 shadow-sm'>
        <div className='card-body p-24'>
          <div className='d-flex flex-wrap align-items-center justify-content-between gap-3'>
            <h6 className='text-lg mb-0 fw-bold'>Total Incomes</h6>
          {/*  <select className='form-select bg-base form-select-sm w-auto radius-8 border text-secondary-light'>
              <option value='Yearly'>Yearly</option>
              <option value='Monthly'>Monthly</option>
            </select>*/}
          </div>
          
          <div className='d-flex flex-wrap align-items-center gap-2 mt-12'>
            {/* 🌟 Rupees Symbol updated */}
            <h4 className='mb-0 fw-bold'>₹{incomeData.total}</h4>
            {/* 🌟 Removed Increase/Decrease Arrow tags as requested */}
            <span className='text-xs fw-medium text-secondary-light ms-2'>Platform Revenue Status</span>
          </div>

          <div id="incomeChart" className="mt-24" style={{ minHeight: '264px' }}>
            {/* 🌟 logic: Instant render after data load */}
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