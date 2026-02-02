import React, { useState, useEffect } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";
import axios from "axios";
// Toast notification components
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CategoryPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", description: "", image: null });
  const [categories, setCategories] = useState([]);

  const API_BASE_URL = "http://54.157.210.26/api/v1/catalog/categories";
  const IMAGE_BASE_URL = "http://54.157.210.26/uploads/";

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_BASE_URL);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error.message);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      let response;
      if (isEditMode) {
        response = await axios.put(`${API_BASE_URL}/${formData.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await axios.post(API_BASE_URL, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (response.data.success) {
        // App kulla toast message
        toast.success(isEditMode ? "Category Updated Successfully!" : "Category Created Successfully!");
        fetchCategories();
        setIsDrawerOpen(false);
        setFormData({ id: "", name: "", description: "", image: null });
      }
    } catch (error) {
      console.error("SAVE ERROR:", error.response?.data);
      toast.error(error.response?.data?.message || "Check connection or format");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/${deleteId}`);
      if (response.data.success) {
        // App kulla toast message
        toast.success("Category Deleted Successfully!");
        fetchCategories();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setFormData({
      id: item._id,
      name: item.name,
      description: item.description || "",
      image: null
    });
    setIsDrawerOpen(true);
  };

  // Blinking bug-ah fix panna logic update
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "assets/images/default.png";
    if (imagePath.startsWith('http')) return imagePath;
    const fileName = imagePath.split('/').pop();
    return `${IMAGE_BASE_URL}${fileName}`;
  };

  // Image load error handle panna common constant
  const handleImageError = (e) => {
    e.target.onerror = null; // Infinite loop block panna ithu mukkiyam
    e.target.src = "assets/images/default.png";
  };

  const filteredData = categories.filter((item) =>
    searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MasterLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className='card h-100 p-0 radius-12 overflow-hidden'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
          <h6 className='text-lg fw-semibold mb-0'>Category Details</h6>
          <div className="position-relative d-flex align-items-center justify-content-center flex-grow-1" style={{ maxWidth: '250px' }}>
            <select className="form-select w-100 radius-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}>
              <option value="">Search Category</option>
              {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <button onClick={() => { setIsEditMode(false); setFormData({ id: "", name: "", description: "", image: null }); setIsDrawerOpen(true); }}
            className="btn btn-primary-600 text-sm d-flex align-items-center gap-2">
            <Icon icon="lucide:plus" /> Add New Category
          </button>
        </div>

        <div className='card-body p-24 position-relative' style={{ minHeight: '400px' }}>
          {isLoading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white opacity-75 z-3">
              <div className="spinner-border text-primary shadow-sm"></div>
            </div>
          )}

          <div className='table-responsive'>
            <table className='table basic-border-table mb-0'>
              <thead>
                <tr>
                  <th scope='col'>S.no</th><th scope='col'>Image</th><th scope='col'>Name</th><th scope='col'>Description</th><th scope='col'>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={item._id}>
                      <td>{index + 1}</td>
                      <td>
                        <img
                          src={getImageUrl(item.image)}
                          alt=""
                          className="w-40-px h-40-px radius-8 object-fit-cover shadow-sm"
                          onError={handleImageError}
                        />
                      </td>
                      <td className="text-primary-600 fw-medium">{item.name}</td>
                      <td><div className="text-wrap" style={{ maxWidth: '300px' }}>{item.description}</div></td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <button onClick={() => handleEdit(item)} className="text-info-600 text-xl border-0 bg-transparent cursor-pointer"><Icon icon="lucide:edit" /></button>
                          <button onClick={() => { setDeleteId(item._id); setShowDeleteModal(true); }} className="text-danger-600 text-xl border-0 bg-transparent cursor-pointer"><Icon icon="lucide:trash-2" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-4">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`}
        style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '450px', zIndex: 1060 }} tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 d-flex align-items-center justify-content-between bg-base'>
          <h6 className='offcanvas-title fw-semibold'>{isEditMode ? 'Edit Category' : 'Create Category'}</h6>
          <button type='button' className='btn-close shadow-none' onClick={() => setIsDrawerOpen(false)}></button>
        </div>
        <div className='offcanvas-body p-24'>
          <form className="row gy-4" onSubmit={handleSubmit}>
            {/* Category ID hidden visual-aa, but state-la maintain aagum */}
            <div className="col-12">
              <label className="form-label fw-semibold">Category Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea className="form-control" rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Update Image</label>
              <div className="upload-box border-dashed p-24 radius-8 text-center bg-info-50 position-relative">
                <Icon icon="lucide:upload-cloud" className="text-3xl text-primary-600 mb-2" />
                <p className="mb-0 text-sm fw-medium">{formData.image ? formData.image.name : "Select new file to update"}</p>
                <input type="file" className="d-none" id="catImg" onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })} />
                <label htmlFor="catImg" className="stretched-link cursor-pointer"></label>
              </div>
            </div>
            <div className="col-12 d-flex gap-3 mt-4">
              <button type="button" className="btn btn-outline-primary-600 flex-grow-1" onClick={() => setIsDrawerOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 flex-grow-1 shadow-sm">{isEditMode ? 'Update Category' : 'Submit'}</button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-16 border-0 shadow">
              <div className="modal-body text-center p-40">
                <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24 animate-bounce">
                  <Icon icon="lucide:trash-2" className="text-4xl" />
                </div>
                <h5 className="mb-8 fw-semibold">Delete Category?</h5>
                <p className="text-secondary-light mb-32">Database la irunthu thirumba recover panna mudiyathu.</p>
                <div className="d-flex justify-content-center gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline-secondary-light px-32 radius-8">Cancel</button>
                  <button onClick={confirmDelete} className="btn btn-danger-600 px-32 radius-8">Confirm Delete</button>
                </div>
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