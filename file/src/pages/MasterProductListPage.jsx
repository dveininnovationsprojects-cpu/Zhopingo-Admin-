import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const MasterProductListPage = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Data States
    const [masterProducts, setMasterProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [hsnList, setHsnList] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [formData, setFormData] = useState({ 
        id: "", name: "", category: "", subCategory: "", hsnMasterId: "", gstRate: "", description: "" 
    });

// 🌟 41. Fixed API paths for Master Product sync
const API_BASE = "https://api.zhopingo.in/api/v1/catalog";
const HSN_API_URL = "https://api.zhopingo.in/api/v1/catalog/hsn-master";

    useEffect(() => {
        fetchInitialData();
    }, []);
const confirmDelete = async () => {
    if (!formData.id) return toast.error("Error: Item ID missing");

    setIsLoading(true);
    try {
        // 🌟 41. Fixed API path matching your backend router
        const res = await axios.delete(`${API_BASE}/master-product/${formData.id}`);
        
        if (res.data.success) {
            toast.success("Successfully removed from Catalog!");
            await fetchInitialData(); // 🌟 Wait for refresh
            setShowDeleteModal(false);
            setFormData({id: ""}); // Reset
        }
    } catch (err) {
        console.error("Delete Error:", err.response?.data);
        toast.error(err.response?.data?.message || "Delete failed");
    } finally {
        setIsLoading(false);
    }
};
const fetchInitialData = async () => {
    setIsLoading(true);
    try {
        // 🌟 Parallel-ah Master Product List-aiyum sethu fetch panrom
        const [resCat, resHsn, resReq, resMasterFull] = await Promise.all([
            axios.get(`${API_BASE}/categories`),
            axios.get(`${HSN_API_URL}/active`),
            axios.get(`${API_BASE}/tokens/pending`),
            // 🌟 TL sethurukka pudhu route: Full Catalog fetch
            axios.get(`${API_BASE}/master-products/all`) 
        ]);
        
        // 🌟 Backend controller 'getAllMasterProducts' return pannura data-vai set panrom
        if (resMasterFull.data.success) {
            console.log("Full Master Catalog Loaded:", resMasterFull.data.count);
            setMasterProducts(resMasterFull.data.data);
        }

        if (resCat.data.success) setCategories(resCat.data.data);
        if (resHsn.data.success) setHsnList(resHsn.data.data);
        if (resReq.data.success) setPendingRequests(resReq.data.data);
        
    } catch (err) { 
        console.error("Catalog Sync Error:", err);
        toast.error("Failed to load full master list. Check API."); 
    } finally { setIsLoading(false); }
};
// Drawer-la sub-category select pannuna Master List filter aagura logic
const handleSubCategoryChange = async (subId) => {
    setFormData({ ...formData, subCategory: subId, hsnMasterId: "", gstRate: "" });
    
    // 🌟 Best Practice: Dropdown-la ulla data-vai ippo dynamic-ah backend-la irundhu fetch pannuvom
    try {
        const res = await axios.get(`${API_BASE}/master-list/${subId}`);
        if (res.data.success) {
            setMasterProducts(res.data.data);
        }
    } catch (err) { console.error("Filter error"); }
};

    // 🌟 Category click panna athoda sub-category mattum drawer-la vara logic
    const handleCategorySelect = async (catId) => {
        setFormData({ ...formData, category: catId, subCategory: "" });
        try {
            const res = await axios.get(`${API_BASE}/sub-categories/${catId}`);
            if (res.data.success) setSubCategories(res.data.data);
        } catch (err) { console.error("Sub-cat fetch error"); }
    };

    // 🌟 HSN select pannuna GST auto-fetch logic
    const handleHsnSelect = (hsnId) => {
        const selectedHsn = hsnList.find(h => h._id === hsnId);
        setFormData({ ...formData, hsnMasterId: hsnId, gstRate: selectedHsn ? selectedHsn.gstRate : "" });
    };

    const filteredData = masterProducts.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = categoryFilter === "All" || item.category?._id === categoryFilter;
        return matchesSearch && matchesCat;
    });

    const currentItems = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const endpoint = formData.id ? `${API_BASE}/master-product/${formData.id}` : `${API_BASE}/master-product/add`;
            const method = formData.id ? 'put' : 'post';
            const res = await axios[method](endpoint, formData);
            if (res.data.success) {
                toast.success(formData.id ? "Catalog Updated!" : "Product Added to Master List!");
                fetchInitialData();
                setIsDrawerOpen(false);
            }
        } catch (err) { toast.error("Operation failed"); }
        finally { setIsLoading(false); }
    };

    return (
        <MasterLayout>
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            
            <div className='card h-100 p-0 radius-12 overflow-hidden border-0 shadow-sm'>
                {/* 🌟 HEADER: One-line Buttons and Filters */}
                <div className='card-header border-bottom bg-white py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
                    <div className="flex-grow-0">
                        <h6 className='text-lg fw-bold mb-0 text-primary-600'>Master Product List</h6>
                        <small className="text-secondary fw-bold">Total Items: {filteredData.length}</small>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-grow-1 justify-content-end">
                        <select className="form-select form-select-sm radius-8 border-primary-100" style={{width: '180px'}} value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)}>
                            <option value="All">Filter by Category</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>

                        <div className="position-relative" style={{ width: '220px' }}>
                            <input type="text" className="form-control form-control-sm radius-8 ps-32" placeholder="Search product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary" />
                        </div>

                        <button onClick={() => setShowRequestModal(true)} className="btn btn-warning-600 btn-sm radius-8 d-flex align-items-center gap-2 fw-bold text-white shadow-sm position-relative">
                            <Icon icon="solar:bell-bing-bold" /> Seller Requests
                            {pendingRequests.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white">{pendingRequests.length}</span>}
                        </button>

                        <button onClick={() => { setFormData({id:"", name:"", category:"", subCategory:"", hsnMasterId:"", gstRate:"", description:""}); setIsDrawerOpen(true); }}
                                className="btn btn-primary-600 btn-sm radius-8 d-flex align-items-center gap-2 shadow-sm fw-bold">
                            <Icon icon="lucide:plus" /> New Master Product
                        </button>
                    </div>
                </div>

                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        <table className='table basic-border-table mb-0 align-middle'>
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-24">S.no</th>
                                    <th>Master Product Name</th>
                                    <th>Category</th>
                                    <th>Sub-Category</th>
                                    <th>HSN Code</th>
                                    <th>GST %</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item, index) => (
                                    <tr key={item._id}>
                                        {/* 🌟 42. S.No Descending with Hashtag */}
                                        <td className="ps-24 fw-bold text-secondary">{filteredData.length - ((currentPage - 1) * rowsPerPage + index)}</td>
                                        <td className="text-dark fw-bold">{item.name}</td>
                                        <td><span className="badge bg-primary-50 text-primary-600 radius-4">{item.category?.name}</span></td>
                                        <td><span className="badge bg-neutral-100 text-secondary radius-4">{item.subCategory?.name}</span></td>
                                        <td className="fw-semibold text-secondary-light">{item.hsnMasterId?.hsnCode || "---"}</td>
                                        <td><span className="badge bg-success-focus text-success-main radius-4">{item.hsnMasterId?.gstRate}%</span></td>
                                       <td>
    <div className="d-flex align-items-center justify-content-center gap-3">
        {/* Edit Button */}
        <button 
            type="button"
            onClick={() => { 
                setFormData({
                    ...item, 
                    id: item._id, // 🌟 Ensure ID is passed for editing
                    category: item.category?._id, 
                    subCategory: item.subCategory?._id, 
                    hsnMasterId: item.hsnMasterId?._id, 
                    gstRate: item.hsnMasterId?.gstRate
                }); 
                setIsDrawerOpen(true); 
            }} 
            className="btn btn-sm btn-info-focus text-info-main p-8 border-0 shadow-none d-flex align-items-center justify-content-center"
        >
            <Icon icon="lucide:edit" className="fs-5" />
        </button>

        {/* Delete Button - Fixed */}
        <button 
            type="button"
            onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); // 🌟 Maraithu kondirukkum maththa events-ai thadukkum
                setFormData({ id: item._id }); // 🌟 ID-ai correctly set pannugirom
                setShowDeleteModal(true); 
            }} 
            className="btn btn-sm btn-danger-focus text-danger-main p-8 border-0 shadow-none d-flex align-items-center justify-content-center"
            style={{ cursor: 'pointer', zIndex: 10 }}
        >
            <Icon icon="lucide:trash-2" className="fs-5" />
        </button>
    </div>
