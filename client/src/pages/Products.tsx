import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo, useId, useRef } from "react";
import { useSearch } from "wouter";
import { VEHICLE_MAKES, PART_CONDITIONS } from "@shared/marketplace";

export default function Products() {
  const searchParams = new URLSearchParams(useSearch());
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [vehicleMake, setVehicleMake] = useState(searchParams.get("make") || "");
  const [vehicleModel, setVehicleModel] = useState(searchParams.get("model") || "");
  const [yearFrom, setYearFrom] = useState(searchParams.get("yearFrom") || "");
  const [condition, setCondition] = useState("");
  const [showFilters, setShowFilters] = useState(
    !!(searchParams.get("make") || searchParams.get("model") || searchParams.get("yearFrom") || searchParams.get("categoryId"))
  );
  const [page, setPage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  const categories = trpc.category.list.useQuery();
  const models = trpc.product.models.useQuery({ make: vehicleMake }, { enabled: !!vehicleMake });

  const filters = useMemo(() => ({
    search: search || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    vehicleMake: vehicleMake || undefined,
    vehicleModel: vehicleModel || undefined,
    yearFrom: yearFrom ? Number(yearFrom) : undefined,
    condition: condition || undefined,
    limit: 20,
    offset: page * 20,
  }), [search, categoryId, vehicleMake, vehicleModel, yearFrom, condition, page]);

  // Sync filters to URL for shareable/bookmarkable searches
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (vehicleMake) params.set("make", vehicleMake);
    if (vehicleModel) params.set("model", vehicleModel);
    if (yearFrom) params.set("yearFrom", yearFrom);
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    const currentUrl = window.location.search;
    if (newUrl !== currentUrl) {
      window.history.replaceState(null, "", `/products${newUrl}`);
    }
  }, [search, categoryId, vehicleMake, vehicleModel, yearFrom]);

  const products = trpc.product.search.useQuery(filters);

  const suggestions = trpc.product.search.useQuery(
    { search: search || undefined, limit: 6, offset: 0 },
    { enabled: search.length >= 2 }
  );

  const autocompleteItems = useMemo(() => {
    if (!search || search.length < 2 || !suggestions.data?.products) return [];
    const seen = new Set<string>();
    return suggestions.data.products
      .map((p) => p.name)
      .filter((name) => {
        const lower = name.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      })
      .slice(0, 5);
  }, [search, suggestions.data]);

  const selectAutocomplete = (value: string) => {
    setSearch(value);
    setActiveIndex(-1);
    setShowAutocomplete(false);
    setPage(0);
  };

  const hasActiveFilters = !!(search || categoryId || vehicleMake || vehicleModel || yearFrom || condition);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setVehicleMake("");
    setVehicleModel("");
    setYearFrom("");
    setCondition("");
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-white/50 backdrop-blur-xl border-b border-white/20">
        <div className="container py-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search parts by name, brand, or vehicle..."
                className="pl-11 h-12 rounded-[100px] bg-white/60 backdrop-blur-sm border-white/20 tracking-wide"
                value={search}
                role="combobox"
                aria-expanded={showAutocomplete && autocompleteItems.length > 0}
                aria-controls={autocompleteId}
                aria-activedescendant={activeIndex >= 0 ? `${autocompleteId}-${activeIndex}` : undefined}
                onChange={(e) => { setSearch(e.target.value); setActiveIndex(-1); setShowAutocomplete(true); setPage(0); }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => { setTimeout(() => setShowAutocomplete(false), 150); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((prev) => Math.min(prev + 1, autocompleteItems.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((prev) => Math.max(prev - 1, -1));
                  } else if (e.key === "Enter") {
                    if (activeIndex >= 0 && autocompleteItems[activeIndex]) {
                      e.preventDefault();
                      selectAutocomplete(autocompleteItems[activeIndex]);
                    }
                  } else if (e.key === "Escape") {
                    setShowAutocomplete(false);
                    setActiveIndex(-1);
                  }
                }}
              />
              {showAutocomplete && autocompleteItems.length > 0 && (
                <div
                  id={autocompleteId}
                  role="listbox"
                  className="absolute z-50 top-full mt-1 w-full bg-white rounded-2xl shadow-lg border border-white/20 overflow-hidden"
                >
                  {autocompleteItems.map((item, index) => (
                    <button
                      key={item}
                      id={`${autocompleteId}-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`w-full text-left px-4 py-2.5 text-sm tracking-wide transition-colors ${index === activeIndex ? "bg-primary/10" : "hover:bg-primary/5"}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(e) => { e.preventDefault(); selectAutocomplete(item); }}
                    >
                      <Search className="inline h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {item}
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
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(0); }}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {(categories.data || []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
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

              <Select value={yearFrom} onValueChange={(v) => { setYearFrom(v); setPage(0); }}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }, (_, i) => String(2026 - i)).map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
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
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-muted-foreground tracking-wide">Active filters:</span>
              {search && <FilterTag label={`"${search}"`} onRemove={() => setSearch("")} />}
              {categoryId && (
                <FilterTag
                  label={categories.data?.find(c => String(c.id) === categoryId)?.name || "Category"}
                  onRemove={() => setCategoryId("")}
                />
              )}
              {vehicleMake && <FilterTag label={vehicleMake} onRemove={() => { setVehicleMake(""); setVehicleModel(""); }} />}
              {vehicleModel && <FilterTag label={vehicleModel} onRemove={() => setVehicleModel("")} />}
              {yearFrom && <FilterTag label={`Year: ${yearFrom}`} onRemove={() => setYearFrom("")} />}
              {condition && <FilterTag label={condition} onRemove={() => setCondition("")} />}
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
        </div>

        {products.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/90" />
          </div>
        ) : products.error ? (
          <Card className="border-dashed border-white/20 rounded-3xl glass shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
            <CardContent className="py-20 text-center">
              <Search className="h-10 w-10 mx-auto mb-5 text-destructive/40" />
              <h3 className="font-light tracking-wide text-lg mb-3">Failed to load products</h3>
              <p className="text-muted-foreground text-sm tracking-wide mb-5">
                {products.error.message || "An unexpected error occurred. Please try again."}
              </p>
              <Button variant="outline" className="rounded-full border-border/30 tracking-wide" onClick={() => products.refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
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
              <h3 className="font-light tracking-wide text-lg mb-3">
                {vehicleMake ? `No exact matches for ${vehicleMake}${vehicleModel ? ` ${vehicleModel}` : ""}${yearFrom ? ` (${yearFrom})` : ""}` : "No parts found"}
              </h3>
              <p className="text-muted-foreground text-sm tracking-wide">
                {vehicleMake
                  ? "Try removing the year or model filter, or browse all parts below."
                  : "Try adjusting your search or filters to find what you need."}
              </p>
              {hasActiveFilters && (
                <div className="flex gap-3 justify-center mt-5">
                  {vehicleMake && vehicleModel && (
                    <Button variant="outline" className="rounded-full border-border/30 tracking-wide" onClick={() => { setVehicleModel(""); setYearFrom(""); setPage(0); }}>
                      Show all {vehicleMake} parts
                    </Button>
                  )}
                  <Button variant="outline" className="rounded-full border-border/30 tracking-wide" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
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
