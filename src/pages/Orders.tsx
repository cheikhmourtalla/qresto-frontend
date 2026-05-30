import { useEffect, useState } from "react";
import { ChefHat, Clock, CheckCircle, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import api from "../services/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: "En attente",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20",      icon: Clock },
  IN_PROGRESS: { label: "En préparation", color: "text-blue-400 bg-blue-400/10 border-blue-400/20",         icon: ChefHat },
  SERVED:      { label: "Servie",         color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING:     "IN_PROGRESS",
  IN_PROGRESS: "SERVED",
  SERVED:      "SERVED",
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  const loadOrders = async () => {
    try {
      setError("");
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Impossible de charger les commandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      loadOrders();
    } catch {
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm("Supprimer cette commande ?")) return;
    try {
      await api.delete(`/orders/${orderId}`);
      loadOrders();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const filteredOrders = filter === "ALL"
    ? orders
    : orders.filter(o => o.status === filter);

  const counts = {
    ALL:         orders.length,
    PENDING:     orders.filter(o => o.status === "PENDING").length,
    IN_PROGRESS: orders.filter(o => o.status === "IN_PROGRESS").length,
    SERVED:      orders.filter(o => o.status === "SERVED").length,
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-100">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Commandes</h1>
          <p className="text-slate-500 uppercase text-xs tracking-widest mt-1">
            Temps réel — rafraîchissement auto toutes les 20s
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={16} /> Actualiser
        </button>
      </header>

      {/* Filtres */}
      <div className="mb-8 flex flex-wrap gap-3">
        {[
          { key: "ALL",         label: "Toutes" },
          { key: "PENDING",     label: "En attente" },
          { key: "IN_PROGRESS", label: "En préparation" },
          { key: "SERVED",      label: "Servies" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              filter === f.key
                ? "bg-amber-500 text-black"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
            <span className={`rounded-lg px-2 py-0.5 text-xs ${filter === f.key ? "bg-black/20" : "bg-slate-800"}`}>
              {counts[f.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
          <button onClick={loadOrders} className="ml-auto text-xs font-bold underline">Réessayer</button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Grille des commandes */}
      {!loading && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = config.icon;
            const nextStatus = NEXT_STATUS[order.status];
            const orderTotal = order.items.reduce(
              (sum: number, item: any) => sum + item.price * item.quantity, 0
            );

            return (
              <div
                key={order.id}
                className={`rounded-3xl bg-slate-900/50 border p-5 transition-all ${
                  order.status === "PENDING"
                    ? "border-amber-500/30"
                    : "border-slate-800"
                }`}
              >
                {/* Header commande */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-2xl font-black text-white">
                      {order.tableNumber}
                    </div>
                    <div>
                      <p className="font-black text-white">Table {order.tableNumber}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Badge statut */}
                <div className={`mb-4 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${config.color}`}>
                  <StatusIcon size={14} />
                  {config.label}
                </div>

                {/* Items commandés */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-800/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 text-xs font-black">
                          {item.quantity}
                        </span>
                        <span className="text-sm text-slate-300">{item.product.name}</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {(item.price * item.quantity).toLocaleString()} F
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3 mb-4">
                  <span className="text-sm text-slate-400 font-bold">Total</span>
                  <span className="font-black text-white">{orderTotal.toLocaleString()} FCFA</span>
                </div>

                {/* Bouton action */}
                {order.status !== "SERVED" ? (
                  <button
                    onClick={() => handleStatusUpdate(order.id, nextStatus)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold transition-colors ${
                      order.status === "PENDING"
                        ? "bg-blue-500 text-white hover:bg-blue-400"
                        : "bg-emerald-500 text-white hover:bg-emerald-400"
                    }`}
                  >
                    {order.status === "PENDING" ? (
                      <><ChefHat size={18} /> Démarrer la préparation</>
                    ) : (
                      <><CheckCircle size={18} /> Marquer comme servie</>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm text-slate-500 font-bold">
                    <CheckCircle size={16} className="text-emerald-500" /> Commande complète
                  </div>
                )}
              </div>
            );
          })}

          {filteredOrders.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-800 text-slate-600">
              <ChefHat size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Aucune commande</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}