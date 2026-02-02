import React, { useState } from "react";

const HSNMasterTable = () => {
  // Client website-la iruntha exact data
  const [hsnData, setHsnData] = useState([
    { id: 1, code: "6109", desc: "T-shirts, vests and innerwear (knitted)", rate: "12%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 2, code: "6203", desc: "Mens shirts, trousers and jackets", rate: "12%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 3, code: "6204", desc: "Womens dresses, tops and garments", rate: "12%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 4, code: "6115", desc: "Socks, stockings and hosiery", rate: "12%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 5, code: "6401", desc: "Footwear below ₹1000", rate: "5%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 6, code: "6403", desc: "Footwear above ₹1000", rate: "18%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 7, code: "6404", desc: "Sports shoes and casual footwear", rate: "18%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 8, code: "1101", desc: "Wheat flour / atta", rate: "5%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 9, code: "0401", desc: "Milk (fresh, not packaged)", rate: "0%", effectiveFrom: "01-Jul-2017", status: true },
    { id: 10, code: "1701", desc: "Sugar", rate: "5%", effectiveFrom: "01-Jul-2017", status: true },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  // Search filter logic
  const filteredData = hsnData.filter(item => 
    item.code.includes(searchTerm) || item.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
        <h6 className='text-lg fw-semibold mb-0'>HSN Master</h6>
        {/* Client website search box style */}
        <input 
          type="text" 
          className="form-control w-auto" 
          placeholder="Search HSN / Description" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive'>
          <table className='table basic-border-table mb-0'>
            <thead>
              <tr>
                <th scope='col'>S.no</th>
                <th scope='col'>HSN Code</th>
                <th scope='col'>Description</th>
                <th scope='col'>GST Rate</th>
                <th scope='col'>Effective From</th>
                <th scope='col'>Effective To</th>
                <th scope='col'>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td><span className="text-primary-600 fw-medium">{item.code}</span></td>
                  <td>{item.desc}</td>
                  <td>
                    {/* GST Rate badge style */}
                    <span className="badge bg-info-focus text-info-main px-16 py-4 radius-4">
                      {item.rate}
                    </span>
                  </td>
                  <td>{item.effectiveFrom}</td>
                  <td>-</td>
                  <td>
                    {/* Status switch logic */}
                    <div className='form-check form-switch'>
                      <input 
                        className='form-check-input' 
                        type='checkbox' 
                        role='switch' 
                        checked={item.status} 
                        onChange={() => {
                          const updated = hsnData.map(d => d.id === item.id ? {...d, status: !d.status} : d);
                          setHsnData(updated);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HSNMasterTable;