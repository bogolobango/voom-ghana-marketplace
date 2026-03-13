import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Cog, Loader2 } from "lucide-react";

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {(categories.data || []).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="no-underline">
                <Card className="zen-card rounded-2xl border-white/20 bg-white/60 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-white/90 to-slate-50/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.10)] group-hover:scale-105 transition-transform duration-300">
                      {cat.icon ? (
                        <img
                          src={`/icons/${cat.icon}.png`}
                          alt={cat.name}
                          className="w-16 h-16 object-contain drop-shadow"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-primary/70">
                          <Cog className="h-8 w-8" />
                        </div>
                      )}
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
