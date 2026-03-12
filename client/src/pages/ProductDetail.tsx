import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { formatGHS, generateWhatsAppLink } from "@shared/marketplace";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingCart, MessageCircle, MapPin, Star, ArrowLeft,
  Package, ShieldCheck, Loader2, Phone, Store, Send, Hash,
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
  const sendInquiry = trpc.inquiry.create.useMutation({
    onSuccess: () => {
      toast.success("Inquiry sent! The vendor will be notified.");
      setShowInquiry(false);
      setInquiryMessage("");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const utils = trpc.useUtils();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");

  if (product.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/90" />
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
        <div className="flex items-center gap-2 mb-8">
          <Link href="/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary/90 no-underline tracking-wide">
            <ArrowLeft className="h-4 w-4" /> Back to Parts
          </Link>
        </div>

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
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                      i === selectedImage ? "border-primary/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
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
              <Badge
                variant={p.condition === "new" ? "default" : "secondary"}
                className={`rounded-full tracking-wide ${
                  p.condition === "new" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/40" :
                  p.condition === "used" ? "bg-amber-50 text-amber-700 border border-amber-200/40" :
                  "bg-sky-50 text-sky-700 border border-sky-200/40"
                }`}
              >
                {p.condition === "new" ? "Brand New" : p.condition === "used" ? "Used / Tokunbo" : "Refurbished"}
              </Badge>
              {p.brand && <Badge variant="outline" className="rounded-full border-border/30 tracking-wide">{p.brand}</Badge>}
              {p.oemPartNumber && (
                <Badge variant="outline" className="rounded-full border-border/30 tracking-wide font-mono text-xs">
                  <Hash className="h-3 w-3 mr-1" /> {p.oemPartNumber}
                </Badge>
              )}
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

            {/* Actions — Request to Buy Flow */}
            <div className="space-y-3">
              <div className="flex gap-3">
                {whatsappLink && (
                  <Button size="lg" className="flex-1 h-13 bg-voom-green hover:bg-voom-green/90 text-white rounded-full tracking-wide shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]" asChild>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="no-underline">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Chat on WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 h-13 rounded-full border-primary/30 text-primary hover:bg-primary/5 tracking-wide"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please sign in to send an inquiry");
                      return;
                    }
                    setShowInquiry(!showInquiry);
                  }}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Inquire In-App
                </Button>
              </div>

              {/* In-App Inquiry Form */}
              {showInquiry && (
                <Card className="zen-card rounded-2xl border-primary/10 bg-primary/[0.02]">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium tracking-wide">Send an inquiry to this vendor</p>
                    <Textarea
                      placeholder={`Hi, I'm interested in "${p.name}". Is it available? What's the best price?`}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="rounded-xl border-border/30 text-sm min-h-[80px]"
                    />
                    <Button
                      className="w-full rounded-full"
                      disabled={sendInquiry.isPending}
                      onClick={() => {
                        if (!vendor) return;
                        sendInquiry.mutate({
                          productId: p.id,
                          vendorId: vendor.id,
                          message: inquiryMessage || `I'm interested in "${p.name}". Is it available?`,
                        });
                      }}
                    >
                      {sendInquiry.isPending ? "Sending..." : "Send Inquiry"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Secondary: Add to Cart */}
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 rounded-full border-border/30 tracking-wide text-muted-foreground"
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
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addToCart.isPending ? "Adding..." : "Add to Cart"}
              </Button>
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
                      <div className="flex items-center gap-3 mt-1">
                        {vendor.city && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1 tracking-wide">
                            <MapPin className="h-3.5 w-3.5" /> {vendor.city}
                          </span>
                        )}
                        {vendor.rating && parseFloat(String(vendor.rating)) > 0 && (
                          <span className="text-sm text-amber-600 flex items-center gap-1 tracking-wide">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {parseFloat(String(vendor.rating)).toFixed(1)}
                          </span>
                        )}
                        {vendor.totalSales && vendor.totalSales > 0 && (
                          <span className="text-xs text-muted-foreground/60 tracking-wide">
                            {vendor.totalSales} sales
                          </span>
                        )}
                      </div>
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
