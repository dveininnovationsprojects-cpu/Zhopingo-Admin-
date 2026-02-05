import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const THEME_GREEN = "#064E3B";

const AddProduct = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth & Storage
  const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
  const token = localStorage.getItem("userToken");
  
  const API_BASE = "http://54.157.210.26/api/v1";

  // Form States (Matching Backend req.body)
  const [formData, setFormData] = useState({
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

  // 1. Initial Fetch: My Products & Master Categories
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch Seller specific products
      const prodRes = await axios.get(`${API_BASE}/products/my-products`, config);
      if (prodRes.data.success) setProducts(prodRes.data.data);

      // Fetch all Categories for dropdown
      const catRes = await axios.get(`${API_BASE}/catalog/categories`);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Fetch Sub-Categories when Main Category changes
  const handleCategoryChange = async (catId) => {
    setFormData({ ...formData, category: catId, subCategory: "", hsnCode: "" });
    setSubCategories([]); // Clear previous subs
    
    if (!catId) return;

    try {
      // Backend should have an endpoint to fetch subs by parent cat id
      const res = await axios.get(`${API_BASE}/catalog/sub-categories/all`);
      if (res.data.success) {
        setSubCategories(res.data.data);
      }
    } catch (err) {
      console.error("Sub-category fetch failed");
    }
  };

  // 3. Auto-fill HSN when Sub-Category is selected
  const handleSubCatChange = (subId) => {
    const selectedSub = subCategories.find(s => s._id === subId);
    setFormData({ 
      ...formData, 
      subCategory: subId, 
      hsnCode: selectedSub?.hsnCode || "" 
    });
  };

  // 4. File selection handlers
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 5) {
      return toast.error("Maximum 5 images allowed");
    }
    setFiles({ ...files, images: selectedFiles });
  };

  const handleVideoChange = (e) => {
    setFiles({ ...files, video: e.target.files[0] });
  };

  // 5. Submit Form to Backend
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.subCategory || !formData.price) {
      return toast.error("Mandatory fields missing!");
    }

    setIsSubmitting(true);
    const data = new FormData();
    
    // Append Text Data
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append("seller", sellerData.id || sellerData._id); // From LocalStorage

    // Append Files (Keys must match your Backend req.files['images'] and req.files['video'])
    files.images.forEach(file => data.append("images", file));
    if (files.video) data.append("video", files.video);

    try {
      const config = { 
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        } 
      };

      const res = await axios.post(`${API_BASE}/products/add`, data, config);

      if (res.data.success) {
        toast.success("Product listed successfully!");
        setShowAddModal(false);
        fetchData(); // Refresh Catalog
        // Reset local state
        setFormData({ name: "", category: "", subCategory: "", price: "", mrp: "", stock: "", description: "", lowStockAlert: "", hsnCode: "" });
        setFiles({ images: [], video: null });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Listing failed. Check HSN Master.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate__animated animate__fadeIn">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-24">
        <div>
          <h5 className="fw-bold mb-0">Product Catalog</h5>
          <p className="text-secondary text-sm"></p>
        </div>
        <button onClick={() => setShowAddModal(true)} 
          className="btn text-white radius-12 px-24 py-12 fw-bold d-flex align-items-center gap-2 shadow-sm"
          style={{ backgroundColor: THEME_GREEN }}>
          <Icon icon="solar:add-circle-bold" className="text-xl" /> ADD NEW ITEM
        </button>
      </div>

      {/* CATALOG GRID */}
      <div className="row gy-4">
        {isLoading ? (
          <div className="text-center py-50"><div className="spinner-border text-primary"></div></div>
        ) : products.length > 0 ? (
          products.map((item) => (
            <div className="col-sm-6 col-md-4 col-xl-3" key={item._id}>
              <div className="card radius-20 border-0 shadow-sm overflow-hidden h-100 bg-white">
                <img src={`http://54.157.210.26/uploads/${item.images[0]}`} 
                  alt={item.name} className="w-100" style={{ height: "160px", objectFit: "cover" }} 
                  onError={(e) => e.target.src = "https://via.placeholder.com/200"} />
                <div className="p-16">
                  <h6 className="fw-bold mb-4 text-dark text-truncate">{item.name}</h6>
                  <p className="text-xxs text-secondary mb-12 uppercase">{item.category?.name} • {item.subCategory?.name}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-900 mb-0" style={{ color: THEME_GREEN }}>₹{item.price}</h5>
                    <span className={`badge radius-8 px-8 py-4 text-xs ${item.stock < 5 ? 'bg-danger-focus text-danger' : 'bg-success-focus text-success'}`}>
                      {item.stock} in stock
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-50 bg-white radius-20 shadow-sm w-100 mx-3">
             <Icon icon="solar:box-minimalistic-linear" className="text-6xl text-neutral-200 mb-16" />
             <p className="text-secondary fw-bold">Empty Catalog! Start adding products.</p>
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg">
              <div className="modal-header border-bottom p-24">
                <h5 className="fw-bold mb-0">Product Details</h5>
                <button onClick={() => setShowAddModal(false)} className="btn-close shadow-none"></button>
              </div>
              <form onSubmit={handlePublish} className="modal-body p-24 overflow-y-auto" style={{maxHeight: '75vh'}}>
                <div className="row">
                  {/* Media Uploads */}
                  <div className="col-12 mb-24">
                    <label className="text-xs fw-bold text-secondary uppercase mb-12 d-block">Media Slots (Compulsory)</label>
                    <div className="d-flex gap-3">
                       {/* Multiple Image Slot */}
                       <label className="border radius-16 d-flex flex-column align-items-center justify-content-center cursor-pointer bg-neutral-50 shadow-sm" style={{width:'110px', height:'110px', borderStyle:'dashed'}}>
                          <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                          <Icon icon="solar:gallery-add-bold" className="text-3xl text-primary-600 mb-1"/>
                          <span className="text-xxs fw-bold">5 Images</span>
                       </label>
                       {/* Single Video Slot */}
                       <label className="border radius-16 d-flex flex-column align-items-center justify-content-center cursor-pointer bg-neutral-50 shadow-sm" style={{width:'110px', height:'110px', borderStyle:'dashed'}}>
                          <input type="file" accept="video/*" hidden onChange={handleVideoChange} />
                          <Icon icon="solar:videocamera-add-bold" className="text-3xl text-warning-main mb-1"/>
                          <span className="text-xxs fw-bold">1 Video</span>
                       </label>
                    </div>
                    <div className="mt-12 d-flex gap-2">
                        {files.images.length > 0 && <span className="badge bg-success-focus text-success radius-4">{files.images.length} Photos ready</span>}
                        {files.video && <span className="badge bg-warning-focus text-warning-main radius-4">Video attached</span>}
                    </div>
                  </div>

                  <div className="col-md-6 mb-16">
                    <label className="form-label text-xs fw-bold">PRODUCT NAME *</label>
                    <input type="text" className="form-control radius-12 h-48-px" placeholder="e.g. Organic Millet Flour" 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>

                  <div className="col-md-3 mb-16">
                    <label className="form-label text-xs fw-bold">SELLING PRICE (₹) *</label>
                    <input type="number" className="form-control radius-12 h-48-px" placeholder="Price" 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                  </div>

                  <div className="col-md-3 mb-16">
                    <label className="form-label text-xs fw-bold">MRP PRICE (₹)</label>
                    <input type="number" className="form-control radius-12 h-48-px" placeholder="Retail Price" 
                      onChange={(e) => setFormData({...formData, mrp: e.target.value})} />
                  </div>

                  <div className="col-md-6 mb-16">
                    <label className="form-label text-xs fw-bold">MAIN CATEGORY *</label>
                    <select className="form-select radius-12 h-48-px" required onChange={(e) => handleCategoryChange(e.target.value)}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-6 mb-16">
                    <label className="form-label text-xs fw-bold">SUB CATEGORY *</label>
                    <select className="form-select radius-12 h-48-px" required disabled={!subCategories.length} onChange={(e) => handleSubCatChange(e.target.value)}>
                      <option value="">Select Sub-Category</option>
                      {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4 mb-16">
                    <label className="form-label text-xs fw-bold">HSN CODE (AUTO)</label>
                    <input type="text" className="form-control radius-12 bg-light h-48-px fw-bold text-primary-600" value={formData.hsnCode} readOnly />
                  </div>

                  <div className="col-md-4 mb-16">
                    <label className="form-label text-xs fw-bold">TOTAL STOCK *</label>
                    <input type="number" className="form-control radius-12 h-48-px" placeholder="0" 
                      onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
                  </div>

                  <div className="col-md-4 mb-16">
                    <label className="form-label text-xs fw-bold">LOW STOCK ALERT</label>
                    <input type="number" className="form-control radius-12 h-48-px border-warning-main" placeholder="Min level" 
                      onChange={(e) => setFormData({...formData, lowStockAlert: e.target.value})} />
                  </div>

                  <div className="col-12 mb-24">
                    <label className="form-label text-xs fw-bold">DESCRIPTION</label>
                    <textarea className="form-control radius-12" rows="3" placeholder="Explain product benefits..." 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} 
                  className="btn w-100 py-16 radius-16 text-white fw-bold shadow-lg mt-8"
                  style={{ backgroundColor: THEME_GREEN }}>
                  {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="solar:upload-minimalistic-bold" className="me-2" />}
                  {isSubmitting ? "LISTING TO STORE..." : "PUBLISH TO ZHOPINGO"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;