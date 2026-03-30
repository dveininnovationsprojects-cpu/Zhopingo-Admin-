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
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false); // 🌟 Admin request modal
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
const [myRequests, setMyRequests] = useState([]);
// 🌟 41. Pagination States for Inventory
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

const [editId, setEditId] = useState(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);



    const sellerData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = localStorage.getItem("userToken");
    const API_BASE = "https://api.zhopingo.in/api/v1";
    const IMAGE_BASE = "https://api.zhopingo.in/uploads/products/";

    const initialForm = {
    masterProductId: "",
    name: "", category: "", subCategory: "", 
    price: "", mrp: "", purchasePrice: "", // 🌟 Backend-ku ithu romba mukkiyam
    stock: "", description: "", brand: "", 
    weight: "", shelfLife: "", fssaiLicense: "",
    hsnCode: "", gstPercentage: "", 
    isVeg: true, isFreeDelivery: false, 
    isReturnable: false, returnWindow: 0,
    offerTag: "",
    // 🚀 Backend Nested Objects
    highlights: { 
        productType: "", 
        cocoaContent: "", 
        fabricType: "",
        speciality: "" 
    },
    manufacturerDetails: { 
        manufacturerNameAddress: "", 
        marketerNameAddress: "", 
        countryOfOrigin: "India", 
        customerCareDetails: "" 
    },
    returnPolicy: "", 
    storageTips: ""
};

    const [formData, setFormData] = useState(initialForm);
    const [requestData, setRequestData] = useState({ name: "", category: "", subCategory: "" });
    const [variants, setVariants] = useState([]); 
    const [keyFeatures, setKeyFeatures] = useState([""]);
    const [ingredientsList, setIngredientsList] = useState([""]);
    const [nutritionInfo, setNutritionInfo] = useState([{ label: "", value: "" }]);
    const [files, setFiles] = useState({ images: [null, null, null, null, null], video: null }); // 🌟 5 Image Slots
    const handleEditProduct = (item) => {
    setIsEditMode(true);
    setEditId(item._id);
    
    // Auto-fill form with existing backend data
    setFormData({
        masterProductId: item.masterProductId?._id || item.masterProductId,
        name: item.name,
        category: item.category?._id || item.category,
        subCategory: item.subCategory?._id || item.subCategory,
        price: item.price,
        mrp: item.mrp || "",
        purchasePrice: item.purchasePrice || "", // 🌟 Pre-filling Purchase Price
        stock: item.stock,
        brand: item.brand || "",
        description: item.description || "",
        hsnCode: item.hsnCode || "",
        gstPercentage: item.gstPercentage || "",
        isVeg: item.isVeg,
        isFreeDelivery: item.isFreeDelivery,
        isReturnable: item.isReturnable,
        offerTag: item.offerTag || "",
        highlights: item.highlights || { productType: "", cocoaContent: "" },
        manufacturerDetails: item.manufacturerDetails || { manufacturerNameAddress: "", countryOfOrigin: "India" }
    });
 
    // Lists logic pre-fill
    setVariants(item.variants || []);
    setKeyFeatures(item.keyFeatures || [""]);
    setIngredientsList(item.ingredients ? item.ingredients.split(", ") : [""]);
    
    setShowAddModal(true); // Open the same modal
};


    // 🚀 1. BIG MODAL TRIGGER (Pre-fill & Open)
    const handleEditClick = async (item) => {
    setEditId(item._id);
    setIsLoading(true); // Loading indicator start

    try {
        const catId = item.category?._id || item.category;
        const subCatId = item.subCategory?._id || item.subCategory;

        // 🚀 1. SYNC SUB-CATEGORIES: Filter logic strictly for the selected category
        if (catId) {
            const filtered = allSubCategories.filter(sub => 
                (sub.category === catId || sub.category?._id === catId)
            );
            setFilteredSubCategories(filtered);
        }

        // 🚀 2. SYNC MASTER LIST: Backend-la irundhu andha sub-category items-ai instantaneous-ah fetch panroam
        if (subCatId) {
            const res = await axios.get(`${API_BASE}/products/master-list/${subCatId}`);
            if (res.data.success) {
                setMasterProductList(res.data.data);
            }
        }

        // 🚀 3. SET FORM DATA: Ellam fetch aana apram data-vai map panroam
        setFormData({
            masterProductId: item.masterProductId?._id || item.masterProductId,
            name: item.name,
            category: catId,
            subCategory: subCatId,
            price: item.price,
            mrp: item.mrp || "",
            purchasePrice: item.purchasePrice || "", 
            stock: item.stock,
            brand: item.brand || "",
            description: item.description || "",
            hsnCode: item.hsnCode || "",
            gstPercentage: item.gstPercentage || "",
            offerTag: item.offerTag || "",
            isVeg: item.isVeg,
            isFreeDelivery: item.isFreeDelivery,
            isReturnable: item.isReturnable,
            returnWindow: item.returnWindow || 0,
            highlights: item.highlights || { productType: "", cocoaContent: "", fabricType: "" },
            manufacturerDetails: item.manufacturerDetails || { manufacturerNameAddress: "", countryOfOrigin: "India" }
        });

        // Other lists sync
        setVariants(item.variants || []);
        setKeyFeatures(item.keyFeatures || [""]);
        setIngredientsList(item.ingredients ? item.ingredients.split(", ") : [""]);
        
        // 🚀 4. OPEN MODAL: Everything is synced now
        setShowUpdateModal(true);

    } catch (err) {
        console.error("Edit Sync Error:", err);
        toast.error("Failed to sync catalog data for editing");
    } finally {
        setIsLoading(false);
    }
};
    // 🚀 2. SUBMIT UPDATE (FormData Logic)
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const data = new FormData();

        // Strictly loop through all formData keys and Stringify Objects
        Object.keys(formData).forEach(key => {
            if (typeof formData[key] === 'object' && formData[key] !== null) {
                data.append(key, JSON.stringify(formData[key]));
            } else {
                data.append(key, formData[key]);
            }
        });

        data.append("variants", JSON.stringify(variants));

        try {
            const res = await axios.put(`${API_BASE}/products/update/${editId}`, data, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Catalog Updated Successfully!");
                setShowUpdateModal(false);
                fetchData(); // Table refresh
            }
        } catch (err) {
            toast.error("Database sync failed!");
        } finally { setIsSubmitting(false); }
    };

    
