import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import MasterLayout from "../masterLayout/MasterLayout";

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const DOMAIN = "https://api.zhopingo.in"; 
    const API_BASE = `${DOMAIN}/api/v1/products`; 
    const IMAGE_BASE = `${DOMAIN}/uploads/products/`;

    const getCleanImageUrl = (backendPath) => {
        if (!backendPath) return "assets/images/default-product.png";
        const fileName = backendPath.split('/').pop();
        return `${IMAGE_BASE}${fileName}`;
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/all`);
            if (res.data.success) {
                setProducts(res.data.data);
                setFilteredProducts(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching products", err);
        } finally {
            setLoading(false);
        }
    };

    // 🌟 1. SEARCH FILTER LOGIC (Product Name or Shop Name)
    useEffect(() => {
        const query = searchQuery.toLowerCase().trim();
        
        if (query === "") {
            setFilteredProducts(products);
        } else {
            const results = products.filter(p => {
                // Product name-la irukka nu check pannudhu
                const productNameMatch = p.name.toLowerCase().includes(query);
                
                // Shop name-la irukka nu check pannudhu
                const shopNameMatch = p.seller?.shopName?.toLowerCase().includes(query);

                return productNameMatch || shopNameMatch;
            });
            setFilteredProducts(results);
        }
    }, [searchQuery, products]);

    return (
        <MasterLayout>
            <div className="card h-100 p-24 radius-12 border-0 shadow-sm overflow-hidden">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24 pb-16 border-bottom">
                    <h6 className="fw-bold mb-0 text-primary-600">All Product List</h6>
                    
                    {/* 🌟 2. SEARCH INPUT BINDING */}
                    <div className="icon-field" style={{ width: '320px' }}>
                        <span className="icon top-50 translate-middle-y ms-12 text-secondary">
                            <Icon icon="ion:search-outline" />
                        </span>
                        <input 
                            type="text" 
                            className="form-control h-44-px ps-40 radius-8" 
                            placeholder="Search by Product or Shop Name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table basic-border-table mb-0 text-nowrap align-middle">
                        <thead>
                            <tr style={{ height: '50px' }}>
                                <th style={{ width: '80px' }}>Thumbnail</th>
                                <th>Product Details</th>
                                <th>Seller/Shop</th>
                                <th>Category</th>
                                <th>Sub-Category</th>
                                <th>Pricing</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => (
                                    <tr key={p._id} style={{ height: '85px' }}>
                                        <td>
                                            <div className="d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                                <img 
                                                    src={getCleanImageUrl(p.images?.[0])} 
                                                    alt={p.name} 
                                                    className="radius-8 border shadow-sm"
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null; 
                                                        e.target.src = "https://via.placeholder.com/60x60?text=No+Img"; 
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <h6 className="text-sm fw-bold mb-0">{p.name}</h6>
                                            <p className="text-xxs text-secondary mb-0">HSN: {p.hsnCode || 'N/A'}</p>
                                        </td>
                                        <td>
                                            {/* 🌟 Highlight Shop Name */}
                                            <span className="text-primary-600 fw-bold text-xs">{p.seller?.shopName || "Unknown Shop"}</span>
                                        </td>
                                        <td>
                                            <span className="badge bg-neutral-100 text-neutral-800 radius-4 px-8 py-4 text-xxs">
                                                {p.category?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-secondary text-xs fw-medium">
                                                {p.subCategory?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-dark text-xs">Selling: <strong>₹{p.price}</strong></span>
                                                <span className="text-danger text-xs">MRP: <del>₹{p.mrp}</del></span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`fw-bold ${p.stock <= 5 ? 'text-danger animate__animated animate__flash animate__infinite' : 'text-dark'}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${p.stock > 0 ? 'bg-success-focus text-success-main' : 'bg-danger-focus text-danger-main'} px-12 py-4 radius-4 fw-bold text-xxs`}>
                                                {p.stock > 0 ? 'LIVE' : 'OUT OF STOCK'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-50">
                                        <Icon icon="solar:magnifer-zoom-out-linear" className="text-6xl text-neutral-200 mb-16" />
                                        <p className="text-secondary fw-bold">No matching products or shops found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MasterLayout>
    );
};

export default ProductListPage;