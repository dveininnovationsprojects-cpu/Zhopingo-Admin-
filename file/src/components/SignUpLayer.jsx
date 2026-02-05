import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignUpLayer = () => {
  // 1: Details Entry, 2: KYC Upload, 3: Success
  const [step, setStep] = useState(1); 
  const navigate = useNavigate();
  const API_BASE = "http://54.157.210.26/api/v1";

  // Form States
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", password: "", confirmPassword: "", 
    shopName: "", panNumber: "", gstNumber: "", fssaiNumber: "", msmeNumber: ""
  });
  
  const [files, setFiles] = useState({ pan_doc: null, gst_doc: null, msme_doc: null, fssai_doc: null });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  /* ===========================================================
  WHATSAPP OTP LOGIC (COMMENTED AS PER REQUEST)
  ===========================================================
  const handleSendOTP = async () => { ... }
  const handleVerifyOTP = async () => { ... }
  ===========================================================
  */

  // STEP 1: REGISTER DETAILS (Backend: /register)
  const handleRegisterDetails = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.shopName) {
      return toast.error("All required fields must be filled!");
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords mismatch!");
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/seller/register`, {
        name: formData.name,
        email: formData.email, // Primary ID as per your new backend
        phone: formData.phone,
        password: formData.password,
        shopName: formData.shopName
      });

      if (res.data.success) {
        toast.success("Details registered! Now upload KYC.");
        setStep(2); // Moving to KYC step
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: KYC UPLOAD (Backend: /kyc)
  const handleKycUpload = async (e) => {
    e.preventDefault();

    // Compulsory check as per your backend controller
    if (!formData.panNumber || !formData.gstNumber || !files.pan_doc || !files.gst_doc || !files.msme_doc) {
      return toast.error("PAN, GST, and MSME documents/numbers are compulsory!");
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append("email", formData.email); // Finding seller by email
    data.append("panNumber", formData.panNumber);
    data.append("gstNumber", formData.gstNumber);
    if (formData.fssaiNumber) data.append("fssaiNumber", formData.fssaiNumber);
    if (formData.msmeNumber) data.append("msmeNumber", formData.msmeNumber);

    if (files.pan_doc) data.append("pan_doc", files.pan_doc);
    if (files.gst_doc) data.append("gst_doc", files.gst_doc);
    if (files.msme_doc) data.append("msme_doc", files.msme_doc);
    if (files.fssai_doc) data.append("fssai_doc", files.fssai_doc);

    try {
      const res = await axios.post(`${API_BASE}/seller/kyc`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        toast.success("KYC Submitted Successfully!");
        setStep(3); // Success Screen
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "KYC Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className='auth bg-base d-flex flex-wrap vh-100 overflow-hidden'>
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      
      <div className='auth-left d-lg-block d-none vh-100' style={{ flex: '0 0 50%' }}>
        <img src='../assets/images/auth/zhopingo-splash.jpeg' alt='Zhopingo' className="w-100 h-100" style={{ objectFit: 'cover' }} />
      </div>

      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center vh-100' style={{ flex: '1' }}>
        <div className='max-w-464-px mx-auto w-100'>
          <div className="text-center mb-24">
            <Link to='/' className='mb-16 d-inline-block'><img src='assets/images/logo.png' alt='Logo' style={{height: '40px'}} /></Link>
            {step < 3 && <h4 className='mb-8 mt-2'>Seller Registration</h4>}
          </div>
          
          <form>
            {/* STEP 1: PROFILE DETAILS */}
            {step === 1 && (
              <div className="row gy-3 animate__animated animate__fadeIn">
                <div className="icon-field">
                  <span className='icon top-50 translate-middle-y ms-16' style={{ left: 0 }}><Icon icon='f7:person' /></span>
                  <input type='text' name="name" className='form-control h-56-px ps-48' placeholder='Full Name *' onChange={handleInputChange} required />
                </div>
                <div className="icon-field">
                  <span className='icon top-50 translate-middle-y ms-16' style={{ left: 0 }}><Icon icon='solar:shop-linear' /></span>
                  <input type='text' name="shopName" className='form-control h-56-px ps-48' placeholder='Shop Name *' onChange={handleInputChange} required />
                </div>
                <div className="icon-field">
                  <span className='icon top-50 translate-middle-y ms-16' style={{ left: 0 }}><Icon icon='mage:email' /></span>
                  <input type='email' name="email" className='form-control h-56-px ps-48' placeholder='Email ID (Used for Login) *' onChange={handleInputChange} required />
                </div>
                <div className="icon-field">
                  <span className='icon top-50 translate-middle-y ms-16' style={{ left: 0 }}><Icon icon='solar:phone-linear' /></span>
                  <input type='text' name="phone" className='form-control h-56-px ps-48' placeholder='Phone Number' onChange={handleInputChange} />
                </div>
                
                <div className="icon-field position-relative">
                  <span className='icon top-50 translate-middle-y ms-16' style={{ left: 0 }}><Icon icon='solar:lock-password-outline' /></span>
                  <input type={showPassword ? 'text' : 'password'} name="password" className='form-control h-56-px ps-48 radius-12' placeholder='Create Password *' onChange={handleInputChange} required />
                  <span className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer text-secondary-light" style={{ left: "auto" }} onClick={() => setShowPassword(!showPassword)}>
                    <Icon icon={showPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} className="text-xl" />
                  </span>
                </div>

                <div className="icon-field position-relative">
                  <span className='icon top-50 translate-middle-y ms-16' style={{ left: 0 }}><Icon icon='solar:lock-password-bold' /></span>
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" className='form-control h-56-px ps-48 radius-12' placeholder='Confirm Password *' onChange={handleInputChange} required />
                  <span className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer text-secondary-light" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon icon={showConfirmPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} className="text-xl" />
                  </span>
                </div>

                <button type="button" onClick={handleRegisterDetails} disabled={isSubmitting} className="btn btn-primary w-100 h-56-px radius-12 fw-bold mt-3">
                  {isSubmitting ? "Saving..." : "PROCEED TO KYC"}
                </button>
              </div>
            )}

            {/* STEP 2: KYC UPLOAD (Matches your uploadKyc controller) */}
            {step === 2 && (
              <div className="row gy-3 animate__animated animate__fadeIn overflow-y-auto pe-2" style={{maxHeight: '500px'}}>
                <div className="p-16 border radius-12 bg-neutral-50">
                  <p className="text-xs fw-bold text-danger-main mb-12">COMPULSORY DOCUMENTS *</p>
                  
                  <label className="text-xs mb-1">PAN NUMBER</label>
                  <input type="text" name="panNumber" className="form-control mb-12 h-44-px" placeholder="ABCDE1234F" onChange={handleInputChange} />
                  
                  <label className="text-xs mb-1">PAN CARD PHOTO</label>
                  <input type="file" className="form-control mb-12" onChange={(e) => setFiles({...files, pan_doc: e.target.files[0]})} />

                  <label className="text-xs mb-1">GST NUMBER</label>
                  <input type="text" name="gstNumber" className="form-control mb-12 h-44-px" placeholder="22AAAAA0000A1Z5" onChange={handleInputChange} />

                  <label className="text-xs mb-1">GST DOCUMENT</label>
                  <input type="file" className="form-control mb-12" onChange={(e) => setFiles({...files, gst_doc: e.target.files[0]})} />
                  
                  <label className="text-xs mb-1">MSME CERTIFICATE (PDF)</label>
                  <input type="file" className="form-control mb-12" onChange={(e) => setFiles({...files, msme_doc: e.target.files[0]})} />
                </div>

                <div className="p-16 border radius-12 bg-neutral-50 shadow-sm">
                  <p className="text-xs fw-bold text-warning-main mb-12">OPTIONAL DOCUMENTS</p>
                  <label className="text-xs mb-1">FSSAI LICENSE NO</label>
                  <input type="text" name="fssaiNumber" className="form-control mb-12 h-44-px" placeholder="14-digit License No" onChange={handleInputChange} />
                  
                  <label className="text-xs mb-1">FSSAI DOCUMENT</label>
                  <input type="file" className="form-control mb-12" onChange={(e) => setFiles({...files, fssai_doc: e.target.files[0]})} />
                </div>

                <button type="button" onClick={handleKycUpload} className="btn btn-primary w-100 h-56-px radius-12 fw-bold mt-3 mb-4" disabled={isSubmitting}>
                  {isSubmitting ? "Uploading Documents..." : "COMPLETE REGISTRATION"}
                </button>
              </div>
            )}

            {/* STEP 3: SUCCESS MESSAGE */}
            {step === 3 && (
              <div className="text-center p-32 bg-info-50 radius-24 border border-info-200 animate__animated animate__bounceIn">
                <Icon icon="solar:clock-circle-bold" className="text-6xl text-info-600 mb-16" />
                <h5 className="mb-12">Application Submitted!</h5>
                <p className="text-sm text-secondary-light">KYC documents submitted. Waiting for Admin Approval...</p>
                <button onClick={() => navigate("/")} className="btn btn-primary w-100 mt-24 radius-12 h-56-px fw-bold">Back to Login</button>
              </div>
            )}
          </form>

          {step < 3 && (
            <div className='mt-24 text-center text-sm'>
              <p className='mb-0 text-secondary-light'>Already have a shop? <Link to='/' className='text-primary-600 fw-bold'>Sign In</Link></p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SignUpLayer;