// 🌟 41. Handle Delete Logic strictly matching your Backend Router
const confirmDelete = async () => {
    if (!editId) return toast.error("Error: Product ID missing");1
    
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // 🌟 Path strictly sync: /api/v1/products/delete/:id
        const res = await axios.delete(`${API_BASE}/products/delete/${editId}`, config);
        
        if (res.data.success) {
            toast.success("Product removed from store successfully!");
            fetchData(); // Table instantaneous-ah refresh aagum
            setShowDeleteModal(false);
            setEditId(null);
        }
    } catch (err) {
        console.error("Delete Error:", err.response?.data);
        toast.error(err.response?.data?.message || "Internal Server Error during delete");
    } finally {
        setIsLoading(false);
    }
};

  // 🌟 41. Fixed Fetch Logic to show Latest Products on Top
const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const prodRes = await axios.get(`${API_BASE}/products/my-products`, config);
        
        if (prodRes.data.success) {
            // 🚀 THE FIX: Latest Date first-ah vara sort panroam
            const sortedProducts = prodRes.data.data.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setProducts(sortedProducts);
        }

        const catRes = await axios.get(`${API_BASE}/catalog/categories`);
        if (catRes.data.success) setCategories(catRes.data.data);
        
        const subRes = await axios.get(`${API_BASE}/catalog/sub-categories/all`);
        if (subRes.data.success) setAllSubCategories(subRes.data.data);
        
    } catch (err) { 
        toast.error("Catalog load error"); 
    } finally { 
        setIsLoading(false); 
    }
};
const fetchMyRequestStatus = async () => {
    try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Backend strictly 'seller' ID vachu filter pannum
        const res = await axios.get(`${API_BASE}/catalog/tokens/all`, config);
        if (res.data.success) {
            setMyRequests(res.data.data);
            setShowStatusModal(true);
        }
    } catch (err) {
        toast.error("Failed to fetch request status");
    }
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

    // 1. Basic Validation
    if (!formData.masterProductId || !formData.price || !formData.stock) {
        return toast.error("Select a product from Catalog and fill price/stock!");
    }

    if (formData.isReturnable && (!formData.returnWindow || formData.returnWindow < 1)) {
        return toast.error("Please specify a valid Return Window (1-30 days)!");
    }

    setIsSubmitting(true);
    const data = new FormData();

    // 🚀 2. DYNAMIC FORM SYNC (Handles Strings, Booleans & Nested Objects)
    Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && formData[key] !== null) {
            // Mapping Highlights & Manufacturer Details strictly for backend
            Object.keys(formData[key]).forEach(subKey => {
                data.append(`${key}[${subKey}]`, formData[key][subKey]);
            });
        } else {
            // Strictly append basic fields like name, price, isReturnable, returnWindow etc.
            data.append(key, formData[key]);
        }
    });

    // 🚀 3. MISSING ARRAY SYNC (Ingredients, Features & Nutrition)
    
    // Ingredients mapping
    data.append("ingredients", ingredientsList.filter(i => i.trim()).join(", "));

    // Key Features mapping (Array of strings -> Backend expects keyFeatures[0], keyFeatures[1])
    keyFeatures.filter(f => f.trim()).forEach((f, i) => {
        data.append(`keyFeatures[${i}]`, f);
    });

    // Nutrition Info mapping (Array of Objects -> Backend expects nutritionInfo[0][label])
    nutritionInfo.filter(n => n.label.trim()).forEach((n, i) => {
        data.append(`nutritionInfo[${i}][label]`, n.label);
        data.append(`nutritionInfo[${i}][value]`, n.value);
    });

    // 🚀 4. RELATIONS & VARIANTS
    data.append("seller", currentSellerId);
    data.append("variants", JSON.stringify(variants)); 

    // 🚀 5. FILES SYNC
    files.images.forEach(img => { if (img) data.append("images", img); });
    if (files.video) data.append("video", files.video);

    // 🚀 6. API CALL
    try {
        const config = { 
            headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } 
        };
        const res = await axios.post(`${API_BASE}/products/add`, data, config);

        if (res.data.success) {
            toast.success("Product Live on Zhopingo! 🚀 Listing Successful.");
            setShowAddModal(false);
            fetchData(); // Table refresh
            setFormData(initialForm); // Reset
            setFiles({ images: [null, null, null, null, null], video: null });
        }
    } catch (err) { 
        console.error("Listing Error:", err.response?.data);
        toast.error(err.response?.data?.message || "Listing failed. Please check inputs."); 
    } finally { 
        setIsSubmitting(false); 
    }
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
// New Listing click pannumpodhu form-ai clean panroam
const openAddModal = () => {
    setFormData(initialForm); // 🌟 THE FIX: Reset to blank
    setVariants([]);
    setKeyFeatures([""]);
    setIngredientsList([""]);
    setNutritionInfo([{ label: "", value: "" }]);
    setFiles({ images: [null, null, null, null, null], video: null });
    setEditId(null);
    setShowAddModal(true);
};

