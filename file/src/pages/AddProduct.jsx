import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const THEME_BLUE = "#485EC4";

const AddProduct = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]); 
    const [filteredSubCategories, setFilteredSubCategories] = useState([]); 
    const [masterProductList, setMasterProductList] = useState([]); // 🌟 Master List state
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false); // 🌟 Admin request modal
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = localStorage.getItem("userToken");
    const API_BASE = "https://api.zhopingo.in/api/v1";
    const IMAGE_BASE = "https://api.zhopingo.in/uploads/products/";

    const initialForm = {
        masterProductId: "", // 🌟 Linked to Master Catalog
        name: "", category: "", subCategory: "", price: "", mrp: "", offerTag: "", stock: "",
        description: "", brand: "", weight: "", shelfLife: "", fssaiLicense: "",
        hsnCode: "", gstPercentage: "", // 🌟 Auto-filled from Master
        isVeg: true, isFreeDelivery: false, isReturnable: false, returnWindow: 0,
        highlights: { productType: "", cocoaContent: "", fabricType: "" },
        manufacturerDetails: { manufacturerNameAddress: "", marketerNameAddress: "", countryOfOrigin: "India", customerCareDetails: "" },
        returnPolicy: "", storageTips: ""
    };

    const [formData, setFormData] = useState(initialForm);
    const [requestData, setRequestData] = useState({ name: "", category: "", subCategory: "" });
    const [variants, setVariants] = useState([]); 
    const [keyFeatures, setKeyFeatures] = useState([""]);
    const [ingredientsList, setIngredientsList] = useState([""]);
    const [nutritionInfo, setNutritionInfo] = useState([{ label: "", value: "" }]);
    const [files, setFiles] = useState({ images: [null, null, null, null, null], video: null }); // 🌟 5 Image Slots

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

    // 🌟 Category filter logic
    const handleCategoryChange = (catId, isRequest = false) => {
    if (isRequest) {
        // 🌟 This ensures request modal state is updated
        setRequestData({ ...requestData, category: catId, subCategory: "" });
    } else {
        setFormData({ ...formData, category: catId, subCategory: "", masterProductId: "" });
        setMasterProductList([]);
    }

    // Common logic to filter sub-categories dropdown
    const filtered = allSubCategories.filter(sub => 
        (sub.category === catId || sub.category?._id === catId)
    );
    setFilteredSubCategories(filtered);
};
    // 🌟 Sub-Category selection: Fetch Master Products for this specific sub-cat
    const handleSubCategoryChange = async (subId) => {
        setFormData({ ...formData, subCategory: subId, masterProductId: "" });
        try {
            const res = await axios.get(`${API_BASE}/products/master-list/${subId}`);
            if (res.data.success) setMasterProductList(res.data.data);
        } catch (err) { console.error("Master list fetch error"); }
    };

    // 🌟 Master Product selection: Auto-fill Name, HSN, and GST
    // 🌟 41. Master selection logic corrected to keep manual name primary
