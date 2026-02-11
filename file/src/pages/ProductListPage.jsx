import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import MasterLayout from "../masterLayout/MasterLayout"; // ✅ MasterLayout import pannunga

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const API_BASE = "https://api.zhopingo.in/api/v1/product"; 

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
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

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const results = products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.seller?.shopName && p.seller.shopName.toLowerCase().includes(query))
        );
        setFilteredProducts(results);
    }, [searchQuery, products]);

    return (
        // 🌟 Inga MasterLayout kudutha dhaan Sidebar theriyaum
        <MasterLayout>
            <div className="card h-100 p-24 radius-12">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
                    <h6 className="fw-semibold mb-0">Product List</h6>
                    
                    <div className="icon-field" style={{ width: '300px' }}>
                        <span className="icon top-50 translate-middle-y ms-12">
                            <Icon icon="ion:search-outline" />
                        </span>
                        <input 
                            type="text" 
                            className="form-control h-44-px ps-40" 
                            placeholder="Search Product or Shop Name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table basic-border-table mb-0">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Product Name</th>
                                <th>Shop Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>MRP</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center">Loading...</td></tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((p, index) => (
                                    <tr key={index}>
                                        <td>
                                            <img 
                                                src={p.images?.[0] || 'assets/images/default-product.png'} 
                                                alt={p.name} 
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td>{p.name}</td>
                                        <td>
                                            <span className="text-primary-600 fw-medium">
                                                {p.seller?.shopName || "N/A"}
                                            </span>
                                        </td>
                                        <td>{p.subCategory?.name || "N/A"}</td>
                                        <td>₹{p.price}</td>
                                        <td><del className="text-secondary-light">₹{p.mrp}</del></td>
                                        <td>{p.stock || 0}</td>
                                        <td>
                                            <span className={`badge ${p.stock > 0 ? 'bg-success-focus text-success-main' : 'bg-danger-focus text-danger-main'} px-12 py-4 radius-4 fw-medium`}>
                                                {p.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="text-center text-secondary-light">No products found matching your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MasterLayout>
    );
};

export default ProductListPage;