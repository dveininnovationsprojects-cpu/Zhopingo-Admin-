import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";

const SignUpLayer = () => {
  const [role, setRole] = useState("admin"); // Default Admin
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setStep(1); // Role maathuna udane step 1 reset aaganum
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    setStep(4); // Success Message
  };

  return (
    <section className='auth bg-base d-flex flex-wrap vh-100 overflow-hidden'>
      {/* LEFT SIDE IMAGE - FIXED FIT */}
      <div className='auth-left d-lg-block d-none vh-100' style={{ flex: '0 0 50%' }}>
        <img 
          src='assets/images/auth/zhopingo-splash.jpeg' 
          alt='Zhopingo' 
          className="w-100 h-100" 
          style={{ objectFit: 'cover' }} 
        />
      </div>

      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center vh-100' style={{ flex: '1' }}>
        <div className='max-w-464-px mx-auto w-100'>
          <Link to='/' className='mb-24 d-block'><img src='assets/images/logo.png' alt='Logo' /></Link>
          
          {step < 4 && (
            <>
              <h4 className='mb-12'>Sign Up to your Account</h4>
              <p className='mb-24 text-secondary-light text-lg'>Join Zhopingo as a {role}</p>
            </>
          )}

          <form onSubmit={handleFinalSubmit}>
            {/* ROLE DROPDOWN - Aligned */}
            {step < 4 && (
              <div className='mb-24'>
                <label className="form-label fw-semibold text-secondary-light text-sm">Register as</label>
                <div className="icon-field">
                    <span className='icon top-50 translate-middle-y'><Icon icon='solar:user-rounded-bold' /></span>
                    <select 
                      className="form-select h-56-px radius-12 bg-neutral-50 ps-48" 
                      value={role} 
                      onChange={handleRoleChange}
                    >
                      <option value="admin">Admin</option>
                      <option value="seller">Seller</option>
                    </select>
                </div>
              </div>
            )}

            {role === "seller" ? (
              <>
                {/* SELLER STEP 1: OTP */}
                {step === 1 && (
                  <div className="animate__animated animate__fadeIn">
                    <div className="icon-field mb-16">
                      <span className='icon top-50 translate-middle-y'><Icon icon='solar:phone-linear' /></span>
                      <input type='text' className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Enter Mobile Number' required />
                    </div>
                    <button type="button" onClick={() => setStep(1.5)} className="btn btn-primary w-100 h-56-px radius-12 fw-semibold">Send OTP</button>
                  </div>
                )}

                {step === 1.5 && (
                  <div className="animate__animated animate__fadeIn text-center">
                    <div className="icon-field mb-16">
                         <span className='icon top-50 translate-middle-y'><Icon icon='solar:shield-check-linear' /></span>
                         <input type='text' className='form-control h-56-px bg-neutral-50 radius-12 ps-48 text-center fw-bold' placeholder='0 0 0 0' maxLength="4" />
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="btn btn-success-600 text-white w-100 h-56-px radius-12 fw-semibold">Verify OTP</button>
                  </div>
                )}

                {/* SELLER STEP 2: PROFILE - Aligned with Icons */}
                {step === 2 && (
                  <div className="row gy-3 animate__animated animate__fadeIn">
                    <div className="icon-field"><span className='icon top-50 translate-middle-y'><Icon icon='f7:person' /></span>
                        <input type='text' className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Full Name' required />
                    </div>
                    <div className="icon-field"><span className='icon top-50 translate-middle-y'><Icon icon='solar:shop-linear' /></span>
                        <input type='text' className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Shop Name' required />
                    </div>
                    <div className="icon-field"><span className='icon top-50 translate-middle-y'><Icon icon='mage:email' /></span>
                        <input type='email' className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Email' required />
                    </div>
                    <div className="icon-field"><span className='icon top-50 translate-middle-y'><Icon icon='solar:lock-password-outline' /></span>
                        <input type='password' d="p1" className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Create Password' required />
                    </div>
                    <div className="icon-field"><span className='icon top-50 translate-middle-y'><Icon icon='solar:lock-password-bold' /></span>
                        <input type='password' d="p2" className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Confirm Password' required />
                    </div>
                    <button type="button" onClick={() => setStep(3)} className="btn btn-primary w-100 h-56-px radius-12 mt-12 fw-semibold">Next: Upload Documents</button>
                  </div>
                )}

                {/* SELLER STEP 3: DOCS - Neat Layout */}
                {step === 3 && (
                  <div className="row gy-3 animate__animated animate__fadeIn overflow-y-auto pe-4" style={{maxHeight: '400px'}}>
                    <div>
                      <label className="form-label text-xs fw-bold text-secondary-light">MSME DOCUMENT (PDF/DOCX)</label>
                      <input type="file" className="form-control radius-12 bg-neutral-50 h-44-px" accept=".pdf,.docx" required />
                    </div>
                    <div>
                      <label className="form-label text-xs fw-bold text-secondary-light">PAN NUMBER & CARD</label>
                      <input type="text" className="form-control mb-2 radius-12 bg-neutral-50 h-44-px" placeholder="Enter PAN Number" required />
                      <input type="file" className="form-control radius-12 bg-neutral-50 h-44-px" accept=".pdf,.docx,image/*" required />
                    </div>
                    <div className="p-16 border radius-12 bg-neutral-50 mt-12 shadow-sm">
                      <p className="text-xs fw-bold text-warning-main mb-8 text-uppercase">Optional Documents</p>
                      <label className="text-xs mb-1">GST DOCUMENT</label>
                      <input type="file" className="form-control mb-8 bg-white radius-8" />
                      <label className="text-xs mb-1">FSSAI LICENSE</label>
                      <input type="file" className="form-control bg-white radius-8" />
                    </div>
                    <button type="submit" className="btn btn-success-600 text-white w-100 h-56-px radius-12 mt-12 fw-bold shadow-sm">Submit Documents</button>
                  </div>
                )}

                {/* SELLER STEP 4: WAITING */}
                {step === 4 && (
                  <div className="text-center p-32 bg-info-50 radius-24 border border-info-200 animate__animated animate__bounceIn">
                    <Icon icon="solar:clock-circle-bold" className="text-6xl text-info-600 mb-16" />
                    <h5 className="mb-12">Waiting for Admin Approval</h5>
                    <p className="text-sm text-secondary-light">Unga shop verify panna Admin-ku request poiduchi. Approval kidaitha piragu thaan dashboard open aagum.</p>
                    <Link to="/" className="btn btn-primary w-100 mt-24 radius-12 h-56-px d-flex align-items-center justify-content-center fw-bold">Back to Login</Link>
                  </div>
                )}
              </>
            ) : (
              /* ADMIN SIGNUP UI - Aligned */
              <div className="row gy-3 animate__animated animate__fadeIn">
                <div className="icon-field">
                  <span className='icon top-50 translate-middle-y'><Icon icon='f7:person' /></span>
                  <input type='text' className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Username' required />
                </div>
                <div className="icon-field">
                  <span className='icon top-50 translate-middle-y'><Icon icon='mage:email' /></span>
                  <input type='email' className='form-control h-56-px bg-neutral-50 radius-12 ps-48' placeholder='Email' required />
                </div>
                <div className="icon-field">
                  <span className='icon top-50 translate-middle-y'><Icon icon='solar:lock-password-outline' /></span>
                  <input type='password' class="form-control h-56-px bg-neutral-50 radius-12 ps-48" placeholder="Password" required />
                </div>
                <button type="button" onClick={() => navigate("/dashboard")} className="btn btn-primary w-100 h-56-px radius-12 mt-12 fw-bold shadow">Sign Up Admin</button>
              </div>
            )}
            
            {step < 4 && (
              <div className='mt-32 text-center text-sm'>
                <p className='mb-0 text-secondary-light'>Already have an account? <Link to='/' className='text-primary-600 fw-bold'>Sign In</Link></p>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
export default SignUpLayer;