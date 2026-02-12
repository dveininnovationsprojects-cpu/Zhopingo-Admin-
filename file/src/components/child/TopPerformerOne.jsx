import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import axios from "axios";

const TopPerformerOne = () => {
    const [topProducts, setTopProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 🌟 API Config - Plural 'orders' synced with your routes
    const DOMAIN = "https://api.zhopingo.in";
    const ORDERS_API = `${DOMAIN}/api/v1/orders/all`; 
    const IMAGE_BASE = `${DOMAIN}/uploads/products/`;

    // 🌟 Working Image Path Logic from ProductListPage
    const getCleanImageUrl = (backendPath) => {
        if (!backendPath) return "assets/images/default-product.png";
        const fileName = backendPath.split('/').pop();
        return `${IMAGE_BASE}${fileName}`;
    };

    useEffect(() => {
        calculateTopSellingProducts();
    }, []);

    const calculateTopSellingProducts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("userToken");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // 1. Get All Orders
            const res = await axios.get(ORDERS_API, config);
            
            if (res.data.success) {
                const allOrders = res.data.data;
                const productSales = {};

                // 2. Aggregate sales count and store product details
                allOrders.forEach(order => {
                    order.items.forEach(item => {
                        // Backend nested structure handling
                        const productId = item.productId?._id || item.productId;
                        
                        if (!productSales[productId]) {
                            productSales[productId] = {
                                ...item,
                                totalQty: 0,
                                // Ensuing details for display
                                name: item.name,
                                price: item.price,
                                images: item.productId?.images || [] 
                            };
                        }
                        productSales[productId].totalQty += item.quantity;
                    });
                });

                // 3. Sort by total quantity and take Top 7
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
                                <div key={index} className='d-flex align-items-center justify-content-between gap-3 mb-20 last-child-0'>
                                    <div className='d-flex align-items-center overflow-hidden'>
                                        <img
                                            /* 🌟 Correct URL synced with ProductListPage */
                                            src={getCleanImageUrl(p.images?.[0])}
                                            alt={p.name}
                                            className='w-44-px h-44-px radius-8 flex-shrink-0 me-12 border bg-light object-fit-cover'
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/44x44?text=P";
                                            }}
                                        />
                                        <div className='flex-grow-1 overflow-hidden'>
                                            <h6 className='text-sm mb-1 fw-bold text-dark text-truncate'>{p.name}</h6>
                                            <span className='text-xxs text-primary-600 fw-medium d-flex align-items-center gap-1'>
                                                <Icon icon="solar:shop-bold" className="text-xs" />
                                                {/* Displaying Shop name from items or placeholder */}
                                                {p.shopName || "Verified Seller"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <span className='text-success-main text-sm fw-900'>₹{p.price}</span>
                                        <div className="text-xxs text-secondary">{p.totalQty} Sold</div>
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