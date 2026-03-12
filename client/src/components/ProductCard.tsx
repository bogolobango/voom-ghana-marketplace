import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, Star } from "lucide-react";
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
      <Card className="overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full">
        {/* Image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {firstImage ? (
            <img
              src={firstImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
          {/* Condition Badge */}
          <Badge
            variant={product.condition === "new" ? "default" : "secondary"}
            className="absolute top-2 left-2 text-[10px] font-semibold"
          >
            {product.condition === "new" ? "New" : product.condition === "used" ? "Used" : "Refurb"}
          </Badge>
          {product.featured && (
            <Badge className="absolute top-2 right-2 bg-voom-gold text-voom-navy text-[10px] font-semibold">
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-3.5 space-y-1.5">
          {/* Vehicle Compatibility */}
          {product.vehicleMake && (
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
              {product.vehicleMake} {product.vehicleModel}
              {product.yearFrom && ` (${product.yearFrom}${product.yearTo ? `–${product.yearTo}` : "+"})`}
            </p>
          )}

          {/* Name */}
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold text-primary">
              {formatGHS(product.price)}
            </span>
            {product.quantity !== undefined && product.quantity <= 5 && product.quantity > 0 && (
              <span className="text-[10px] text-destructive font-medium">
                Only {product.quantity} left
              </span>
            )}
          </div>

          {/* Vendor */}
          {vendorName && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
              <MapPin className="h-3 w-3" /> {vendorName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
