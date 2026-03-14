import { trpc } from "@/lib/trpc";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import CategoryOrb from "@/components/CategoryOrb";
import { Link } from "wouter";

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
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground/70 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Categories</span>
        </nav>

        {categories.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 py-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : categories.error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive/60" />
            <h3 className="font-medium text-lg">Failed to load categories</h3>
            <p className="text-sm text-muted-foreground">{categories.error.message}</p>
            <Button variant="outline" onClick={() => categories.refetch()} className="rounded-full">
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-12 py-8">
            {(categories.data || []).map((cat) => (
              <CategoryOrb key={cat.id} id={cat.id} name={cat.name} slug={cat.slug} icon={cat.icon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
