import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import { Icon } from "@iconify/react";

const AttributesPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State for Form Fields
  const [formData, setFormData] = useState({ id: "", name: "", options: [""] });
  const [searchShop, setSearchShop] = useState("");

  const [attributes, setAttributes] = useState([
    { id: 1, name: "Grams", options: ["10g", "50g", "100g"], shop: "Tuty Store" },
    { id: 2, name: "Kilograms", options: ["1 kg", "2 kg", "3 kg"], shop: "Doms" },
    { id: 3, name: "Liter", options: ["1 Liter", "2 Liter", "3 Liter"], shop: "Tuty Store" },
  ]);

  // Handle Edit - Fills details in Drawer
  const handleEdit = (item) => {
    setIsEditMode(true);
    setFormData({ id: item.id, name: item.name, options: item.options });
    setIsDrawerOpen(true);
  };

  // Handle Delete Popup
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setAttributes(attributes.filter(item => item.id !== deleteId));
    setShowDeleteModal(false);
  };

  // Dynamic Option Fields Logic
  const addOptionField = () => setFormData({ ...formData, options: [...formData.options, ""] });
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  // Filter Logic based on Search Shop
  const filteredData = attributes.filter((item) => 
    searchShop === "" || item.shop === searchShop
  );

  return (
    <MasterLayout>
      <div className='card h-100 p-0 radius-12'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3'>
          <h6 className='text-lg fw-semibold mb-0'>Attributes</h6>
          
          {/* SEARCH SHOP FILTER */}
          <div className="position-relative d-flex align-items-center justify-content-center flex-grow-1" style={{ maxWidth: '250px' }}>
             <select className="form-select w-100 radius-8" value={searchShop} onChange={(e) => setSearchShop(e.target.value)}>
                <option value="">Search Shop</option>
                <option value="Tuty Store">Tuty Store</option>
                <option value="Doms">Doms</option>
             </select>
          </div>

          <button onClick={() => { setIsEditMode(false); setFormData({id:"", name:"", options:[""]}); setIsDrawerOpen(true); }} 
                  className="btn btn-primary-600 text-sm d-flex align-items-center gap-2">
            <Icon icon="lucide:plus" /> Add New Attributes
          </button>
        </div>
        
        <div className='card-body p-24'>
          <div className='table-responsive'>
            <table className='table basic-border-table mb-0 text-nowrap'>
              <thead>
                <tr>
                  <th>S.No</th><th>Name</th><th>Options</th><th>Shop</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className="fw-medium text-primary-600">{item.name}</td>
                    <td>{item.options.join(", ")}</td>
                    <td>{item.shop || "-"}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <button onClick={() => handleEdit(item)} className="text-info-600 text-xl border-0 bg-transparent cursor-pointer"><Icon icon="lucide:edit" /></button>
                        <button onClick={() => handleDeleteClick(item.id)} className="text-danger-600 text-xl border-0 bg-transparent cursor-pointer"><Icon icon="lucide:trash-2" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DRAWER FOR CREATE/EDIT */}
      <div className={`offcanvas offcanvas-end ${isDrawerOpen ? 'show' : ''}`} 
           style={{ visibility: isDrawerOpen ? 'visible' : 'hidden', width: '450px', zIndex: 1060 }}
           tabIndex='-1'>
        <div className='offcanvas-header border-bottom px-24 py-16 d-flex align-items-center justify-content-between'>
          <h6 className='offcanvas-title fw-semibold'>{isEditMode ? 'Edit Attributes' : 'Create Attributes'}</h6>
          <button type='button' className='btn-close' onClick={() => setIsDrawerOpen(false)}></button>
        </div>
        <div className='offcanvas-body p-24'>
          <form className="row gy-4">
            <div className="col-12">
              <label className="form-label fw-semibold">Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter Name" />
            </div>
            <div className="col-12">
               <label className="form-label fw-semibold">Options</label>
               {formData.options.map((opt, idx) => (
                 <div key={idx} className="position-relative mb-12">
                    <input type="text" className="form-control" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} />
                 </div>
               ))}
               <button type="button" onClick={addOptionField} className="btn btn-outline-secondary w-100 border-dashed py-12 radius-8 mt-8">
                  <Icon icon="lucide:plus" className="me-8" /> Add Option
               </button>
            </div>
            <div className="col-12 d-flex gap-3 mt-32">
               <button type="button" className="btn btn-outline-primary-600 flex-grow-1" onClick={() => setIsDrawerOpen(false)}>Cancel</button>
               <button type="submit" className="btn btn-primary-600 flex-grow-1">{isEditMode ? 'Update' : 'Submit'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* PROFESSIONAL DELETE POPUP */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-16 border-0">
              <div className="modal-body text-center p-40">
                <div className="w-80-px h-80-px bg-danger-focus text-danger-600 rounded-circle d-inline-flex justify-content-center align-items-center mb-24">
                  <Icon icon="lucide:trash-2" className="text-4xl" />
                </div>
                <h5 className="mb-8 fw-semibold">Delete Attribute</h5>
                <p className="text-secondary-light mb-32">Are you sure you want to delete this attribute? This action cannot be undone.</p>
                <div className="d-flex justify-content-center gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline-secondary-light px-32 radius-8">Cancel</button>
                  <button onClick={confirmDelete} className="btn btn-danger-600 px-32 radius-8">Delete</button>
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

export default AttributesPage;