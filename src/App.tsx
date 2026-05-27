import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Restaurants from "./pages/Restaurants";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import QRCodePage from "./pages/QrCodePage";
import RestaurantSettings from "./pages/RestaurantSettings";
import Orders from "./pages/Orders";
import PublicMenu from "./pages/PublicMenu";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      {/* Menu public — sans connexion */}
      <Route path="/menu/:slug" element={<PublicMenu />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/qrcode" element={<QRCodePage />} />
          <Route path="/settings" element={<RestaurantSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;