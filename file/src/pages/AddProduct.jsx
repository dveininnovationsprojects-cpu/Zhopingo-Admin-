import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const THEME_GREEN = "#064E3B";

const AddProduct = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]); // Master list
  const [filteredSubCategories, setFilteredSubCategories] = useState([]); // UI dropdown list
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth & Storage
  const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
  const token = localStorage.getItem("userToken");
  
  // 🌟 Updated API Base
  const API_BASE = "https://api.zhopingo.in/api/v1";
  const IMAGE_BASE = "https://api.zhopingo.in/uploads/";

  // Form States
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

  // 1. Fetch Data
  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // My Products
      const prodRes = await axios.get(`${API_BASE}/products/my-products`, config);
      if (prodRes.data.success) setProducts(prodRes.data.data);

      // Categories
      const catRes = await axios.get(`${API_BASE}/catalog/categories`);
      if (catRes.data.success) setCategories(catRes.data.data);

      // Sub-Categories Master
      const subRes = await axios.get(`${API_BASE}/catalog/sub-categories/all`);
      if (subRes.data.success) setAllSubCategories(subRes.data.data);

    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load catalog data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Handle Main Category Change
  const handleCategoryChange = (catId) => {
    setFormData({ ...formData, category: catId, subCategory: "", hsnCode: "" });
    // Filter sub-categories based on parent category ID
    const filtered = allSubCategories.filter(sub => sub.category === catId || sub.category?._id === catId);
    setFilteredSubCategories(filtered);
  };

  // 3. Handle Sub-Category Change (Auto-fill HSN)
  const handleSubCatChange = (subId) => {
    const selectedSub = allSubCategories.find(s => s._id === subId);
    setFormData({ 
      ...formData, 
      subCategory: subId, 
      hsnCode: selectedSub?.hsnCode || "" 
    });
  };

  // 4. File handlers
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 5) return toast.error("Max 5 images allowed");
    setFiles({ ...files, images: selectedFiles });
  };

  const handleVideoChange = (e) => {
    setFiles({ ...files, video: e.target.files[0] });
  };

  // 5. Submit Form
  const handlePublish = async (e) => {
    e.preventDefault();
    const currentSellerId = sellerData.id || sellerData._id;

    if (!formData.category || !formData.subCategory || !formData.price || !currentSellerId) {
      return toast.error("Mandatory fields or Seller Session missing!");
    }

    setIsSubmitting(true);
    const data = new FormData();
    
    // Append fields
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append("seller", currentSellerId);

    // Append Files
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
        fetchData(); 
        setFormData({ name: "", category: "", subCategory: "", price: "", mrp: "", stock: "", description: "", lowStockAlert: "", hsnCode: "" });
        setFiles({ images: [], video: null });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Listing failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate__animated animate__fadeIn p-3">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Product Catalog</h4>
          <p className="text-secondary small">Manage your store inventory</p>
        </div>
        <button onClick={() => setShowAddModal(true)} 
          className="btn text-white rounded-3 px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm"
          style={{ backgroundColor: THEME_GREEN }}>
          <Icon icon="solar:add-circle-bold" className="fs-5" /> ADD NEW ITEM
        </button>
      </div>

      {/* CATALOG GRID */}
      <div className="row g-4">
        {isLoading ? (
          <div className="text-center py-5 w-100"><div className="spinner-border text-success"></div></div>
        ) : products.length > 0 ? (
          products.map((item) => (
            <div className="col-6 col-md-4 col-xl-3" key={item._id}>
              <div className="card rounded-4 border-0 shadow-sm overflow-hidden h-100 bg-white">
                <img 
                  // 🌟 Fixed Image URL Logic
                  src={item.images?.[0]?.startsWith('http') ? item.images[0] : `${IMAGE_BASE}${item.images?.[0]}`} 
                  alt={item.name} 
                  className="w-100" 
                  style={{ height: "180px", objectFit: "cover" }} 
                  onError={(e) => e.target.src = "https://via.placeholder.com/300x200?text=No+Image"} 
                />
                <div className="p-3">
                  <h6 className="fw-bold mb-1 text-dark text-truncate">{item.name}</h6>
                  <p className="small text-muted mb-2 text-uppercase" style={{fontSize: '10px'}}>
                    {item.category?.name || 'No Cat'} • {item.subCategory?.name || 'No Sub'}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 text-success">₹{item.price}</h5>
                    <span className={`badge rounded-pill px-2 py-1 ${item.stock < 10 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`} style={{fontSize: '10px'}}>
                      {item.stock} Left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm w-100 mx-2">
             <Icon icon="solar:box-minimalistic-linear" className="display-1 text-light mb-3" />
             <p className="text-secondary fw-bold">Empty Catalog! Start adding products.</p>
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom p-4">
                <h5 className="fw-bold mb-0">New Product Details</h5>
                <button onClick={() => setShowAddModal(false)} className="btn-close shadow-none"></button>
              </div>
              <form onSubmit={handlePublish} className="modal-body p-4" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                <div className="row">
                  {/* Media */}
                  <div className="col-12 mb-4">
                    <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Media Slots</label>
                    <div className="d-flex gap-3">
                       <label className="border rounded-4 d-flex flex-column align-items-center justify-content-center cursor-pointer bg-light shadow-sm" style={{width:'100px', height:'100px', borderStyle:'dashed'}}>
                          <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                          <Icon icon="solar:gallery-add-bold" className="fs-2 text-primary mb-1"/>
                          <span className="small fw-bold" style={{fontSize: '10px'}}>Images</span>
                       </label>
                       <label className="border rounded-4 d-flex flex-column align-items-center justify-content-center cursor-pointer bg-light shadow-sm" style={{width:'100px', height:'100px', borderStyle:'dashed'}}>
                          <input type="file" accept="video/*" hidden onChange={handleVideoChange} />
                          <Icon icon="solar:videocamera-add-bold" className="fs-2 text-warning mb-1"/>
                          <span className="small fw-bold" style={{fontSize: '10px'}}>Video</span>
                       </label>
                    </div>
                    <div className="mt-2 d-flex gap-2">
                        {files.images.length > 0 && <span className="badge bg-success text-white small">{files.images.length} Photos</span>}
                        {files.video && <span className="badge bg-warning text-dark small">Video OK</span>}
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold">PRODUCT NAME *</label>
                    <input type="text" className="form-control rounded-3 py-2" placeholder="Item name" 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label small fw-bold">PRICE (₹) *</label>
                    <input type="number" className="form-control rounded-3 py-2" placeholder="0.00" 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label small fw-bold">MRP (₹)</label>
                    <input type="number" className="form-control rounded-3 py-2" placeholder="0.00" 
                      onChange={(e) => setFormData({...formData, mrp: e.target.value})} />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold">MAIN CATEGORY *</label>
                    <select className="form-select rounded-3 py-2" required onChange={(e) => handleCategoryChange(e.target.value)}>
                      <option value="">Select</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-bold">SUB CATEGORY *</label>
                    <select className="form-select rounded-3 py-2" required disabled={!filteredSubCategories.length} onChange={(e) => handleSubCatChange(e.target.value)}>
                      <option value="">Select</option>
                      {filteredSubCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-bold text-muted">HSN CODE</label>
                    <input type="text" className="form-control rounded-3 bg-light py-2 fw-bold text-primary" value={formData.hsnCode} readOnly />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-bold">STOCK *</label>
                    <input type="number" className="form-control rounded-3 py-2" placeholder="0" 
                      onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label small fw-bold">LOW STOCK ALERT</label>
                    <input type="number" className="form-control rounded-3 py-2" placeholder="5" 
                      onChange={(e) => setFormData({...formData, lowStockAlert: e.target.value})} />
                  </div>

                  <div className="col-12 mb-4">
                    <label className="form-label small fw-bold">DESCRIPTION</label>
                    <textarea className="form-control rounded-3" rows="3" placeholder="Product details..." 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} 
                  className="btn w-100 py-3 rounded-4 text-white fw-bold shadow-lg"
                  style={{ backgroundColor: THEME_GREEN }}>
                  {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="solar:upload-minimalistic-bold" className="me-2" />}
                  {isSubmitting ? "PUBLISHING..." : "PUBLISH PRODUCT"}
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