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
    <div className="min-h-screen bg-background">
      <div className="bg-voom-navy py-10">
        <div className="container">
          <h1 className="text-3xl font-bold text-white">Browse by Category</h1>
          <p className="text-white/60 mt-2">Find parts organized by vehicle system</p>
        </div>
      </div>

      <div className="container py-8">
        {categories.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(categories.data || []).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="no-underline">
                <Card className="hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      {CATEGORY_ICONS[cat.slug] || <Cog className="h-8 w-8" />}
                    </div>
                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
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
