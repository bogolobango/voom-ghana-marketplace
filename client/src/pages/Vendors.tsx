import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { MapPin, Star, Store, Loader2 } from "lucide-react";

export default function Vendors() {
  const vendors = trpc.vendor.list.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-voom-navy py-10">
        <div className="container">
          <h1 className="text-3xl font-bold text-white">Verified Vendors</h1>
          <p className="text-white/60 mt-2">Trusted spare parts dealers across Ghana</p>
        </div>
      </div>

      <div className="container py-8">
        {vendors.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (vendors.data?.length || 0) > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.data?.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="no-underline">
                <Card className="hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        {vendor.logoUrl ? (
                          <img src={vendor.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <Store className="h-7 w-7 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {vendor.businessName}
                        </h3>
                        {vendor.city && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5" /> {vendor.city}, {vendor.region}
                          </p>
                        )}
                        {vendor.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{vendor.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1 text-voom-gold" />
                            {vendor.rating || "New"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {vendor.totalSales || 0} sales
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Store className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-semibold text-lg mb-2">No vendors yet</h3>
              <p className="text-muted-foreground text-sm">Be the first to register as a vendor on VOOM.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