// Update close pannumpodhum form-ai clean panna idhai use pannunga
const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setFormData(initialForm);
    setEditId(null);
};
const indexOfLastProduct = currentPage * rowsPerPage;
const indexOfFirstProduct = indexOfLastProduct - rowsPerPage;
const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    return (
        
        <div className="p-0 animate__animated animate__fadeIn">
            <ToastContainer position="top-right" autoClose={2000} theme="colored" />
            
           {/* 🌟 41. Professional Responsive Header */}
{/* 🌟 41. Fixed Header: Desktop-la Right thallum, Mobile-la Wrap aagum */}
{/* 🌟 41. Fixed Header: Desktop strictly Right Aligned, Mobile Responsive Wrap */}
<div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-24 p-16 p-sm-24 radius-12 shadow-sm border bg-white w-100" 
     style={{ minWidth: 'fit-content' }}> 
    
    {/* Left Side: Title Section */}
    <div className="flex-grow-1 mb-16 mb-sm-0">
        <h5 className="fw-bold mb-0 text-primary-600 uppercase ls-1" style={{ fontSize: '18px' }}>
            Inventory Management
        </h5>
        <p className="text-secondary text-xs mb-0 fw-medium">Total Products Listed: {products.length}</p>
    </div>

    {/* Right Side: Buttons Group - Strictly pushed to right via ms-sm-auto */}
    <div className="d-flex align-items-center gap-2 overflow-x-auto w-100 w-sm-auto ms-sm-auto pb-8 pb-sm-0 scrollbar-hidden justify-content-start justify-content-sm-end">
        
        <button onClick={fetchMyRequestStatus} 
                className="btn btn-outline-primary btn-sm rounded-8 fw-bold d-flex align-items-center gap-1 text-nowrap flex-shrink-0 px-16 py-10"
                style={{ fontSize: '11px' }}>
            <Icon icon="solar:clipboard-list-bold" /> STATUS
        </button>
        
        <button onClick={() => setShowRequestModal(true)} 
                className="btn btn-outline-warning btn-sm rounded-8 fw-bold d-flex align-items-center gap-1 text-nowrap flex-shrink-0 px-16 py-10"
                style={{ fontSize: '11px' }}>
            <Icon icon="solar:chat-round-call-bold" /> REQUEST
        </button>
        
        <button 
    onClick={openAddModal} // 🌟 THE FIX: Call the reset function
    className="btn btn-primary-600 btn-sm rounded-8 fw-bold shadow-sm d-flex align-items-center gap-1 text-white text-nowrap flex-shrink-0 px-20 py-10"
    style={{ fontSize: '11px' }}
>
    <Icon icon="solar:add-circle-bold" className="fs-5" /> NEW LISTING
</button>
    </div>
</div>


           
            <div className="card-body p-0" style={{ overflowX: 'auto' }}>
    <div className="table-responsive w-100" style={{ minWidth: '800px' }}>
        <table className="table basic-border-table mb-0 align-middle">
            <thead className="bg-light">
                <tr className="text-xxs fw-black uppercase text-secondary">
                    <th className="ps-24">S.No</th>
                    <th>Thumbnail</th>
                    <th>Product Name</th>
                    <th>Category / Sub</th>
                    <th>Price Details</th>
                    <th>Stock</th>
                    <th className="text-center">Action</th>
                </tr>
            </thead>
            
            
<tbody>
   {currentProducts.length > 0 ? currentProducts.map((item, index) => (
        <tr key={item._id}>
            {/* 🌟 THE FIX: Sequential Ascending S.No logic */}
            {/* Old logic: products.length - (indexOfFirstProduct + index) -> Reverse order */}
            {/* New logic: Start from 1 and sync with Pagination */}
            <td className="ps-24 fw-bold text-secondary">
                {indexOfFirstProduct + index + 1}
            </td>
                        <td style={{ width: '80px' }}>
                            <div className="w-50-px h-50-px radius-8 border bg-light d-flex align-items-center justify-content-center overflow-hidden shadow-sm">
                                <img 
                                    src={item.images?.[0] || "assets/images/default-product.png"} 
                                    className="w-100 h-100 object-fit-cover" 
                                    alt="" 
                                    onError={(e) => e.target.src = "assets/images/default-product.png"}
                                />
                            </div>
                        </td>
                        <td>
                            <div className="d-flex flex-column">
                                <span className="text-dark fw-bold text-sm uppercase">{item.name}</span>
                                <small className="text-muted">HSN: {item.hsnCode || "---"}</small>
                            </div>
                        </td>
                        <td>
                            <span className="badge bg-primary-50 text-primary-600 radius-4 d-block mb-1" style={{width:'fit-content'}}>{item.category?.name}</span>
                            <small className="text-muted fw-bold ps-4">{item.subCategory?.name}</small>
                        </td>
                        <td>
                            <div className="d-flex flex-column">
                                <span className="text-success-main fw-900 text-sm">₹{item.price}</span>
                                {item.mrp > item.price && <del className="text-danger text-xxs opacity-75">MRP: ₹{item.mrp}</del>}
                            </div>
                        </td>
                        <td>
                            <span className={`badge ${item.stock > 10 ? 'bg-success-focus text-success-main' : 'bg-danger-focus text-danger-main'} radius-pill px-12 py-4 text-xxs fw-bold`}>
                                {item.stock} units
                            </span>
                        </td>    
<td className="text-center">
    <div className="d-flex align-items-center justify-content-center gap-2">

<button 
    type="button" 
    onClick={() => handleEditClick(item)} // 🌟 strictly map to handleEditClick
    className="btn btn-sm btn-info-focus text-info-main p-8 border-0 radius-8"
>
    <Icon icon="lucide:edit" className="fs-5"/>
</button>

        {/* Delete Button */}
        <button 
            type="button" 
            onClick={(e) => { 
                e.stopPropagation(); 
                setEditId(item._id); 
                setShowDeleteModal(true); 
            }} 
            className="btn btn-sm btn-danger-focus text-danger-main p-8 border-0 radius-8 shadow-none"
        >
            <Icon icon="lucide:trash-2" className="fs-5"/>
        </button>
    </div>
</td>
                    </tr>
                )) : <tr><td colSpan="7" className="text-center py-80 text-muted">No products listed yet.</td></tr>}
            </tbody>
        </table>
        {/* 🌟 41. Advanced Dynamic Pagination Footer */}
<div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
    <div className="d-flex align-items-center gap-2 border-end pe-3">
        <span className="text-xs text-secondary fw-bold">Rows:</span>
        <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold shadow-none" 
                value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
    </div>

    <div className="d-flex align-items-center gap-2">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} 
                className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm">
            <Icon icon="solar:alt-arrow-left-linear" />
        </button>

        <div className="d-flex gap-1 align-items-center">
            {(() => {
                const totalPages = Math.ceil(products.length / rowsPerPage);
                const pages = [];
                if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                    pages.push(1);
                    if (currentPage > 3) pages.push('...');
                    if (currentPage > 1 && currentPage < totalPages) {
                        if (currentPage > 2) pages.push(currentPage - 1);
                        pages.push(currentPage);
                        if (currentPage < totalPages - 1) pages.push(currentPage + 1);
                    }
                    if (currentPage < totalPages - 2) pages.push('...');
                    if (totalPages > 1) pages.push(totalPages);
                }
                return [...new Set(pages)].map((p, idx) => (
                    p === '...' ? <span key={idx} className="px-2 text-muted text-xs">...</span> :
                    <button key={idx} onClick={() => setCurrentPage(p)} 
                            className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 fw-bold ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>
                        {p}
                    </button>
                ));
            })()}
        </div>

        <button disabled={indexOfLastProduct >= products.length} onClick={() => setCurrentPage(prev => prev + 1)} 
                className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm">
            <Icon icon="solar:alt-arrow-right-linear" />
        </button>
    </div>
