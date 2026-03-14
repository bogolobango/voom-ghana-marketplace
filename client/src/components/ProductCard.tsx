import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, Star, Package } from "lucide-react";
import { formatGHS } from "@shared/marketplace";
import type { Product } from "../../../drizzle/schema";

interface ProductCardProps {
  product: Product;
  vendorName?: string;
}

export default function ProductCard({ product, vendorName }: ProductCardProps) {
  const images = (product.images as string[] | null) || [];
  const firstImage = images[0];

  return (
    <Link href={`/products/${product.id}`} className="no-underline group">
      <Card className="overflow-hidden border-white/20 hover:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.08)] transition-all duration-400 h-full zen-card">
        {/* Image */}
        <div className="aspect-square bg-muted/30 relative overflow-hidden rounded-t-3xl">
          {firstImage ? (
            <img
              src={firstImage}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("hidden"); }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-white/40 to-white/20 ${firstImage ? "hidden" : ""}`}>
            <Package className="w-12 h-12 opacity-20" />
          </div>
          {/* Condition Badge */}
          <Badge
            variant={product.condition === "new" ? "default" : "secondary"}
            className="absolute top-3 left-3 text-[10px] font-medium backdrop-blur-md"
          >
            {product.condition === "new" ? "New" : product.condition === "used" ? "Used" : "Refurb"}
          </Badge>
          {product.featured && (
            <Badge className="absolute top-3 right-3 bg-voom-gold/85 text-voom-navy text-[10px] font-medium backdrop-blur-md">
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          {/* Vehicle Compatibility */}
          {product.vehicleMake && (
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              {product.vehicleMake} {product.vehicleModel}
              {product.yearFrom && ` (${product.yearFrom}${product.yearTo ? `–${product.yearTo}` : "+"})`}
            </p>
          )}

          {/* Name */}
          <h3 className="font-medium text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 tracking-wide">
            {product.name}
          </h3>

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-muted-foreground tracking-wide">{product.brand}</p>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-1.5">
            <span className="text-base font-medium text-primary tracking-wide">
              {formatGHS(product.price)}
            </span>
            {product.quantity !== undefined && product.quantity <= 5 && product.quantity > 0 && (
              <span className="text-[10px] text-destructive/80 font-medium tracking-wide">
                Only {product.quantity} left
              </span>
            )}
          </div>

          {/* Vendor */}
          {vendorName && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5 tracking-wide">
              <MapPin className="h-3 w-3" /> {vendorName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
