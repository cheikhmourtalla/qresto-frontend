import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@qresto.sn");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);

    const res = await api.post("/auth/login", { email, password });

    const token = res.data.qresto_token;
    const userData = res.data.user;

    if (!token) {
      alert("Erreur : token manquant dans la réponse du serveur");
      return;
    }

    localStorage.setItem("qresto_token", token);
    localStorage.setItem("qresto_user", JSON.stringify(userData));

    navigate("/dashboard");

  } catch (err: any) {
    console.error("Erreur de connexion:", err);
    alert(err.response?.data?.message || "Accès refusé : Identifiants incorrects");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#020617] px-4 overflow-hidden">
      {/* Effets de lumière en arrière-plan */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-10 text-center">
          {/* Logo Q Orange */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/20 rotate-3">
             <span className="text-3xl font-black text-white -rotate-3">Q</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">QResto Sénégal</h1>
          <p className="mt-2 text-slate-500 font-medium">Administration & Gestion de Carte</p>
        </div>

        <div className="rounded-[2.5rem] bg-slate-900/50 border border-slate-800 p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email professionnel</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 py-4 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700"
                  placeholder="admin@qresto.sn"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 py-4 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 transition-all"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-3 rounded-2xl bg-white py-4 font-black text-black hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
            >
              {loading ? "VÉRIFICATION..." : "SE CONNECTER"}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-slate-600">
          Propulsé par <span className="text-slate-400 font-bold">QResto Sénégal</span>
        </p>
      </div>
    </div>
  );
}