import { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  Package,
  QrCode,
  Store,
  BellRing,
  ChefHat,
  Receipt,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";

interface WaiterCall {
  id: number;
  tableNumber: string;
  type: "WAITER" | "BILL";
  createdAt: string;
}

export default function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("qresto_user") || "{}"
  );

  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    restaurants: 0,
  });

  const [restaurantLogo, setRestaurantLogo] =
    useState<string>("");

  const [restaurantId, setRestaurantId] =
    useState<number | null>(null);

  const [waiterCalls, setWaiterCalls] =
    useState<WaiterCall[]>([]);

  const [loadingCalls, setLoadingCalls] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [lastCallId, setLastCallId] =
    useState<number | null>(null);

  // DASHBOARD DATA
  const loadDashboardData = async () => {
    let categoriesCount = 0;
    let productsCount = 0;
    let restCount = 0;

    // RESTAURANT ADMIN / EMPLOYEE
    if (
      user.role === "RESTAURANT_ADMIN" ||
      user.role === "EMPLOYEE"
    ) {
      try {
        const [cat, prod, res] =
          await Promise.all([
            api.get("/categories"),
            api.get("/products"),
            api.get("/restaurants/me"),
          ]);

        categoriesCount = Array.isArray(
          cat.data
        )
          ? cat.data.length
          : cat.data.categories?.length ||
            0;

        productsCount = Array.isArray(
          prod.data
        )
          ? prod.data.length
          : prod.data.products?.length ||
            0;

        if (res.data) {
          if (res.data.logo) {
            setRestaurantLogo(
              res.data.logo
            );
          }

          if (res.data.id) {
            setRestaurantId(
              res.data.id
            );
          }
        }
      } catch (e) {
        console.error(
          "Erreur lors du chargement des données du restaurant :",
          e
        );
      }
    }

    // SUPER ADMIN
    if (
      user.role === "SUPER_ADMIN"
    ) {
      try {
        const rest =
          await api.get(
            "/restaurants"
          );

        if (
          Array.isArray(rest.data)
        ) {
          restCount =
            rest.data.length;
        } else if (
          rest.data &&
          Array.isArray(
            rest.data.restaurants
          )
        ) {
          restCount =
            rest.data
              .restaurants.length;
        }
      } catch (e) {
        console.error(
          "Erreur lors du chargement des restaurants :",
          e
        );
      }
    }

    setStats({
      categories:
        categoriesCount,
      products: productsCount,
      restaurants: restCount,
    });
  };

  // LOAD WAITER CALLS
  const loadWaiterCalls =
    async () => {
      if (!restaurantId)
        return;

      try {
        setLoadingCalls(true);

        const res =
          await api.get(
            `/waiter-call/${restaurantId}`
          );

        const calls =
          Array.isArray(
            res.data
          )
            ? res.data
            : [];

        // NOTIFICATION SONORE
        if (
          lastCallId !== null &&
          calls.length > 0 &&
          calls[0].id !==
            lastCallId
        ) {
          const audio =
            new Audio(
              "/sounds/notification.mp3"
            );

          audio.play();
        }

        // SAUVEGARDE DU DERNIER ID
        if (
          calls.length > 0
        ) {
          setLastCallId(
            calls[0].id
          );
        }

        setWaiterCalls(
          calls
        );
      } catch (err) {
        console.error(
          "Erreur waiter calls :",
          err
        );
      } finally {
        setLoadingCalls(
          false
        );
      }
    };

  // COMPLETE CALL
  const completeCall = async (
    id: number
  ) => {
    try {
      setProcessingId(id);

      await api.patch(
        `/waiter-call/${id}/complete`
      );

      setWaiterCalls((prev) =>
        prev.filter(
          (call) =>
            call.id !== id
        )
      );
    } catch (err) {
      console.error(
        "Erreur traitement demande :",
        err
      );
    } finally {
      setProcessingId(
        null
      );
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    loadDashboardData();
  }, []);

  // AUTO REFRESH WAITER CALLS
  useEffect(() => {
    if (!restaurantId)
      return;

    loadWaiterCalls();

    const interval =
      setInterval(() => {
        loadWaiterCalls();
      }, 5000);

    return () =>
      clearInterval(interval);
  }, [
    restaurantId,
    lastCallId,
  ]);

  // STATS
  const waiterCount =
    useMemo(() => {
      return waiterCalls.filter(
        (c) =>
          c.type === "WAITER"
      ).length;
    }, [waiterCalls]);

  const billCount =
    useMemo(() => {
      return waiterCalls.filter(
        (c) =>
          c.type === "BILL"
      ).length;
    }, [waiterCalls]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] p-4 text-slate-100 md:p-8">
      {/* BACKGROUND */}
      {restaurantLogo && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${restaurantLogo})`,
            backgroundPosition:
              "center",
            backgroundSize:
              "40% 40%",
            backgroundRepeat:
              "no-repeat",
            filter: "blur(60px)",
            opacity: 0.12,
            mixBlendMode:
              "screen",
          }}
        />
      )}

      {/* CONTENT */}
      <div className="relative z-10">
        {/* HEADER */}
        <header className="mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Tableau de bord
              </h1>

              <p className="mt-2 text-sm uppercase tracking-widest text-slate-400">
                Aperçu de votre
                activité
              </p>
            </div>

            {/* LIVE STATUS */}
            {(user.role ===
              "RESTAURANT_ADMIN" ||
              user.role ===
                "EMPLOYEE") && (
              <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
                <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Service actif
                  </p>

                  <p className="text-sm text-slate-300">
                    Les appels
                    clients sont
                    surveillés en
                    direct
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label:
                "Catégories",
              val: stats.categories,
              icon: LayoutGrid,
              color:
                "text-amber-500",
              hide:
                user.role ===
                "SUPER_ADMIN",
            },

            {
              label: "Produits",
              val: stats.products,
              icon: Package,
              color:
                "text-blue-500",
              hide:
                user.role ===
                "SUPER_ADMIN",
            },

            {
              label:
                "Restaurants",
              val: stats.restaurants,
              icon: Store,
              color:
                "text-emerald-500",
              hide:
                user.role !==
                "SUPER_ADMIN",
            },

            {
              label:
                "Status Menu",
              val: "Actif",
              icon: QrCode,
              color:
                "text-purple-500",
              hide:
                user.role ===
                "SUPER_ADMIN",
            },
          ].map(
            (item, i) =>
              !item.hide && (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-amber-500/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {
                          item.label
                        }
                      </p>

                      <h2 className="mt-2 text-3xl font-bold text-white">
                        {item.val}
                      </h2>
                    </div>

                    <div
                      className={`rounded-xl border border-slate-800 bg-slate-950/80 p-3 ${item.color}`}
                    >
                      <item.icon
                        size={24}
                      />
                    </div>
                  </div>

                  <div className="absolute -bottom-2 -right-2 text-white opacity-5 transition-transform group-hover:scale-110">
                    <item.icon
                      size={80}
                    />
                  </div>
                </div>
              )
          )}
        </div>

        {/* WAITER CALLS */}
        {(user.role ===
          "RESTAURANT_ADMIN" ||
          user.role ===
            "EMPLOYEE") && (
          <div className="mt-12">
            {/* HEADER */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-3xl font-black text-white">
                  <BellRing className="text-amber-500" />

                  Assistance
                  clients
                </h2>

                <p className="mt-2 text-slate-400">
                  Demandes envoyées
                  depuis les tables
                </p>
              </div>

              {/* COUNTERS */}
              <div className="flex flex-wrap gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <ChefHat className="text-amber-500" />

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Serveur
                      </p>

                      <h3 className="text-2xl font-black text-white">
                        {
                          waiterCount
                        }
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Receipt className="text-emerald-500" />

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Additions
                      </p>

                      <h3 className="text-2xl font-black text-white">
                        {
                          billCount
                        }
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CALLS LIST */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {loadingCalls ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
                  <p className="text-slate-400">
                    Chargement des
                    demandes...
                  </p>
                </div>
              ) : waiterCalls.length ===
                0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center">
                  <BellRing
                    size={50}
                    className="mx-auto text-slate-700"
                  />

                  <h3 className="mt-5 text-xl font-black text-white">
                    Aucune demande
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Les appels
                    clients
                    apparaîtront ici
                  </p>
                </div>
              ) : (
                waiterCalls.map(
                  (
                    call,
                    index
                  ) => (
                    <div
                      key={call.id}
                      className={`group relative overflow-hidden rounded-3xl border bg-slate-900/50 p-6 backdrop-blur-xl transition-all ${
                        index === 0
                          ? "animate-pulse border-amber-500/60"
                          : "border-slate-800 hover:border-amber-500/30"
                      }`}
                    >
                      {/* TOP */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-400">
                            Table{" "}
                            {
                              call.tableNumber
                            }
                          </div>

                          <h3 className="mt-5 text-2xl font-black text-white">
                            {call.type ===
                            "WAITER"
                              ? "Appel serveur"
                              : "Demande d'addition"}
                          </h3>
                        </div>

                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                            call.type ===
                            "WAITER"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {call.type ===
                          "WAITER" ? (
                            <ChefHat
                              size={
                                28
                              }
                            />
                          ) : (
                            <Receipt
                              size={
                                28
                              }
                            />
                          )}
                        </div>
                      </div>

                      {/* DESCRIPTION */}
                      <p className="mt-4 text-slate-400">
                        {call.type ===
                        "WAITER"
                          ? "Le client demande l'assistance d'un serveur."
                          : "Le client souhaite recevoir l'addition."}
                      </p>

                      {/* FOOTER */}
                      <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                        <Clock3
                          size={16}
                        />

                        {new Date(
                          call.createdAt
                        ).toLocaleString()}
                      </div>

                      {/* BUTTON */}
                      <button
                        onClick={() =>
                          completeCall(
                            call.id
                          )
                        }
                        disabled={
                          processingId ===
                          call.id
                        }
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2
                          size={18}
                        />

                        {processingId ===
                        call.id
                          ? "Traitement..."
                          : "Marquer comme traité"}
                      </button>

                      {/* GLOW */}
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        )}

        {/* HERO */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 p-1">
          <div className="flex flex-col items-center justify-between gap-8 rounded-[calc(1.5rem-1px)] bg-[#020617]/90 p-8 backdrop-blur-md md:flex-row md:p-12">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-4xl font-black leading-tight text-white">
                {user.role ===
                "SUPER_ADMIN"
                  ? "Gestion du réseau d'établissements"
                  : "Optimisez l'expérience de vos clients."}
              </h2>

              <p className="mt-4 text-lg text-slate-400">
                {user.role ===
                "SUPER_ADMIN"
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