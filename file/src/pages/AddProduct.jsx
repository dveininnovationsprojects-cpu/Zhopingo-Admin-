import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const THEME_GREEN = "#064E3B";

const AddProduct = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]); 
  const [filteredSubCategories, setFilteredSubCategories] = useState([]); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
  const token = localStorage.getItem("userToken");
  const API_BASE = "https://api.zhopingo.in/api/v1";
  const IMAGE_BASE = "https://api.zhopingo.in/uploads/";

  const initialForm = {
    name: "", category: "", subCategory: "", price: "", mrp: "", offerTag: "", stock: "",
    description: "", brand: "", weight: "", shelfLife: "", fssaiLicense: "",
    isVeg: true, isFreeDelivery: false, isReturnable: false, returnWindow: 0,
    highlights: { productType: "", cocoaContent: "", fabricType: "" },
    manufacturerDetails: { manufacturerNameAddress: "", marketerNameAddress: "", countryOfOrigin: "India", customerCareDetails: "" },
    returnPolicy: "", storageTips: ""
  };

  const [formData, setFormData] = useState(initialForm);
  const [variants, setVariants] = useState([]); 
  const [keyFeatures, setKeyFeatures] = useState([""]);
  const [ingredientsList, setIngredientsList] = useState([""]);
  const [nutritionInfo, setNutritionInfo] = useState([{ label: "", value: "" }]);
  const [files, setFiles] = useState({ images: [], video: null });

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const prodRes = await axios.get(`${API_BASE}/products/my-products`, config);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      const catRes = await axios.get(`${API_BASE}/catalog/categories`);
      if (catRes.data.success) setCategories(catRes.data.data);
      const subRes = await axios.get(`${API_BASE}/catalog/sub-categories/all`);
      if (subRes.data.success) setAllSubCategories(subRes.data.data);
    } catch (err) { toast.error("Catalog load error"); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCategoryChange = (catId) => {
    setFormData({ ...formData, category: catId, subCategory: "" });
    setFilteredSubCategories(allSubCategories.filter(sub => (sub.category === catId || sub.category?._id === catId)));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const currentSellerId = sellerData.id || sellerData._id;

    if (!formData.name || !formData.category || !formData.subCategory || !formData.price || !currentSellerId) {
      return toast.error("Mandatory fields (*) are missing!");
    }

    setIsSubmitting(true);
    const data = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'object' && formData[key] !== null) {
        Object.keys(formData[key]).forEach(subKey => {
          data.append(`${key}[${subKey}]`, formData[key][subKey]);
        });
      } else {
        data.append(key, formData[key]);
      }
    });

    data.append("seller", currentSellerId);
    data.append("variants", JSON.stringify(variants)); 
    data.append("ingredients", ingredientsList.filter(i => i.trim()).join(", "));

    keyFeatures.filter(f => f.trim()).forEach((f, i) => data.append(`keyFeatures[${i}]`, f));
    nutritionInfo.filter(n => n.label.trim()).forEach((n, i) => {
      data.append(`nutritionInfo[${i}][label]`, n.label);
      data.append(`nutritionInfo[${i}][value]`, n.value);
    });

    files.images.forEach(img => data.append("images", img));
    if (files.video) data.append("video", files.video);

    try {
      const res = await axios.post(`${API_BASE}/products/add`, data, { 
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) {
        toast.success("Listed successfully!");
        setShowAddModal(false);
        fetchData();
        setFormData(initialForm);
        setVariants([]);
      }
    } catch (err) { toast.error(err.response?.data?.message || "Listing failed."); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-4 bg-light min-vh-100">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-4 shadow-sm">
        <h4 className="fw-bold mb-0 text-success">Product Management</h4>
        <button onClick={() => setShowAddModal(true)} className="btn text-white rounded-pill px-4 py-2 fw-bold shadow border-0" style={{ backgroundColor: THEME_GREEN }}>
          <Icon icon="solar:add-circle-bold" className="me-2 fs-5" /> NEW LISTING
        </button>
      </div>

      <div className="row g-4">
        {isLoading ? <div className="text-center py-5 w-100"><div className="spinner-border text-success"></div></div> : 
          products.map((item) => (
            <div className="col-6 col-md-4 col-xl-2" key={item._id}>
              <div className="card rounded-4 border-0 shadow-sm h-100 bg-white overflow-hidden text-center p-2">
                <img src={item.images?.[0]?.startsWith('http') ? item.images[0] : `${IMAGE_BASE}${item.images?.[0]}`} className="w-100" style={{ height: "120px", objectFit: "contain" }} />
                <div className="p-2">
                  <h6 className="fw-bold mb-0 text-truncate small">{item.name}</h6>
                  <p className="text-success fw-bold small">₹{item.price}</p>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content rounded-5 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-white border-bottom p-4">
                <h5 className="fw-bold mb-0 text-success">Premium Product Configuration</h5>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-close shadow-none"></button>
              </div>
              <form onSubmit={handlePublish} className="modal-body p-4 bg-white" style={{maxHeight: '85vh', overflowY: 'auto'}}>
                <div className="row g-4">
                  
                  {/* --- Section 1: Basic Info --- */}
                  <div className="col-md-4">
                    <h6 className="fw-bold text-primary mb-3"><Icon icon="solar:info-circle-bold" className="me-1"/> Core Details</h6>
                    <div className="row g-2">
                        <div className="col-12 mb-2"><label className="small fw-bold">Name *</label><input type="text" className="form-control" onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                        <div className="col-6 mb-2"><label className="small fw-bold">Price *</label><input type="number" className="form-control" onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
                        <div className="col-6 mb-2"><label className="small fw-bold">MRP</label><input type="number" className="form-control" onChange={e => setFormData({...formData, mrp: e.target.value})} /></div>
                        <div className="col-6 mb-2"><label className="small fw-bold">Stock *</label><input type="number" className="form-control" onChange={e => setFormData({...formData, stock: e.target.value})} required /></div>
                        <div className="col-6 mb-2"><label className="small fw-bold">Brand</label><input type="text" className="form-control" onChange={e => setFormData({...formData, brand: e.target.value})} /></div>
                        <div className="col-6"><label className="small fw-bold">Main Category *</label><select className="form-select" onChange={e => handleCategoryChange(e.target.value)} required><option value="">Select</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                        <div className="col-6"><label className="small fw-bold">Sub Category *</label><select className="form-select" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} required><option value="">Select</option>{filteredSubCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
                    </div>

                    <h6 className="fw-bold text-primary mt-4 mb-3"><Icon icon="solar:layers-bold" className="me-1"/> Variants</h6>
                    {variants.map((v, i) => (
                        <div className="d-flex gap-1 mb-1" key={i}>
                            <input className="form-control form-control-sm" placeholder="Size/Vol" onChange={e => {v.attributeValue = e.target.value; setVariants([...variants])}} />
                            <input className="form-control form-control-sm" placeholder="Price" type="number" onChange={e => {v.price = e.target.value; setVariants([...variants])}} />
                            <Icon icon="solar:trash-bin-minimalistic-bold" className="text-danger fs-3 mt-1" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} />
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline-primary w-100 mt-2" onClick={() => setVariants([...variants, { attributeName: "Unit", attributeValue: "", price: "", stock: 100 }])}>+ Add Variant</button>
                  </div>

                  {/* --- Section 2: Attributes --- */}
                  <div className="col-md-4">
                    <h6 className="fw-bold text-primary mb-3"><Icon icon="solar:settings-bold" className="me-1"/> Specifications</h6>
                    <div className="row g-2 mb-3">
                        <div className="col-6"><label className="small fw-bold">Product Type</label><input type="text" className="form-control" placeholder="e.g. Snack" onChange={e => setFormData({...formData, highlights: {...formData.highlights, productType: e.target.value}})} /></div>
                        <div className="col-6"><label className="small fw-bold">Cocoa/Fabric %</label><input type="text" className="form-control" onChange={e => setFormData({...formData, highlights: {...formData.highlights, cocoaContent: e.target.value}})} /></div>
                    </div>
                    
                    <label className="small fw-bold text-success">Key Features</label>
                    {keyFeatures.map((f, i) => (
                        <div className="d-flex gap-2 mb-1" key={i}>
                            <input className="form-control form-control-sm" value={f} onChange={e => { const n = [...keyFeatures]; n[i] = e.target.value; setKeyFeatures(n); }} placeholder="Feature point"/>
                            <Icon icon="solar:trash-bin-minimalistic-bold" className="text-danger fs-4 mt-1" onClick={() => setKeyFeatures(keyFeatures.filter((_, idx) => idx !== i))} />
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm text-primary p-0 mb-3" onClick={() => setKeyFeatures([...keyFeatures, ""])}>+ Add Point</button>

                    <label className="small fw-bold text-primary d-block">Ingredients</label>
                    {ingredientsList.map((ing, i) => (
                        <div className="d-flex gap-2 mb-1" key={i}>
                            <input className="form-control form-control-sm" value={ing} onChange={e => { const n = [...ingredientsList]; n[i] = e.target.value; setIngredientsList(n); }} placeholder="Ingredient name"/>
                            <Icon icon="solar:trash-bin-minimalistic-bold" className="text-danger fs-4 mt-1" onClick={() => setIngredientsList(ingredientsList.filter((_, idx) => idx !== i))} />
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm text-primary p-0 mb-3" onClick={() => setIngredientsList([...ingredientsList, ""])}>+ Add Ingredient</button>
                    
                    <label className="small fw-bold text-muted mt-2">Manufacturer Address</label>
                    <textarea className="form-control form-control-sm" rows="2" onChange={e => setFormData({...formData, manufacturerDetails: {...formData.manufacturerDetails, manufacturerNameAddress: e.target.value}})}></textarea>
                  </div>

                  {/* --- Section 3: Logistics & Nutrition --- */}
                  <div className="col-md-4">
                    <h6 className="fw-bold text-primary mb-3"><Icon icon="solar:delivery-bold" className="me-1"/> Logistics & Nutrition</h6>
                    
                    <div className="bg-light p-3 rounded-4 mb-3">
                        <div className="row g-2">
                            <div className="col-6 mb-2"><label className="small fw-bold">FREE DELIVERY?</label>
                            <select className="form-select" onChange={e => setFormData({...formData, isFreeDelivery: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
                            <div className="col-6 mb-2"><label className="small fw-bold">RETURNABLE?</label>
                            <select className="form-select" onChange={e => setFormData({...formData, isReturnable: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
                            <div className="col-12 mb-2"><label className="small fw-bold">RETURN WINDOW (DAYS)</label>
                            <input type="number" className="form-control" disabled={!formData.isReturnable} onChange={e => setFormData({...formData, returnWindow: e.target.value})} /></div>
                            <div className="col-12 mb-2"><label className="small fw-bold">OFFER TAG</label><input type="text" className="form-control text-danger fw-bold" placeholder="Buy 1 Get 1" onChange={e => setFormData({...formData, offerTag: e.target.value})} /></div>
                        </div>
                    </div>

                    <label className="small fw-bold text-warning d-block mb-1">Nutrition Facts</label>
                    <div className="bg-light p-2 rounded-3 mb-3">
                        {nutritionInfo.map((n, i) => (
                            <div className="d-flex gap-1 mb-1" key={i}>
                                <input className="form-control form-control-sm" placeholder="Label" value={n.label} onChange={e => { const nArr = [...nutritionInfo]; nArr[i].label = e.target.value; setNutritionInfo(nArr); }} />
                                <input className="form-control form-control-sm" placeholder="Value" value={n.value} onChange={e => { const nArr = [...nutritionInfo]; nArr[i].value = e.target.value; setNutritionInfo(nArr); }} />
                                <Icon icon="solar:close-circle-bold" className="text-muted fs-4 mt-1" onClick={() => setNutritionInfo(nutritionInfo.filter((_, idx) => idx !== i))} />
                            </div>
                        ))}
                        <button type="button" className="btn btn-sm text-primary p-0" onClick={() => setNutritionInfo([...nutritionInfo, {label:"", value:""}])}>+ Add Row</button>
                    </div>

                    <label className="small fw-bold text-muted">Upload Media</label>
                    <div className="row g-2">
                        <div className="col-6"><label className="btn btn-sm btn-outline-primary w-100 py-2"><input type="file" multiple hidden onChange={e => setFiles({...files, images: Array.from(e.target.files)})} />Images ({files.images.length})</label></div>
                        <div className="col-6"><label className="btn btn-sm btn-outline-warning w-100 py-2"><input type="file" hidden onChange={e => setFiles({...files, video: e.target.files[0]})} />Video {files.video ? '✅' : ''}</label></div>
                    </div>
                  </div>

                </div>

                <div className="col-12 mt-4">
                    <label className="small fw-bold text-muted">Description *</label>
                    <textarea className="form-control" rows="3" onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn w-100 py-3 mt-4 text-white fw-bold rounded-pill shadow-lg" style={{ backgroundColor: THEME_GREEN }}>
                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : "CONFIRM & PUBLISH PREMIUM PRODUCT"}
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