</div>
    </div>
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
                                    {/* --- ADD THIS INSIDE COLUMN 2: SPECS --- */}

                                    <div className="col-lg-4 border-end px-lg-4">
                                        <h6 className="fw-bold text-dark mb-20 d-flex align-items-center gap-2"><Icon icon="solar:bill-list-bold" className="text-primary-600"/> Technical Specs</h6>
                                       <div className="mt-24 p-16 radius-12 bg-light border border-dashed">
    <h6 className="text-xs fw-black text-dark uppercase mb-12">Manufacturing & Logistics</h6>
    
    <div className="mb-12">
        <label className="form-label text-xxs fw-bold text-secondary uppercase">Manufacturer Details *</label>
        <textarea 
            className="form-control form-control-sm radius-8" 
            placeholder="Name, Full Address & Batch Info"
            value={formData.manufacturerDetails.manufacturerNameAddress}
            onChange={e => setFormData({
                ...formData, 
                manufacturerDetails: { ...formData.manufacturerDetails, manufacturerNameAddress: e.target.value }
            })}
            required
        />
    </div>

    <div className="row g-2">
        <div className="col-6">
            <label className="text-xxs fw-bold text-secondary uppercase">Customer Care</label>
            <input 
                type="text" className="form-control form-control-sm radius-8" placeholder="Email or Phone"
                value={formData.manufacturerDetails.customerCareDetails}
                onChange={e => setFormData({
                    ...formData, 
                    manufacturerDetails: { ...formData.manufacturerDetails, customerCareDetails: e.target.value }
                })}
            />
        </div>
        <div className="col-6">
            <label className="text-xxs fw-bold text-secondary uppercase">Origin</label>
            <input 
                type="text" className="form-control form-control-sm radius-8"
                value={formData.manufacturerDetails.countryOfOrigin}
                onChange={e => setFormData({
                    ...formData, 
                    manufacturerDetails: { ...formData.manufacturerDetails, countryOfOrigin: e.target.value }
                })}
            />
        </div>
    </div>
