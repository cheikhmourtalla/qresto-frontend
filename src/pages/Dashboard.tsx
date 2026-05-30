import { useEffect, useMemo, useState } from "react";

const ORDERS_PER_PAGE = 5;
import {
  LayoutGrid, Package, QrCode, Store,
  TrendingUp, Receipt, Users, ChefHat,
  ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp,
} from "lucide-react";
import api from "../services/api";

// ── Heure de clôture : 6h du matin ──
const CLOSING_HOUR = 6;

/**
 * Retourne la "journée business" d'une date.
 * Toute commande avant 6h du matin appartient à la veille.
 */
const getBusinessDay = (date: Date): string => {
  const d = new Date(date);
  if (d.getHours() < CLOSING_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  // Retourne YYYY-MM-DD
  return d.toISOString().split("T")[0];
};

/**
 * Retourne la journée business d'aujourd'hui
 */
const getTodayBusinessDay = (): string => {
  return getBusinessDay(new Date());
};

/**
 * Formate une date YYYY-MM-DD en texte lisible
 */
const formatBusinessDay = (dateStr: string): string => {
  const date = new Date(dateStr + "T12:00:00");
  const today = getTodayBusinessDay();
  const yesterday = getBusinessDay(new Date(Date.now() - 86400000));

  if (dateStr === today) return "Aujourd'hui";
  if (dateStr === yesterday) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Navigue d'un jour (±1)
 */
const shiftDay = (dateStr: string, delta: number): string => {
  const date = new Date(dateStr + "T12:00:00");
  date.setDate(date.getDate() + delta);
  return date.toISOString().split("T")[0];
};

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");

  const [stats, setStats] = useState({ categories: 0, products: 0, restaurants: 0 });
  const [restaurantLogo, setRestaurantLogo] = useState<string>("");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(getTodayBusinessDay());
  const [visibleCount, setVisibleCount] = useState<number>(ORDERS_PER_PAGE);

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

  // ── LOAD ALL SERVED ORDERS ──
  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.get("/orders");
      const orders = Array.isArray(res.data) ? res.data : [];
      // Garde uniquement les commandes SERVED
      setAllOrders(orders.filter((o: any) => o.status === "SERVED"));
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
      loadOrders();
      const interval = setInterval(loadOrders, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // ── COMMANDES DU JOUR SÉLECTIONNÉ ──
  // Reset pagination when day changes
  useEffect(() => { setVisibleCount(ORDERS_PER_PAGE); }, [selectedDay]);

  // ── COMMANDES DU JOUR SÉLECTIONNÉ ──
  const dayOrders = useMemo(() => {
    return allOrders.filter(
      (o: any) => getBusinessDay(new Date(o.createdAt)) === selectedDay
    );
  }, [allOrders, selectedDay]);

  // ── STATS DU JOUR ──
  const totalRecettes = useMemo(() =>
    dayOrders.reduce((sum, order) =>
      sum + order.items.reduce((s: number, item: any) => s + item.price * item.quantity, 0), 0
    ), [dayOrders]);

  const totalPlats = useMemo(() =>
    dayOrders.reduce((sum, order) =>
      sum + order.items.reduce((s: number, item: any) => s + item.quantity, 0), 0
    ), [dayOrders]);

  // ── HISTORIQUE : jours distincts avec ventes ──
  const businessDays = useMemo(() => {
    const days = new Set(
      allOrders.map((o: any) => getBusinessDay(new Date(o.createdAt)))
    );
    return Array.from(days).sort((a, b) => b.localeCompare(a)); // Plus récent en premier
  }, [allOrders]);

  const isToday = selectedDay === getTodayBusinessDay();

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

        {/* CAISSE */}
        {(user.role === "RESTAURANT_ADMIN" || user.role === "EMPLOYEE") && (
          <div className="mt-12">

            {/* HEADER CAISSE */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-3xl font-black text-white">
                  <TrendingUp className="text-amber-500" />
                  Caisse
                </h2>
                <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest">
                  Clôture journalière à 6h00 du matin
                </p>
              </div>
              <button
                onClick={loadOrders}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Actualiser
              </button>
            </div>

            {/* NAVIGATION PAR JOUR */}
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <button
                onClick={() => setSelectedDay(shiftDay(selectedDay, -1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-white font-black text-lg capitalize">
                  <Calendar size={18} className="text-amber-500" />
                  {formatBusinessDay(selectedDay)}
                </div>
                {!isToday && (
                  <button
                    onClick={() => setSelectedDay(getTodayBusinessDay())}
                    className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    Revenir à aujourd'hui
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedDay(shiftDay(selectedDay, 1))}
                disabled={isToday}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* RÉSUMÉ */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="text-emerald-400" size={20} />
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Recettes</p>
                </div>
                <h3 className="text-3xl font-black text-white">
                  {totalRecettes.toLocaleString()} <span className="text-lg text-slate-400">FCFA</span>
                </h3>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Receipt className="text-amber-400" size={20} />
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Commandes</p>
                </div>
                <h3 className="text-3xl font-black text-white">{dayOrders.length}</h3>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <ChefHat className="text-blue-400" size={20} />
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Plats servis</p>
                </div>
                <h3 className="text-3xl font-black text-white">{totalPlats}</h3>
              </div>
            </div>

            {/* TABLEAU COMMANDES */}
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              </div>
            ) : dayOrders.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-800 p-12 text-center">
                <TrendingUp size={48} className="mx-auto text-slate-700 mb-4" />
                <h3 className="text-xl font-black text-white">Aucune vente ce jour</h3>
                <p className="mt-2 text-slate-500">Navigue vers un autre jour ou attend les premières commandes</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
                <div className="grid grid-cols-4 gap-4 border-b border-slate-800 px-6 py-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Table</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Plats</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Heure</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Total</span>
                </div>

                <div className="divide-y divide-slate-800/50">
                  {dayOrders.slice(0, visibleCount).map((order) => {
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

                {/* VOIR PLUS / VOIR MOINS */}
                {dayOrders.length > ORDERS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-4 border-t border-slate-800 px-6 py-4 bg-slate-900/30">
                    <span className="text-xs text-slate-500">
                      {Math.min(visibleCount, dayOrders.length)} / {dayOrders.length} commandes
                    </span>
                    {visibleCount < dayOrders.length ? (
                      <button
                        onClick={() => setVisibleCount(v => v + ORDERS_PER_PAGE)}
                        className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <ChevronDown size={16} /> Voir plus
                      </button>
                    ) : (
                      <button
                        onClick={() => setVisibleCount(ORDERS_PER_PAGE)}
                        className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <ChevronUp size={16} /> Voir moins
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4 border-t border-slate-700 bg-slate-800/50 px-6 py-5">
                  <span className="col-span-3 font-black text-white uppercase tracking-wider text-sm">Total du jour</span>
                  <span className="text-right text-xl font-black text-emerald-400">{totalRecettes.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}

            {/* HISTORIQUE — jours avec ventes */}
            {businessDays.length > 1 && (
              <div className="mt-10">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
                  <Calendar size={18} className="text-amber-500" />
                  Historique
                </h3>
                <div className="space-y-3">
                  {businessDays.map((day) => {
                    const dayTotal = allOrders
                      .filter((o: any) => getBusinessDay(new Date(o.createdAt)) === day)
                      .reduce((sum, order) =>
                        sum + order.items.reduce((s: number, item: any) => s + item.price * item.quantity, 0), 0
                      );
                    const dayCount = allOrders.filter(
                      (o: any) => getBusinessDay(new Date(o.createdAt)) === day
                    ).length;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`w-full flex items-center justify-between rounded-2xl border px-5 py-4 transition-all ${
                          selectedDay === day
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            selectedDay === day ? "bg-amber-500 text-black" : "bg-slate-800 text-slate-400"
                          }`}>
                            <Calendar size={16} />
                          </div>
                          <div className="text-left">
                            <p className={`font-bold capitalize ${selectedDay === day ? "text-amber-400" : "text-white"}`}>
                              {formatBusinessDay(day)}
                            </p>
                            <p className="text-xs text-slate-500">{dayCount} commande{dayCount > 1 ? "s" : ""} servie{dayCount > 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <span className={`font-black text-lg ${selectedDay === day ? "text-amber-400" : "text-emerald-400"}`}>
                          {dayTotal.toLocaleString()} FCFA
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

       

      </div>
    </div>
  );
}