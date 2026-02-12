import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const UsersOverviewOne = () => {
  const [chartData, setChartData] = useState({
    series: [0, 0], 
    labels: ['Approved', 'New Requests'],
    totalSellers: 0,
    newSellers: 0,
    approvedSellers: 0
  });
  
  // 🌟 Chart render logic-kaaga extra state
  const [isLoaded, setIsLoaded] = useState(false);

  const API_BASE_URL = "https://api.zhopingo.in/api/v1/admin";

  useEffect(() => {
    fetchSellersForChart();
  }, []);

  const fetchSellersForChart = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sellers`);
      if (response.data.success) {
        const allSellers = response.data.data;
        
        const newCount = allSellers.filter(s => s.kycStatus === "pending").length;
        const approvedCount = allSellers.filter(s => s.kycStatus === "approved").length;

        setChartData({
          series: [approvedCount, newCount],
          labels: ['Approved', 'New Requests'],
          totalSellers: allSellers.length,
          newSellers: newCount,
          approvedSellers: approvedCount
        });
        
        // 🌟 Data fetch aagi mudindhadhum TRUE aakkiduvom
        setIsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const donutChartOptions = {
    colors: ['#FF9F43', '#485EC4'], 
    labels: chartData.labels,
    legend: { show: false },
    dataLabels: { enabled: false },
    // 🌟 Animations-ah fast-aaka intha setting help pannum
    chart: {
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => chartData.totalSellers
            }
          }
        }
      }
    }
  };

  return (
    <div className='col-xxl-3 col-xl-6'>
      <div className='card h-100 radius-8 border-0 overflow-hidden shadow-sm'>
        <div className='card-body p-24'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between mb-20'>
            <h6 className='mb-0 fw-bold text-lg text-primary-light'>Seller Overview</h6>
          </div>

          <div id="sellerOverviewChart" style={{ minHeight: '264px' }}>
             {/* 🌟 logic: isLoaded true-aana mattum chart-ah kaattu. 
                 Ippo instant-a dynamic data-voda load aagum */}
             {isLoaded ? (
               <ReactApexChart
                  options={donutChartOptions}
                  series={chartData.series}
                  type='donut'
                  height={264}
                />
             ) : (
               <div className="d-flex justify-content-center align-items-center" style={{ height: '264px' }}>
                  <div className="spinner-border text-primary-600 spinner-border-sm" role="status"></div>
               </div>
             )}
          </div>
          
          <ul className='d-flex flex-wrap align-items-center justify-content-between mt-3 gap-3'>
            <li className='d-flex align-items-center gap-2'>
              <span className='w-12-px h-12-px radius-2 bg-primary-600' />
              <span className='text-secondary-light text-sm fw-normal'>
                New: 
                <span className='text-primary-600 fw-bold ms-1'>{chartData.newSellers}</span>
              </span>
            </li>
            <li className='d-flex align-items-center gap-2'>
              <span className='w-12-px h-12-px radius-2 bg-yellow' />
              <span className='text-secondary-light text-sm fw-normal'>
                Approved: 
                <span className='text-warning-main fw-bold ms-1'>{chartData.approvedSellers}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UsersOverviewOne;