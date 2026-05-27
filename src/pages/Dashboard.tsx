import { useEffect, useState } from "react";
import { LayoutGrid, Package, QrCode, Store } from "lucide-react";
import api from "../services/api";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");
  const [stats, setStats] = useState({ categories: 0, products: 0, restaurants: 0 });
  const [restaurantLogo, setRestaurantLogo] = useState<string>("");

  const loadDashboardData = async () => {
    let categoriesCount = 0;
    let productsCount = 0;
    let restCount = 0;

    // 1. Si l'utilisateur est un ADMIN de restaurant ou EMPLOYÉ, on charge ses produits/catégories et son logo
    if (user.role === "RESTAURANT_ADMIN" || user.role === "EMPLOYEE") {
      try {
        const [cat, prod, res] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
          api.get("/restaurants/me")
        ]);

        categoriesCount = Array.isArray(cat.data) ? cat.data.length : (cat.data.categories?.length || 0);
        productsCount = Array.isArray(prod.data) ? prod.data.length : (prod.data.products?.length || 0);
        
        if (res.data && res.data.logo) {
          setRestaurantLogo(res.data.logo);
        }
      } catch (e) {
        console.error("Erreur lors du chargement des données du restaurant :", e);
      }
    }

    // 2. Si l'utilisateur est SUPER_ADMIN, on charge uniquement la liste globale des restaurants
    if (user.role === "SUPER_ADMIN") {
      try {
        const rest = await api.get("/restaurants");
        if (Array.isArray(rest.data)) {
          restCount = rest.data.length;
        } else if (rest.data && Array.isArray(rest.data.restaurants)) {
          restCount = rest.data.restaurants.length;
        }
      } catch (e) {
        console.error("Erreur lors du chargement des restaurants (Super Admin) :", e);
      }
    }

    // 3. Mise à jour unique de l'état des statistiques
    setStats({
      categories: categoriesCount,
      products: productsCount,
      restaurants: restCount
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-100 relative overflow-hidden">
      
      {/* ARRIÈRE-PLAN FLOU (Uniquement si un logo est présent) */}
      {restaurantLogo && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${restaurantLogo})`,
            backgroundPosition: "center",
            backgroundSize: "40% 40%",
            backgroundRepeat: "no-repeat",
            filter: "blur(60px)",
            opacity: 0.12,
            mixBlendMode: "screen"
          }}
        />
      )}

      {/* CONTENU PRINCIPAL */}
      <div className="relative z-10 w-full h-full">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white">Tableau de bord</h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest">Aperçu de votre activité</p>
        </header>

        {/* Grille des statistiques */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Catégories", val: stats.categories, icon: LayoutGrid, color: "text-amber-500", hide: user.role === "SUPER_ADMIN" },
            { label: "Produits", val: stats.products, icon: Package, color: "text-blue-500", hide: user.role === "SUPER_ADMIN" },
            { label: "Restaurants", val: stats.restaurants, icon: Store, color: "text-emerald-500", hide: user.role !== "SUPER_ADMIN" },
            { label: "Status Menu", val: "Actif", icon: QrCode, color: "text-purple-500", hide: user.role === "SUPER_ADMIN" }
          ].map((item, i) => !item.hide && (
            <div 
              key={i} 
              className="group relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 backdrop-blur-xl transition-all hover:border-amber-500/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">{item.label}</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">{item.val}</h2>
                </div>
                <div className={`rounded-xl bg-slate-950/80 p-3 border border-slate-800 ${item.color}`}>
                  <item.icon size={24} />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 opacity-5 text-white transition-transform group-hover:scale-110">
                <item.icon size={80} />
              </div>
            </div>
          ))}
        </div>

        {/* Bannière d'accueil */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 p-1">
          <div className="rounded-[calc(1.5rem-1px)] bg-[#020617]/90 backdrop-blur-md p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-4xl font-black text-white leading-tight">
                {user.role === "SUPER_ADMIN" ? "Gestion du réseau d'établissements" : "Optimisez l'expérience de vos clients."}
              </h2>
              <p className="mt-4 text-slate-400 text-lg">
                {user.role === "SUPER_ADMIN" 
                  ? "Suivez les performances globales, ajoutez de nouveaux restaurants et contrôlez l'accès au réseau."
                  : "Gérez vos menus en temps réel et offrez une navigation fluide, rapide et élégante sur toutes les tables."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}