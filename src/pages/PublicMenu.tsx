import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
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

type AppState = "menu" | "order_confirmed";

export default function PublicMenu() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const tableNumber = searchParams.get("table") || "?";

  const [restaurant, setRestaurant] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<any>("all");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [orderLoading, setOrderLoading] =
    useState(false);

  const [appState, setAppState] =
    useState<AppState>("menu");

  useEffect(() => {
    api
      .get(`/menu/${slug}`)
      .then((res) => {
        setRestaurant(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          console.error(err);
        }
      });

    const savedState = localStorage.getItem(
      `qresto_app_state_${slug}`
    ) as AppState | null;

    if (savedState === "order_confirmed") {
      setAppState("order_confirmed");
    }
  }, [slug]);

  const categories =
    restaurant?.category?.filter(
      (c: any) => c.product?.length > 0
    ) || [];

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === product.id
      );

      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === id
      );

      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: i.quantity - 1,
              }
            : i
        );
      }

      return prev.filter((i) => i.id !== id);
    });
  };

  const deleteFromCart = (id: number) => {
    setCart((prev) =>
      prev.filter((i) => i.id !== id)
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }, [cart]);

  const handleOrder = async () => {
    if (cart.length === 0) return;

    setOrderLoading(true);

    try {
      await api.post("/orders", {
        tableNumber,
        restaurantId: restaurant.id,
        items: cart.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
      });

      localStorage.setItem(
        `qresto_app_state_${slug}`,
        "order_confirmed"
      );

      setCart([]);
      setCartOpen(false);

      setAppState("order_confirmed");
    } catch (err) {
      alert(
        "Erreur lors de l'envoi de la commande."
      );
    } finally {
      setOrderLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-center p-8">
        <AlertTriangle
          size={54}
          className="text-amber-500 mb-6"
        />

        <h1 className="text-4xl font-black text-white">
          Menu introuvable
        </h1>

        <p className="mt-4 text-slate-400">
          Ce QR code n'est plus valide.
        </p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-5">
        <div className="h-12 w-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />

        <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">
          Chargement du menu...
        </p>
      </div>
    );
  }

  if (appState === "order_confirmed") {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="w-full max-w-lg rounded-[40px] border border-white/10 bg-slate-900/70 p-10 text-center backdrop-blur-2xl"
        >
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle size={56} />
          </div>

          <h1 className="mt-8 text-4xl font-black text-white">
            Commande envoyée
          </h1>

          <p className="mt-4 text-lg text-slate-400">
            Votre commande pour la table{" "}
            <span className="font-black text-amber-400">
              {tableNumber}
            </span>{" "}
            est en préparation.
          </p>

          <button
            onClick={() => {
              localStorage.setItem(
                `qresto_app_state_${slug}`,
                "menu"
              );

              setAppState("menu");
            }}
            className="mt-10 h-14 w-full rounded-2xl border border-slate-700 bg-slate-800 font-black text-white transition hover:bg-slate-700"
          >
            Retour au menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#020617] text-white pb-32">
      {/* HERO */}
      <header className="relative h-[55vh] overflow-hidden">
        {restaurant.banner ? (
          <img
            src={restaurant.banner}
            alt="Banner"
            className="h-full w-full object-cover scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-900 to-black" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-5 pb-10">
            <motion.div
              initial={{
                y: 25,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
            >
              <div className="flex items-end gap-5 flex-wrap">
                {restaurant.logo ? (
                  <img
                    src={restaurant.logo}
                    alt="Logo"
                    className="h-24 w-24 rounded-[28px] border border-white/10 bg-white object-contain p-3 shadow-2xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-500 text-4xl font-black text-black shadow-2xl">
                    {restaurant.name.charAt(0)}
                  </div>
                )}

                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                    Table {tableNumber}
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
                    {restaurant.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-300">
                    {restaurant.address && (
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-amber-500"
                        />
                        {restaurant.address}
                      </div>
                    )}

                    {restaurant.phone && (
                      <div className="flex items-center gap-2">
                        <Phone
                          size={16}
                          className="text-amber-500"
                        />
                        {restaurant.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-5 pt-8">
        {/* SEARCH */}
        <div className="sticky top-5 z-40 mb-6">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 backdrop-blur-2xl">
            <Search
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="h-16 w-full bg-transparent pl-14 pr-5 text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* CATEGORY FILTER */}
        <div className="mb-12 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            <button
              onClick={() =>
                setSelectedCategory("all")
              }
              className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${
                selectedCategory === "all"
                  ? "bg-amber-500 text-black"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-500/30"
              }`}
            >
              Tous
            </button>

            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(cat.id)
                }
                className={`rounded-2xl px-5 py-3 text-sm font-black whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 text-black"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-500/30"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY */}
        {restaurant.category?.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-600 font-bold">
              Aucun produit disponible
            </p>
          </div>
        )}

        {/* CATEGORIES */}
        {restaurant.category
          ?.filter((cat: any) =>
            selectedCategory === "all"
              ? true
              : cat.id === selectedCategory
          )
          .map((cat: any) => {
            const filtered = cat.product?.filter(
              (p: any) =>
                p.name
                  .toLowerCase()
                  .includes(
                    search.toLowerCase()
                  )
            );

            if (
              !filtered ||
              filtered.length === 0
            )
              return null;

            return (
              <section
                key={cat.id}
                className="mb-20"
              >
                <div className="mb-8 flex items-center gap-4">
                  <div className="h-10 w-1 rounded-full bg-amber-500" />

                  <h2 className="text-3xl font-black uppercase tracking-tight">
                    {cat.name}
                  </h2>
                </div>

                {/* PRODUCTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filtered.map(
                    (product: any) => {
                      const cartItem =
                        cart.find(
                          (i) =>
                            i.id ===
                            product.id
                        );

                      return (
                        <motion.div
                          key={product.id}
                          whileHover={{
                            y: -6,
                          }}
                          transition={{
                            duration: 0.2,
                          }}
                          className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-black/20"
                        >
                          {/* IMAGE */}
                          <div className="relative h-56 overflow-hidden">
                            {product.image ? (
                              <img
                                src={
                                  product.image
                                }
                                alt={
                                  product.name
                                }
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-5xl font-black text-slate-700">
                                {product.name.charAt(
                                  0
                                )}
                              </div>
                            )}

                            {/* OVERLAY */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                            {/* PRIX */}
                            <div className="absolute top-4 right-4 rounded-full bg-amber-500 px-4 py-2 text-sm font-black text-black shadow-lg">
                              {product.price.toLocaleString()}{" "}
                              FCFA
                            </div>

                            {/* NOM */}
                            <div className="absolute bottom-4 left-4 right-4">
                              <h3 className="text-xl font-black text-white line-clamp-1">
                                {product.name}
                              </h3>

                              {product.description && (
                                <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                                  {
                                    product.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          {/* FOOTER */}
                          <div className="flex items-center justify-between p-4">
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">
                                Disponible
                              </p>
                            </div>

                            {cartItem ? (
                              <div className="flex items-center gap-3 rounded-2xl bg-slate-800 p-2">
                                <button
                                  onClick={() =>
                                    removeFromCart(
                                      product.id
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700 text-white transition hover:bg-slate-600"
                                >
                                  <Minus
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <span className="w-6 text-center font-black text-white">
                                  {
                                    cartItem.quantity
                                  }
                                </span>

                                <button
                                  onClick={() =>
                                    addToCart(
                                      product
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-black transition hover:bg-amber-400"
                                >
                                  <Plus
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  addToCart(
                                    product
                                  )
                                }
                                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition-all hover:bg-amber-500 active:scale-95"
                              >
                                <Plus
                                  size={
                                    16
                                  }
                                />
                                Ajouter
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </section>
            );
          })}
      </main>

      {/* FLOATING CART */}
      <FloatingCartButton
        cartCount={cartCount}
        cartTotal={cartTotal}
        setCartOpen={setCartOpen}
      />

      {/* CART MODAL */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() =>
              setCartOpen(false)
            }
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{
                y: "100%",
              }}
              animate={{
                y: 0,
              }}
              exit={{
                y: "100%",
              }}
              transition={{
                type: "spring",
                damping: 24,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="w-full max-w-xl rounded-t-[40px] border-t border-white/10 bg-[#08101f] p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">
                    Mon panier
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Table {tableNumber}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-300">
                  {cartCount} article(s)
                </div>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-[28px] border border-white/10 bg-slate-900/80 p-4"
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-800">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-black text-slate-700">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-black text-white">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-amber-400">
                        {(
                          item.price *
                          item.quantity
                        ).toLocaleString()}{" "}
                        FCFA
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          removeFromCart(
                            item.id
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-slate-700"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="w-6 text-center font-black text-white">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          addToCart(item)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-black hover:bg-amber-400"
                      >
                        <Plus size={15} />
                      </button>

                      <button
                        onClick={() =>
                          deleteFromCart(
                            item.id
                          )
                        }
                        className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="mt-8 rounded-[30px] border border-white/10 bg-slate-900 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    Total
                  </span>

                  <span className="text-3xl font-black text-white">
                    {cartTotal.toLocaleString()}{" "}
                    FCFA
                  </span>
                </div>
              </div>

              {/* BUTTON */}
              <button
                onClick={handleOrder}
                disabled={orderLoading}
                className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-white text-lg font-black text-black transition-all hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle
                  size={24}
                />

                {orderLoading
                  ? "Envoi en cours..."
                  : "Passer la commande"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingCartButton({
  cartCount,
  cartTotal,
  setCartOpen,
}: {
  cartCount: number;
  cartTotal: number;
  setCartOpen: (b: boolean) => void;
}) {
  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{
          y: 100,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        exit={{
          y: 100,
          opacity: 0,
        }}
        onClick={() =>
          setCartOpen(true)
        }
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-[28px] border border-white/10 bg-white px-7 py-5 font-black text-black shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all hover:bg-amber-500 active:scale-95"
      >
        <ShoppingCart size={24} />

        <span>Voir le panier</span>

        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm text-white">
          {cartCount}
        </span>

        <span className="text-sm">
          {cartTotal.toLocaleString()} FCFA
        </span>
      </motion.button>
    </AnimatePresence>
  );
}