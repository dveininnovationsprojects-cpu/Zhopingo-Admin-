import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SubCategoryPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories"); // 🌟 Category Filter
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({ 
    id: "", name: "", categoryId: "", description: "", image: null
  });
  const [previewImage, setPreviewImage] = useState(null); // 🌟 Image Preview State

  const BASE_URL = "https://api.zhopingo.in/api/v1/catalog";
  const IMAGE_DOMAIN = "https://api.zhopingo.in/uploads/categories/";

  const fetchParentCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/categories`);
      if (res.data.success) setCategories(res.data.data);
    } catch (err) { console.error("Parent fetch error:", err); }
  };

  const fetchAllSubCategories = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/sub-categories/all`);
      if (res.data.success) setSubCategories(res.data.data);
    } catch (error) { console.error("Sub fetch error:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchParentCategories();
    fetchAllSubCategories();
  }, []);

  // 🌟 FILTER LOGIC: Category Dropdown + Search
  const filteredData = subCategories.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || (item.category?._id || item.category) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const selectedParent = categories.find(c => c._id === catId);
    setFormData({
      ...formData,
      categoryId: catId,
      hsnCode: selectedParent ? selectedParent.hsnCode : "",
      gstRate: selectedParent ? selectedParent.gstRate : ""
    });
  };

  // 🌟 IMAGE RESTRICTION & PREVIEW LOGIC
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      toast.error("PDF files are not allowed! Please upload an image.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit!");
      e.target.value = "";
      return;
    }
    setFormData({ ...formData, image: file });
    setPreviewImage(URL.createObjectURL(file)); // Show preview
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("category", formData.categoryId); 
    data.append("description", formData.description);
    data.append("hsnCode", formData.hsnCode);
    data.append("gstRate", formData.gstRate);
    if (formData.image) data.append("image", formData.image);

    try {
      let res = isEditMode 
        ? await axios.put(`${BASE_URL}/sub-categories/${formData.id}`, data, { headers: { "Content-Type": "multipart/form-data" } })
        : await axios.post(`${BASE_URL}/sub-categories`, data, { headers: { "Content-Type": "multipart/form-data" } });

      if (res.data.success) {
        toast.success(isEditMode ? "Updated!" : "Created!");
        fetchAllSubCategories();
        setIsDrawerOpen(false);
        setPreviewImage(null);
      }
    } catch (error) { toast.error("Save failed"); } 
    finally { setIsLoading(false); }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/sub-categories/${deleteId}`);
      if (res.data.success) {
        toast.success("Deleted!");
        fetchAllSubCategories();
        setShowDeleteModal(false);
      }
    } catch (err) { toast.error("Failed"); } 
    finally { setIsLoading(false); }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setFormData({ 
      id: item._id, name: item.name, categoryId: item.category?._id || item.category, 
      description: item.description || "", hsnCode: item.hsnCode || "", 
      gstRate: item.gstRate || "", image: null 
    });
    // 🌟 Show existing image in preview
    setPreviewImage(getImageUrl(item.image));
    setIsDrawerOpen(true);
  };

 // 🌟 41. Fixed Image URL Logic to support CloudFront
const getImageUrl = (path) => {
    if (!path) return "assets/images/default.png";
    
    // Oru velai backend-la irundhu full URL (http...) vandha adhaiye use pannuvom
    if (path.startsWith('http')) return path;
    
    // Illana unga secondary CloudFront URL-oda sync pannuvom
    const CF_URL = "https://d1utzn73483swp.cloudfront.net/";
    return CF_URL + path;
};

  return (
    <MasterLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <div className='card h-100 p-0 radius-12 overflow-hidden border-0 shadow-sm'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
          <div>
            <h6 className='text-lg fw-semibold mb-0'>Sub Category Details</h6>
            <small className="text-secondary fw-bold">Total: {filteredData.length}</small>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* 🌟 CATEGORY FILTER DROPDOWN */}
            <select className="form-select form-select-sm radius-8" style={{ width: '200px' }} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
                <option value="All Categories">All Categories Filter</option>
                {categories.map(cat => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
            </select>

            <div className="position-relative">
              <input type="text" className="form-control form-control-sm radius-8 ps-32" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary" />
            </div>

            <button onClick={() => { setIsEditMode(false); setPreviewImage(null); setFormData({id:"", name:"", categoryId:"", description:"", image:null, hsnCode:"", gstRate:""}); setIsDrawerOpen(true); }} className="btn btn-primary-600 btn-sm radius-8">
              <Icon icon="lucide:plus" /> Add New
            </button>
          </div>
        </div>
        
        <div className='card-body p-0 position-relative' style={{ minHeight: '400px' }}>
          {isLoading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center opacity-75 z-3 bg-white">
              <div className="spinner-border text-primary"></div>
            </div>
          )}

          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 align-middle'>
              <thead>
                <tr>
                  <th className="ps-24">S.no</th><th>Image</th><th>Sub-Category</th>
                  <th>Category</th><th>Description</th><th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr key={item._id}>
                    <td className="ps-24">{indexOfFirstItem + index + 1}</td>
                   {/* 🌟 Table Image Fix */}
{/* 🌟 SubCategoryPage.jsx Table Image Section */}
<td style={{ width: '60px' }}>
    <div className="w-40-px h-40-px radius-8 border bg-light d-flex align-items-center justify-content-center overflow-hidden shadow-sm">
        <img 
            src={getImageUrl(item.image)} 
            className="w-100 h-100 object-fit-cover" 
            alt={item.name}
            // 🌟 Error vandha andha space empty-ah irukkaama default image vara vaikkaum
            onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = "assets/images/default.png"; 
            }} 
        />
    </div>
</td>
                    <td className="text-primary-600 fw-medium">{item.name}</td>
                    <td><span className="badge bg-secondary-focus text-secondary-light">{item.category?.name || "N/A"}</span></td> 
                    <td><div className="text-wrap text-xs" style={{ maxWidth: '180px' }}>{item.description}</div></td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-3">
                        <button onClick={() => handleEdit(item)} className="btn btn-info-focus text-info-main p-6 radius-8 border-0"><Icon icon="lucide:edit" /></button>
                        <button onClick={() => { setDeleteId(item._id); setShowDeleteModal(true); }} className="btn btn-danger-focus text-danger-main p-6 radius-8 border-0"><Icon icon="lucide:trash-2" /></button>
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
            <div className="d-flex align-items-center gap-2 border-end pe-3">
                <span className="text-xs text-secondary fw-bold">Rows:</span>
                <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold bg-light" value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
            </div>
            <div className="d-flex align-items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-left-linear" /></button>
                <div className="d-flex gap-1 align-items-center">
                    {(() => {
                        const pages = [];
                        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
                        else {
                            pages.push(1);
                            if (currentPage > 3) pages.push('...');
                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) { pages.push(i); }
                            if (currentPage < totalPages - 2) pages.push('...');
                            if (totalPages > 1) pages.push(totalPages);
                        }
                        return [...new Set(pages)].map((p, idx) => (
                            p === '...' ? <span key={idx} className="px-2 text-muted">...</span> :
                            <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>{p}</button>
                        ));
                    })()}
                </div>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light radius-8 border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
            </div>
        </div>
      </div>

      {/* CREATE/EDIT DRAWER */}
      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '450px', zIndex: 1060 }} tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 bg-base'>
          <h6 className='offcanvas-title fw-bold text-primary-600'>{isEditMode ? 'Edit Sub Category' : 'Create Sub Category'}</h6>
          <button type='button' className='btn-close shadow-none' onClick={() => {setIsDrawerOpen(false); setPreviewImage(null);}}></button>
        </div>
        <div className='offcanvas-body p-24'>
          <form className="row gy-4" onSubmit={handleSubmit}>
            <div className="col-12"><label className="form-label fw-bold">Sub Category Name *</label><input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
            <div className="col-12"><label className="form-label fw-bold">Category *</label><select className="form-select" value={formData.categoryId} onChange={handleCategoryChange} required><option value="">Select Category</option>{categories.map(cat => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}</select></div>
            <div className="col-12"><label className="form-label fw-bold">Description</label><textarea className="form-control" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea></div>
            <div className="col-12">
              <label className="form-label fw-bold">Image Upload (Max 2MB)</label>
              <div className="upload-box border-dashed p-16 radius-8 text-center bg-info-50 position-relative">
                 <Icon icon="lucide:upload-cloud" className="text-2xl text-primary-600" />
                 <input type="file" className="d-none" id="subImg" accept="image/*" onChange={handleImageUpload} />
                 <label htmlFor="subImg" className="stretched-link cursor-pointer d-block text-xs mt-1">Click to Upload Image</label>
              </div>
              {/* 🌟 IMAGE PREVIEW BELOW */}
              {previewImage && (
                <div className="mt-16 text-center border p-8 radius-12 bg-white shadow-sm">
                  <p className="text-xxs fw-bold text-secondary uppercase mb-8">Selected Preview</p>
                  <img src={previewImage} className="radius-8 object-fit-contain" style={{ width: '100%', maxHeight: '180px' }} alt="Preview" />
                </div>
              )}
            </div>
            <div className="col-12 d-flex gap-3 mt-8"><button type="submit" className="btn btn-primary-600 w-100 radius-8 shadow-sm" disabled={isLoading}>{isEditMode ? 'Update Sub Category' : 'Submit Details'}</button></div>
          </form>
        </div>
      </div>

      {/* DELETE MODAL (Design Sync) */}
      {/* 🌟 41. Fixed Centered Trash Icon logic */}
{showDeleteModal && (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
        <div className="modal-dialog modal-dialog-centered" style={{maxWidth:'400px'}}>
            <div className="modal-content radius-24 border-0 shadow-lg p-32 text-center bg-white">
                
                {/* 🌟 Icon Wrapper: Strictly Centered */}
                <div className="d-flex justify-content-center align-items-center mb-24">
                    <div 
                        className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-flex justify-content-center align-items-center shadow-none animate__animated animate__shakeX"
                        style={{ border: '1px dashed #EA5455' }}
                    >
                        {/* 🌟 Professional Trash Icon */}
                        <Icon icon="lucide:trash-2" className="text-4xl" />
                    </div>
                </div>

                <h5 className="mb-8 fw-bold text-dark">Delete Sub Category?</h5>
                <p className="text-secondary-light mb-32 fw-medium text-sm">
                    Are you sure you want to permanently delete this Sub Category? <br/> 
                    <small className="text-danger-600 fw-bold">This action cannot be undone.</small>
                </p>

                <div className="d-flex justify-content-center gap-3">
                    <button 
                        onClick={() => setShowDeleteModal(false)} 
                        className="btn btn-light px-24 py-10 radius-12 fw-bold text-dark border-0 shadow-sm"
                    >
                        Cancel
                    </button>
                    {/* 🌟 Sync with confirmDelete logic */}
                    <button 
                        onClick={confirmDelete} 
                        className="btn btn-danger-600 px-24 py-10 radius-12 fw-bold shadow-lg uppercase ls-1"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    </div>
)}
      {isDrawerOpen && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => {setIsDrawerOpen(false); setPreviewImage(null);}}></div>}
    </MasterLayout>
  );
};

export default SubCategoryPage;