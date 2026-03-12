import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { formatGHS, generateWhatsAppLink } from "@shared/marketplace";
import {
  ShoppingCart, MessageCircle, MapPin, Star, ArrowLeft,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const p = product.data;
  if (!p) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Product not found</h2>
        <Link href="/products"><Button variant="outline">Browse Parts</Button></Link>
      </div>
    );
  }

  const images = (p.images as string[] | null) || [];
  const vendor = p.vendor;

  const whatsappMessage = `Hi, I'm interested in "${p.name}" listed at ${formatGHS(p.price)} on VOOM Ghana Marketplace. Is it still available?`;
  const whatsappLink = vendor?.whatsapp ? generateWhatsAppLink(vendor.whatsapp, whatsappMessage) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary no-underline">
            <ArrowLeft className="h-4 w-4" /> Back to Parts
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden">
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
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      i === selectedImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            {/* Vehicle Compatibility */}
            {p.vehicleMake && (
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                {p.vehicleMake} {p.vehicleModel}
                {p.yearFrom && ` • ${p.yearFrom}${p.yearTo ? `–${p.yearTo}` : "+"}`}
              </p>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{p.name}</h1>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={p.condition === "new" ? "default" : "secondary"}>
                {p.condition === "new" ? "Brand New" : p.condition === "used" ? "Used / Tokunbo" : "Refurbished"}
              </Badge>
              {p.brand && <Badge variant="outline">{p.brand}</Badge>}
              {p.quantity !== undefined && p.quantity > 0 && (
                <span className="text-sm text-voom-green font-medium flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> In Stock ({p.quantity} available)
                </span>
              )}
              {p.quantity === 0 && (
                <span className="text-sm text-destructive font-medium">Out of Stock</span>
              )}
            </div>

            {/* Price */}
            <div className="bg-primary/5 rounded-xl p-5">
              <p className="text-3xl font-extrabold text-primary">{formatGHS(p.price)}</p>
              {p.minOrderQty && p.minOrderQty > 1 && (
                <p className="text-sm text-muted-foreground mt-1">Min. order: {p.minOrderQty} units</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-12 text-white"
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
                <Button size="lg" variant="outline" className="h-12 border-voom-green text-voom-green hover:bg-voom-green/5" asChild>
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
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{p.description}</p>
              </div>
            )}

            <Separator />

            {/* Vendor Card */}
            {vendor && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/vendors/${vendor.id}`} className="font-semibold text-foreground hover:text-primary no-underline">
                        {vendor.businessName}
                      </Link>
                      {vendor.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" /> {vendor.city}, {vendor.region}
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3.5 w-3.5" /> {vendor.phone}
                        </p>
                      )}
                    </div>
                    <Link href={`/vendors/${vendor.id}`}>
                      <Button variant="outline" size="sm">View Shop</Button>
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
