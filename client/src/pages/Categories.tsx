import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import CategoryOrb from "@/components/CategoryOrb";

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
