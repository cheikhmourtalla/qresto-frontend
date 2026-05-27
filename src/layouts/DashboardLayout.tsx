import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Tags, Utensils, LogOut,
  QrCode, Store, Settings, User, Menu, ShoppingBag,
} from "lucide-react";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("qresto_token");
    localStorage.removeItem("qresto_user");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { to: "/restaurants",label: "Restaurants",icon: Store, adminOnly: true },
    { to: "/categories", label: "Catégories", icon: Tags },
    { to: "/products",   label: "Produits",   icon: Utensils },
    { to: "/orders",     label: "Commandes",  icon: ShoppingBag },
    { to: "/qrcode",     label: "QR Code",    icon: QrCode },
    { to: "/settings",   label: "Paramètres", icon: Settings },
  ];

  const SidebarContent = () => (
    <>
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
          <span className="text-xl font-black text-white">Q</span>
        </div>
        <h1 className="text-xl font-black tracking-tighter text-white uppercase">
          QResto <span className="text-amber-500">SN</span>
        </h1>
      </div>

      <div className="mb-8 rounded-2xl bg-slate-800/40 p-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <User size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-white">{user.name || "Administrateur"}</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{user.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          if (item.adminOnly && user.role !== "SUPER_ADMIN") return null;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
      >
        <LogOut size={20} /> Déconnexion
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-72 flex-col border-r border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl lg:flex z-50">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-900 p-6" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-72 transition-all">
        {/* Topbar Mobile */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 p-4 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-black font-black">Q</div>
            <span className="font-black text-white uppercase tracking-tighter">QResto SN</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
        <div className="h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}