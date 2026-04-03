import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

const AddProductPage = () => {
    const [sellers, setSellers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [filteredSubCategories, setFilteredSubCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [masterProductList, setMasterProductList] = useState([]); // 🌟 Master list state

    const API_BASE = "https://api.zhopingo.in/api/v1";
    const token = localStorage.getItem("userToken");

    const initialForm = {
    seller: "", 
    masterProductId: "",
    name: "", category: "", subCategory: "", 
    price: "", mrp: "", purchasePrice: "", 
    stock: "", brand: "", description: "", lowStockAlert: "", hsnCode: "", gstPercentage: 0,
    weight: "", shelfLife: "", fssaiLicense: "", 
    isVeg: true, isFreeDelivery: false, isReturnable: false, 
    returnWindow: 0, 
    offerTag: "",
    // 🚀 NEW FIELDS SYNC
    ingredients: "", 
    storageTips: "",
    returnPolicy: "", 
    highlights: { productType: "", cocoaContent: "", speciality: "" },
    manufacturerDetails: { manufacturerNameAddress: "", countryOfOrigin: "India", customerCareDetails: "" }
};

    const [formData, setFormData] = useState(initialForm);
    const [variants, setVariants] = useState([]);
    // 🌟 COMMAND: Add this function to handle variant input
const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
};
    const [keyFeatures, setKeyFeatures] = useState([""]);
    const [ingredientsList, setIngredientsList] = useState([""]);
    const [nutritionInfo, setNutritionInfo] = useState([{ label: "", value: "" }]);
    const [imageSlots, setImageSlots] = useState([null, null, null, null, null]); 
    const [videoFile, setVideoFile] = useState(null);

    useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // 🚀 Strictly fetching only existing valid categories and sellers
            const [sellerRes, catRes, subRes] = await Promise.all([
                axios.get(`${API_BASE}/admin/sellers`, config),
                axios.get(`${API_BASE}/catalog/categories`, config),
                axios.get(`${API_BASE}/catalog/sub-categories/all`, config)
            ]);
            
            if (sellerRes.data.success) setSellers(sellerRes.data.data);
            if (catRes.data.success) setCategories(catRes.data.data);
            if (subRes.data.success) setAllSubCategories(subRes.data.data);
        } catch (err) { 
            console.error("Initial Load Error:", err);
            toast.error("Failed to load Catalog Data"); 
        } finally { setIsLoading(false); }
    };
    fetchInitialData();
}, [token]);

    const handleCategoryChange = (catId) => {
        setFormData({ ...formData, category: catId, subCategory: "", hsnCode: "" });
        const filtered = allSubCategories.filter(s => s.category === catId || s.category?._id === catId);
        setFilteredSubCategories(filtered);
    };

    // Function around line 80
