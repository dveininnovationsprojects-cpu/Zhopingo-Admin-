import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const SignInLayer = () => {
  // Backend ippo email thaan base panniruku, so namba 'email' nu identifier vechikuvom
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const API_BASE = "http://54.157.210.26/api/v1";
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      /**
       * STEP 1: ADMIN LOGIN CHECK
       * Admin controller expects: { email, password }
       */
      try {
        const adminRes = await axios.post(`${API_BASE}/admin/login`, {
          email: loginData.email,
          password: loginData.password
        });

        if (adminRes.data.success) {
          localStorage.setItem("userToken", adminRes.data.token);
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("userData", JSON.stringify(adminRes.data.user));
          toast.success("Welcome back, Admin!");
          return navigate("/dashboard"); 
        }
      } catch (adminErr) {
        // Admin illana mattum next seller check-ku pogum
        if (adminErr.response && adminErr.response.status !== 401) {
          throw adminErr; 
        }
      }

      /**
       * STEP 2: SELLER LOGIN CHECK (Updated as per your new Backend)
       * Seller controller expects: { email, password }
       */
      const sellerRes = await axios.post(`${API_BASE}/seller/login`, {
        email: loginData.email, // Unga puthu backend logic-padi inga 'email' thaan poganum
        password: loginData.password
      });

      if (sellerRes.data.success) {
        const { token, seller } = sellerRes.data;
        
        // Admin verification check (isVerified true-ah irukanum)
        // Unga backend-la 'isVerified' check panni error message anupuriga, 
        // athu catch-laye handle aagidum. Inga additional safety check.
        
        localStorage.setItem("userToken", token);
        localStorage.setItem("userRole", "seller");
        localStorage.setItem("userData", JSON.stringify(seller));

        toast.success(`Welcome back, ${seller.name}!`);
        return navigate("/seller-dashboard"); 
      }

    } catch (err) {
      // Backend-la irunthu vara exact message-ai toast-la katrom
      const errMsg = err.response?.data?.message || "Invalid credentials or Server Error";
      toast.error(errMsg);
    }
  };

  return (
    <section className='auth bg-base d-flex flex-wrap vh-100'>
      <ToastContainer position="top-right" theme="colored" />
      
      <div className='auth-left d-lg-block d-none vh-100' style={{ flex: '0 0 50%' }}>
        <img 
          src='../assets/images/auth/zhopingo-splash.jpeg' 
          alt='Zhopingo' 
          style={{ width: '100%', height: '100vh', objectFit: 'cover' }} 
        />
      </div>

      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center vh-100' style={{ flex: '1' }}>
        <div className='max-w-464-px mx-auto w-100'>
          <div className="text-center mb-32">
            <img src='assets/images/logo.png' alt='Logo' className="mb-24" />
            <h4 className='mb-12'>Sign In to Zhopingo</h4>
            <p className="text-secondary-light">Please enter your registered email to access dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
           {/* Email Input Section */}
{/* Email Input Section */}
<div className='icon-field mb-16'>
  <span className='icon top-50 translate-middle-y' style={{ left: 0 }}><Icon icon='mage:email' /></span>
  <input 
    type='email' 
    name="email" 
    className='form-control h-56-px ps-48 radius-12' 
    placeholder='Enter Registered Email' 
    value={loginData.email}
    onChange={handleInputChange} 
    required 
  />
</div>

            <div className='icon-field mb-20 position-relative'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='solar:lock-password-outline' />
              </span>
              
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                className='form-control h-56-px ps-48 radius-12' 
                placeholder='Enter Password' 
                value={loginData.password}
                onChange={handleInputChange} 
                required 
              />

              <span 
                className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer text-secondary-light"
                onClick={() => setShowPassword(!showPassword)}
              >
                <Icon icon={showPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} className="text-xl" />
              </span>
            </div>

            <button type='submit' className='btn btn-primary h-56-px w-100 radius-12 fw-bold'>
              Sign In
            </button>
          </form>

          <div className='mt-32 text-center text-sm'>
            <p className='mb-0 text-secondary-light'>
              Don’t have a shop? 
              <Link to='/sign-up' className='text-primary-600 fw-semibold ps-1'>Sign Up as Seller</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignInLayer;