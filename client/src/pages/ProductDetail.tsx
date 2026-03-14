import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { formatGHS, generateWhatsAppLink } from "@shared/marketplace";
import {
  ShoppingCart, MessageCircle, MapPin, ChevronRight,
  Package, ShieldCheck, Phone, Store, ChevronLeft,
  AlertTriangle, Users, Eye, Ban,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const product = trpc.product.getById.useQuery({ id: Number(id) });
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => toast.success("Added to cart!"),
    onError: () => toast.error("Please sign in to add items to cart"),
  });
  const utils = trpc.useUtils();
  const [selectedImage, setSelectedImage] = useState(0);

  if (product.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-6 px-4">
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="aspect-square w-full rounded-2xl mb-4" />
          <div className="flex gap-2 mb-6">
            {[0,1,2].map(i => <Skeleton key={i} className="w-14 h-14 rounded-xl flex-shrink-0" />)}
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-10 w-36 mb-6 rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full mb-3" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  const p = product.data;
  if (!p) {
    return (
      <div className="container py-24 text-center">
        <h2 className="text-xl font-light tracking-wide mb-3">Product not found</h2>
        <Link href="/products">
          <Button variant="outline" className="rounded-full border-border/30 tracking-wide">Browse Parts</Button>
        </Link>
      </div>
    );
  }

  const images = (p.images as string[] | null) || [];
  const vendor = p.vendor;
  const whatsappMessage = `Hi, I'm interested in "${p.name}" listed at ${formatGHS(p.price)} on VOOM Ghana Marketplace. Is it still available?`;
  const whatsappLink = vendor?.whatsapp ? generateWhatsAppLink(vendor.whatsapp, whatsappMessage) : null;
  const outOfStock = p.quantity === 0;

  function handleAddToCart() {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      return;
    }
    addToCart.mutate({ productId: p!.id, quantity: 1 }, {
      onSuccess: () => utils.cart.list.invalidate(),
    });
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-10">
      {/* ── Mobile back + breadcrumb ───────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/20">
        <div className="container max-w-5xl px-4 h-12 flex items-center gap-2">
          <Link href="/products" className="flex items-center text-muted-foreground hover:text-primary/90 no-underline">
            <ChevronLeft className="h-5 w-5 flex-shrink-0" />
          </Link>
          <nav className="flex items-center gap-1 text-xs text-muted-foreground/70 min-w-0" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary/90 no-underline whitespace-nowrap">Home</Link>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <Link href="/products" className="hover:text-primary/90 no-underline whitespace-nowrap">Parts</Link>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <span className="text-foreground/80 truncate">{p.name}</span>
          </nav>
        </div>
      </div>

      <div className="container max-w-5xl px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Image gallery ──────────────────────────────── */}
          <div className="space-y-3">
            <div className="aspect-square bg-white/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage] ?? images[0]}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  data-testid="img-product-main"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20 ${images.length > 0 ? "hidden" : ""}`}>
                <Package className="h-20 w-20 opacity-20" />
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    data-testid={`btn-thumbnail-${i}`}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                      i === selectedImage
                        ? "border-primary shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-90"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product details ────────────────────────────── */}
          <div className="space-y-5">
            {/* Make/Model */}
            {p.vehicleMake && (
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                {p.vehicleMake} {p.vehicleModel}
                {p.yearFrom && ` · ${p.yearFrom}${p.yearTo ? `–${p.yearTo}` : "+"}`}
              </p>
            )}

            {/* Title */}
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide text-foreground leading-snug"
              data-testid="text-product-name"
            >
              {p.name}
            </h1>

            {/* Condition + brand + stock */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={p.condition === "new" ? "default" : "secondary"}
                className="rounded-full text-xs tracking-wide"
              >
                {p.condition === "new" ? "Brand New" : p.condition === "used" ? "Used / Tokunbo" : "Refurbished"}
              </Badge>
              {p.brand && (
                <Badge variant="outline" className="rounded-full border-border/30 text-xs tracking-wide">
                  {p.brand}
                </Badge>
              )}
            </div>

            {/* Stock status */}
            {p.quantity !== undefined && (
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {p.quantity > 0 ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-voom-green flex-shrink-0" />
                    <span className="text-voom-green" data-testid="status-stock">In Stock ({p.quantity} available)</span>
                  </>
                ) : (
                  <span className="text-destructive" data-testid="status-stock">Out of Stock</span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-sm">
              <p
                className="text-2xl sm:text-3xl font-light tracking-wide text-primary/90"
                data-testid="text-price"
              >
                {formatGHS(p.price)}
              </p>
              {p.minOrderQty && p.minOrderQty > 1 && (
                <p className="text-xs text-muted-foreground mt-1 tracking-wide">
                  Min. order: {p.minOrderQty} units
                </p>
              )}
            </div>

            {/* CTA buttons — visible on desktop only; mobile uses sticky bar below */}
            <div className="hidden md:flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-12 text-white rounded-full tracking-wide"
                disabled={outOfStock || addToCart.isPending}
                onClick={handleAddToCart}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addToCart.isPending ? "Adding…" : outOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              {whatsappLink && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-5 border-voom-green/60 text-voom-green hover:bg-voom-green/5 rounded-full tracking-wide"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="no-underline" data-testid="link-whatsapp">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>

            {/* Description */}
            {p.description && (
              <div>
                <h3 className="font-medium tracking-wide mb-2 text-sm uppercase text-muted-foreground">Description</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {p.description}
                </p>
              </div>
            )}

            <Separator className="bg-border/20" />

            {/* Vendor card */}
            {vendor && (
              <Card className="rounded-2xl border-white/20 shadow-sm bg-white/50 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-5 w-5 text-primary/90" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/vendors/${vendor.id}`}
                        className="font-medium text-sm tracking-wide text-foreground hover:text-primary/90 no-underline truncate block"
                        data-testid="link-vendor"
                      >
                        {vendor.businessName}
                      </Link>
                      {vendor.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {vendor.city}, {vendor.region}
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {vendor.phone}
                        </p>
                      )}
                    </div>
                    <Link href={`/vendors/${vendor.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-border/30 text-xs tracking-wide flex-shrink-0"
                        data-testid="button-view-shop"
                      >
                        View Shop
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Safety Tips ─────────────────────────────── */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-5" data-testid="section-safety-tips">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <h3 className="font-semibold text-sm tracking-wide text-emerald-800 dark:text-emerald-300 uppercase">
                  Safety Tips
                </h3>
              </div>

              {/* Icon row */}
              <div className="flex items-center justify-around mb-5">
                {[
                  { icon: Ban,   label: "No fees"  },
                  { icon: Users, label: "Bring help" },
                  { icon: Eye,   label: "Inspect"   },
                  { icon: ShieldCheck, label: "Secure pay" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium tracking-wide">{label}</span>
                  </div>
                ))}
              </div>

              <ul className="space-y-2.5">
                {[
                  "Avoid paying inspection or reservation fees upfront",
                  "Bring a trusted mechanic when collecting parts in person",
                  "Verify the part number matches your vehicle before paying",
                  "Don't transfer money directly — use VOOM's secure checkout",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm text-emerald-900 dark:text-emerald-200 leading-snug">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky mobile bottom bar ───────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/95 backdrop-blur-lg border-t border-border/20 px-4 py-3 safe-area-pb">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            size="lg"
            className="flex-1 h-12 text-white rounded-full tracking-wide shadow-md"
            disabled={outOfStock || addToCart.isPending}
            onClick={handleAddToCart}
            data-testid="button-add-to-cart-mobile"
          >
            <ShoppingCart className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="truncate">
              {addToCart.isPending ? "Adding…" : outOfStock ? "Out of Stock" : "Add to Cart"}
            </span>
          </Button>
          {whatsappLink && (
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-4 border-voom-green/60 text-voom-green hover:bg-voom-green/5 rounded-full tracking-wide flex-shrink-0"
              asChild
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="no-underline flex items-center" data-testid="link-whatsapp-mobile">
                <MessageCircle className="h-5 w-5 mr-1.5" />
                <span>WhatsApp</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
