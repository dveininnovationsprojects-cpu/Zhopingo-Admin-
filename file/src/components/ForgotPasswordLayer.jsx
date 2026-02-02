import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const ForgotPasswordLayer = () => {
  return (
    <section className='auth bg-base d-flex flex-wrap'>
      <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
          <img src='../assets/images/auth/zhopingo-splash.jpeg' alt='Zhopingo' style={{ width: '100%', height: '100vh', objectFit: 'cover' }} />
        </div>
      </div>
      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='max-w-464-px mx-auto w-100'>
          <div>
            <Link to='/' className='mb-40 d-block'><img src='assets/images/logo.png' alt='Logo' /></Link>
            <h4 className='mb-12'>Forgot Password</h4>
            <p className='mb-32 text-secondary-light text-lg'>Enter your email to receive a reset link.</p>
          </div>
          <form action='#'>
            <div className='icon-field mb-24'>
              <span className='icon top-50 translate-middle-y'><Icon icon='mage:email' /></span>
              <input type='email' className='form-control h-56-px bg-neutral-50 radius-12' placeholder='Enter Email' required />
            </div>
            <button type='button' className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12' data-bs-toggle='modal' data-bs-target='#exampleModal'>
              Continue
            </button>
            <div className='text-center mt-24'>
              <Link to='/' className='text-primary-600 fw-bold'>Back to Sign In</Link>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <div className='modal fade' id='exampleModal' tabIndex={-1} aria-hidden='true'>
        <div className='modal-dialog modal-dialog-centered'>
          <div className='modal-content radius-16 bg-base'>
            <div className='modal-body p-40 text-center'>
              <div className='mb-32'><img src='assets/images/auth/envelop-icon.png' alt='Email Icon' /></div>
              <h6 className='mb-12'>Verify your Email</h6>
              <p className='text-secondary-light text-sm mb-0'>Check your inbox for reset instructions.</p>
              <button type='button' className='btn btn-primary w-100 radius-12 mt-32' data-bs-dismiss="modal">Skip</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default ForgotPasswordLayer;