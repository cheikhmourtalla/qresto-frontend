import { useEffect, useState } from "react";
import { Plus, Package, Trash2, Edit3, Image as ImageIcon, X, Save } from "lucide-react";
import api from "../services/api";

export default function Products() {
  const user = JSON.parse(localStorage.getItem("qresto_user") || "{}");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", categoryId: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // NOUVEAU : État pour savoir quel produit on est en train de modifier
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [prod, cat] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);
      setProducts(prod.data);
      setCategories(cat.data);
    } catch (err) {
      console.error("Erreur chargement données:", err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // NOUVEAU : Fonction déclenchée au clic sur le bouton "Éditer" d'un produit
  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      categoryId: String(product.categoryId),
    });
    setImagePreview(product.image || "");
    setImageFile(null); // On ne remplace pas l'image sauf s'il en choisit une nouvelle
    
    // Remonte la page en douceur vers le formulaire
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // NOUVEAU : Annuler le mode édition
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", description: "", price: "", categoryId: "" });
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = imagePreview; // Par défaut, conserve l'ancienne URL si édition

      // 1. Upload de la nouvelle image si l'utilisateur en a choisi une
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data.imageUrl;
      }

      const productData = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        categoryId: Number(form.categoryId),
        image: imageUrl,
        restaurantId: user.restaurantId,
      };

      // 2. ALTERNATIVE : Soit on MODIFIE (PUT), soit on AJOUTE (POST)
      if (editingId) {
        await api.put(`/products/${editingId}`, productData);
      } else {
        await api.post("/products", productData);
      }

      // Réinitialisation du formulaire complet
      setForm({ name: "", description: "", price: "", categoryId: "" });
      setEditingId(null);
      setImageFile(null);
      setImagePreview("");
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement du produit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await api.delete(`/products/${id}`);
      if (editingId === id) handleCancelEdit();
      loadData();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleToggleAvailability = async (id: number) => {
    try {
      await api.patch(`/products/${id}/availability`);
      loadData();
    } catch (err) {
      alert("Erreur lors du changement de disponibilité");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-100">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Produits</h1>
          <p className="text-slate-500 uppercase text-xs tracking-widest mt-1">Gérez votre carte de menu</p>
        </div>
      </header>

      {/* Formulaire d'ajout / modification */}
      <form onSubmit={handleSubmit} className={`mb-12 rounded-3xl bg-slate-900/50 border p-6 md:p-8 backdrop-blur-xl transition-all ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
        
        {/* Petit indicateur visuel du mode d'édition */}
        {editingId && (
          <div className="mb-6 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Mode Modification activé</span>
            <button type="button" onClick={handleCancelEdit} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold">
              <X size={14} /> Annuler
            </button>
          </div>
        )}

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nom du plat</label>
            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-white outline-none focus:border-amber-500/50 transition-all"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Yassa Poulet"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Prix (FCFA)</label>
            <input
              type="number"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-white outline-none focus:border-amber-500/50"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="5000"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Catégorie</label>
            <select
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-400 outline-none focus:border-amber-500/50"
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              <option value="">Sélectionner...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Image</label>
            <label className="flex items-center justify-center w-full h-46px rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 cursor-pointer hover:border-amber-500/50 transition-all overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} className="h-full w-full object-cover" alt="preview" />
              ) : (
                <>
                  <ImageIcon size={18} className="mr-2 text-slate-400" />
                  <span className="text-sm text-slate-400">Choisir...</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

        </div>

        <div className="mt-6 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description (optionnel)</label>
          <input
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-white outline-none focus:border-amber-500/50"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Courte description du plat..."
          />
        </div>

        <div className="flex gap-4 mt-8">
          <button
            disabled={loading}
            className={`w-full md:w-auto flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-bold text-black transition-all disabled:opacity-50 ${editingId ? 'bg-amber-500 hover:bg-amber-400' : 'bg-white hover:bg-amber-500'}`}
          >
            {editingId ? <Save size={20} /> : <Plus size={20} />}
            {loading ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Ajouter au menu"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-6 py-3 rounded-xl bg-slate-800 font-bold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Grille de produits */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(product => (
          <div key={product.id} className={`group overflow-hidden rounded-3xl bg-slate-900 border transition-all ${editingId === product.id ? 'border-amber-500 shadow-lg shadow-amber-500/5' : 'border-slate-800 hover:border-amber-500/30'}`}>
            <div className="relative h-48 bg-slate-800">
              {product.image ? (
                <img src={product.image} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={product.name} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-700">
                  <Package size={48} />
                </div>
              )}
              <div className="absolute top-3 right-3 rounded-lg bg-black/60 backdrop-blur-md px-2 py-1 text-xs font-bold text-amber-500">
                {product.price.toLocaleString()} FCFA
              </div>
              
              <button
                onClick={() => handleToggleAvailability(product.id)}
                className={`absolute top-3 left-3 rounded-lg px-2 py-1 text-xs font-bold backdrop-blur-md transition-colors ${
                  product.available
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/40"
                }`}
              >
                {product.available ? "Disponible" : "Indisponible"}
              </button>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-white text-lg">{product.name}</h3>
              <p className="mt-1 text-sm text-slate-500 line-clamp-1">{product.description || "Pas de description"}</p>
              {product.category && (
                <span className="mt-2 inline-block rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400">
                  {product.category.name}
                </span>
              )}
              <div className="mt-4 flex gap-2">
                {/* BRANCHEMENT DE LA FONCTION SUR LE BOUTON ÉDITER ICI */}
                <button 
                  onClick={() => handleEditClick(product)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-800 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Edit3 size={14} /> Éditer
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-800 text-slate-600">
            <Package size={48} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">Aucun produit pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}