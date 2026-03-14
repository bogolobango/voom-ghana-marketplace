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
  ShoppingCart, MessageCircle, MapPin, Star, ChevronRight,
  Package, ShieldCheck, Loader2, Phone, Store,
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
        <div className="container py-10">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-1.5 mb-8">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image skeleton */}
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-3xl" />
              <div className="flex gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="w-16 h-16 rounded-2xl flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* Details skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-3/4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="rounded-3xl p-6 bg-white/50">
                <Skeleton className="h-8 w-36" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-13 flex-1 rounded-full" />
                <Skeleton className="h-13 w-32 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const p = product.data;
  if (!p) {
    return (
      <div className="container py-24 text-center">
        <h2 className="text-xl font-light tracking-wide mb-3">Product not found</h2>
        <Link href="/products"><Button variant="outline" className="rounded-full border-border/30 tracking-wide">Browse Parts</Button></Link>
      </div>
    );
  }

  const images = (p.images as string[] | null) || [];
  const vendor = p.vendor;

  const whatsappMessage = `Hi, I'm interested in "${p.name}" listed at ${formatGHS(p.price)} on VOOM Ghana Marketplace. Is it still available?`;
  const whatsappLink = vendor?.whatsapp ? generateWhatsAppLink(vendor.whatsapp, whatsappMessage) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground/70 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary/90 no-underline tracking-wide">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-primary/90 no-underline tracking-wide">Parts</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground/80 tracking-wide">{p.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage] || images[0]}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="h-20 w-20 opacity-20" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`View image ${i + 1} of ${images.length}`}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                      i === selectedImage ? "border-primary/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Vehicle Compatibility */}
            {p.vehicleMake && (
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-[0.08em]">
                {p.vehicleMake} {p.vehicleModel}
                {p.yearFrom && ` • ${p.yearFrom}${p.yearTo ? `–${p.yearTo}` : "+"}`}
              </p>
            )}

            <h1 className="text-2xl md:text-3xl font-light tracking-wide text-foreground">{p.name}</h1>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={p.condition === "new" ? "default" : "secondary"} className="rounded-full tracking-wide">
                {p.condition === "new" ? "Brand New" : p.condition === "used" ? "Used / Tokunbo" : "Refurbished"}
              </Badge>
              {p.brand && <Badge variant="outline" className="rounded-full border-border/30 tracking-wide">{p.brand}</Badge>}
              {p.quantity !== undefined && p.quantity > 0 && (
                <span className="text-sm text-voom-green font-medium flex items-center gap-1 tracking-wide">
                  <ShieldCheck className="h-4 w-4" /> In Stock ({p.quantity} available)
                </span>
              )}
              {p.quantity === 0 && (
                <span className="text-sm text-destructive font-medium tracking-wide">Out of Stock</span>
              )}
            </div>

            {/* Price */}
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
              <p className="text-3xl font-light tracking-[0.03em] text-primary/90">{formatGHS(p.price)}</p>
              {p.minOrderQty && p.minOrderQty > 1 && (
                <p className="text-sm text-muted-foreground mt-1.5 tracking-wide">Min. order: {p.minOrderQty} units</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-13 text-white rounded-full tracking-wide shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]"
                disabled={p.quantity === 0 || addToCart.isPending}
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error("Please sign in to add items to cart");
                    return;
                  }
                  addToCart.mutate({ productId: p.id, quantity: 1 }, {
                    onSuccess: () => utils.cart.list.invalidate(),
                  });
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addToCart.isPending ? "Adding..." : "Add to Cart"}
              </Button>
              {whatsappLink && (
                <Button size="lg" variant="outline" className="h-13 border-voom-green/60 text-voom-green hover:bg-voom-green/5 rounded-full tracking-wide" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="no-underline">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>

            {/* Description */}
            {p.description && (
              <div>
                <h3 className="font-medium tracking-wide mb-3">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap tracking-wide">{p.description}</p>
              </div>
            )}

            <Separator className="bg-border/30" />

            {/* Vendor Card */}
            {vendor && (
              <Card className="zen-card rounded-3xl border-white/20 glass shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-6 w-6 text-primary/90" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/vendors/${vendor.id}`} className="font-medium tracking-wide text-foreground hover:text-primary/90 no-underline">
                        {vendor.businessName}
                      </Link>
                      {vendor.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 tracking-wide">
                          <MapPin className="h-3.5 w-3.5" /> {vendor.city}, {vendor.region}
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 tracking-wide">
                          <Phone className="h-3.5 w-3.5" /> {vendor.phone}
                        </p>
                      )}
                    </div>
                    <Link href={`/vendors/${vendor.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full border-border/30 tracking-wide">View Shop</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
