import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Plus, Minus, QrCode, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function QRCodePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");
  const [restaurant, setRestaurant] = useState<any>(null);
  const [error, setError] = useState("");
  const [tableCount, setTableCount] = useState(5);

  useEffect(() => {
    if (user.role === "SUPER_ADMIN") return;
    api.get("/restaurants/me")
      .then(res => setRestaurant(res.data))
      .catch(err => setError(err.response?.data?.message || "Erreur de chargement"));
  }, []);

  const downloadQrCode = (tableNumber: number) => {
    const canvas = document.getElementById(`qr-table-${tableNumber}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR_${restaurant.name}_Table_${tableNumber}.png`;
    link.click();
  };

  const downloadAll = () => {
    for (let i = 1; i <= tableCount; i++) {
      setTimeout(() => downloadQrCode(i), i * 300);
    }
  };

  // Garde SUPER_ADMIN
  if (user.role === "SUPER_ADMIN") return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-center p-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        <ShieldAlert size={40} />
      </div>
      <h1 className="text-3xl font-black text-white">Fonctionnalité non applicable</h1>
      <p className="mt-4 text-slate-400 max-w-sm">
        Le QR Code est généré par restaurant. Connectez-vous avec un compte{" "}
        <span className="text-amber-500 font-bold">RESTAURANT_ADMIN</span>.
      </p>
      <button
        onClick={() => navigate("/restaurants")}
        className="mt-8 rounded-2xl bg-white px-8 py-4 font-black text-black hover:bg-amber-500 transition-all"
      >
        Voir les restaurants
      </button>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-2xl font-black text-white">Erreur de chargement</h1>
      <p className="mt-4 text-slate-400">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white hover:bg-slate-700">
        Réessayer
      </button>
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Chargement...</p>
    </div>
  );

  const baseUrl = `${window.location.origin}/menu/${restaurant.slug}`;

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-100">
      <header className="mb-10">
        <div className="h-1 w-16 rounded-full bg-amber-500 mb-6" />
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">QR Codes Tables</h1>
        <p className="mt-2 text-slate-500 uppercase tracking-widest text-xs">
          {restaurant.name} — un QR Code par table
        </p>
      </header>

      {/* Contrôle nombre de tables */}
      <div className="mb-10 inline-flex items-center gap-6 rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nombre de tables</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTableCount(Math.max(1, tableCount - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            <Minus size={18} />
          </button>
          <span className="w-12 text-center text-3xl font-black text-white">{tableCount}</span>
          <button
            onClick={() => setTableCount(Math.min(50, tableCount + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        <button
          onClick={downloadAll}
          className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-black hover:bg-amber-500 transition-all"
        >
          <Download size={18} /> Tout télécharger
        </button>
      </div>

      {/* Grille des QR Codes */}
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: tableCount }, (_, i) => i + 1).map(tableNumber => {
          const tableUrl = `${baseUrl}?table=${tableNumber}`;
          return (
            <div
              key={tableNumber}
              className="group flex flex-col items-center rounded-3xl bg-slate-900 border border-slate-800 p-5 hover:border-amber-500/40 transition-all"
            >
              {/* Label table */}
              <div className="mb-4 flex items-center gap-2 text-amber-500">
                <QrCode size={16} />
                <span className="text-sm font-black uppercase tracking-widest">Table {tableNumber}</span>
              </div>

              {/* QR Code */}
              <div className="rounded-2xl bg-white p-3 shadow-lg">
                <QRCodeCanvas
                  id={`qr-table-${tableNumber}`}
                  value={tableUrl}
                  size={140}
                  level="H"
                  includeMargin={false}
                  fgColor="#020617"
                />
              </div>

              {/* URL */}
              <p className="mt-3 text-[10px] text-slate-600 font-mono text-center break-all line-clamp-2">
                {tableUrl}
              </p>

              {/* Bouton télécharger */}
              <button
                onClick={() => downloadQrCode(tableNumber)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-amber-500 hover:text-black transition-all"
              >
                <Download size={14} /> Télécharger
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}