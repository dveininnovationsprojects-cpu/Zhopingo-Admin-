import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import axios from "axios";

const TopPerformerOne = () => {
    const [topProducts, setTopProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 🌟 API Config
    const API_BASE = "https://api.zhopingo.in/api/v1/orders/all"; 

    useEffect(() => {
        calculateTopSellingProducts();
    }, []);

    const calculateTopSellingProducts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("userToken");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const res = await axios.get(API_BASE, config);
            
            if (res.data.success) {
                const allOrders = res.data.data;
                const productSales = {};

                // Aggregate sales count
                allOrders.forEach(order => {
                    order.items.forEach(item => {
                        const productId = item.productId?._id || item.productId;
                        if (!productSales[productId]) {
                            productSales[productId] = {
                                ...item,
                                totalQty: 0,
                                name: item.name,
                                price: item.price
                            };
                        }
                        productSales[productId].totalQty += item.quantity;
                    });
                });

                // Sort by total quantity and take Top 7
                const sorted = Object.values(productSales)
                    .sort((a, b) => b.totalQty - a.totalQty)
                    .slice(0, 7);

                setTopProducts(sorted);
            }
        } catch (err) {
            console.error("Top products calculation error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='col-xxl-3 col-xl-12'>
            <div className='card h-100 radius-12 border-0 shadow-sm'>
                <div className='card-body p-24'>
                    <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between mb-24 border-bottom pb-16'>
                        <h6 className='mb-0 fw-bold text-lg text-primary-light'>Top Selling Products</h6>
                        <Link
                            to='/product-list'
                            className='text-primary-600 hover-text-primary d-flex align-items-center gap-1 text-sm fw-bold'
                        >
                            View All
                            <Icon icon='solar:alt-arrow-right-linear' className='icon' />
                        </Link>
                    </div>

                    <div className='mt-8'>
                        {isLoading ? (
                            <div className="text-center py-20"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                        ) : topProducts.length > 0 ? (
                            topProducts.map((p, index) => (
                                <div key={index} className='d-flex align-items-center justify-content-between gap-3 mb-20 last-child-0 border-bottom pb-12'>
                                    <div className='flex-grow-1 overflow-hidden'>
                                        {/* 🌟 Removed Image, only Text & Sales Count */}
                                        <h6 className='text-sm mb-1 fw-bold text-dark text-truncate'>{p.name}</h6>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className='text-xxs text-primary-600 fw-medium d-flex align-items-center gap-1'>
                                                <Icon icon="solar:shop-bold" className="text-xs" />
                                                {p.shopName || "Verified Seller"}
                                            </span>
                                            <span className="text-xxs text-secondary opacity-50">|</span>
                                            <span className="text-xxs text-secondary fw-bold">{p.totalQty} Sold</span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <span className='text-success-main text-sm fw-900'>₹{p.price}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-40">
                                <Icon icon="solar:box-minimalistic-linear" className="text-5xl text-neutral-200" />
                                <p className="text-xs text-secondary mt-8">No sales data found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopPerformerOne;