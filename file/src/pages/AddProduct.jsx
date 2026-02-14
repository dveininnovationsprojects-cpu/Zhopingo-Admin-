import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";

// 🌟 Theme Sync with Admin Blue
const THEME_BLUE = "#485EC4";
const LIGHT_BLUE = "rgba(72, 94, 196, 0.05)";

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
        <div className="p-0 animate__animated animate__fadeIn">
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
            <div className="d-flex justify-content-between align-items-center mb-24  p-24 radius-12 shadow-sm border">
                <div>
                    <h5 className="fw-bold mb-0 text-primary-600">Product Management</h5>
                    <p className="text-secondary text-xs mb-0">List and manage your shop inventory</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary-600 rounded-8 px-24 py-12 fw-bold shadow-sm d-flex align-items-center gap-2">
                    <Icon icon="solar:add-circle-bold" className="fs-5" /> NEW LISTING
                </button>
            </div>

            <div className="row gy-4">
                {isLoading ? (
                    <div className="text-center py-50 w-100"><div className="spinner-border text-primary"></div></div>
                ) : products.length > 0 ? (
                    products.map((item) => (
                        <div className="col-xxl-2 col-lg-3 col-sm-4 col-6" key={item._id}>
                            <div className="card radius-12 border-0 shadow-sm h-100  overflow-hidden text-center p-12 transition-all hover-scale">
                                <div className="radius-8 overflow-hidden  mb-12" style={{ height: "140px" }}>
                                    <img src={item.images?.[0]?.startsWith('http') ? item.images[0] : `${IMAGE_BASE}${item.images?.[0]}`} className="w-100 h-100 object-fit-contain" alt={item.name} />
                                </div>
                                <h6 className="fw-bold mb-4 text-truncate text-sm text-dark">{item.name}</h6>
                                <p className="text-primary-600 fw-900 mb-0">₹{item.price}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-80  radius-12 shadow-sm w-100 mx-3">
                        <Icon icon="solar:box-minimalistic-broken" className="text-6xl text-neutral-200 mb-16" />
                        <p className="text-secondary fw-bold">Your catalog is empty.</p>
                    </div>
                )}
            </div>

            {/* 🌟 PREMIUM MODAL UI - FIXED ALIGNMENT */}
            {showAddModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom px-32 py-20 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="w-40-px h-40-px radius-10 bg-primary-50 d-flex justify-content-center align-items-center text-primary-600">
                                        <Icon icon="solar:box-bold" className="fs-4" />
                                    </div>
                                    <h5 className="fw-bold mb-0 text-dark">Premium Product Configuration</h5>
                                </div>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-close shadow-none"></button>
                            </div>

                            <form onSubmit={handlePublish} className="modal-body p-32" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                                <div className="row g-4">
                                    
                                    {/* --- COLUMN 1: CORE & VARIANTS --- */}
                                    <div className="col-lg-4 border-end pe-lg-4">
                                        <h6 className="fw-bold text-primary-600 mb-20 d-flex align-items-center gap-2">
                                            <Icon icon="solar:info-circle-bold" /> Core Details
                                        </h6>
                                        <div className="mb-16">
                                            <label className="form-label text-xs fw-bold text-secondary uppercase">Product Name *</label>
                                            <input type="text" className="form-control radius-10" placeholder="e.g. Milk" onChange={e => setFormData({...formData, name: e.target.value})} required />
                                        </div>
                                        <div className="row g-2 mb-16">
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">Price *</label>
                                                <input type="number" className="form-control radius-10" placeholder="0" onChange={e => setFormData({...formData, price: e.target.value})} required />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">MRP</label>
                                                <input type="number" className="form-control radius-10" placeholder="0" onChange={e => setFormData({...formData, mrp: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="row g-2 mb-16">
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">Stock *</label>
                                                <input type="number" className="form-control radius-10" placeholder="0" onChange={e => setFormData({...formData, stock: e.target.value})} required />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">Brand</label>
                                                <input type="text" className="form-control radius-10" placeholder="Brand name" onChange={e => setFormData({...formData, brand: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="row g-2 mb-24">
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">Category *</label>
                                                <select className="form-select radius-10" onChange={e => handleCategoryChange(e.target.value)} required>
                                                    <option value="">Select</option>
                                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">Sub-Category *</label>
                                               
                                                {/* 🌟 'dark-select' class sethurukkaen, idhu disabled-ah irundhaalum white-ah varaathu */}
<select className="form-select radius-10 dark-select" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} required disabled={!filteredSubCategories.length}>  
                                                    <option value="">Select</option>
                                                    {filteredSubCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <h6 className="fw-bold text-primary-600 mb-16 mt-32 d-flex align-items-center gap-2">
                                            <Icon icon="solar:layers-bold" /> Product Variants
                                        </h6>
                                        <div className=" p-12 radius-12 border border-dashed">
                                            {variants.map((v, i) => (
                                                <div className="d-flex gap-2 mb-10" key={i}>
                                                    <input className="form-control form-control-sm radius-8" placeholder="Size (e.g. 1kg)" onChange={e => {v.attributeValue = e.target.value; setVariants([...variants])}} />
                                                    <input className="form-control form-control-sm radius-8" placeholder="Price" type="number" onChange={e => {v.price = e.target.value; setVariants([...variants])}} />
                                                    <button type="button" className="btn btn-sm btn-danger-focus text-danger-main px-8" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}>
                                                        <Icon icon="solar:trash-bin-minimalistic-bold" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button type="button" className="btn btn-sm btn-primary-600 w-100 mt-2 radius-8" onClick={() => setVariants([...variants, { attributeName: "Unit", attributeValue: "", price: "", stock: 100 }])}>
                                                + Add Size/Price Variant
                                            </button>
                                        </div>
                                    </div>

                                    {/* --- COLUMN 2: SPECS, FEATURES, INGREDIENTS --- */}
                                    <div className="col-lg-4 border-end px-lg-4">
                                        <h6 className="fw-bold text-primary-600 mb-20 d-flex align-items-center gap-2">
                                            <Icon icon="solar:settings-bold" /> Specifications
                                        </h6>
                                        <div className="row g-2 mb-20">
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">Product Type</label>
                                                <input type="text" className="form-control radius-10" placeholder="e.g. Snack" onChange={e => setFormData({...formData, highlights: {...formData.highlights, productType: e.target.value}})} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label text-xs fw-bold text-secondary uppercase">Cocoa/Fabric %</label>
                                                <input type="text" className="form-control radius-10" onChange={e => setFormData({...formData, highlights: {...formData.highlights, cocoaContent: e.target.value}})} />
                                            </div>
                                        </div>
                                        
                                        <div className="mb-20">
                                            <label className="form-label text-xs fw-bold text-secondary uppercase">Key Features</label>
                                            {keyFeatures.map((f, i) => (
                                                <div className="d-flex gap-2 mb-2" key={i}>
                                                    <input className="form-control form-control-sm radius-8" value={f} onChange={e => { const n = [...keyFeatures]; n[i] = e.target.value; setKeyFeatures(n); }} placeholder="Highlight point"/>
                                                    <Icon icon="solar:close-circle-bold" className="text-danger fs-4 mt-1 cursor-pointer" onClick={() => setKeyFeatures(keyFeatures.filter((_, idx) => idx !== i))} />
                                                </div>
                                            ))}
                                            <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0" onClick={() => setKeyFeatures([...keyFeatures, ""])}>+ Add Point</button>
                                        </div>

                                        <div className="mb-20">
                                            <label className="form-label text-xs fw-bold text-secondary uppercase">Ingredients List</label>
                                            {ingredientsList.map((ing, i) => (
                                                <div className="d-flex gap-2 mb-2" key={i}>
                                                    <input className="form-control form-control-sm radius-8" value={ing} onChange={e => { const n = [...ingredientsList]; n[i] = e.target.value; setIngredientsList(n); }} placeholder="Ingredient name"/>
                                                    <Icon icon="solar:close-circle-bold" className="text-danger fs-4 mt-1 cursor-pointer" onClick={() => setIngredientsList(ingredientsList.filter((_, idx) => idx !== i))} />
                                                </div>
                                            ))}
                                            <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0" onClick={() => setIngredientsList([...ingredientsList, ""])}>+ Add Ingredient</button>
                                        </div>

                                        <div>
                                            <label className="form-label text-xs fw-bold text-secondary uppercase">Manufacturer Details</label>
                                            <textarea className="form-control radius-10" rows="3" placeholder="Address and licensing..." onChange={e => setFormData({...formData, manufacturerDetails: {...formData.manufacturerDetails, manufacturerNameAddress: e.target.value}})}></textarea>
                                        </div>
                                    </div>

                                    {/* --- COLUMN 3: LOGISTICS, NUTRITION, MEDIA --- */}
                                    <div className="col-lg-4 ps-lg-4">
                                        <h6 className="fw-bold text-primary-600 mb-20 d-flex align-items-center gap-2">
                                            <Icon icon="solar:delivery-bold" /> Logistics & Nutrition
                                        </h6>
                                        <div className="bg-primary-50 p-16 radius-16 border border-primary-100 mb-24">
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <label className="text-xxs fw-bold text-secondary uppercase">Free Delivery?</label>
                                                    <select className="form-select form-select-sm radius-8" onChange={e => setFormData({...formData, isFreeDelivery: e.target.value === 'true'})}>
                                                        <option value="false">No</option><option value="true">Yes</option>
                                                    </select>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-xxs fw-bold text-secondary uppercase">Returnable?</label>
                                                    <select className="form-select form-select-sm radius-8" onChange={e => setFormData({...formData, isReturnable: e.target.value === 'true'})}>
                                                        <option value="false">No</option><option value="true">Yes</option>
                                                    </select>
                                                </div>
                                                <div className="col-12 mt-2">
                                                    <label className="text-xxs fw-bold text-secondary uppercase">Offer Tag (Display)</label>
                                                    <input type="text" className="form-control form-control-sm radius-8" placeholder="e.g. Buy 1 Get 1" onChange={e => setFormData({...formData, offerTag: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-24">
                                            <label className="form-label text-xs fw-bold text-secondary uppercase">Nutrition Facts (per 100g)</label>
                                            <div className=" p-12 radius-12">
                                                {nutritionInfo.map((n, i) => (
                                                    <div className="d-flex gap-1 mb-2" key={i}>
                                                        <input className="form-control form-control-sm radius-8" placeholder="Label" value={n.label} onChange={e => { const nArr = [...nutritionInfo]; nArr[i].label = e.target.value; setNutritionInfo(nArr); }} />
                                                        <input className="form-control form-control-sm radius-8" placeholder="Val" value={n.value} onChange={e => { const nArr = [...nutritionInfo]; nArr[i].value = e.target.value; setNutritionInfo(nArr); }} />
                                                        <Icon icon="solar:close-circle-bold" className="text-muted fs-4 mt-1 cursor-pointer" onClick={() => setNutritionInfo(nutritionInfo.filter((_, idx) => idx !== i))} />
                                                    </div>
                                                ))}
                                                <button type="button" className="btn btn-sm text-primary-600 fw-bold p-0" onClick={() => setNutritionInfo([...nutritionInfo, {label:"", value:""}])}>+ Add Row</button>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 p-16 radius-16 border">
                                            <label className="form-label text-xs fw-bold text-secondary uppercase mb-12">Upload Media Assets</label>
                                            <div className="d-flex gap-2">
                                                <label className="btn btn-sm btn-outline-primary flex-grow-1 py-10 radius-8 border-dashed">
                                                    <input type="file" multiple hidden onChange={e => setFiles({...files, images: Array.from(e.target.files)})} />
                                                    <Icon icon="solar:gallery-add-bold" className="me-1"/> Photos ({files.images.length})
                                                </label>
                                                <label className="btn btn-sm btn-outline-warning flex-grow-1 py-10 radius-8 border-dashed">
                                                    <input type="file" hidden onChange={e => setFiles({...files, video: e.target.files[0]})} />
                                                    <Icon icon="solar:videocamera-add-bold" className="me-1"/> Video {files.video ? '✅' : ''}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 mt-32">
                                    <label className="form-label text-xs fw-bold text-secondary uppercase">Final Product Description *</label>
                                    <textarea className="form-control radius-12" rows="4" placeholder="Describe the product details, benefits, and usage..." onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
                                </div>

                                <div className="mt-40">
                                    <button type="submit" disabled={isSubmitting} className="btn btn-primary-600 w-100 py-16 radius-16 fw-900 shadow-lg text-uppercase ls-1">
                                        {isSubmitting ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span> PUBLISHING PRODUCT...</>
                                        ) : (
                                            <><Icon icon="solar:upload-minimalistic-bold" className="me-2 fs-4" /> CONFIRM & PUBLISH PREMIUM PRODUCT</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddProduct;