import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 🌟 Har-coded data-ku badhila current storage-ah check pannurom
  const token = localStorage.getItem("userToken")?.trim();
  const userDataRaw = localStorage.getItem("userData");
  const userData = userDataRaw ? JSON.parse(userDataRaw) : {};

  // 1. Token illana sign-in page
  if (!token || token === "" || token === "undefined") {
    return <Navigate to="/sign-in" replace />;
  }

  // 2. Token irundha kulla vidaalam
  return <Outlet />;
};

export default ProtectedRoute;