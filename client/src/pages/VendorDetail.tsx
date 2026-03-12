import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import ProductCard from "@/components/ProductCard";
import { generateWhatsAppLink } from "@shared/marketplace";
import {
  MapPin, Phone, MessageCircle, Star, Store, ArrowLeft, Loader2, Mail,
} from "lucide-react";

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const vendor = trpc.vendor.getById.useQuery({ id: Number(id) });
  const products = trpc.product.search.useQuery({ vendorId: Number(id) } as any);

  if (vendor.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const v = vendor.data;
  if (!v) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Vendor not found</h2>
        <Link href="/vendors"><Button variant="outline">Browse Vendors</Button></Link>
      </div>
    );
  }

  const whatsappLink = v.whatsapp ? generateWhatsAppLink(v.whatsapp, `Hi, I found your shop on VOOM Ghana Marketplace. I'd like to inquire about your car parts.`) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-voom-navy py-10">
        <div className="container">
          <Link href="/vendors" className="flex items-center gap-1 text-sm text-white/60 hover:text-white no-underline mb-4">
            <ArrowLeft className="h-4 w-4" /> All Vendors
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              {v.logoUrl ? (
                <img src={v.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Store className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{v.businessName}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {v.city && (
                  <span className="text-sm text-white/60 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {v.city}, {v.region}
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1 text-voom-gold" />
                  {v.rating || "New Vendor"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {v.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Contact</h3>
                {v.phone && (
                  <a href={`tel:${v.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary no-underline">
                    <Phone className="h-4 w-4" /> {v.phone}
                  </a>
                )}
                {v.email && (
                  <a href={`mailto:${v.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary no-underline">
                    <Mail className="h-4 w-4" /> {v.email}
                  </a>
                )}
                {whatsappLink && (
                  <Button variant="outline" className="w-full border-voom-green text-voom-green hover:bg-voom-green/5" asChild>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="no-underline">
                      <MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold">Stats</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Products</span>
                  <span className="font-medium">{products.data?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="font-medium">{v.totalSales || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{new Date(v.createdAt).toLocaleDateString("en-GH", { year: "numeric", month: "short" })}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold mb-4">Products ({products.data?.total || 0})</h2>
            {(products.data?.products.length || 0) > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.data?.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">This vendor hasn't listed any products yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
