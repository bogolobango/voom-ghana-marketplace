import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearch } from "wouter";
import { VEHICLE_MAKES, PART_CONDITIONS } from "@shared/marketplace";

export default function Products() {
  const searchParams = new URLSearchParams(useSearch());
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [vehicleMake, setVehicleMake] = useState(searchParams.get("make") || "");
  const [vehicleModel, setVehicleModel] = useState("");
  const [condition, setCondition] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const categories = trpc.category.list.useQuery();
  const models = trpc.product.models.useQuery({ make: vehicleMake }, { enabled: !!vehicleMake });

  const filters = useMemo(() => ({
    search: search || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    vehicleMake: vehicleMake || undefined,
    vehicleModel: vehicleModel || undefined,
    condition: condition || undefined,
    limit: 20,
    offset: page * 20,
  }), [search, categoryId, vehicleMake, vehicleModel, condition, page]);

  const products = trpc.product.search.useQuery(filters);

  const hasActiveFilters = !!(search || categoryId || vehicleMake || vehicleModel || condition);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setVehicleMake("");
    setVehicleModel("");
    setCondition("");
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parts by name, brand, or vehicle..."
                className="pl-10 h-11"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            <Button
              variant="outline"
              className="h-11 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {(categories.data || []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={vehicleMake} onValueChange={(v) => { setVehicleMake(v); setVehicleModel(""); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Vehicle Make" /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_MAKES.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={vehicleModel} onValueChange={(v) => { setVehicleModel(v); setPage(0); }} disabled={!vehicleMake}>
                <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
                <SelectContent>
                  {(models.data || []).map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={condition} onValueChange={(v) => { setCondition(v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent>
                  {PART_CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {search && <FilterTag label={`"${search}"`} onRemove={() => setSearch("")} />}
              {categoryId && (
                <FilterTag
                  label={categories.data?.find(c => String(c.id) === categoryId)?.name || "Category"}
                  onRemove={() => setCategoryId("")}
                />
              )}
              {vehicleMake && <FilterTag label={vehicleMake} onRemove={() => { setVehicleMake(""); setVehicleModel(""); }} />}
              {vehicleModel && <FilterTag label={vehicleModel} onRemove={() => setVehicleModel("")} />}
              {condition && <FilterTag label={condition} onRemove={() => setCondition("")} />}
              <button onClick={clearFilters} className="text-xs text-primary hover:underline ml-1">Clear all</button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {products.data ? `${products.data.total} parts found` : "Loading..."}
          </p>
        </div>

        {products.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (products.data?.products.length || 0) > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.data?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {(products.data?.total || 0) > 20 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page + 1} of {Math.ceil((products.data?.total || 0) / 20)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * 20 >= (products.data?.total || 0)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-semibold text-lg mb-2">No parts found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search or filters to find what you need.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
