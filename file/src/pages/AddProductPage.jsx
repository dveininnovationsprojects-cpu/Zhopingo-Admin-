import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const AddProductPage = () => {
    const [sellers, setSellers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE = "https://api.zhopingo.in/api/v1";
    const token = localStorage.getItem("userToken");

    const [formData, setFormData] = useState({
        seller: "", 
        name: "",
        category: "",
        subCategory: "",
        price: "",
        mrp: "",
        stock: "",
        description: "",
        lowStockAlert: "",
        hsnCode: "",
    });

    const [files, setFiles] = useState({ images: [], video: null });

    // 1. Load All Sellers (Admin can see all) & Categories
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                // Using the specific admin seller endpoint you provided
                const [sellerRes, catRes] = await Promise.all([
                    axios.get(`${API_BASE}/admin/sellers`, config),
                    axios.get(`${API_BASE}/catalog/categories`, config)
                ]);
                
                if (sellerRes.data.success) setSellers(sellerRes.data.data);
                if (catRes.data.success) setCategories(catRes.data.data);
            } catch (err) {
                toast.error("Failed to load Sellers list. Check Admin Login.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [token]);

    // 2. Sub-Category fetch and Sync HSN
    const handleCategoryChange = async (catId) => {
        setFormData({ ...formData, category: catId, subCategory: "", hsnCode: "" });
        try {
            const res = await axios.get(`${API_BASE}/catalog/sub-categories/all`);
            if (res.data.success) {
                const filtered = res.data.data.filter(s => s.category === catId || s.category?._id === catId);
                setSubCategories(filtered);
            }
        } catch (err) { console.error("Sub-cat error"); }
    };

    const handleSubCatChange = (subId) => {
        const selectedSub = subCategories.find(s => s._id === subId);
        setFormData({ ...formData, subCategory: subId, hsnCode: selectedSub?.hsnCode || "" });
    };

    // 3. Submit Logic (Syncing to Seller Account)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 🌟 CRITICAL FIX: Seller ID-ah dummy value anuppaama thadukkurom
        if (!formData.seller || formData.seller === "" || formData.seller === "static_admin_id") {
            return toast.error("Please select a target Seller first!");
        }

        setIsSubmitting(true);
        const data = new FormData();
        
        // Form field mapping
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });
        
        if (files.images.length > 0) {
            files.images.forEach(img => data.append("images", img));
        }

        try {
            const config = { 
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}` 
                } 
            };

            const res = await axios.post(`${API_BASE}/products/add`, data, config);

            if (res.data.success) {
                toast.success("Product successfully pushed to Seller account!");
                // Clear state
                setFormData({ seller: "", name: "", category: "", subCategory: "", price: "", mrp: "", stock: "", description: "", lowStockAlert: "", hsnCode: "" });
                setFiles({ images: [], video: null });
            }
        } catch (err) {
            // Backend error message handling
            const backendMsg = err.response?.data?.message || err.response?.data?.error || "Request Failed (400)";
            toast.error(backendMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MasterLayout>
            <ToastContainer position="top-right" theme="colored" />
            <div className="card h-100 p-0 radius-12 overflow-hidden shadow-sm">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Add Product (Assign to Seller)</h6>
                </div>
                
                <div className="card-body p-24">
                    {isLoading ? (
                        <div className="text-center py-50"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <form onSubmit={handleSubmit} className="row gy-4">
                            {/* 🌟 SELLER DROPDOWN (Real ID logic) */}
                            <div className="col-12 mb-8 p-16 radius-12 bg-light border shadow-sm">
                                <label className="form-label fw-bold text-primary-600">Select Seller Account *</label>
                                <select className="form-select h-52-px radius-8" 
                                    value={formData.seller} 
                                    onChange={(e) => setFormData({...formData, seller: e.target.value})} required>
                                    <option value="">-- Choose Seller to receive this product --</option>
                                    {sellers.map(s => (
                                        <option key={s._id} value={s._id}>{s.shopName || s.name} ({s.phone})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">Product Name *</label>
                                <input type="text" className="form-control h-48-px radius-8" placeholder="Item name..." 
                                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-bold">Price (₹) *</label>
                                <input type="number" className="form-control h-48-px radius-8" value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-bold">MRP (₹) *</label>
                                <input type="number" className="form-control h-48-px radius-8" value={formData.mrp}
                                    onChange={(e) => setFormData({...formData, mrp: e.target.value})} required />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">Main Category *</label>
                                <select className="form-select h-48-px radius-8" value={formData.category}
                                    onChange={(e) => handleCategoryChange(e.target.value)} required>
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">Sub Category *</label>
                                <select className="form-select h-48-px radius-8" value={formData.subCategory}
                                    disabled={!subCategories.length} onChange={(e) => handleSubCatChange(e.target.value)} required>
                                    <option value="">Select Sub-Category</option>
                                    {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">HSN Code</label>
                                <input type="text" className="form-control h-48-px radius-8 bg-light fw-bold text-primary-600" value={formData.hsnCode} readOnly />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Stock Inventory *</label>
                                <input type="number" className="form-control h-48-px radius-8" value={formData.stock}
                                    onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Low Stock Alert</label>
                                <input type="number" className="form-control h-48-px radius-8" value={formData.lowStockAlert}
                                    onChange={(e) => setFormData({...formData, lowStockAlert: e.target.value})} />
                            </div>

                            <div className="col-12">
                                <label className="form-label fw-bold">Description</label>
                                <textarea className="form-control radius-8" rows="3" value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>

                            <div className="col-12">
                                <label className="form-label fw-bold">Product Images</label>
                                <input type="file" multiple accept="image/*" className="form-control radius-8" 
                                    onChange={(e) => setFiles({...files, images: Array.from(e.target.files)})} />
                            </div>

                            <div className="col-12 mt-16">
                                <button type="submit" disabled={isSubmitting} className="btn btn-primary-600 w-100 h-52-px radius-8 fw-bold">
                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="solar:upload-minimalistic-bold" className="me-2 text-xl" />}
                                    {isSubmitting ? "PROCESSING..." : "PUSH PRODUCT TO SELLER"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </MasterLayout>
    );
};

export default AddProductPage;