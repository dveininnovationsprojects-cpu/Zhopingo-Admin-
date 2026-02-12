import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 🌟 Trim panni check pannurom, appo thaan empty space irundhaalum kulla vidaadhu
  const token = localStorage.getItem("userToken")?.trim();

  // Token illana direct-ah Sign-in page-ku thiruppi vidum
  if (!token || token === "" || token === "undefined") {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;