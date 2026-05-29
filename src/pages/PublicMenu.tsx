import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  MapPin,
  Phone,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Clock3,
  Hash,
  X,
  Menu,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface ReceiptData {
  id?: number;
  orderNumber: string;
  tableNumber: string;
  createdAt: string;
  total: number;
  items: CartItem[];
  status: string;
}

type AppState = "menu" | "order_confirmed";

export default function PublicMenu() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table") || "?";

  const [restaurant, setRestaurant] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [appState, setAppState] = useState<AppState>("menu");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productQty, setProductQty] = useState(1);

  

  useEffect(() => {
    api
      .get(`/menu/${slug}`)
      .then((res) => setRestaurant(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error(err);
      });

    const savedState = localStorage.getItem(`qresto_app_state_${slug}`) as AppState | null;
    const savedReceipt = localStorage.getItem(`qresto_receipt_${slug}`);
    if (savedState === "order_confirmed" && savedReceipt) {
      setAppState("order_confirmed");
      setReceipt(JSON.parse(savedReceipt));
    }
  }, [slug]);

  const categories = restaurant?.category?.filter((c: any) => c.product?.length > 0) || [];

  const allProducts = useMemo(() => {
    return (restaurant?.category ?? []).flatMap((c: any) => c.product ?? []);
  }, [restaurant]);

  const heroProduct = useMemo(() => {
    if (selectedCategory === "all") return allProducts[0] ?? null;
    const cat = restaurant?.category?.find((c: any) => c.id === selectedCategory);
    return cat?.product?.[0] ?? null;
  }, [selectedCategory, allProducts, restaurant]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "all") return allProducts.slice(1);
    const cat = restaurant?.category?.find((c: any) => c.id === selectedCategory);
    return (cat?.product ?? []).slice(1);
  }, [selectedCategory, allProducts, restaurant]);

  const addToCart = (product: any, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      return [...prev, { id: product.id, name: product.name, image: product.image, price: product.price, quantity: qty }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.quantity > 1)
        return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.id !== id);
    });
  };

  const deleteFromCart = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handleOrder = async () => {
    if (cart.length === 0) return;
    setOrderLoading(true);
    try {
      const res = await api.post("/orders", {
        tableNumber,
        restaurantId: restaurant.id,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
      });
      const order = res.data;
      const receiptData: ReceiptData = {
        id: order?.id,
        orderNumber: order?.orderNumber || `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
        tableNumber: order?.tableNumber || tableNumber,
        createdAt: order?.createdAt || new Date().toISOString(),
        total: cartTotal,
        items: [...cart],
        status: order?.status || "EN ATTENTE",
      };
      localStorage.setItem(`qresto_app_state_${slug}`, "order_confirmed");
      localStorage.setItem(`qresto_receipt_${slug}`, JSON.stringify(receiptData));
      setReceipt(receiptData);
      setCart([]);
      setCartOpen(false);
      setAppState("order_confirmed");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de la commande.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleServiceCall = async (type: "WAITER" | "BILL") => {
    try {
      setServiceLoading(true);
      await api.post("/waiter-call", { tableNumber, restaurantId: restaurant.id, type });
      setServiceModal(false);
      alert(type === "WAITER" ? "Serveur appelé avec succès ✅" : "Demande d'addition envoyée ✅");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de la demande.");
    } finally {
      setServiceLoading(false);
    }
  };

  /* ── SCREENS ── */

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8" style={{ background: "#1a1008" }}>
        <AlertTriangle size={54} className="text-amber-600 mb-6" />
        <h1 className="text-4xl font-bold text-white">Menu introuvable</h1>
        <p className="mt-4 text-stone-400">Ce QR code n'est plus valide.</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: "#1a1008" }}>
        <div className="h-12 w-12 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Chargement du menu...</p>
      </div>
    );
  }

  if (appState === "order_confirmed" && receipt) {
    return (
      <div className="min-h-screen px-5 py-10 flex items-center justify-center" style={{ background: "#1a1008" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
          style={{ background: "#221508", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="p-8 border-b" style={{ borderColor: "rgba(255,255,255,0.07)", background: "linear-gradient(135deg, rgba(34,21,8,1) 0%, rgba(50,30,10,1) 100%)" }}>
            <div className="flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <div className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                {receipt.status}
              </div>
            </div>
            <h1 className="mt-5 text-3xl font-bold text-white">Commande envoyée</h1>
            <p className="mt-2 text-stone-400">Présentez ce reçu à votre serveur</p>
          </div>

          <div className="p-7">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 text-stone-500 mb-2">
                  <Hash size={13} />
                  <span className="text-xs uppercase tracking-wider">Commande</span>
                </div>
                <p className="text-lg font-bold text-white">{receipt.orderNumber}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 text-stone-500 mb-2">
                  <Receipt size={13} />
                  <span className="text-xs uppercase tracking-wider">Table</span>
                </div>
                <p className="text-lg font-bold text-amber-500">{receipt.tableNumber}</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 text-stone-500 mb-2">
                <Clock3 size={13} />
                <span className="text-xs uppercase tracking-wider">Heure</span>
              </div>
              <p className="text-white font-semibold">{new Date(receipt.createdAt).toLocaleString()}</p>
            </div>

            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-3">Détails</h2>
            <div className="space-y-2 mb-6">
              {receipt.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">Qté : {item.quantity}</p>
                  </div>
                  <p className="font-bold text-amber-500 text-sm">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl px-5 py-4 mb-6" style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)" }}>
              <span className="text-stone-300 font-semibold">Total</span>
              <span className="text-2xl font-bold text-white">{receipt.total.toLocaleString()} FCFA</span>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setServiceModal(true)} className="h-13 w-full rounded-xl py-3.5 font-bold text-black transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}>
                🛎️ Appeler le service
              </button>
              <button onClick={() => { localStorage.removeItem(`qresto_app_state_${slug}`); localStorage.removeItem(`qresto_receipt_${slug}`); setReceipt(null); setAppState("menu"); }} className="h-13 w-full rounded-xl py-3.5 font-bold text-white transition hover:opacity-80" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Retour au menu
              </button>
            </div>
          </div>
        </motion.div>

        <ServiceModalComponent
          open={serviceModal}
          loading={serviceLoading}
          onClose={() => setServiceModal(false)}
          onCall={handleServiceCall}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-28" style={{ background: "#1a1008" }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4" style={{ background: "rgba(26,16,8,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          {restaurant.logo ? (
            <img src={restaurant.logo} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white p-1" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-black text-lg" style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}>
              {restaurant.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold text-white leading-tight text-sm">{restaurant.name}</p>
            {restaurant.address && (
              <p className="text-xs text-stone-500 flex items-center gap-1">
                <MapPin size={10} className="text-amber-600" />
                {restaurant.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider" style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)" }}>
            Table {tableNumber}
          </div>
          <button onClick={() => setServiceModal(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:text-white transition" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* ── MENU HEADER ── */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-1">Carte des plats & spécialités</p>

        {/* CATEGORY TABS */}
        <div className="mt-4 overflow-x-auto scrollbar-hide -mx-6 px-6">
          <div className="flex gap-0 min-w-max border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setSelectedCategory("all")}
              className="relative px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
              style={{ color: selectedCategory === "all" ? "#fff" : "#78716c" }}
            >
              Tous
              {selectedCategory === "all" && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="relative px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                style={{ color: selectedCategory === cat.id ? "#fff" : "#78716c" }}
              >
                {cat.name}
                {selectedCategory === cat.id && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO PRODUCT ── */}
      {heroProduct && (
        <div className="px-6 mb-6">
          <motion.div
            key={heroProduct.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl cursor-pointer"
            style={{ background: "#221508", border: "1px solid rgba(255,255,255,0.07)" }}
            onClick={() => { setSelectedProduct(heroProduct); setProductQty(1); }}
          >
            <div className="flex flex-col md:flex-row">
              {/* IMAGE */}
              <div className="relative md:w-1/2 h-64 md:h-80 overflow-hidden flex-shrink-0">
                {heroProduct.image ? (
                  <img src={heroProduct.image} alt={heroProduct.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl font-bold text-stone-700" style={{ background: "#2a1a08" }}>
                    {heroProduct.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, rgba(34,21,8,1) 100%)" }} />
              </div>

              {/* INFO */}
              <div className="p-6 flex flex-col justify-between md:flex-1">
                <div>
                  <p className="text-amber-500 font-bold text-lg mb-2">{heroProduct.price.toLocaleString()} FCFA</p>
                  <h2 className="text-2xl font-bold text-white leading-tight mb-3">{heroProduct.name}</h2>
                  {heroProduct.description && (
                    <p className="text-stone-400 text-sm leading-relaxed line-clamp-4">{heroProduct.description}</p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  {(() => {
                    const cartItem = cart.find((i) => i.id === heroProduct.id);
                    return cartItem ? (
                      <div className="flex items-center gap-3 rounded-xl p-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(heroProduct.id); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center font-bold text-white">{cartItem.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); addToCart(heroProduct); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-black" style={{ background: "#d97706" }}>
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); addToCart(heroProduct); }} className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-black text-sm transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #d97706, #b45309)", border: "none" }}>
                        <Plus size={15} />
                        Ajouter au panier
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => { setSelectedProduct(heroProduct); setProductQty(1); }}
                    className="text-xs text-stone-400 hover:text-white transition underline underline-offset-2"
                  >
                    Voir la description détaillée
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── PRODUCT LIST ── */}
      <div className="px-6">
        {visibleProducts.length > 0 && (
          <div className="space-y-3">
            {visibleProducts.map((product: any) => {
              const cartItem = cart.find((i) => i.id === product.id);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setSelectedProduct(product); setProductQty(1); }}
                  className="flex items-center gap-4 rounded-xl p-3 cursor-pointer transition-all hover:opacity-90"
                  style={{ background: "#221508", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {/* IMAGE */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg" style={{ background: "#2a1a08" }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl font-bold text-stone-700">
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight">{product.name}</h3>
                    {product.description && (
                      <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">{product.description}</p>
                    )}
                  </div>

                  {/* PRIX + ACTION */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="font-bold text-amber-500 text-sm whitespace-nowrap">{product.price.toLocaleString()} FCFA</p>
                    {cartItem ? (
                      <div className="flex items-center gap-2 rounded-lg p-1" onClick={(e) => e.stopPropagation()} style={{ background: "rgba(255,255,255,0.07)" }}>
                        <button onClick={() => removeFromCart(product.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <Minus size={13} />
                        </button>
                        <span className="w-4 text-center font-bold text-white text-sm">{cartItem.quantity}</span>
                        <button onClick={() => addToCart(product)} className="flex h-7 w-7 items-center justify-center rounded-md text-black" style={{ background: "#d97706" }}>
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-black transition hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                      >
                        <Plus size={12} />
                        Ajouter
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {allProducts.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-600 font-bold">Aucun produit disponible</p>
          </div>
        )}
      </div>

      {/* ── FLOATING CART ── */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 font-bold text-white shadow-2xl transition hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #d97706, #92400e)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          >
            <div className="relative">
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-amber-700">
                {cartCount}
              </span>
            </div>
            <span>Mon Panier</span>
            <span className="text-sm opacity-80">({cartCount})</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── SERVICE FAB ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setServiceModal(true)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition hover:opacity-90"
        style={{ background: "rgba(34,21,8,0.95)", border: "1px solid rgba(217,119,6,0.3)" }}
      >
        <span className="text-2xl">🛎️</span>
      </motion.button>

      {/* ── PRODUCT DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
              style={{ background: "#221508", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* IMAGE */}
              <div className="relative h-72 overflow-hidden">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl font-bold text-stone-700" style={{ background: "#2a1a08" }}>
                    {selectedProduct.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(34,21,8,1) 100%)" }} />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <X size={18} className="text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
                  <div className="flex items-end justify-between">
                    <h2 className="text-2xl font-bold text-white leading-tight">{selectedProduct.name}</h2>
                    <p className="text-amber-500 font-bold text-xl ml-4 flex-shrink-0">{selectedProduct.price.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="p-6">
                {selectedProduct.description && (
                  <p className="text-stone-400 text-sm leading-relaxed mb-6">{selectedProduct.description}</p>
                )}

                {/* QTY + ADD */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 rounded-xl p-1.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button onClick={() => setProductQty(Math.max(1, productQty - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <Minus size={16} />
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white text-lg w-6 text-center">{productQty}</span>
                      <ChevronDown size={14} className="text-stone-500" />
                    </div>
                    <button onClick={() => setProductQty(productQty + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-black" style={{ background: "#d97706" }}>
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => { addToCart(selectedProduct, productQty); setSelectedProduct(null); }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-black transition hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                  >
                    <ShoppingCart size={18} />
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CART DRAWER ── */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
              style={{ background: "#1e1208", borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Mon panier</h2>
                  <p className="mt-0.5 text-sm text-stone-500">Table {tableNumber}</p>
                </div>
                <div className="rounded-lg px-3 py-2 text-sm font-bold text-stone-300" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {cartCount} article(s)
                </div>
              </div>

              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg" style={{ background: "#2a1a08" }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl font-bold text-stone-700">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                      <p className="mt-0.5 text-sm font-bold text-amber-500">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => removeFromCart(item.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center font-bold text-white text-sm">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-black" style={{ background: "#d97706" }}>
                        <Plus size={13} />
                      </button>
                      <button onClick={() => deleteFromCart(item.id)} className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:text-white hover:bg-red-500 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl px-5 py-4" style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)" }}>
                <span className="text-stone-300 font-semibold">Total</span>
                <span className="text-2xl font-bold text-white">{cartTotal.toLocaleString()} FCFA</span>
              </div>

              <button
                onClick={handleOrder}
                disabled={orderLoading}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #d97706, #92400e)" }}
              >
                <CheckCircle size={20} />
                {orderLoading ? "Envoi en cours..." : "Passer la commande"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SERVICE MODAL ── */}
      <ServiceModalComponent
        open={serviceModal}
        loading={serviceLoading}
        onClose={() => setServiceModal(false)}
        onCall={handleServiceCall}
      />
    </div>
  );
}

/* ── SERVICE MODAL COMPONENT ── */
function ServiceModalComponent({
  open,
  loading,
  onClose,
  onCall,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCall: (type: "WAITER" | "BILL") => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: "#1e1208", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div className="mb-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl mb-4" style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)" }}>
                🛎️
              </div>
              <h2 className="text-2xl font-bold text-white">Service</h2>
              <p className="mt-1.5 text-stone-400 text-sm">Comment pouvons-nous vous aider ?</p>
            </div>

            <div className="space-y-3">
              <button disabled={loading} onClick={() => onCall("WAITER")} className="flex w-full items-center justify-between rounded-xl p-4 transition hover:opacity-80" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-left">
                  <p className="font-bold text-white">Appeler un serveur</p>
                  <p className="mt-0.5 text-sm text-stone-500">Assistance à votre table</p>
                </div>
                <span className="text-2xl">👨‍🍳</span>
              </button>

              <button disabled={loading} onClick={() => onCall("BILL")} className="flex w-full items-center justify-between rounded-xl p-4 transition hover:opacity-80" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-left">
                  <p className="font-bold text-white">Demander l'addition</p>
                  <p className="mt-0.5 text-sm text-stone-500">Recevoir votre facture</p>
                </div>
                <span className="text-2xl">🧾</span>
              </button>
            </div>

            <button onClick={onClose} className="mt-4 h-13 w-full rounded-xl py-3.5 font-bold text-stone-400 transition hover:text-white" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}