import { useEffect, useState } from "react";
import { Store, Phone, MapPin, Upload, Save, Image as ImageIcon } from "lucide-react";
import api from "../services/api";

export default function RestaurantSettings() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const loadRestaurant = async () => {
    try {
      const res = await api.get("/restaurants/me");
      setName(res.data.name || "");
      setPhone(res.data.phone || "");
      setAddress(res.data.address || "");
      setLogo(res.data.logo || "");
      setBanner(res.data.banner || "");
    } catch (err) {
      console.error("Erreur chargement restaurant:", err);
    }
  };

  useEffect(() => { loadRestaurant(); }, []);

  const handleUpload = async (
    file: File,
    type: "logo" | "banner",
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      // 1. Upload vers Cloudinary
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = uploadRes.data.imageUrl;

      // 2. Mise à jour locale
      const newLogo = type === "logo" ? url : logo;
      const newBanner = type === "banner" ? url : banner;
      if (type === "logo") setLogo(url);
      else setBanner(url);

      // 3. Sauvegarde immédiate
      await api.put("/restaurants/me", {
        name, phone, address,
        logo: newLogo,
        banner: newBanner,
      });
    } catch (err) {
      alert("Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/restaurants/me", { name, phone, address, logo, banner });
      alert("Paramètres mis à jour avec succès");
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-100">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white">Paramètres</h1>
        <p className="text-slate-500 uppercase text-xs tracking-widest mt-1">Identité de votre établissement</p>
      </header>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">

          {/* Formulaire infos */}
          <form onSubmit={handleSubmit} className="rounded-3xl bg-slate-900/50 border border-slate-800 p-6 md:p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Store className="text-amber-500" size={20} /> Informations générales
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nom du restaurant</label>
                <div className="relative group">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-4 pl-11 pr-4 text-white outline-none focus:border-amber-500/50 transition-all"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Téléphone</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-4 pl-11 pr-4 text-white outline-none focus:border-amber-500/50 transition-all"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Adresse physique</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-4 pl-11 pr-4 text-white outline-none focus:border-amber-500/50 transition-all"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-black hover:bg-amber-500 transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? "Enregistrement..." : "Sauvegarder les modifications"}
            </button>
          </form>

          {/* Prévisualisation bannière */}
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            {banner ? (
              <img src={banner} className="h-full w-full object-cover opacity-60" alt="Bannière" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-700 font-bold uppercase tracking-widest text-sm">
                Aucune bannière définie
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl border-2 border-amber-500 bg-white p-1 shadow-2xl overflow-hidden">
                {logo ? (
                  <img src={logo} className="h-full w-full object-contain" alt="Logo" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-200 rounded-xl">
                    <Store size={28} className="text-slate-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase">{name || "Votre Restaurant"}</h3>
                <p className="text-slate-400 text-sm">{address || "Dakar, Sénégal"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne upload médias */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="font-bold text-white mb-6">Logo & Médias</h3>
            <div className="space-y-4">

              {/* Upload Logo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Logo</label>
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-amber-500/40 transition-all cursor-pointer group overflow-hidden relative">
                  {logo ? (
                    <img src={logo} className="h-full w-full object-contain p-2" alt="Logo actuel" />
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-600 group-hover:text-amber-500 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {uploadingLogo ? "Upload en cours..." : "Changer le Logo"}
                      </span>
                    </>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                      <span className="text-xs font-bold text-amber-500 uppercase">Envoi...</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "logo", setUploadingLogo);
                    }}
                  />
                </label>
              </div>

              {/* Upload Bannière */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bannière</label>
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-amber-500/40 transition-all cursor-pointer group overflow-hidden relative">
                  {banner ? (
                    <img src={banner} className="h-full w-full object-cover opacity-60" alt="Bannière actuelle" />
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-slate-600 group-hover:text-amber-500 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {uploadingBanner ? "Upload en cours..." : "Changer la Bannière"}
                      </span>
                    </>
                  )}
                  {uploadingBanner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                      <span className="text-xs font-bold text-amber-500 uppercase">Envoi...</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBanner}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "banner", setUploadingBanner);
                    }}
                  />
                </label>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}