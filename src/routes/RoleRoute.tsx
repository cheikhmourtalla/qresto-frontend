import { Navigate, Outlet } from "react-router-dom";

type RoleRouteProps = {
  allowedRoles: string[];
};

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}