</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 🌟 PAGINATION */}
                <div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light border-0 shadow-sm"><Icon icon="solar:alt-arrow-left-linear" /></button>
                    <div className="d-flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`btn btn-sm radius-8 w-32-px h-32-px p-0 ${currentPage === i + 1 ? 'btn-primary shadow-sm' : 'btn-light'}`}>{i + 1}</button>
                        ))}
                    </div>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
                </div>
            </div>

            {/* --- CREATE/EDIT MASTER DRAWER --- */}
            <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '450px', zIndex: 1060 }} tabIndex='-1'>
                <div className='offcanvas-header border-bottom px-24 py-16 bg-base'>
                    <h6 className='offcanvas-title fw-bold text-primary-600'>{formData.id ? 'Edit Catalog Entry' : 'New Master Product'}</h6>
                    <button type='button' className='btn-close shadow-none' onClick={() => setIsDrawerOpen(false)}></button>
                </div>
                <div className='offcanvas-body p-24'>
                    <form className="row gy-4" onSubmit={handleSubmit}>
                        <div className="col-12"><label className="form-label fw-bold">Product Name *</label><input type="text" className="form-control radius-8" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                        
                        <div className="col-12">
                            <label className="form-label fw-bold">Category *</label>
                            <select className="form-select radius-8" value={formData.category} onChange={(e) => handleCategorySelect(e.target.value)} required>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="col-12">
                            <label className="form-label fw-bold">Sub Category *</label>
                            <select className="form-select radius-8" value={formData.subCategory} onChange={(e) => setFormData({...formData, subCategory: e.target.value})} required disabled={!formData.category}>
                                <option value="">Select Sub Category</option>
                                {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="col-12">
                            <label className="form-label fw-bold">Map HSN Code *</label>
                            <select className="form-select radius-8" value={formData.hsnMasterId} onChange={(e) => handleHsnSelect(e.target.value)} required>
                                <option value="">Select HSN Code</option>
                                {hsnList.map(h => <option key={h._id} value={h._id}>{h.hsnCode} ({h.gstRate}%)</option>)}
                            </select>
                        </div>

                        <div className="col-12"><label className="form-label fw-bold text-xs">GST RATE (Auto-Fetch)</label><input type="text" className="form-control bg-light radius-8 fw-bold text-success-main" value={formData.gstRate ? `${formData.gstRate}%` : ""} readOnly /></div>
                        <div className="col-12"><label className="form-label fw-bold">Admin Description</label><textarea className="form-control radius-8" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea></div>

                        <div className="col-12 d-flex gap-3 mt-4"><button type="submit" className="btn btn-primary-600 w-100 radius-8 fw-bold shadow-sm">SAVE TO CATALOG</button></div>
                    </form>
                </div>
            </div>

            {/* --- SELLER REQUESTS MODAL --- */}
            {showRequestModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-24 border-0 shadow-lg">
                            <div className="modal-header border-bottom p-24 bg-warning-50">
                                <h6 className="mb-0 fw-bold text-warning-main">Incoming Seller Requests</h6>
                                <button onClick={() => setShowRequestModal(false)} className="btn-close shadow-none"></button>
                            </div>
                            <div className="modal-body p-0" style={{maxHeight:'500px', overflowY:'auto'}}>
                                <table className="table table-sm mb-0">
                                    <thead className="bg-light">
                                        <tr className="text-xxs fw-bold uppercase">
                                            <th className="ps-24">Shop Name</th>
                                            <th>Requested Name</th>
                                            <th>Cat / Sub</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequests.length > 0 ? pendingRequests.map((req, i) => (
                                            <tr key={i} className="align-middle">
                                                <td className="ps-24 fw-bold text-dark text-sm">{req.seller?.shopName}</td>
                                                <td className="fw-black text-primary-600">{req.name}</td>
                                                <td><small className="d-block">{req.category?.name}</small><small className="text-secondary">{req.subCategory?.name}</small></td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-2 p-12">
                                                        <button onClick={() => {setFormData({name: req.name, category: req.category?._id, subCategory: req.subCategory?._id}); setIsDrawerOpen(true); setShowRequestModal(false);}} className="btn btn-xs btn-success-600 radius-8">Accept & Map</button>
                                                        <button className="btn btn-xs btn-danger-600 radius-8">Reject</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : <tr><td colSpan="4" className="text-center py-50 text-muted italic">No pending requests found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteModal && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
        <div className="modal-dialog modal-dialog-centered" style={{maxWidth:'400px'}}>
            <div className="modal-content radius-24 border-0 shadow-lg p-32 text-center">
                <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24">
                    <Icon icon="lucide:trash-2" className="text-4xl" />
                </div>
                <h5 className="mb-8 fw-bold">Delete Item?</h5>
                <div className="d-flex justify-content-center gap-3">
                    <button onClick={() => setShowDeleteModal(false)} className="btn btn-light px-24 radius-12 fw-bold">Cancel</button>
                    {/* 🌟 Ensure confirmDelete is here */}
                    <button onClick={confirmDelete} className="btn btn-danger-600 px-24 radius-12 fw-bold shadow-lg">Confirm</button>
                </div>
            </div>
        </div>
    </div>
)}
        </MasterLayout>
    );
};

export default MasterProductListPage;