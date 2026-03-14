import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearch, useLocation } from "wouter";
import { VEHICLE_MAKES, PART_CONDITIONS } from "@shared/marketplace";
import { useVehicle } from "@/contexts/VehicleContext";

const YEARS = Array.from({ length: 30 }, (_, i) => String(2026 - i));

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-white/20 h-full zen-card">
      <Skeleton className="aspect-square rounded-t-3xl" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 mt-2" />
      </div>
    </Card>
  );
}

export default function Products() {
  const searchParams = new URLSearchParams(useSearch());
  const [, navigate] = useLocation();
  const { vehicle } = useVehicle();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [vehicleMake, setVehicleMake] = useState(searchParams.get("make") || vehicle.make || "");
  const [vehicleModel, setVehicleModel] = useState(searchParams.get("model") || vehicle.model || "");
  const [vehicleYear, setVehicleYear] = useState(searchParams.get("year") || vehicle.year || "");
  const [condition, setCondition] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(!!(searchParams.get("make") || vehicle.make));
  const [page, setPage] = useState(0);

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const categories = trpc.category.list.useQuery();
  const models = trpc.product.models.useQuery({ make: vehicleMake }, { enabled: !!vehicleMake });

  // Debounced autocomplete query
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutocompleteQuery(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const autocomplete = trpc.product.autocomplete.useQuery(
    { query: autocompleteQuery },
    { enabled: autocompleteQuery.length >= 2 && showAutocomplete }
  );

  // Close autocomplete on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filters = useMemo(() => ({
    search: search || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    vehicleMake: vehicleMake || undefined,
    vehicleModel: vehicleModel || undefined,
    yearFrom: vehicleYear ? Number(vehicleYear) : undefined,
    yearTo: vehicleYear ? Number(vehicleYear) : undefined,
    condition: condition || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy,
    limit: 20,
    offset: page * 20,
  }), [search, categoryId, vehicleMake, vehicleModel, vehicleYear, condition, minPrice, maxPrice, sortBy, page]);

  const products = trpc.product.search.useQuery(filters);

  const hasActiveFilters = !!(search || categoryId || vehicleMake || vehicleModel || vehicleYear || condition || minPrice || maxPrice);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setVehicleMake("");
    setVehicleModel("");
    setVehicleYear("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setPage(0);
  };

  const selectAutocomplete = useCallback((name: string) => {
    setSearch(name);
    setShowAutocomplete(false);
    setPage(0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-white/50 backdrop-blur-xl border-b border-white/20">
        <div className="container py-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search parts by name, brand, or vehicle..."
                className="pl-11 h-12 rounded-[100px] bg-white/60 backdrop-blur-sm border-white/20 tracking-wide"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); setShowAutocomplete(true); }}
                onFocus={() => search.length >= 2 && setShowAutocomplete(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setShowAutocomplete(false);
                  if (e.key === "Escape") setShowAutocomplete(false);
                }}
              />
              {/* Autocomplete Dropdown */}
              {showAutocomplete && autocompleteQuery.length >= 2 && (autocomplete.data?.length || 0) > 0 && (
                <div
                  ref={autocompleteRef}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg overflow-hidden z-50"
                >
                  {autocomplete.data?.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-3 border-b border-border/10 last:border-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectAutocomplete(item.name)}
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm tracking-wide truncate">{item.name}</p>
                        {(item.brand || item.vehicleMake) && (
                          <p className="text-[11px] text-muted-foreground/60 tracking-wide">
                            {[item.brand, item.vehicleMake].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="h-12 gap-2 rounded-full border-white/20 tracking-wide"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-white/20">
              <Select value={vehicleYear} onValueChange={(v) => { setVehicleYear(v); setPage(0); }}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={vehicleMake} onValueChange={(v) => { setVehicleMake(v); setVehicleModel(""); setPage(0); }}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Vehicle Make" /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_MAKES.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={vehicleModel} onValueChange={(v) => { setVehicleModel(v); setPage(0); }} disabled={!vehicleMake}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Model" /></SelectTrigger>
                <SelectContent>
                  {(models.data || []).map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(0); }}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {(categories.data || []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={condition} onValueChange={(v) => { setCondition(v); setPage(0); }}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent>
                  {PART_CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range */}
              <div className="col-span-2 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min GH₵"
                  className="rounded-2xl h-10"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(0); }}
                />
                <span className="text-muted-foreground/40 text-sm">–</span>
                <Input
                  type="number"
                  placeholder="Max GH₵"
                  className="rounded-2xl h-10"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(0); }}
                />
              </div>
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-muted-foreground tracking-wide">Active filters:</span>
              {search && <FilterTag label={`"${search}"`} onRemove={() => setSearch("")} />}
              {vehicleYear && <FilterTag label={`Year: ${vehicleYear}`} onRemove={() => setVehicleYear("")} />}
              {categoryId && (
                <FilterTag
                  label={categories.data?.find(c => String(c.id) === categoryId)?.name || "Category"}
                  onRemove={() => setCategoryId("")}
                />
              )}
              {vehicleMake && <FilterTag label={vehicleMake} onRemove={() => { setVehicleMake(""); setVehicleModel(""); }} />}
              {vehicleModel && <FilterTag label={vehicleModel} onRemove={() => setVehicleModel("")} />}
              {condition && <FilterTag label={condition} onRemove={() => setCondition("")} />}
              {minPrice && <FilterTag label={`Min: GH₵${minPrice}`} onRemove={() => setMinPrice("")} />}
              {maxPrice && <FilterTag label={`Max: GH₵${maxPrice}`} onRemove={() => setMaxPrice("")} />}
              <button onClick={clearFilters} className="text-xs text-primary/90 hover:underline ml-1 tracking-wide">Clear all</button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground tracking-wide">
            {products.data ? `${products.data.total} parts found` : "Loading..."}
          </p>
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
            <Select value={sortBy} onValueChange={(v: any) => { setSortBy(v); setPage(0); }}>
              <SelectTrigger className="w-[170px] h-9 rounded-full border-white/20 text-xs tracking-wide">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {products.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (products.data?.products.length || 0) > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {products.data?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {(products.data?.total || 0) > 20 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border/30 tracking-wide"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4 tracking-wide">
                  Page {page + 1} of {Math.ceil((products.data?.total || 0) / 20)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border/30 tracking-wide"
                  disabled={(page + 1) * 20 >= (products.data?.total || 0)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="border-dashed border-white/20 rounded-3xl glass shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
            <CardContent className="py-20 text-center">
              <Search className="h-10 w-10 mx-auto mb-5 text-muted-foreground/40" />
              <h3 className="font-light tracking-wide text-lg mb-3">No parts found</h3>
              <p className="text-muted-foreground text-sm tracking-wide">
                Try adjusting your search or filters to find what you need.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-5 rounded-full border-border/30 tracking-wide" onClick={clearFilters}>
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
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary/90 text-xs font-medium px-3 py-1.5 rounded-full tracking-wide">
      {label}
      <button onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
