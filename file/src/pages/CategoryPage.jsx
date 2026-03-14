import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CategoryPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    id: "", name: "", description: "", image: null, hsnCode: "", gstRate: "",
    isPermanent: false 
  });
  
  const [categories, setCategories] = useState([]);
  const [hsnList, setHsnList] = useState([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const API_BASE_URL = "https://api.zhopingo.in/api/v1/catalog/categories";

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // 🌟 FIX: Fetching both normal and permanent categories to prevent table removal
      const [resNormal, resPermanent] = await Promise.all([
        axios.get(API_BASE_URL),
        axios.get(`${API_BASE_URL}/permanent`)
      ]);
      
      let allCats = [];
      if (resNormal.data.success) allCats = [...resNormal.data.data];
      if (resPermanent.data.success) {
        const permIds = new Set(allCats.map(c => c._id));
        resPermanent.data.data.forEach(p => {
          if (!permIds.has(p._id)) allCats.push(p);
        });
      }
      setCategories(allCats);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHsnData = async () => {
    try {
      const response = await axios.get(HSN_API_URL);
      if (response.data.success) {
        const activeHsnOnly = response.data.data.filter(item => item.status !== false);
        setHsnList(activeHsnOnly);
      }
    } catch (error) { console.error("HSN Fetch Error:", error); }
  };

  useEffect(() => {
    fetchCategories();
    fetchHsnData();
  }, []);

  // Filter Logic
  const filteredData = categories.filter((item) =>
    searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🌟 Advanced Pagination Logic
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleHsnChange = (e) => {
    const selectedCode = e.target.value;
    const hsnObj = hsnList.find(item => item.hsnCode === selectedCode);
    setFormData({ ...formData, hsnCode: selectedCode, gstRate: hsnObj ? hsnObj.gstRate : "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("hsnCode", formData.hsnCode);
    data.append("gstRate", formData.gstRate);
    data.append("isPermanent", formData.isPermanent); 

    if (formData.image) data.append("image", formData.image);

    try {
      let response = isEditMode 
        ? await axios.put(`${API_BASE_URL}/${formData.id}`, data, { headers: { "Content-Type": "multipart/form-data" } })
        : await axios.post(API_BASE_URL, data, { headers: { "Content-Type": "multipart/form-data" } });

      if (response.data.success) {
        toast.success(isEditMode ? "Category Updated!" : "Category Created!");
        fetchCategories();
        setIsDrawerOpen(false);
        setFormData({ id: "", name: "", description: "", image: null, hsnCode: "", gstRate: "", isPermanent: false });
      }
    } catch (error) { toast.error("Operation failed!"); } 
    finally { setIsLoading(false); }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/${deleteId}`);
      if (response.data.success) {
        toast.success("Category Deleted!");
        fetchCategories();
        setShowDeleteModal(false);
      }
    } catch (error) { toast.error("Delete failed"); } 
    finally { setIsLoading(false); }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setFormData({
      id: item._id, name: item.name, description: item.description || "",
      hsnCode: item.hsnCode || "", gstRate: item.gstRate || "",
      isPermanent: item.isPermanent || false, image: null
    });
    setIsDrawerOpen(true);
  };

  return (
    <MasterLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className='card h-100 p-0 radius-12 overflow-hidden border-0 shadow-sm'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
          <div>
            <h6 className='text-lg fw-bold mb-0 text-primary-600'>Categories</h6>
            <small className="text-secondary fw-bold">Total Categories: {filteredData.length}</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative" style={{ maxWidth: '250px' }}>
                <input type="text" className="form-control radius-8 ps-32" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary" />
            </div>
            <button onClick={() => { setIsEditMode(false); setFormData({ id: "", name: "", description: "", image: null, hsnCode: "", gstRate: "", isPermanent: false }); setIsDrawerOpen(true); }}
              className="btn btn-primary-600 text-sm d-flex align-items-center gap-2 radius-8 shadow-sm">
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
              <thead className="bg-light">
                <tr>
                  {/* 🌟 Intha line-ai (150) update pannunga */}
<th className="ps-24">S.no</th><th>Image</th><th>Name</th><th>Description</th><th>App Status</th><th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr key={item._id}>
                    <td className="ps-24 fw-bold text-secondary-light">{filteredData.length - (indexOfFirstItem + index)}</td>
                    <td><img src={item.image} alt="" className="w-40-px h-40-px radius-8 object-fit-cover shadow-sm border" onError={(e) => e.target.src = "assets/images/default.png"} /></td>
                    <td className="text-primary-600 fw-bold">{item.name}</td>
                   {/* 🌟 Description Column logic */}
{/* 🌟 Description Column - Full Text Wrap Logic */}
<td className="text-secondary-light text-sm">
    <div 
        style={{ 
            minWidth: '200px',         // Minimum width fix panrom
            maxWidth: '350px',         // Romba perusa pogaama thadukka
            whiteSpace: 'pre-wrap',    // 🌟 Idhu dhaan mukkiyam! Backend-la Enter click pannirundhaalum, illana line perusa ponaalum "one by one" kaatum.
            wordBreak: 'break-word',   // Word perusa irundha break panni next line anuppum
            lineHeight: '1.5',         // Padding spacing nalla irukka
            textAlign: 'justify'       // Text neat-ah align aaga
        }}
    >
        {item.description || "---"}
    </div>
</td>             <td>
                      <span className={`badge ${item.isPermanent ? 'bg-success-focus text-success-main' : 'bg-info-focus text-info-main'} radius-pill px-12 py-6 fw-bold uppercase ls-1`} style={{fontSize:'10px'}}>
                        {item.isPermanent ? 'Top Bar Icon' : 'Normal Item'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center justify-content-center gap-3">
                        <button onClick={() => handleEdit(item)} className="btn btn-sm btn-info-focus text-info-main p-6 radius-8 border-0 shadow-sm"><Icon icon="lucide:edit" /></button>
                        <button onClick={() => { setDeleteId(item._id); setShowDeleteModal(true); }} className="btn btn-sm btn-danger-focus text-danger-main p-6 radius-8 border-0 shadow-sm"><Icon icon="lucide:trash-2" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🌟 ADVANCED PAGINATION */}
        <div className="card-footer bg-white border-top py-16 px-24 d-flex align-items-center justify-content-end gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 border-end pe-3">
                <span className="text-xs text-secondary fw-bold">Rows:</span>
                <select className="form-select form-select-sm w-auto radius-8 border-0 fw-bold bg-light" value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
            </div>
            <div className="d-flex align-items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn btn-icon btn-sm btn-light border-0 shadow-sm"><Icon icon="solar:alt-arrow-left-linear" /></button>
                <div className="d-flex gap-1 align-items-center">
                    {(() => {
                        const pages = [];
                        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
                        else {
                            pages.push(1);
                            if (currentPage > 3) pages.push('...');
                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                            if (currentPage < totalPages - 2) pages.push('...');
                            if (totalPages > 1) pages.push(totalPages);
                        }
                        return [...new Set(pages)].map((p, idx) => (
                            p === '...' ? <span key={idx} className="px-2 text-muted">...</span> :
                            <button key={idx} onClick={() => setCurrentPage(p)} className={`btn btn-sm radius-8 border-0 w-32-px h-32-px p-0 ${currentPage === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}>{p}</button>
                        ));
                    })()}
                </div>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn btn-icon btn-sm btn-light border-0 shadow-sm"><Icon icon="solar:alt-arrow-right-linear" /></button>
            </div>
        </div>
      </div>

      {/* CREATE/EDIT DRAWER */}
      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '450px', zIndex: 1060 }} tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 d-flex align-items-center justify-content-between bg-base'>
          <h6 className='offcanvas-title fw-bold text-primary-600'>{isEditMode ? 'Edit Category' : 'Create Category'}</h6>
          <button type='button' className='btn-close shadow-none' onClick={() => setIsDrawerOpen(false)}></button>
        </div>
        <div className='offcanvas-body p-24'>
          <form className="row gy-4" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label fw-bold">Category Name *</label>
              <input type="text" className="form-control radius-8" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>

            {/* 🌟 UPDATED: Grey-to-Blue Toggle Switch logic */}
            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between p-16 border radius-12 bg-neutral-50 shadow-xs">
                 <div>
                   <label className="fw-black text-dark d-block mb-0 uppercase ls-1" style={{fontSize:'11px'}}>Top Bar Visibility</label>
                   <small className="text-secondary fw-medium">Mark as permanent app icon</small>
                 </div>
                 <div 
                    onClick={() => setFormData({...formData, isPermanent: !formData.isPermanent})}
                    style={{
                        position: 'relative', width: '46px', height: '24px',
                        backgroundColor: formData.isPermanent ? '#485EC4' : '#cbd5e0',
                        borderRadius: '24px', cursor: 'pointer', transition: '0.3s'
                    }}
                 >
                    <div style={{
                        position: 'absolute', top: '4px', left: '4px',
                        width: '16px', height: '16px', backgroundColor: 'white',
                        borderRadius: '50%', transition: '0.3s',
                        transform: formData.isPermanent ? 'translateX(22px)' : 'translateX(0px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                 </div>
              </div>
            </div>

           

            <div className="col-12"><label className="form-label fw-bold">Description</label><textarea className="form-control radius-8" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea></div>

            <div className="col-12">
              <label className="form-label fw-bold">Image Upload</label>
              <div className="upload-box border-dashed p-24 radius-12 text-center bg-primary-50 position-relative border-primary-200">
                <Icon icon="lucide:upload-cloud" className="text-3xl text-primary-600 mb-2" />
                <p className="mb-0 text-xs fw-bold">{formData.image ? formData.image.name : "Select Image File"}</p>
                <input type="file" className="d-none" id="catImg" onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })} />
                <label htmlFor="catImg" className="stretched-link cursor-pointer"></label>
              </div>
            </div>

            <div className="col-12 d-flex gap-3 mt-4">
              <button type="button" className="btn btn-light flex-grow-1 radius-8 fw-bold" onClick={() => setIsDrawerOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 flex-grow-1 radius-8 fw-bold shadow-sm">{isEditMode ? 'Update Details' : 'Save Category'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* DELETE MODAL (Preserved Design) */}
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

                <h5 className="mb-8 fw-bold text-dark">Delete Category?</h5>
                <p className="text-secondary-light mb-32 fw-medium text-sm">
                    Are you sure you want to permanently delete this Category? <br/> 
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
      {isDrawerOpen && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => setIsDrawerOpen(false)}></div>}
    </MasterLayout>
  );
};

export default CategoryPage;