</div>

{/* --- ADD THIS INSIDE COLUMN 3: MEDIA (Below Description) --- */}
<div className="mt-20">
    <label className="form-label text-xs fw-bold text-secondary uppercase">Storage & Usage Tips</label>
    <textarea 
        className="form-control radius-12" rows="2" 
        placeholder="e.g. Keep in cool & dry place..."
        value={formData.storageTips}
        onChange={e => setFormData({...formData, storageTips: e.target.value})}
    />
</div>
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
                                                <div className="col-6"><label className="text-xxs fw-bold uppercase">Returnable?</label><select 
    className="form-select form-select-sm" 
    value={formData.isReturnable} 
    onChange={e => {
        const val = e.target.value === 'true';
        setFormData({
            ...formData, 
            isReturnable: val, 
            returnWindow: val ? formData.returnWindow : 0 // 🌟 Return No-na window-ai 0-vaakidurom
        });
    }}
>
    <option value="false">No</option>
    <option value="true">Yes</option>
</select></div>
{formData.isReturnable && (
    <div className="col-12 animate__animated animate__fadeIn">
        <label className="text-xxs fw-bold text-primary-600 uppercase mb-4">
            Return Window (Days) *
        </label>
        <div className="input-group input-group-sm">
            <input 
                type="number" 
                className="form-control radius-8" 
                placeholder="e.g. 7" 
                value={formData.returnWindow} 
                onChange={e => setFormData({...formData, returnWindow: Number(e.target.value)})}
                min="1"
                max="30"
                required={formData.isReturnable} // Required only if visible
            />
            <span className="input-group-text bg-white text-xxs fw-bold">Days</span>
        </div>
        
    </div>
)}
                                         
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
            )}{/* 🌟 41. Professional Request Status Tracking Modal */}
{/* 🌟 41. Professional Status Tracking with Specific Color Logic */}
{showStatusModal && (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg">
                <div className="modal-header border-bottom p-24 bg-light">
                    <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                        <Icon icon="solar:history-bold" className="text-primary-600" /> Catalog Request History
                    </h6>
                    <button onClick={() => setShowStatusModal(false)} className="btn-close shadow-none"></button>
                </div>
                <div className="modal-body p-0" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-white border-bottom sticky-top">
                            <tr className="text-xxs fw-bold uppercase text-secondary">
                                <th className="ps-24 py-16">Product Name</th>
                                <th>Category / Sub</th>
                                <th>Current Status</th>
                                <th className="text-center">Admin Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myRequests.length > 0 ? myRequests.map((req, i) => (
                                <tr key={i} className="border-bottom">
                                    <td className="ps-24 fw-bold text-dark">{req.name}</td>
                                    <td>
                                        <small className="d-block fw-bold text-primary-600">{req.category?.name}</small>
                                        <small className="text-muted">{req.subCategory?.name}</small>
                                    </td>
                                    <td>
                                        {/* 🌟 41. Exact Color Logic: Active=Green, Approved=Blue, Pending=Yellow, Rejected=Red */}
                                        <span className={`badge radius-pill px-12 py-6 uppercase ls-1 ${
                                            req.status === 'active' ? 'bg-success-focus text-success-main' : // 🟢 ACTIVE (Live)
                                            req.status === 'approved' ? 'bg-info-focus text-info-main' :      // 🔵 APPROVED (HSN Pending)
                                            req.status === 'rejected' ? 'bg-danger-focus text-danger-main' : // 🔴 REJECTED
                                            'bg-warning-focus text-warning-main'                            // 🟡 PENDING
                                        }`} style={{fontSize: '10px', minWidth: '80px', textAlign: 'center'}}>
                                            {req.status === 'active' ? 'Active' : 
                                             req.status === 'approved' ? 'Approved' : 
                                             req.status === 'rejected' ? 'Rejected' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <small className="text-secondary fw-medium">
                                            {req.status === 'active' ? "Product is Live in App" : 
                                             req.status === 'approved' ? "Awaiting HSN Assignment" :
                                             req.status === 'rejected' ? (req.rejectionReason || "Check Guidelines") : 
                                             "Admin is reviewing..."}
                                        </small>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center py-50 text-muted">No catalog requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
)}{/* 🚀 41. Big Update Modal UI - Full Attribute Sync */}
{showUpdateModal && (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1500 }}>
        <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content radius-24 border-0 shadow-lg overflow-hidden bg-white">
                
                {/* Modal Header */}
                <div className="modal-header border-bottom px-32 py-20 bg-info-50">
                    <div className="d-flex align-items-center gap-2">
                        <Icon icon="solar:pen-new-square-bold" className="text-info-main fs-4" />
                        <h5 className="fw-900 mb-0 text-info-main uppercase ls-1">Update Product Profile: {formData.name}</h5>
                    </div>
                    <button type="button" onClick={() => setShowUpdateModal(false)} className="btn-close shadow-none"></button>
                </div>

                <form onSubmit={handleUpdateSubmit} className="modal-body p-32" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <div className="row g-4 text-start">
                        
                        {/* COLUMN 1: PRICING & INVENTORY */}
                        <div className="col-lg-4 border-end pe-lg-4">
                            <h6 className="fw-bold text-dark mb-20 uppercase ls-1" style={{fontSize:'12px'}}>1. Pricing & Inventory</h6>
                            
                            <div className="mb-16">
                                <label className="text-xxs fw-bold text-secondary uppercase">Product Display Name</label>
                                <input type="text" className="form-control radius-10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>

                            <div className="row g-2 mb-16">
                                <div className="col-6">
                                    <label className="text-xxs fw-bold text-primary-600 uppercase">Selling Price (₹)</label>
                                    <input type="number" className="form-control radius-10" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div className="col-6">
                                    <label className="text-xxs fw-bold text-success-600 uppercase">Purchase Price (₹)</label>
                                    <input type="number" className="form-control radius-10 border-success" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
                                </div>
                            </div>

                            <div className="row g-2 mb-16">
                                <div className="col-6">
                                    <label className="text-xxs fw-bold text-secondary uppercase">MRP (₹)</label>
                                    <input type="number" className="form-control radius-10" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} />
                                </div>
                                <div className="col-6">
                                    <label className="text-xxs fw-bold text-secondary uppercase">Stock Count</label>
                                    <input type="number" className="form-control radius-10" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                                </div>
                            </div>
                            {/* COLUMN 1: PRICING & INVENTORY (Inside showUpdateModal) */}
<div className="mb-16">
    <label className="form-label text-xs fw-bold text-secondary uppercase">Change Category</label>
    <select 
        className="form-select radius-10" 
        value={formData.category} 
        onChange={e => handleCategoryChange(e.target.value)}
    >
        <option value="">Select Category</option>
        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
    </select>
</div>

<div className="mb-16">
    <label className="form-label text-xs fw-bold text-secondary uppercase">Change Sub-Category</label>
    <select 
        className="form-select radius-10" 
        value={formData.subCategory} 
        onChange={e => handleSubCategoryChange(e.target.value)}
        disabled={!formData.category}
    >
        <option value="">Select Sub-Category</option>
        {filteredSubCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
    </select>
</div>

<div className="mb-16 p-12 bg-light radius-12 border">
    <label className="form-label text-xs fw-black text-primary-600 uppercase">Map Master Product</label>
    <select 
        className="form-select radius-10 border-primary" 
        value={formData.masterProductId} 
        onChange={e => handleMasterProductSelect(e.target.value)}
        disabled={!formData.subCategory}
    >
        <option value="">-- Choose From Catalog --</option>
        {masterProductList.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
    </select>
    <small className="text-primary-600 fw-bold d-block mt-1" style={{fontSize: '9px'}}>Current HSN: {formData.hsnCode} | GST: {formData.gstPercentage}%</small>
</div>

                            <div className="mb-16">
                                <label className="text-xxs fw-bold text-secondary uppercase">Offer Tag</label>
                                <input type="text" className="form-control radius-10" placeholder="e.g. 20% OFF" value={formData.offerTag} onChange={e => setFormData({...formData, offerTag: e.target.value})} />
                            </div>
                        </div>

                        {/* COLUMN 2: SPECIFICATIONS & NESTED DATA */}
                        <div className="col-lg-4 border-end px-lg-4">
                            <h6 className="fw-bold text-dark mb-20 uppercase ls-1" style={{fontSize:'12px'}}>2. Specifications</h6>
                            
                            <div className="mb-16">
                                <label className="text-xxs fw-bold text-secondary uppercase">Description</label>
                                <textarea className="form-control radius-12" rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>

                            

                            <div className="p-16 radius-16 bg-light border border-dashed">
                                <label className="text-xxs fw-black text-dark uppercase mb-12 d-block">Highlights</label>
                                <div className="mb-8">
                                    <label className="text-xxs text-muted uppercase">Product Type</label>
                                    <input type="text" className="form-control form-control-sm" value={formData.highlights?.productType} onChange={e => setFormData({...formData, highlights: {...formData.highlights, productType: e.target.value}})} />
                                </div>
                                <div>
                                    <label className="text-xxs text-muted uppercase">Cocoa / Fabric Content</label>
                                    <input type="text" className="form-control form-control-sm" value={formData.highlights?.cocoaContent || formData.highlights?.fabricType} onChange={e => setFormData({...formData, highlights: {...formData.highlights, cocoaContent: e.target.value}})} />
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 3: LOGISTICS & MANUFACTURER */}
                        <div className="col-lg-4 ps-lg-4">
                            <h6 className="fw-bold text-dark mb-20 uppercase ls-1" style={{fontSize:'12px'}}>3. Logistics & Source</h6>
                            
                           <div className="row g-2 mb-20">
    <div className="col-6">
        <label className="text-xxs fw-bold uppercase">Returnable?</label>
        <select 
            className="form-select form-select-sm radius-8" 
            value={formData.isReturnable} 
            onChange={e => {
                const val = e.target.value === 'true';
                setFormData({
                    ...formData, 
                    isReturnable: val, 
                    // 🌟 SYNC: If 'No', reset to 0 to prevent old data persistence
                    returnWindow: val ? formData.returnWindow : 0 
                });
            }}
        >
            <option value="false">No</option>
            <option value="true">Yes</option>
        </select>
    </div>

    {/* 🌟 41. DYNAMIC RETURN WINDOW: Only visible in Update Modal when 'Yes' is active */}
    {formData.isReturnable && (
        <div className="col-6 animate__animated animate__fadeIn">
            <label className="text-xxs fw-bold text-info-600 uppercase">Return Days *</label>
            <div className="input-group input-group-sm">
                <input 
                    type="number" 
                    className="form-control radius-8 border-info" 
                    value={formData.returnWindow} 
                    onChange={e => setFormData({...formData, returnWindow: Number(e.target.value)})}
                    min="1"
                    max="30"
                    required
                />
                <span className="input-group-text bg-light text-xxs fw-bold">Days</span>
            </div>
        </div>
    )}

    {/* Free Delivery Dropdown - Conditional Layout Sync */}
    {!formData.isReturnable && (
        <div className="col-6">
            <label className="text-xxs fw-bold uppercase">Free Delivery?</label>
            <select className="form-select form-select-sm radius-8" value={formData.isFreeDelivery} onChange={e => setFormData({...formData, isFreeDelivery: e.target.value === 'true'})}>
                <option value="false">No</option>
                <option value="true">Yes</option>
            </select>
        </div>
    )}
</div>

{/* 🌟 Extra safety: If return is active, Free Delivery move to a new line for better UI spacing */}
{formData.isReturnable && (
    <div className="mb-20">
        <label className="text-xxs fw-bold uppercase">Free Delivery?</label>
        <select className="form-select form-select-sm radius-8" value={formData.isFreeDelivery} onChange={e => setFormData({...formData, isFreeDelivery: e.target.value === 'true'})}>
            <option value="false">No</option>
            <option value="true">Yes</option>
        </select>
    </div>
)}

                            <div className="mb-16">
                                <label className="text-xxs fw-bold text-secondary uppercase">Manufacturer Details</label>
                                <textarea className="form-control radius-12 text-xs" rows="3" placeholder="Name & Address" value={formData.manufacturerDetails?.manufacturerNameAddress} onChange={e => setFormData({...formData, manufacturerDetails: {...formData.manufacturerDetails, manufacturerNameAddress: e.target.value}})}></textarea>
                            </div>

                            <div className="mb-0">
                                <label className="text-xxs fw-bold text-secondary uppercase">Country of Origin</label>
                                <input type="text" className="form-control radius-10" value={formData.manufacturerDetails?.countryOfOrigin} onChange={e => setFormData({...formData, manufacturerDetails: {...formData.manufacturerDetails, countryOfOrigin: e.target.value}})} />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button Area */}
                    <div className="mt-40 border-top pt-24">
                        <button type="submit" disabled={isSubmitting} className="btn btn-info-600 w-100 py-16 radius-16 fw-black shadow-lg uppercase ls-1 transition-all hover-scale">
                            {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : "CONFIRM & SYNC CHANGES TO DATABASE"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}
{showDeleteModal && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content radius-24 border-0 shadow-lg p-32 text-center bg-white">
                
                {/* 🌟 Center Aligned Circular Icon Container */}
                <div className="d-flex justify-content-center mb-24">
                    <div 
                        className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-flex justify-content-center align-items-center shadow-sm animate__animated animate__shakeX"
                        style={{ border: '2px dashed #EA5455' }}
                    >
                        <Icon icon="lucide:trash-2" className="text-4xl" />
                    </div>
                </div>

                <h4 className="mb-8 fw-900 text-dark">Delete Product?</h4>
                <p className="text-secondary-light mb-32 fw-medium">
                    Are you sure you want to delete this product? <br/> 
                    <small className="text-danger-600 fw-bold">This action cannot be undone.</small>
                </p>

                <div className="d-flex justify-content-center gap-3">
                    <button 
                        onClick={() => setShowDeleteModal(false)} 
                        className="btn btn-light px-32 py-12 radius-12 fw-bold text-dark border-0"
                    >
                        Cancel
                    </button>
                    {/* 🌟 Final logic trigger */}
                    <button 
                        onClick={confirmDelete} 
                        className="btn btn-danger-600 px-32 py-12 radius-12 fw-bold shadow-lg uppercase ls-1"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
)}
        </div>
    );

};

export default AddProduct;