const handleSubCatChange = async (subId) => {
    const selectedSub = allSubCategories.find(s => s._id === subId);
    setFormData({ ...formData, subCategory: subId, hsnCode: selectedSub?.hsnCode || "" });

    // 🚀 THE SYNC: Fetch Master List strictly for this Sub-Category
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_BASE}/products/master-list/${subId}`, config);
        if (res.data.success) {
            setMasterProductList(res.data.data);
        }
    } catch (err) {
        setMasterProductList([]);
        console.warn("No master products found for this category");
    }
};
    // Function around line 85
const handleMasterProductSelect = (masterId) => {
    // 🚀 THE SYNC: Finding the master product details from the list
    const selectedMaster = masterProductList.find(m => m._id === masterId);
    
    if (selectedMaster) {
        setFormData({ 
            ...formData, 
            masterProductId: masterId,
            // 🌟 AUTO-FILL LOGIC: Fetching HSN from populated hsnMasterId
            hsnCode: selectedMaster.hsnMasterId?.hsnCode || "N/A",
            gstPercentage: selectedMaster.hsnMasterId?.gstRate || 0,
            // Optional: Name sync panna indha line use pannalam
            // name: selectedMaster.name 
        });
        
    }
};

    const handleImageChange = (index, file) => {
        const newSlots = [...imageSlots];
        newSlots[index] = file;
        setImageSlots(newSlots);
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.seller || !formData.masterProductId) return toast.error("Assign Seller and Select Master Product");

    setIsSubmitting(true);
    const data = new FormData();

    // 1. Data Flattening for Backend
    Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && formData[key] !== null && !Array.isArray(formData[key])) {
            Object.keys(formData[key]).forEach(subKey => {
                data.append(`${key}[${subKey}]`, formData[key][subKey]);
            });
        } else {
            data.append(key, formData[key]);
        }
    });

    // 2. Variants & Arrays
    data.append("variants", JSON.stringify(variants));
    keyFeatures.filter(f => f.trim()).forEach((f, i) => data.append(`keyFeatures[${i}]`, f));
    nutritionInfo.filter(n => n.label.trim()).forEach((n, i) => {
        data.append(`nutritionInfo[${i}][label]`, n.label);
        data.append(`nutritionInfo[${i}][value]`, n.value);
    });

    // 3. Media
    imageSlots.forEach(img => { if (img) data.append("images", img); });
    if (videoFile) data.append("video", videoFile);

    try {
        const res = await axios.post(`${API_BASE}/products/add`, data, {
            headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            toast.success("Listed for Seller Successfully!");

            // 🚀 THE FIX: RESET EVERYTHING TO EMPTY
            setFormData(initialForm);            // Basic Form empty
            setVariants([]);                     // Variants empty
            setKeyFeatures([""]);                // Highlights empty
            setIngredientsList([""]);            // Ingredients empty
            setNutritionInfo([{ label: "", value: "" }]); // Nutrition empty
            setImageSlots([null, null, null, null, null]); // Images reset
            setVideoFile(null);                  // Video reset
            setFilteredSubCategories([]);        // Sub-cat dropdown reset
            setMasterProductList([]);            // Master catalog reset
            
            // Scroll to top for better UX
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (err) { 
        toast.error(err.response?.data?.message || "Check mandatory fields"); 
    } finally { 
        setIsSubmitting(false); 
    }
};
    return (
        <MasterLayout>
            <ToastContainer position="top-right" theme="colored" />
            <div className="card radius-24 border-0 shadow-sm p-24 bg-white">
                <div className="card-header border-bottom bg-transparent pb-20 mb-20">
                    <h5 className="fw-bold mb-0 text-primary-600">Admin: Add to Product For Seller</h5>
                </div>
                
                {isLoading ? <div className="text-center py-50"><div className="spinner-border text-primary"></div></div> : (
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* 🌟 28. TARGET SELLER: Shows Name only, ID hidden in value */}
                            <div className="col-12 p-20 radius-16 bg-primary-50 border border-primary-100 shadow-sm">
                                <label className="fw-bold text-xs mb-8 uppercase text-primary-600">Assign to Seller Account *</label>
                                <select className="form-select h-52-px radius-12 border-primary-200" value={formData.seller} onChange={(e) => setFormData({...formData, seller: e.target.value})} required>
                                    <option value="">-- Select Store Name --</option>
                                    {sellers.map(s => <option key={s._id} value={s._id}>{s.shopName || s.name}</option>)}
                                </select>
                            </div>

                            {/* COLUMN 1: Core Details */}
                            <div className="col-lg-4 border-end">
                                <h6 className="fw-bold text-primary-600 mb-20">Core Details</h6>
<div className="mb-16">
        <label className="text-xxs fw-bold text-secondary uppercase">Product Name *</label>
        <input type="text" className="form-control radius-10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
    </div>

    
                                <div className="row g-2 mb-16">
                                   <div className="col-md-6">
        <label className="text-xxs fw-bold text-primary-600 uppercase mb-8 d-block">Selling Price (₹) *</label>
        <input 
            type="number" 
            className="form-control" 
            value={formData.price} 
            onChange={e => setFormData({...formData, price: e.target.value})} 
            required 
        />
    </div>
  
                                </div>
                                <div className="row g-2 mb-16">
                                    <div className="col-6"><label className="text-xxs fw-bold text-secondary">MRP (₹)</label><input type="number" className="form-control" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} /></div>
                                    <div className="col-6"><label className="text-xxs fw-bold text-secondary">Stock Count</label><input type="number" className="form-control" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} /></div>
                                </div>
                                <div className="row g-2 mb-20">
                                    <div className="col-6"><label className="text-xxs fw-bold text-secondary">Category *</label><select className="form-select" value={formData.category} onChange={e => handleCategoryChange(e.target.value)} required><option value="">Select</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                                    <div className="col-6"><label className="text-xxs fw-bold text-secondary">Sub-Category *</label><select className="form-select" value={formData.subCategory} onChange={e => handleSubCatChange(e.target.value)} required disabled={!filteredSubCategories.length}><option value="">Select</option>{filteredSubCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
                                    <div className="mb-16 p-12 radius-12 bg-primary-50 border border-dashed border-primary-200">
    <label className="text-xxs fw-black text-primary-600 uppercase mb-8 d-block">Select Master Catalog *</label>
    <select 
        className="form-select form-select-sm radius-8 shadow-none" 
        value={formData.masterProductId} 
        onChange={e => handleMasterProductSelect(e.target.value)} 
        required
        disabled={!formData.subCategory}
    >
        <option value="">-- Choose Master Product --</option>
        {masterProductList.map(m => (
            <option key={m._id} value={m._id}>{m.name}</option>
        ))}
    </select>
    {!formData.subCategory && <small className="text-danger-main text-xxs mt-1 d-block">Select Sub-Category first to unlock catalog.</small>}
</div>
                                    {/* COLUMN 2 update - Line 170 approx */}
<div className="mb-16">
    <label className="text-xxs fw-bold text-secondary uppercase">HSN Code</label>
    <input 
        type="text" 
        className="form-control bg-light fw-bold text-primary-600" 
        value={formData.hsnCode} 
        readOnly 
        placeholder="Select Master product first..."
        style={{ cursor: 'not-allowed' }}
    />
</div>
                                </div>

    <div>        <label className="text-xxs fw-bold text-secondary">Offer Tag (e.g. 20% OFF)</label>
        <input type="text" className="form-control form-control-sm" value={formData.offerTag} onChange={e => setFormData({...formData, offerTag: e.target.value})} /></div>
                            </div>


                            {/* COLUMN 2: Specs & Technicals */}
<div className="col-lg-4 border-end">
    <h6 className="fw-bold text-primary-600 mb-20 uppercase ls-1" style={{fontSize:'12px'}}>Technical Specs & Ingredients</h6>
    {/* Manufacturer Hub Section - Column 2 Update */}
<div className="mb-0">
    <label className="text-xxs fw-bold text-secondary uppercase mb-8 d-block">Manufacturer Details</label>
    <div className="p-16 radius-12 bg-neutral-50 border border-neutral-200">
        {/* Address Input */}
        <div className="mb-12">
            <label className="text-xxs text-muted uppercase mb-4 d-block">Full Address & Batch Info</label>
            <textarea 
                className="form-control form-control-sm radius-8" 
                rows="2" 
                placeholder="Name & Full Address"
                value={formData.manufacturerDetails.manufacturerNameAddress} 
                onChange={e => setFormData({
                    ...formData, 
                    manufacturerDetails: {...formData.manufacturerDetails, manufacturerNameAddress: e.target.value}
                })}
            />
        </div>

        {/* Origin Input - 🌟 NEWLY ADDED */}
        <div className="mb-0">
            <label className="text-xxs text-muted uppercase mb-4 d-block">Country of Origin</label>
            <input 
                type="text" 
                className="form-control form-control-sm radius-8" 
                placeholder="e.g. India"
                value={formData.manufacturerDetails.countryOfOrigin} 
                onChange={e => setFormData({
                    ...formData, 
                    manufacturerDetails: {...formData.manufacturerDetails, countryOfOrigin: e.target.value}
                })}
            />
        </div>
    </div>
</div>
    <div className="row g-2 mb-16">
        <div className="col-6"><label className="text-xxs fw-bold text-secondary uppercase">Weight/Vol</label><input type="text" className="form-control" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
        <div className="col-6"><label className="text-xxs fw-bold text-secondary uppercase">Shelf Life</label><input type="text" className="form-control" value={formData.shelfLife} onChange={e => setFormData({...formData, shelfLife: e.target.value})} /></div>
    </div>

    <div className="mb-20">
        <label className="text-xxs fw-bold text-secondary uppercase">Full Ingredients List</label>
        <textarea className="form-control radius-10" rows="3" placeholder="e.g. Organic Brown Rice, Natural Fibre..." value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} />
    </div>

    <div className="mb-20">
        <label className="text-xxs fw-bold text-secondary uppercase">Key Highlight Features</label>
        {keyFeatures.map((f, i) => (
            <div className="d-flex gap-2 mb-2" key={i}>
                <input className="form-control form-control-sm" value={f} onChange={e => { const n = [...keyFeatures]; n[i] = e.target.value; setKeyFeatures(n); }} />
                <button type="button" className="btn btn-sm btn-light border" onClick={() => setKeyFeatures(keyFeatures.filter((_, idx) => idx !== i))}><Icon icon="solar:trash-bin-minimalistic-bold" className="text-danger" /></button>
            </div>
        ))}
        <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0" onClick={() => setKeyFeatures([...keyFeatures, ""])}>+ Add Point</button>
    </div>


</div>
                            {/* COLUMN 3: Logistics & Nutrition */}
<div className="col-lg-4">
    <h6 className="fw-bold text-primary-600 mb-20 uppercase ls-1" style={{fontSize:'12px'}}>Logistics & Marketing</h6>
    
    <div className="bg-primary-50 p-16 radius-16 border mb-24">
        {/* 🍏 VEG / NON-VEG SELECTION HUB */}
<div className="mb-20 p-16 radius-12 border bg-light">
    <label className="form-label text-xs fw-black text-dark uppercase ls-1 mb-12 d-block">
        Dietary Classification *
    </label>
    <div className="d-flex gap-3">
        {/* VEG OPTION */}
        <div 
            onClick={() => setFormData({...formData, isVeg: true})}
            className={`flex-grow-1 p-12 radius-10 border cursor-pointer transition-all d-flex align-items-center gap-2 ${formData.isVeg ? 'bg-success-focus border-success-main shadow-sm' : 'bg-white opacity-50'}`}
        >
            <div className="border border-2 border-success-main p-1 d-flex align-items-center justify-content-center" style={{ width: '16px', height: '16px' }}>
                <div className="bg-success-main rounded-circle" style={{ width: '8px', height: '8px' }}></div>
            </div>
            <span className={`text-xs fw-bold ${formData.isVeg ? 'text-success-main' : 'text-secondary'}`}>PURE VEG</span>
        </div>

        {/* NON-VEG OPTION */}
        <div 
            onClick={() => setFormData({...formData, isVeg: false})}
            className={`flex-grow-1 p-12 radius-10 border cursor-pointer transition-all d-flex align-items-center gap-2 ${!formData.isVeg ? 'bg-danger-focus border-danger-main shadow-sm' : 'bg-white opacity-50'}`}
        >
            <div className="border border-2 border-danger-main p-1 d-flex align-items-center justify-content-center" style={{ width: '16px', height: '16px' }}>
                <div className="bg-danger-main rounded-circle" style={{ width: '8px', height: '8px' }}></div>
            </div>
            <span className={`text-xs fw-bold ${!formData.isVeg ? 'text-danger-main' : 'text-secondary'}`}>NON-VEG</span>
        </div>
    </div>
</div>
        <div className="row g-2 mb-12">
            <div className="col-6"><label className="text-xxs fw-bold text-secondary">Free Delivery?</label><select className="form-select form-select-sm" value={formData.isFreeDelivery} onChange={e => setFormData({...formData, isFreeDelivery: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
            <div className="col-6"><label className="text-xxs fw-bold text-secondary">Returnable?</label><select className="form-select form-select-sm" value={formData.isReturnable} onChange={e => setFormData({...formData, isReturnable: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
            
            {formData.isReturnable && (
                <div className="col-12 mt-2 animate__animated animate__fadeIn">
                    <label className="text-xxs fw-bold text-primary-600 uppercase">Return Policy Description</label>
                    <textarea className="form-control form-control-sm mb-2" placeholder="Describe return conditions..." value={formData.returnPolicy} onChange={e => setFormData({...formData, returnPolicy: e.target.value})} />
                    <div className="input-group input-group-sm">
                        
                        <input type="number" className="form-control" value={formData.returnWindow} onChange={e => setFormData({...formData, returnWindow: e.target.value})} />
                        <span className="input-group-text">Days</span>
                    </div>
                </div>
            )}
        </div>

    </div>
    {/* 🌟 29. 5 IMAGE SLOTS WITH RED X MARK DELETE */}
<label className="text-xxs fw-bold text-secondary uppercase mb-8">Image Assets (Max 5)</label>
<div className="d-flex flex-wrap gap-2 mb-20">
    {imageSlots.map((slot, i) => (
        <div key={i} className="position-relative" style={{ width: "65px", height: "65px" }}>
            <label className={`w-100 h-100 radius-10 border border-dashed d-flex align-items-center justify-content-center cursor-pointer overflow-hidden ${slot ? 'border-primary' : 'bg-light'}`}>
                <input type="file" hidden onChange={e => handleImageChange(i, e.target.files[0])} accept="image/*" />
                {slot ? (
                    <img src={URL.createObjectURL(slot)} className="w-100 h-100 object-fit-cover" alt="" />
                ) : (
                    <Icon icon="solar:camera-add-bold" className="text-secondary fs-5" />
                )}
            </label>

            {/* 🌟 Red X Mark Logic */}
            {slot && (
                <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); handleImageChange(i, null); }} 
                    className="position-absolute d-flex align-items-center justify-content-center p-0 shadow-lg border-0" 
                    style={{ 
                        top: "-5px", 
                        right: "-5px", 
                        width: "20px", 
                        height: "20px", 
                        backgroundColor: "#EA5455", // 🌟 Exact Red from list
                        borderRadius: "50%",
                        zIndex: 2 
                    }}
                >
                    <Icon icon="material-symbols:close-rounded" className="text-white" style={{ fontSize: "14px" }} />
                </button>
            )}
        </div>
    ))}
</div>
                                                              {/* 🌟 Professional Compact Video Upload */}
<div className="mt-20">
    <label className="text-xxs fw-bold text-secondary uppercase mb-8 d-block">Promotional Video</label>
    <div className="p-8 radius-10 border bg-light d-flex align-items-center justify-content-between" style={{ maxWidth: '220px' }}> {/* 🌟 Limited width to prevent thallifying other columns */}
        <label className="btn btn-xs btn-outline-primary mb-0 radius-8 px-12 py-6 cursor-pointer d-flex align-items-center gap-1">
            <input type="file" hidden onChange={e => setVideoFile(e.target.files[0])} accept="video/*" />
            <Icon icon="solar:videocamera-add-bold" />
            <span style={{ fontSize: '11px' }}>Choose Video</span>
        </label>
        
        {/* 🌟 Status Tick */}
        {videoFile && (
            <div className="d-flex align-items-center gap-1 text-success animate__animated animate__fadeIn">
                <Icon icon="solar:check-circle-bold" className="fs-5" />
            </div>
        )}
    </div>

</div>

                            <div className="col-12 mt-32"><label className="form-label text-xs fw-bold text-secondary uppercase">Product Description *</label><textarea className="form-control radius-12" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea></div>
                                
                               
                            </div>
                        </div>
                        {/* 🌟 Admin: Product Variants Section (Synced with Seller Premium UI) */}
<div className="mb-32 p-24 radius-16 bg-white border border-neutral-200 shadow-xs mt-24">
    <div className="d-flex align-items-center justify-content-between mb-20">
        <div>
            <h6 className="text-sm fw-black text-primary-600 uppercase mb-0 ls-1">Product Variants (Optional)</h6>
            <small className="text-secondary-light fw-medium">Define different sizes, prices and stock levels</small>
        </div>
        <button 
            type="button" 
            onClick={() => setVariants([...variants, { attributeName: "Unit", attributeValue: "", price: "", stock: "" }])} 
            className="btn btn-primary-600 btn-sm radius-8 px-16 py-8 fw-bold shadow-sm d-flex align-items-center gap-2"
        >
            <Icon icon="solar:add-circle-bold" className="fs-5" /> ADD VARIANT
        </button>
    </div>

    {variants.length > 0 ? (
        <div className="row g-3">
            {variants.map((v, i) => (
                <div key={i} className="col-12 animate__animated animate__fadeInUp mb-2">
                    {/* UI Sync: Large padding and neutral-50 background for clarity */}
                    <div className="p-20 radius-12 border border-neutral-100 bg-neutral-50 d-flex align-items-center gap-3 transition-all hover-border-primary shadow-xs">
                        
                        {/* 1. Value Input (Size/Weight) */}
                        <div className="flex-grow-1">
                            <label className="text-xxs fw-bold text-secondary uppercase mb-6 d-block">Variant Value</label>
                            <input 
                                type="text"
                                className="form-control h-44-px radius-8 border-neutral-200 text-sm fw-bold text-dark" 
                                placeholder="e.g. 1kg"
                                value={v.attributeValue || ""} 
                                onChange={e => handleVariantChange(i, 'attributeValue', e.target.value)} 
                            />
                        </div>

                        {/* 2. Price Input - 🚀 THE FIX: type="text" with numeric only logic for visibility */}
                        <div style={{ width: '130px' }}>
                            <label className="text-xxs fw-bold text-secondary uppercase mb-6 d-block">Price (₹)</label>
                            <input 
                                type="text"
                                className="form-control h-44-px radius-8 border-neutral-200 text-sm fw-bold text-dark" 
                                placeholder="0"
                                value={v.price || ""} 
                                onChange={e => { 
                                    const val = e.target.value.replace(/[^0-9]/g, ''); // Numbers only filter
                                    handleVariantChange(i, 'price', val);
                                }}
                            />
                        </div>

                        {/* 3. Stock Input - 🌟 NEW: Added Stock for Admin sync */}
                        <div style={{ width: '110px' }}>
                            <label className="text-xxs fw-bold text-secondary uppercase mb-6 d-block">Stock Qty</label>
                            <input 
                                type="text"
                                className="form-control h-44-px radius-8 border-neutral-200 text-sm fw-bold text-dark" 
                                placeholder="0"
                                value={v.stock || ""} 
                                onChange={e => { 
                                    const val = e.target.value.replace(/[^0-9]/g, ''); // Numbers only filter
                                    handleVariantChange(i, 'stock', val);
                                }}
                            />
                        </div>

                        {/* 4. Remove Button */}
                        <button 
                            type="button" 
                            onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} 
                            className="btn btn-sm btn-danger-focus text-danger-main radius-8 p-12 border-0 mt-20"
                        >
                            <Icon icon="solar:trash-bin-minimalistic-bold" className="fs-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <div className="text-center py-40 bg-neutral-50 radius-16 border border-dashed">
            <Icon icon="solar:box-minimalistic-linear" className="fs-1 text-neutral-300 mb-2" />
            <p className="text-xxs text-secondary fw-bold uppercase mb-0">No variants added yet for this product listing.</p>
        </div>
    )}
</div>



                        <div className="mt-40 text-end">
                            <button type="submit" disabled={isSubmitting} className="btn btn-primary-600 px-40 py-16 radius-16 fw-900 shadow-lg uppercase">
                                {isSubmitting ? "PROCESSING..." : "CONFIRM & PUSH PRODUCT TO SELLER"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </MasterLayout>
    );
};

export default AddProductPage;