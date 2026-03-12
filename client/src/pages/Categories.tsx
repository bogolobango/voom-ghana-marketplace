import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Cog, CircleStop, ArrowUpDown, Zap, Car, Settings,
  Wind, Thermometer, Droplets, Lightbulb, Circle, Armchair, Loader2,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "engine-parts": <Cog className="h-8 w-8" />,
  "brake-system": <CircleStop className="h-8 w-8" />,
  "suspension": <ArrowUpDown className="h-8 w-8" />,
  "electrical": <Zap className="h-8 w-8" />,
  "body-parts": <Car className="h-8 w-8" />,
  "transmission": <Settings className="h-8 w-8" />,
  "exhaust-system": <Wind className="h-8 w-8" />,
  "cooling-system": <Thermometer className="h-8 w-8" />,
  "filters-fluids": <Droplets className="h-8 w-8" />,
  "lighting": <Lightbulb className="h-8 w-8" />,
  "tires-wheels": <Circle className="h-8 w-8" />,
  "interior": <Armchair className="h-8 w-8" />,
};

export default function Categories() {
  const categories = trpc.category.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white/60">
      <div className="zen-hero py-14">
        <div className="container">
          <h1 className="text-3xl font-light tracking-wide text-white">Browse by Category</h1>
          <p className="text-white/50 mt-3 tracking-wide">Find parts organized by vehicle system</p>
        </div>
      </div>

      <div className="container py-10">
        {categories.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {(categories.data || []).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="no-underline">
                <Card className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] hover:border-primary/20 transition-all duration-500 group cursor-pointer h-full">
                  <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/70 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      {CATEGORY_ICONS[cat.slug] || <Cog className="h-8 w-8" />}
                    </div>
                    <h3 className="font-medium tracking-wide text-foreground/80">{cat.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
