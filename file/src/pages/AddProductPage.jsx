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

    const API_BASE = "https://api.zhopingo.in/api/v1";
    const token = localStorage.getItem("userToken");

    const initialForm = {
        seller: "", // Backend needs ID, UI shows Name
        name: "", category: "", subCategory: "", price: "", mrp: "", purchasePrice: "", // 🌟 Added Purchase Price
        stock: "", brand: "", description: "", lowStockAlert: "", hsnCode: "",
        isVeg: true, isFreeDelivery: false, isReturnable: false, offerTag: "",
        highlights: { productType: "", cocoaContent: "" },
        manufacturerDetails: { manufacturerNameAddress: "", countryOfOrigin: "India" }
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
    const [imageSlots, setImageSlots] = useState([null, null, null, null, null]); // 🌟 5 Image Slots
    const [videoFile, setVideoFile] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [sellerRes, catRes, subRes] = await Promise.all([
                    axios.get(`${API_BASE}/admin/sellers`, config),
                    axios.get(`${API_BASE}/catalog/categories`, config),
                    axios.get(`${API_BASE}/catalog/sub-categories/all`, config)
                ]);
                if (sellerRes.data.success) setSellers(sellerRes.data.data);
                if (catRes.data.success) setCategories(catRes.data.data);
                if (subRes.data.success) setAllSubCategories(subRes.data.data);
            } catch (err) { toast.error("Catalog Load Error"); }
            finally { setIsLoading(false); }
        };
        fetchInitialData();
    }, [token]);

    const handleCategoryChange = (catId) => {
        setFormData({ ...formData, category: catId, subCategory: "", hsnCode: "" });
        const filtered = allSubCategories.filter(s => s.category === catId || s.category?._id === catId);
        setFilteredSubCategories(filtered);
    };

    const handleSubCatChange = (subId) => {
        const selectedSub = allSubCategories.find(s => s._id === subId);
        setFormData({ ...formData, subCategory: subId, hsnCode: selectedSub?.hsnCode || "" });
    };

    const handleImageChange = (index, file) => {
        const newSlots = [...imageSlots];
        newSlots[index] = file;
        setImageSlots(newSlots);
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.seller || !formData.name || !formData.price) return toast.error("Fill mandatory fields");

    setIsSubmitting(true);
    const data = new FormData();

    // 🌟 1. CORE DATA APPEND
    Object.keys(formData).forEach(key => {
        if (key === 'highlights' || key === 'manufacturerDetails') {
            // Send nested objects as strings to prevent [object Object] error
            data.append(key, JSON.stringify(formData[key]));
        } else {
            data.append(key, formData[key]);
        }
    });

    // 🌟 2. VARIANTS & LISTS
    data.append("variants", JSON.stringify(variants));
    data.append("ingredients", ingredientsList.filter(i => i.trim()).join(", "));
    
    // Key features processing
    const validFeatures = keyFeatures.filter(f => f.trim());
    validFeatures.forEach((f, i) => data.append(`keyFeatures[${i}]`, f));

    // 🌟 3. IMAGES APPEND (FieldName MUST match Multer 'images')
    imageSlots.forEach(img => { 
        if (img) data.append("images", img); 
    });

    if (videoFile) data.append("video", videoFile);

    try {
        const res = await axios.post(`${API_BASE}/products/add`, data, {
            headers: { 
                "Content-Type": "multipart/form-data", 
                Authorization: `Bearer ${token}` 
            }
        });

        if (res.data.success) {
            toast.success("Listed for Seller Successfully!");
            // Reset logic remains same...
        }
    } catch (err) { 
        // 🌟 Catching real backend error message
        toast.error(err.response?.data?.message || "Check mandatory fields or image size"); 
    } finally { setIsSubmitting(false); }
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
                                <div className="mb-16"><label className="text-xxs fw-bold text-secondary">Product Name *</label><input type="text" className="form-control radius-10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
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
    {/* 🌟 NEW: Neenga vaangiya vilai */}
    <div className="col-md-6">
        <label className="text-xxs fw-bold text-success-600 uppercase mb-8 d-block">Purchase Price (₹) *</label>
        <input 
            type="number" 
            className="form-control border-success" 
            value={formData.purchasePrice} 
            onChange={e => setFormData({...formData, purchasePrice: e.target.value})} 
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
                            </div>


                            {/* COLUMN 2: Specs & Ingredients */}
                            <div className="col-lg-4 border-end">
                                <h6 className="fw-bold text-primary-600 mb-20">Specifications & Ingredients</h6>
                                <div className="mb-20"><label className="text-xxs fw-bold text-secondary">Key Features</label>
                                    {keyFeatures.map((f, i) => (<div className="d-flex gap-2 mb-2" key={i}><input className="form-control form-control-sm" value={f} onChange={e => { const n = [...keyFeatures]; n[i] = e.target.value; setKeyFeatures(n); }} placeholder="Highlight point"/><Icon icon="solar:close-circle-bold" className="text-danger fs-4 mt-1 cursor-pointer" onClick={() => setKeyFeatures(keyFeatures.filter((_, idx) => idx !== i))} /></div>))}
                                    <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0" onClick={() => setKeyFeatures([...keyFeatures, ""])}>+ Add Point</button>
                                </div>
                                <div className="mb-20"><label className="text-xxs fw-bold text-secondary">Ingredients List</label>
                                    {ingredientsList.map((ing, i) => (<div className="d-flex gap-2 mb-2" key={i}><input className="form-control form-control-sm" value={ing} onChange={e => { const n = [...ingredientsList]; n[i] = e.target.value; setIngredientsList(n); }} placeholder="Ingredient name"/><Icon icon="solar:close-circle-bold" className="text-danger fs-4 mt-1 cursor-pointer" onClick={() => setIngredientsList(ingredientsList.filter((_, idx) => idx !== i))} /></div>))}
                                    <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0" onClick={() => setIngredientsList([...ingredientsList, ""])}>+ Add Ingredient</button>
                                </div>
                                <div><label className="text-xxs fw-bold text-secondary">Manufacturer Address</label><textarea className="form-control radius-10" rows="3" value={formData.manufacturerDetails.manufacturerNameAddress} onChange={e => setFormData({...formData, manufacturerDetails: {...formData.manufacturerDetails, manufacturerNameAddress: e.target.value}})}></textarea></div>
                            </div>

                            {/* COLUMN 3: Logistics & Nutrition */}
                            <div className="col-lg-4">
                                <h6 className="fw-bold text-primary-600 mb-20">Logistics & Nutrition</h6>
                                <div className="bg-primary-50 p-16 radius-16 border mb-24">
                                    <div className="row g-2 mb-12">
                                        <div className="col-6"><label className="text-xxs fw-bold text-secondary">Free Delivery?</label><select className="form-select form-select-sm" value={formData.isFreeDelivery} onChange={e => setFormData({...formData, isFreeDelivery: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
                                        <div className="col-6"><label className="text-xxs fw-bold text-secondary">Returnable?</label><select className="form-select form-select-sm" value={formData.isReturnable} onChange={e => setFormData({...formData, isReturnable: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
                                    </div>
                                    <label className="text-xxs fw-bold text-secondary">Offer Tag (Display)</label><input type="text" className="form-control form-control-sm" value={formData.offerTag} onChange={e => setFormData({...formData, offerTag: e.target.value})} placeholder="e.g. Buy 1 Get 1" />
                                </div>
<h6 className="fw-bold text-primary-600 mb-16 mt-24">Product Variants</h6>
    <div className="p-12 radius-12 border border-dashed">
        {variants.map((v, i) => (
            <div className="d-flex gap-2 mb-10" key={i}>
                <input className="form-control form-control-sm" placeholder="Size" value={v.attributeValue} onChange={e => handleVariantChange(i, 'attributeValue', e.target.value)} />
                <input className="form-control form-control-sm" placeholder="Price" type="number" value={v.price} onChange={e => handleVariantChange(i, 'price', e.target.value)} />
                <button type="button" className="btn btn-sm btn-danger-focus" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}>
                    <Icon icon="solar:trash-bin-minimalistic-bold" />
                </button>
            </div>
        ))}
        <button type="button" className="btn btn-sm btn-primary-600 w-100 mt-2 radius-8" onClick={() => setVariants([...variants, { attributeName: "Unit", attributeValue: "", price: "", stock: 100 }])}>
            + Add Size/Price Variant
        </button>
    </div>
                                
                               
                            </div>
                        </div>

                        <div className="col-12 mt-32"><label className="form-label text-xs fw-bold text-secondary uppercase">Product Description *</label><textarea className="form-control radius-12" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea></div>

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