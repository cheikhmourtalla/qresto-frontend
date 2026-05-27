import { useEffect, useState } from "react";
import { 
  Store, Plus, MapPin, Phone, Mail, Lock, User, 
  Globe, Trash2, AlertCircle, Edit2, X, Eye, EyeOff 
} from "lucide-react";
import api from "../services/api";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // États pour la création
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // États pour la modification
  const [editingRestaurant, setEditingRestaurant] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  const loadRestaurants = async () => {
    try {
      setFetchError("");
      const res = await api.get("/restaurants");
      setRestaurants(res.data);
    } catch (err: any) {
      console.error("GET_RESTAURANTS_ERROR:", err);
      setFetchError(
        err.response?.data?.message || "Impossible de charger les restaurants"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/restaurants", {
        name, slug, phone, address,
        adminName, adminEmail, adminPassword,
      });
      setName(""); setSlug(""); setPhone(""); setAddress("");
      setAdminName(""); setAdminEmail(""); setAdminPassword("");
      setShowPassword(false);
      loadRestaurants();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (restaurant: any) => {
    setEditingRestaurant(restaurant);
    setEditName(restaurant.name || "");
    setEditSlug(restaurant.slug || "");
    setEditPhone(restaurant.phone || "");
    setEditAddress(restaurant.address || "");
    
    const adminAccount = restaurant.user?.find((u: any) => u.role === "RESTAURANT_ADMIN") || {};
    setEditAdminName(adminAccount.name || "");
    setEditAdminEmail(adminAccount.email || "");
    setEditAdminPassword(""); 
    setShowEditPassword(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    setLoading(true);
    try {
      await api.patch(`/restaurants/${editingRestaurant.id}`, {
        name: editName,
        slug: editSlug,
        phone: editPhone,
        address: editAddress,
        adminName: editAdminName,
        adminEmail: editAdminEmail,
        ...(editAdminPassword.trim() !== "" && { adminPassword: editAdminPassword })
      });
      setEditingRestaurant(null);
      loadRestaurants();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, restaurantName: string) => {
    if (!confirm(`Supprimer "${restaurantName}" ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/restaurants/${id}`);
      loadRestaurants();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  useEffect(() => { loadRestaurants(); }, []);

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-100 relative">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight uppercase">Gestion Réseau</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Contrôle des établissements</p>
      </header>

      <div className="grid gap-10 grid-cols-1 xl:grid-cols-3">

        {/* Formulaire de création */}
        <div className="xl:col-span-1">
          {/* Note: autoComplete="off" global aide à couper les suggestions génériques */}
          <form onSubmit={handleSubmit} autoComplete="off" className="sticky top-8 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
              <Plus className="text-amber-500" size={20} /> Nouveau Restaurant
            </h2>

            <div className="space-y-4">
              <div className="group relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50"
                  placeholder="Nom du restaurant"
                  value={name} onChange={e => setName(e.target.value)} required
                />
              </div>

              <div className="group relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50"
                  placeholder="Slug (ex: mon-resto)"
                  value={slug} onChange={e => setSlug(e.target.value)} required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-white outline-none focus:border-amber-500/50"
                  placeholder="Téléphone"
                  value={phone} onChange={e => setPhone(e.target.value)}
                />
                <input
                  className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-white outline-none focus:border-amber-500/50"
                  placeholder="Adresse"
                  value={address} onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div className="h-px bg-slate-800 my-2" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compte Administrateur</p>

              <div className="group relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50"
                  placeholder="Nom complet"
                  value={adminName} onChange={e => setAdminName(e.target.value)} required
                />
              </div>

              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50"
                  placeholder="Email" type="email"
                  autoComplete="none" // ← Bloque l'auto-remplissage de l'email
                  value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required
                />
              </div>

              {/* Champ Mot de Passe (Création) */}
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-12 text-white outline-none focus:border-amber-500/50"
                  placeholder="Mot de passe" 
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password" // ← Crucial : Dit au navigateur que c'est un nouveau mot de passe, donc pas de préremplissage
                  value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-white py-4 font-black text-black hover:bg-amber-500 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "CRÉATION EN COURS..." : "CRÉER L'ÉTABLISSEMENT"}
              </button>
            </div>
          </form>
        </div>

        {/* Liste des restaurants */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Établissements enregistrés
              {restaurants.length > 0 && (
                <span className="ml-3 rounded-lg bg-amber-500/10 px-2 py-1 text-sm text-amber-500">
                  {restaurants.length}
                </span>
              )}
            </h2>
          </div>

          {fetchError && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{fetchError}</span>
              <button onClick={loadRestaurants} className="ml-auto text-xs font-bold underline hover:text-red-300">
                Réessayer
              </button>
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="group relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 hover:bg-slate-900 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Store size={24} />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(restaurant)}
                      className="rounded-lg p-2 text-slate-600 hover:bg-amber-500/10 hover:text-amber-500 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.id, restaurant.name)}
                      className="rounded-lg p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white uppercase tracking-tight">{restaurant.name}</h3>
                <p className="text-amber-500/80 text-xs font-mono mt-1">/{restaurant.slug}</p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin size={14} className="text-slate-600 shrink-0" />
                    {restaurant.address || "Adresse non définie"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone size={14} className="text-slate-600 shrink-0" />
                    {restaurant.phone || "Non renseigné"}
                  </div>
                </div>

                {restaurant._count && (
                  <div className="mt-4 flex gap-3 pt-4 border-t border-slate-800">
                    <span className="text-xs text-slate-500">
                      <span className="font-bold text-slate-300">{restaurant._count.category}</span> catégories
                    </span>
                    <span className="text-xs text-slate-500">
                      <span className="font-bold text-slate-300">{restaurant._count.product}</span> produits
                    </span>
                    <span className="text-xs text-slate-500">
                      <span className="font-bold text-slate-300">{restaurant._count.user}</span> utilisateurs
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODALE D'ÉDITION DE L'ÉTABLISSEMENT */}
      {editingRestaurant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            
            <button 
              onClick={() => setEditingRestaurant(null)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Edit2 className="text-amber-500" size={20} /> Modifier l'Établissement
            </h3>

            <form onSubmit={handleUpdate} autoComplete="off" className="space-y-4">
              <div className="group relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 text-sm"
                  placeholder="Nom du restaurant"
                  value={editName} onChange={e => setEditName(e.target.value)} required
                />
              </div>

              <div className="group relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 text-sm"
                  placeholder="Slug (ex: mon-resto)"
                  value={editSlug} onChange={e => setEditSlug(e.target.value)} required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-white outline-none focus:border-amber-500/50 text-sm"
                  placeholder="Téléphone"
                  value={editPhone} onChange={e => setEditPhone(e.target.value)}
                />
                <input
                  className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-white outline-none focus:border-amber-500/50 text-sm"
                  placeholder="Adresse"
                  value={editAddress} onChange={e => setEditAddress(e.target.value)}
                />
              </div>

              <div className="h-px bg-slate-800 my-2" />
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Identifiants Administrateur</p>

              <div className="group relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 text-sm"
                  placeholder="Nom complet"
                  value={editAdminName} onChange={e => setEditAdminName(e.target.value)} required
                />
              </div>

              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 text-sm"
                  placeholder="Email" type="email"
                  autoComplete="none"
                  value={editAdminEmail} onChange={e => setEditAdminEmail(e.target.value)} required
                />
              </div>

              {/* Champ Mot de Passe (Modification) */}
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-12 pr-12 text-white outline-none focus:border-amber-500/50 text-sm"
                  placeholder="Nouveau mot de passe (laisser vide si inchangé)" 
                  type={showEditPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={editAdminPassword} onChange={e => setEditAdminPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setEditingRestaurant(null)}
                  className="flex-1 rounded-xl bg-slate-800 py-3 font-bold text-white hover:bg-slate-700 transition-all text-sm"
                >
                  ANNULER
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 rounded-xl bg-amber-500 py-3 font-black text-black hover:bg-amber-600 transition-all text-sm disabled:opacity-50"
                >
                  {loading ? "ENREGISTREMENT..." : "SAUVEGARDER"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}