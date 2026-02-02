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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [categories, setCategories] = useState([]); 
  const [subCategories, setSubCategories] = useState([]);
  const [formData, setFormData] = useState({ id: "", name: "", categoryId: "", description: "", image: null });

  const BASE_URL = "http://54.157.210.26/api/v1/catalog";
  const IMAGE_BASE_URL = "http://54.157.210.26/uploads/";

  // 1. FETCH PARENT CATEGORIES (For Dropdown)
  const fetchParentCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/categories`);
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error("Parent fetch error:", err);
    }
  };

  // 2. FETCH ALL SUB-CATEGORIES
  const fetchAllSubCategories = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/sub-categories/all`);
      if (res.data.success) {
        setSubCategories(res.data.data);
      }
    } catch (error) {
      console.error("Sub fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParentCategories();
    fetchAllSubCategories();
  }, []);

  // 3. CREATE OR UPDATE SUB-CATEGORY
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("category", formData.categoryId); // Backend Category ID reference
    data.append("description", formData.description);
    if (formData.image) {
      data.append("image", formData.image); // Mulder image field
    }

    try {
      let res;
      if (isEditMode) {
        // Update API
        res = await axios.put(`${BASE_URL}/sub-categories/${formData.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        // Create API
        res = await axios.post(`${BASE_URL}/sub-categories`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (res.data.success) {
        toast.success(isEditMode ? "Sub-Category Updated!" : "Sub-Category Created!");
        fetchAllSubCategories();
        setIsDrawerOpen(false);
        setFormData({ id: "", name: "", categoryId: "", description: "", image: null });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. DELETE SUB-CATEGORY
  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const res = await axios.delete(`${BASE_URL}/sub-categories/${deleteId}`);
      if (res.data.success) {
        toast.success("Deleted successfully!");
        fetchAllSubCategories();
        setShowDeleteModal(false);
      }
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setFormData({ 
      id: item._id, 
      name: item.name, 
      categoryId: item.category?._id || item.category, 
      description: item.description || "",
      image: null 
    });
    setIsDrawerOpen(true);
  };

  const getImageUrl = (path) => {
    if (!path) return "assets/images/default.png";
    const fileName = path.split('/').pop();
    return `${IMAGE_BASE_URL}${fileName}`;
  };

  const filteredData = subCategories.filter((item) => 
    searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MasterLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <div className='card h-100 p-0 radius-12 overflow-hidden'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
          <h6 className='text-lg fw-semibold mb-0'>Sub Category Details</h6>
          <button onClick={() => { setIsEditMode(false); setFormData({id:"", name:"", categoryId:"", description:"", image:null}); setIsDrawerOpen(true); }} 
                  className="btn btn-primary-600 text-sm d-flex align-items-center gap-2">
            <Icon icon="lucide:plus" /> Add New Sub Category
          </button>
        </div>
        
        <div className='card-body p-24 position-relative' style={{ minHeight: '400px' }}>
          {isLoading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white opacity-75 z-3">
              <div className="spinner-border text-primary"></div>
            </div>
          )}

          <div className='table-responsive'>
            <table className='table basic-border-table mb-0'>
              <thead>
                <tr>
                  <th scope='col'>S.no</th><th scope='col'>Image</th><th scope='col'>Sub-Category</th><th scope='col'>Category</th><th scope='col'>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>
                      <img src={getImageUrl(item.image)} className="w-40-px h-40-px radius-8 object-fit-cover" 
                           onError={(e) => { e.target.onerror = null; e.target.src="assets/images/default.png"; }} />
                    </td>
                    <td className="text-primary-600 fw-medium">{item.name}</td>
                    {/* Category name logic handle panren */}
                    <td>{item.category?.name || "N/A"}</td> 
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <button onClick={() => handleEdit(item)} className="text-info-600 border-0 bg-transparent cursor-pointer"><Icon icon="lucide:edit" /></button>
                        <button onClick={() => { setDeleteId(item._id); setShowDeleteModal(true); }} className="text-danger-600 border-0 bg-transparent cursor-pointer"><Icon icon="lucide:trash-2" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE/EDIT DRAWER */}
      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} 
           style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '450px', zIndex: 1060 }} tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 d-flex align-items-center justify-content-between'>
          <h6 className='offcanvas-title fw-semibold'>{isEditMode ? 'Edit Sub Category' : 'Create Sub Category'}</h6>
          <button type='button' className='btn-close' onClick={() => setIsDrawerOpen(false)}></button>
        </div>
        <div className='offcanvas-body p-24'>
          <form className="row gy-4" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label fw-semibold">Sub Category Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            
            <div className="col-12">
              <label className="form-label fw-semibold">Parent Category</label>
              <select className="form-select" value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} required>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea className="form-control" rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Upload Image</label>
              <div className="upload-box border-dashed p-24 radius-8 text-center bg-info-50 position-relative">
                 <Icon icon="lucide:upload-cloud" className="text-3xl text-primary-600 mb-2" />
                 <p className="mb-0 text-sm">{formData.image ? formData.image.name : "Browse to upload"}</p>
                 <input type="file" className="d-none" id="subImg" onChange={(e) => setFormData({...formData, image: e.target.files[0]})} />
                 <label htmlFor="subImg" className="stretched-link cursor-pointer"></label>
              </div>
            </div>
            
            <div className="col-12 d-flex gap-3 mt-4">
               <button type="button" className="btn btn-outline-primary-600 flex-grow-1" onClick={() => setIsDrawerOpen(false)}>Cancel</button>
               <button type="submit" className="btn btn-primary-600 flex-grow-1">{isEditMode ? 'Update' : 'Submit'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* PROFESSIONAL DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-16 border-0 shadow">
              <div className="modal-body text-center p-40">
                <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24 animate-bounce">
                  <Icon icon="lucide:trash-2" className="text-4xl" />
                </div>
                <h5 className="mb-8 fw-semibold">Delete Sub Category?</h5>
                <p className="text-secondary-light mb-32">Confirm panna database-la irunthu permanent-aa delete aagidum.</p>
                <div className="d-flex justify-content-center gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline-secondary-light px-32 radius-8">Cancel</button>
                  <button onClick={confirmDelete} className="btn btn-danger-600 px-32 radius-8">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDrawerOpen && <div className="offcanvas-backdrop fade show" onClick={() => setIsDrawerOpen(false)}></div>}
    </MasterLayout>
  );
};

export default SubCategoryPage;