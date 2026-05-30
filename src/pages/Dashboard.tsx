import { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid, Package, QrCode, Store,
  TrendingUp, Receipt, Users, ChefHat,
} from "lucide-react";
import api from "../services/api";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");

  const [stats, setStats] = useState({ categories: 0, products: 0, restaurants: 0 });
  const [restaurantLogo, setRestaurantLogo] = useState<string>("");
  const [servedOrders, setServedOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ── DASHBOARD DATA ──
  const loadDashboardData = async () => {
    let categoriesCount = 0;
    let productsCount = 0;
    let restCount = 0;

    if (user.role === "RESTAURANT_ADMIN" || user.role === "EMPLOYEE") {
      try {
        const [cat, prod, res] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
          api.get("/restaurants/me"),
        ]);
        categoriesCount = Array.isArray(cat.data) ? cat.data.length : 0;
        productsCount = Array.isArray(prod.data) ? prod.data.length : 0;
        if (res.data?.logo) setRestaurantLogo(res.data.logo);
      } catch (e) {
        console.error("Erreur chargement dashboard:", e);
      }
    }

    if (user.role === "SUPER_ADMIN") {
      try {
        const rest = await api.get("/restaurants");
        restCount = Array.isArray(rest.data) ? rest.data.length : 0;
      } catch (e) {
        console.error("Erreur chargement restaurants:", e);
      }
    }

    setStats({ categories: categoriesCount, products: productsCount, restaurants: restCount });
  };

  // ── LOAD SERVED ORDERS ──
  const loadServedOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.get("/orders");
      const allOrders = Array.isArray(res.data) ? res.data : [];

      // Filtre uniquement les commandes SERVED du jour
      const today = new Date().toDateString();
      const todayServed = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt).toDateString();
        return o.status === "SERVED" && orderDate === today;
      });

      setServedOrders(todayServed);
    } catch (e) {
      console.error("Erreur chargement commandes:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (user.role === "RESTAURANT_ADMIN" || user.role === "EMPLOYEE") {
      loadServedOrders();
      const interval = setInterval(loadServedOrders, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // ── CALCULS CAISSE ──
  const totalRecettes = useMemo(() => {
    return servedOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce(
        (s: number, item: any) => s + item.price * item.quantity, 0
      );
      return sum + orderTotal;
    }, 0);
  }, [servedOrders]);

  const totalPlats = useMemo(() => {
    return servedOrders.reduce((sum, order) => {
      return sum + order.items.reduce((s: number, item: any) => s + item.quantity, 0);
    }, 0);
  }, [servedOrders]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] p-4 text-slate-100 md:p-8">

      {/* BACKGROUND LOGO */}
      {restaurantLogo && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${restaurantLogo})`,
            backgroundPosition: "center",
            backgroundSize: "40% 40%",
            backgroundRepeat: "no-repeat",
            filter: "blur(60px)",
            opacity: 0.12,
            mixBlendMode: "screen",
          }}
        />
      )}

      <div className="relative z-10">

        {/* HEADER */}
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white">Tableau de bord</h1>
          <p className="mt-2 text-sm uppercase tracking-widest text-slate-400">Aperçu de votre activité</p>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Catégories",    val: stats.categories,  icon: LayoutGrid, color: "text-amber-500",  hide: user.role === "SUPER_ADMIN" },
            { label: "Produits",      val: stats.products,    icon: Package,    color: "text-blue-500",   hide: user.role === "SUPER_ADMIN" },
            { label: "Restaurants",   val: stats.restaurants, icon: Store,      color: "text-emerald-500",hide: user.role !== "SUPER_ADMIN" },
            { label: "Menu de statut",val: "Actif",           icon: QrCode,     color: "text-purple-500", hide: user.role === "SUPER_ADMIN" },
          ].map((item, i) =>
            !item.hide && (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-amber-500/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                    <h2 className="mt-2 text-3xl font-bold text-white">{item.val}</h2>
                  </div>
                  <div className={`rounded-xl border border-slate-800 bg-slate-950/80 p-3 ${item.color}`}>
                    <item.icon size={24} />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 text-white opacity-5 transition-transform group-hover:scale-110">
                  <item.icon size={80} />
                </div>
              </div>
            )
          )}
        </div>

        {/* CAISSE DU JOUR */}
        {(user.role === "RESTAURANT_ADMIN" || user.role === "EMPLOYEE") && (
          <div className="mt-12">

            {/* HEADER CAISSE */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-3xl font-black text-white">
                  <TrendingUp className="text-amber-500" />
                  Caisse du jour
                </h2>
                <p className="mt-2 text-slate-400">
                  {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={loadServedOrders}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Actualiser
              </button>
            </div>

            {/* RÉSUMÉ */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="text-emerald-400" size={20} />
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Recettes totales</p>
                </div>
                <h3 className="text-3xl font-black text-white">{totalRecettes.toLocaleString()} <span className="text-lg text-slate-400">FCFA</span></h3>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Receipt className="text-amber-400" size={20} />
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Commandes servies</p>
                </div>
                <h3 className="text-3xl font-black text-white">{servedOrders.length}</h3>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <ChefHat className="text-blue-400" size={20} />
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Plats servis</p>
                </div>
                <h3 className="text-3xl font-black text-white">{totalPlats}</h3>
              </div>
            </div>

            {/* DÉTAIL PAR COMMANDE */}
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              </div>
            ) : servedOrders.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-800 p-12 text-center">
                <TrendingUp size={48} className="mx-auto text-slate-700 mb-4" />
                <h3 className="text-xl font-black text-white">Aucune vente aujourd'hui</h3>
                <p className="mt-2 text-slate-500">Les commandes servies apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
                {/* EN-TÊTE TABLEAU */}
                <div className="grid grid-cols-4 gap-4 border-b border-slate-800 px-6 py-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Table</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Plats</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Heure</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Total</span>
                </div>

                {/* LIGNES */}
                <div className="divide-y divide-slate-800/50">
                  {servedOrders.map((order) => {
                    const orderTotal = order.items.reduce(
                      (s: number, item: any) => s + item.price * item.quantity, 0
                    );
                    const orderPlats = order.items.reduce(
                      (s: number, item: any) => s + item.quantity, 0
                    );
                    return (
                      <div key={order.id} className="grid grid-cols-4 gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-black text-sm">
                            {order.tableNumber}
                          </div>
                          <span className="text-sm font-bold text-white">Table {order.tableNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-500" />
                          <span className="text-sm text-slate-300">{orderPlats} plat{orderPlats > 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="font-black text-emerald-400">{orderTotal.toLocaleString()} F</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TOTAL FINAL */}
                <div className="grid grid-cols-4 gap-4 border-t border-slate-700 bg-slate-800/50 px-6 py-5">
                  <span className="col-span-3 font-black text-white uppercase tracking-wider text-sm">Total du jour</span>
                  <span className="text-right text-xl font-black text-emerald-400">{totalRecettes.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HERO */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 p-1">
          <div className="flex flex-col items-center justify-between gap-8 rounded-[calc(1.5rem-1px)] bg-[#020617]/90 p-8 backdrop-blur-md md:flex-row md:p-12">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-4xl font-black leading-tight text-white">
                {user.role === "SUPER_ADMIN"
                  ? "Gestion du réseau d'établissements"
                  : "Optimisez l'expérience de vos clients."}
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                {user.role === "SUPER_ADMIN"
                  ? "Suivez les performances globales et gérez l'ensemble des restaurants."
                  : "Recevez les commandes, les appels serveur et les demandes d'addition directement depuis les tables."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}