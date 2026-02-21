import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null); // 🌟 Detail Modal state
    const navigate = useNavigate();

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const DOMAIN = "https://api.zhopingo.in"; 
    const API_BASE = `${DOMAIN}/api/v1/products`; 
    const IMAGE_BASE = `${DOMAIN}/uploads/products/`;

    const getCleanImageUrl = (backendPath) => {
        if (!backendPath) return "assets/images/default-product.png";
        const fileName = backendPath.split('/').pop();
        return `${IMAGE_BASE}${fileName}`;
    };

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/all`);
            if (res.data.success) {
                setProducts(res.data.data);
                setFilteredProducts(res.data.data);
            }
        } catch (err) { console.error("Error fetching products", err); } 
        finally { setLoading(false); }
    };

    // SEARCH FILTER LOGIC
    useEffect(() => {
        const query = searchQuery.toLowerCase().trim();
        const results = products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.seller?.shopName?.toLowerCase().includes(query) ||
            p.seller?.name?.toLowerCase().includes(query)
        );
        setFilteredProducts(results);
        setCurrentPage(1);
    }, [searchQuery, products]);

    // Pagination Logic
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);

    return (
        <MasterLayout>
            <div className="card h-100 p-0 radius-12 border-0 shadow-sm overflow-hidden">
                {/* 🌟 HEADER: Total Count & Add Product Button */}
                <div className="card-header border-bottom bg-white py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div>
                        <h6 className="fw-bold mb-0 text-primary-600 text-lg uppercase ls-1">Inventory Management</h6>
                        <p className="text-secondary-light text-xs mb-0 fw-bold">Total Products in Catalog: {filteredProducts.length}</p>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* 🌟 YELLOW MARKED AREA: Add Product Button */}
                        <button 
                            onClick={() => navigate("/add-product")} 
                            className="btn btn-primary-600 radius-8 px-20 py-10 d-flex align-items-center gap-2 fw-bold shadow-sm"
                        >
                            <Icon icon="solar:add-circle-bold" className="fs-5" /> Add New Product
                        </button>

                        <div className="position-relative" style={{ width: '280px' }}>
                            <input type="text" className="form-control h-40-px ps-40 radius-8" placeholder="Search product or shop..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <Icon icon="ion:search-outline" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary" />
                        </div>
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className='table basic-border-table mb-0 text-nowrap align-middle'>
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-24">S.No</th>
                                    <th>Thumbnail</th>
                                    <th>Product Name</th>
                                    <th>Category & Sub</th>
                                    <th>Seller Details</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th className="text-center">View Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && currentItems.length > 0 ? currentItems.map((p, index) => (
                                    <tr key={p._id}>
                                        <td className="ps-24 text-xs fw-bold text-secondary">{indexOfFirstItem + index + 1}</td>
                                        <td>
                                            <img src={getCleanImageUrl(p.images?.[0])} alt={p.name} className="radius-8 border shadow-sm object-fit-cover" style={{ width: '50px', height: '50px' }} onError={(e) => e.target.src = "https://via.placeholder.com/50"} />
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-sm fw-bold text-dark">{p.name}</span>
                                                <small className="text-xxs text-muted">HSN: {p.hsnCode || 'N/A'}</small>
                                            </div>
                                        </td>
                                        {/* 🌟 Category & Sub-Category Merged */}
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-xs fw-bold text-primary-600">{p.category?.name || 'N/A'}</span>
                                                <span className="text-xxs text-secondary italic">{p.subCategory?.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        {/* 🌟 Seller Name & Shop Name Stacked */}
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-xs fw-bold text-dark">{p.seller?.name || "Admin"}</span>
                                                <small className="text-info-main fw-bold" style={{ fontSize: '10px' }}>{p.seller?.shopName || "Zhopingo Store"}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="text-success-main fw-900 text-sm">₹{p.price}</span>
                                                {p.mrp > p.price && <del className="text-danger text-xxs">₹{p.mrp}</del>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${p.stock > 10 ? 'bg-success-focus text-success-main' : 'bg-danger-focus text-danger-main'} radius-pill px-12 py-4 text-xxs fw-bold`}>
                                                {p.stock} units
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button onClick={() => setSelectedProduct(p)} className="btn btn-info-focus text-info-main p-6 radius-8 shadow-sm border-0">
                                                <Icon icon="solar:eye-bold" className="fs-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="8" className="text-center py-80 text-secondary italic">No products found in catalog.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 🌟 ADVANCED PAGINATION */}
                <div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
                    <div className="d-flex align-items-center gap-2 border-end pe-3">
                        <span className="text-xs text-secondary fw-bold">Rows:</span>
                        <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold bg-light" value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                        </select>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-left-linear" /></button>
                        <div className="d-flex gap-1 align-items-center">
                            {(() => {
                                const pages = [];
                                if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
                                else {
                                    pages.push(1);
                                    if (currentPage > 3) pages.push('...');
                                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                    if (currentPage < totalPages - 2) pages.push('...');
                                    if (totalPages > 1) pages.push(totalPages);
                                }
                                return [...new Set(pages)].map((p, idx) => (
                                    p === '...' ? <span key={idx} className="px-2 text-muted text-xs">...</span> :
                                    <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>{p}</button>
                                ));
                            })()}
                        </div>
                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
                    </div>
                </div>
            </div>

            {/* 🌟 DYNAMIC PRODUCT DETAIL MODAL */}
            {selectedProduct && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom px-32 py-20 bg-primary-50">
                                <h6 className="mb-0 fw-black text-primary-600 uppercase ls-1">Product Details Profile</h6>
                                <button onClick={() => setSelectedProduct(null)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-32" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                <div className="row gy-4 border-bottom pb-24 mb-24">
                                    <div className="col-md-4">
                                        <img src={getCleanImageUrl(selectedProduct.images?.[0])} className="w-100 radius-16 border shadow-sm" alt="" />
                                    </div>
                                    <div className="col-md-8">
                                        <h4 className="fw-900 text-dark mb-4">{selectedProduct.name}</h4>
                                        <span className="badge bg-success-focus text-success-main radius-4 mb-16">LIVE IN CATALOG</span>
                                        <div className="row">
                                            <div className="col-6 mb-12"><label className="text-xxs fw-bold text-muted uppercase">Price</label><p className="fw-900 text-primary-600 fs-5 mb-0">₹{selectedProduct.price}</p></div>
                                            <div className="col-6 mb-12"><label className="text-xxs fw-bold text-muted uppercase">Stock Available</label><p className="fw-bold text-dark mb-0">{selectedProduct.stock} Units</p></div>
                                            <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">Category</label><p className="text-sm fw-bold mb-0">{selectedProduct.category?.name}</p></div>
                                            <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">Seller</label><p className="text-sm fw-bold mb-0 text-primary-600">{selectedProduct.seller?.shopName}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12"><h6 className="text-sm fw-bold text-dark border-bottom pb-2 mb-12">Description</h6><p className="text-xs text-secondary-light line-height-1.5">{selectedProduct.description || "No description provided."}</p></div>
                                    <div className="col-md-6 mt-16"><h6 className="text-sm fw-bold text-dark border-bottom pb-2 mb-12">Product Specifications</h6><ul className="ps-16 text-xxs text-secondary"><li><b>Brand:</b> {selectedProduct.brand || "N/A"}</li><li><b>HSN Code:</b> {selectedProduct.hsnCode}</li><li><b>Returnable:</b> {selectedProduct.isReturnable ? "Yes" : "No"}</li></ul></div>
                                    <div className="col-md-6 mt-16"><h6 className="text-sm fw-bold text-dark border-bottom pb-2 mb-12">Variants Available</h6><div className="d-flex flex-wrap gap-2">{selectedProduct.variants?.map((v, i) => (<span key={i} className="badge bg-neutral-100 text-dark border radius-4 text-xxs">{v.attributeValue}: ₹{v.price}</span>)) || "No Variants"}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default ProductListPage;