const handleMasterProductSelect = (masterId) => {
    const selected = masterProductList.find(m => m._id === masterId);
    if (selected) {
        setFormData({ 
            ...formData, 
            masterProductId: masterId, 
            // 🌟 Important: Name reset aagaama irukka manual-ah type panna input-aiye vachukkuvom
            hsnCode: selected.hsnMasterId?.hsnCode || "N/A",
            gstPercentage: selected.hsnMasterId?.gstRate || 0
        });
    }
};

    // 🌟 5 Image Slot Handlers
    const handleImageChange = (index, file) => {
        const newImages = [...files.images];
        newImages[index] = file;
        setFiles({ ...files, images: newImages });
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        const currentSellerId = sellerData.id || sellerData._id;

        if (!formData.masterProductId || !formData.price || !formData.stock) {
            return toast.error("Select a product from Catalog and fill price/stock!");
        }

        setIsSubmitting(true);
        const data = new FormData();
        
        // Append all nested objects
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

        files.images.forEach(img => { if (img) data.append("images", img); });
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
                setFiles({ images: [null, null, null, null, null], video: null });
            }
        } catch (err) { toast.error(err.response?.data?.message || "Listing failed."); } 
        finally { setIsSubmitting(false); }
    };

   const handleRequestAdmin = async (e) => {
    e.preventDefault();
    
    // 🌟 Validation: All IDs must be present before sending
    if (!requestData.name || !requestData.category || !requestData.subCategory) {
        return toast.error("Select Category and Sub-Category first!");
    }

    setIsSubmitting(true); // Loading indicator start
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 🌟 Exact key matching with your Backend Controller
        const payload = {
            name: requestData.name,
            category: requestData.category,
            subCategory: requestData.subCategory
        };

        const res = await axios.post(`${API_BASE}/products/request-token`, payload, config);

        if (res.data.success) {
            toast.success("Request sent successfully to Admin!");
            setShowRequestModal(false);
            setRequestData({ name: "", category: "", subCategory: "" }); // Reset
        }
    } catch (err) {
        console.error("Admin Request Error:", err.response?.data);
        toast.error(err.response?.data?.message || "Request failed to send!");
    } finally {
        setIsSubmitting(false);
    }
};
    return (
        <div className="p-0 animate__animated animate__fadeIn">
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className="d-flex justify-content-between align-items-center mb-24 p-24 radius-12 shadow-sm border bg-white">
                <div>
                    <h5 className="fw-bold mb-0 text-primary-600 uppercase ls-1">Inventory Management</h5>
                    <p className="text-secondary text-xs mb-0">Total Products Listed: {products.length}</p>
                </div>
                <div className="d-flex gap-3">
                    {/* 🌟 New Request Button */}
                    <button onClick={() => setShowRequestModal(true)} className="btn btn-outline-warning rounded-8 px-20 py-12 fw-bold d-flex align-items-center gap-2">
                        <Icon icon="solar:chat-round-call-bold" /> REQUEST ADMIN
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary-600 rounded-8 px-24 py-12 fw-bold shadow-sm d-flex align-items-center gap-2 text-white">
                        <Icon icon="solar:add-circle-bold" className="fs-5" /> NEW LISTING
                    </button>
                </div>
            </div>

            <div className="row gy-4">
                {isLoading ? (
                    <div className="text-center py-50 w-100"><div className="spinner-border text-primary"></div></div>
                ) : products.length > 0 ? (
                    products.map((item) => (
                        <div className="col-xxl-2 col-lg-3 col-sm-4 col-6" key={item._id}>
                            <div className="card radius-12 border-0 shadow-sm h-100 overflow-hidden text-center p-12 transition-all hover-scale">
                                <div className="radius-8 overflow-hidden mb-12 border" style={{ height: "140px" }}>
                                    <img src={item.images?.[0]} className="w-100 h-100 object-fit-contain" alt={item.name} onError={(e) => e.target.src = "assets/images/default-product.png"} />
                                </div>
                                <h6 className="fw-bold mb-4 text-truncate text-sm text-dark uppercase ls-1">{item.name}</h6>
                                <p className="text-primary-600 fw-900 mb-0">₹{item.price}</p>
                                <span className="badge bg-neutral-50 text-secondary border px-8 py-4 mt-2 text-xxs">STOCK: {item.stock}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-80 radius-12 shadow-sm w-100 mx-3 border">
                        <Icon icon="solar:box-minimalistic-broken" className="text-6xl text-neutral-200 mb-16" />
                        <p className="text-secondary fw-bold">Your inventory is currently empty.</p>
                    </div>
                )}
            </div>

            {/* 🌟 PREMIUM LISTING MODAL */}
            {showAddModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom px-32 py-20 bg-white">
                                <h5 className="fw-bold mb-0 text-primary-600">Configuring Premium Product Listing</h5>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-close shadow-none"></button>
                            </div>

                            <form onSubmit={handlePublish} className="modal-body p-32" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                                <div className="row g-4">
                                  
                                    
                                    {/* COLUMN 1: CATALOG SYNC */}
                                    <div className="col-lg-4 border-end pe-lg-4">
                                        <h6 className="fw-bold text-dark mb-20 d-flex align-items-center gap-2"><Icon icon="solar:globus-bold" className="text-primary-600"/> Catalog Sync</h6>

                                        <div className="mb-16">
        <label className="form-label text-xs fw-black text-secondary uppercase ls-1">Product Display Name *</label>
        <input 
            type="text" 
            className="form-control radius-10 border-primary-100" 
            placeholder="e.g. Organic Brown Rice 1kg" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
        />
        <small className="text-muted text-xxs">This name will be visible to customers.</small>
    </div>
                                        
                                        <div className="mb-16">
                                            <label className="form-label text-xs fw-bold text-secondary uppercase">1. Select Category *</label>
                                            <select className="form-select radius-10" onChange={e => handleCategoryChange(e.target.value)} required>
                                                <option value="">Choose Category</option>
                                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="mb-16">
                                            <label className="form-label text-xs fw-bold text-secondary uppercase">2. Select Sub-Category *</label>
                                            <select className="form-select radius-10" value={formData.subCategory} onChange={e => handleSubCategoryChange(e.target.value)} required disabled={!formData.category}>
                                                <option value="">Choose Sub-Category</option>
                                                {filteredSubCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="mb-24 p-16 radius-12 bg-primary-focus border border-primary-100">
                                            <label className="form-label text-xs fw-black text-primary-600 uppercase">3. Choose From Master List *</label>
                                            <select className="form-select radius-10 shadow-sm border-primary-200" value={formData.masterProductId} onChange={e => handleMasterProductSelect(e.target.value)} required disabled={!formData.subCategory}>
                                                <option value="">-- Choose Master Product --</option>
                                                {masterProductList.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                            </select>
                                            {!masterProductList.length && formData.subCategory && <p className="text-danger text-xxs mt-2 fw-bold">No catalog items for this sub-category. Use 'Request Admin' button.</p>}
                                        </div>

                                        <div className="row g-2 mb-20">
                                            <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">HSN (Auto)</label><input type="text" className="form-control bg-light radius-10 text-xs fw-bold" value={formData.hsnCode} readOnly /></div>
                                            <div className="col-6"><label className="text-xxs fw-bold text-muted uppercase">GST (Auto)</label><input type="text" className="form-control bg-light radius-10 text-xs fw-bold" value={formData.gstPercentage ? `${formData.gstPercentage}%` : ""} readOnly /></div>
                                        </div>

                                        <h6 className="fw-bold text-dark mt-32 mb-16 uppercase ls-1" style={{fontSize:'12px'}}>Pricing & Inventory</h6>
                                        <div className="row g-2 mb-16">
                                            <div className="col-6"><label className="form-label text-xs fw-bold text-secondary">Our Price *</label><input type="number" className="form-control radius-10" placeholder="₹" onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
                                            <div className="col-6"><label className="form-label text-xs fw-bold text-secondary">MRP</label><input type="number" className="form-control radius-10" placeholder="₹" onChange={e => setFormData({...formData, mrp: e.target.value})} /></div>
                                        </div>
                                        <div className="mb-16"><label className="form-label text-xs fw-bold text-secondary">Available Stock *</label><input type="number" className="form-control radius-10" placeholder="Units" onChange={e => setFormData({...formData, stock: e.target.value})} required /></div>
                                    </div>

                                    {/* COLUMN 2: SPECS & VARIANTS */}
                                    <div className="col-lg-4 border-end px-lg-4">
                                        <h6 className="fw-bold text-dark mb-20 d-flex align-items-center gap-2"><Icon icon="solar:bill-list-bold" className="text-primary-600"/> Technical Specs</h6>
                                       
                                        <div className="row g-2 mb-20">
                                            <div className="col-6"><label className="form-label text-xs fw-bold text-secondary">Weight/Vol</label><input type="text" className="form-control radius-10" placeholder="500g" onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
                                            <div className="col-6"><label className="form-label text-xs fw-bold text-secondary">Shelf Life</label><input type="text" className="form-control radius-10" placeholder="6 Months" onChange={e => setFormData({...formData, shelfLife: e.target.value})} /></div>
                                        </div>

                                        <label className="form-label text-xs fw-bold text-secondary uppercase">Key Highlight Features</label>
                                        <div className="mb-24">
                                            {keyFeatures.map((f, i) => (
                                                <div className="d-flex gap-2 mb-2" key={i}>
                                                    <input className="form-control form-control-sm radius-8" value={f} onChange={e => { const n = [...keyFeatures]; n[i] = e.target.value; setKeyFeatures(n); }} placeholder="e.g. 100% Organic" />
                                                    <button type="button" className="btn btn-sm btn-light radius-8" onClick={() => setKeyFeatures(keyFeatures.filter((_, idx) => idx !== i))}><Icon icon="solar:trash-bin-minimalistic-bold" className="text-danger"/></button>
                                                </div>
                                            ))}
                                            <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0" onClick={() => setKeyFeatures([...keyFeatures, ""])}>+ Add Feature</button>
                                        </div>

                                        <label className="form-label text-xs fw-bold text-secondary uppercase">Nutrition Facts</label>
                                        <div className="p-12 radius-12 bg-neutral-50 mb-24">
                                            {nutritionInfo.map((n, i) => (
                                                <div className="d-flex gap-1 mb-2" key={i}>
                                                    <input className="form-control form-control-sm radius-8" placeholder="Label" value={n.label} onChange={e => { const nArr = [...nutritionInfo]; nArr[i].label = e.target.value; setNutritionInfo(nArr); }} />
                                                    <input className="form-control form-control-sm radius-8" placeholder="Value" value={n.value} onChange={e => { const nArr = [...nutritionInfo]; nArr[i].value = e.target.value; setNutritionInfo(nArr); }} />
                                                </div>
                                            ))}
                                            <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0 mt-2" onClick={() => setNutritionInfo([...nutritionInfo, {label:"", value:""}])}>+ Add Facts Row</button>
                                        </div>
                                    </div>

                                    {/* COLUMN 3: LOGISTICS & MEDIA (5 Slots) */}
                                    <div className="col-lg-4 ps-lg-4">
                                        <h6 className="fw-bold text-dark mb-20 d-flex align-items-center gap-2"><Icon icon="solar:camera-bold" className="text-primary-600"/> Media & Logistics</h6>
                                        <div className="bg-primary-focus p-16 radius-16 border border-primary-100 mb-24">
                                            <div className="row g-2">
                                                <div className="col-6"><label className="text-xxs fw-bold uppercase">Free Delivery?</label><select className="form-select form-select-sm" onChange={e => setFormData({...formData, isFreeDelivery: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
                                                <div className="col-6"><label className="text-xxs fw-bold uppercase">Returnable?</label><select className="form-select form-select-sm" onChange={e => setFormData({...formData, isReturnable: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
                                            </div>
                                        </div>

                                        <label className="form-label text-xs fw-bold text-secondary uppercase mb-12">Product Images (5 Slots Required)</label>
                                        <div className="row g-2 mb-24">
                                            {files.images.map((img, i) => (
                                                <div className="col-4" key={i}>
                                                    <div className="w-100 h-80-px border border-dashed radius-12 d-flex flex-column align-items-center justify-content-center cursor-pointer overflow-hidden bg-white" onClick={() => document.getElementById(`imgSlot-${i}`).click()}>
                                                        {img ? <img src={URL.createObjectURL(img)} className="w-100 h-100 object-fit-cover" /> : <div className="text-center"><Icon icon="solar:gallery-add-linear" className="fs-4 text-muted"/><p className="mb-0" style={{fontSize:'8px'}}>Slot {i+1}</p></div>}
                                                        <input type="file" id={`imgSlot-${i}`} hidden accept="image/*" onChange={(e) => handleImageChange(i, e.target.files[0])} />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="col-4">
                                                <div className="w-100 h-80-px border border-dashed border-warning-200 radius-12 d-flex flex-column align-items-center justify-content-center cursor-pointer bg-warning-50" onClick={() => document.getElementById('videoSlot').click()}>
                                                    {files.video ? <div className="text-success text-xxs fw-bold">Video OK</div> : <div className="text-center"><Icon icon="solar:videocamera-add-linear" className="fs-4 text-warning"/><p className="mb-0" style={{fontSize:'8px'}}>Add Video</p></div>}
                                                    <input type="file" id="videoSlot" hidden accept="video/*" onChange={(e) => setFiles({...files, video: e.target.files[0]})} />
                                                </div>
                                            </div>
                                        </div>

                                        <label className="form-label text-xs fw-bold text-secondary uppercase">Product Description *</label>
                                        <textarea className="form-control radius-12" rows="5" placeholder="Highlight benefits, quality, and usage..." onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
                                    </div>
                                </div>

                                <div className="mt-40">
                                    <button type="submit" disabled={isSubmitting} className="btn btn-primary-600 w-100 py-16 radius-16 fw-black shadow-lg text-uppercase ls-1">
                                        {isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : "CONFIRM & PUBLISH PREMIUM PRODUCT"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 ADMIN REQUEST MODAL */}
            {showRequestModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 p-32">
                            <div className="modal-header border-0 p-0 mb-24">
                                <h5 className="fw-bold mb-0">Request New Master Entry</h5>
                                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-close shadow-none"></button>
                            </div>
                            {/* 🌟 41. Updated Request Modal with Sub-Category Logic */}
<form onSubmit={handleRequestAdmin} className="modal-body p-0">
    <p className="text-secondary text-sm mb-24">If a product name is missing from the catalog, request Admin to add it with Category and Sub-Category details.</p>
    
    {/* Product Name Request */}
    <div className="mb-16">
        <label className="form-label text-xs fw-bold">Suggested Product Name *</label>
        <input type="text" className="form-control radius-10" placeholder="e.g. Sona Masuri Rice" onChange={e => setRequestData({...requestData, name: e.target.value})} required />
    </div>

    {/* Category Select */}
    <div className="mb-16">
        <label className="form-label text-xs fw-bold">Target Category *</label>
        <select className="form-select radius-10" onChange={e => handleCategoryChange(e.target.value, true)} required>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
    </div>

    {/* Sub-Category Select (Dynamic) */}
    <div className="mb-24">
        <label className="form-label text-xs fw-bold">Target Sub-Category *</label>
        <select className="form-select radius-10" onChange={e => setRequestData({...requestData, subCategory: e.target.value})} required disabled={!filteredSubCategories.length}>
            <option value="">Select Sub-Category</option>
            {filteredSubCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
    </div>

    <button type="submit" className="btn btn-warning-600 w-100 py-12 radius-12 fw-bold text-white uppercase mt-12 shadow-sm">
        <Icon icon="solar:letter-send-bold" className="me-2" /> SEND REQUEST TO ADMIN
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