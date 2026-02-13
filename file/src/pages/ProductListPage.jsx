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

    // SEARCH FILTER LOGIC
    useEffect(() => {
        const query = searchQuery.toLowerCase().trim();
        if (query === "") {
            setFilteredProducts(products);
        } else {
            const results = products.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.seller?.shopName?.toLowerCase().includes(query)
            );
            setFilteredProducts(results);
        }
    }, [searchQuery, products]);

    return (
        <MasterLayout>
            <div className="card h-100 p-24 radius-12 border-0 shadow-sm overflow-hidden">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24 pb-16 border-bottom">
                    <h6 className="fw-bold mb-0 text-primary-600 text-lg uppercase ls-1">Inventory Management</h6>
                    <div className="icon-field" style={{ width: '320px' }}>
                        <span className="icon top-50 translate-middle-y ms-12 text-secondary">
                            <Icon icon="ion:search-outline" />
                        </span>
                        <input 
                            type="text" 
                            className="form-control h-44-px ps-40 radius-8" 
                            placeholder="Search product or shop..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-24">Thumbnail</th>
                                <th>Product Details</th>
                                <th>Variants (Size/Price)</th> {/* 🌟 New Column */}
                                <th>Seller/Shop</th>
                                <th>Category Master</th> {/* 🌟 Merged Column */}
                                <th>Pricing</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => (
                                    <tr key={p._id}>
                                        <td className="ps-24">
                                            <img 
                                                src={getCleanImageUrl(p.images?.[0])} 
                                                alt={p.name} 
                                                className="radius-8 border shadow-sm object-fit-cover"
                                                style={{ width: '60px', height: '60px' }}
                                                onError={(e) => e.target.src = "https://via.placeholder.com/60x60?text=No+Img"}
                                            />
                                        </td>
                                        <td>
                                            <h6 className="text-sm fw-bold mb-1 text-dark">{p.name}</h6>
                                            <span className="badge bg-neutral-100 text-secondary-light text-xxs px-8 py-4">HSN: {p.hsnCode || 'N/A'}</span>
                                        </td>
                                        
                                        {/* 🌟 VARIANTS COLUMN - Dynamic Logic */}
                                        <td>
                                            {p.variants && p.variants.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-2" style={{ maxWidth: '200px' }}>
                                                    {p.variants.map((v, i) => (
                                                        <span key={i} className="badge bg-primary-50 text-primary-600 border border-primary-100 radius-4 text-xxs">
                                                            {v.attributeValue}: <strong>₹{v.price}</strong>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted text-xs italic">No variants</span>
                                            )}
                                        </td>

                                        <td><span className="text-primary-600 fw-bold text-xs">{p.seller?.shopName || "Unknown Shop"}</span></td>
                                        
                                        {/* 🌟 MERGED CATEGORY COLUMN */}
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-dark fw-bold text-xs">{p.category?.name || 'N/A'}</span>
                                                <span className="text-secondary text-xxs">{p.subCategory?.name || 'N/A'}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-success-main fw-900 text-sm">₹{p.price}</span>
                                                {p.mrp > p.price && <del className="text-danger text-xxs">MRP: ₹{p.mrp}</del>}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`fw-bold text-sm ${p.stock <= 5 ? 'text-danger' : 'text-dark'}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${p.stock > 0 ? 'bg-success-focus text-success-main' : 'bg-danger-focus text-danger-main'} px-12 py-6 radius-pill fw-bold text-xxs`}>
                                                {p.stock > 0 ? 'LIVE' : 'OUT OF STOCK'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-80">
                                        {loading ? <div className="spinner-border text-primary"></div> : 
                                        <><Icon icon="solar:magnifer-zoom-out-linear" className="text-6xl text-neutral-200 mb-16" />
                                        <p className="text-secondary fw-bold">No products found.</p></>}
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