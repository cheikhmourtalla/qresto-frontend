import { useEffect, useState } from "react";
import { LayoutGrid, Plus, Trash2, Tag, Edit3, X, Save } from "lucide-react";
import api from "../services/api";

export default function Categories() {
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
    }
  };

  const handleEditClick = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        // Modification
        await api.put(`/categories/${editingId}`, { name });
      } else {
        // Création
        await api.post("/categories", { name, restaurantId: user.restaurantId });
      }
      setName("");
      setEditingId(null);
      loadCategories();
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, catName: string) => {
    if (!confirm(`Supprimer la catégorie "${catName}" ?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      if (editingId === id) handleCancelEdit();
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  useEffect(() => { loadCategories(); }, []);

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-100">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Catégories</h1>
        <p className="text-slate-500 uppercase text-xs tracking-widest mt-1">Organisez votre menu dynamique</p>
      </header>

      <div className="grid gap-10 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form 
            onSubmit={handleSubmit} 
            className={`sticky top-8 rounded-3xl border p-6 shadow-2xl transition-all duration-300 ${
              editingId ? "bg-amber-500/5 border-amber-500/40 shadow-amber-500/10" : "bg-slate-900 border-slate-800"
            }`}
          >
            <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${editingId ? "bg-amber-500 text-black" : "bg-amber-500/10 text-amber-500"}`}>
              {editingId ? <Edit3 size={24} /> : <Tag size={24} />}
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingId ? "Modifier Catégorie" : "Nouvelle Catégorie"}
              </h2>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <input 
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-white outline-none focus:border-amber-500/50"
                placeholder="Ex: Petit-Déjeuner"
                value={name} onChange={e => setName(e.target.value)} required
              />
              <button 
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-black uppercase text-sm tracking-wide transition-all ${
                  editingId ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-amber-600 text-white hover:bg-amber-500"
                }`}
              >
                {editingId ? <Save size={20} /> : <Plus size={20} />}
                {loading ? "Chargement..." : editingId ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className={`group flex items-center justify-between rounded-2xl border p-5 transition-all ${
              editingId === cat.id ? "bg-amber-500/10 border-amber-500/50" : "bg-slate-900/40 border-slate-800 hover:bg-slate-900"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${editingId === cat.id ? "bg-amber-500 text-black" : "bg-slate-800 text-slate-400 group-hover:text-amber-500"} transition-colors`}>
                  <LayoutGrid size={20} />
                </div>
                <span className="text-lg font-semibold text-white">{cat.name}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditClick(cat)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-amber-500/10 hover:text-amber-400 transition-all"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}