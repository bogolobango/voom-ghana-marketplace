import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import ProductCard from "@/components/ProductCard";
import {
  Search, ArrowRight, ShieldCheck, Truck, MessageCircle,
  Cog, CircleStop, ArrowUpDown, Zap, Car, Settings,
  Wind, Thermometer, Droplets, Lightbulb, Circle, Armchair, Store,
} from "lucide-react";
import { useState } from "react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "engine-parts": <Cog className="h-6 w-6" />,
  "brake-system": <CircleStop className="h-6 w-6" />,
  "suspension": <ArrowUpDown className="h-6 w-6" />,
  "electrical": <Zap className="h-6 w-6" />,
  "body-parts": <Car className="h-6 w-6" />,
  "transmission": <Settings className="h-6 w-6" />,
  "exhaust-system": <Wind className="h-6 w-6" />,
  "cooling-system": <Thermometer className="h-6 w-6" />,
  "filters-fluids": <Droplets className="h-6 w-6" />,
  "lighting": <Lightbulb className="h-6 w-6" />,
  "tires-wheels": <Circle className="h-6 w-6" />,
  "interior": <Armchair className="h-6 w-6" />,
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const categories = trpc.category.list.useQuery();
  const featured = trpc.product.featured.useQuery();
  const latest = trpc.product.latest.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-voom-navy overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 25% 50%, rgba(255,165,0,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(255,165,0,0.15) 0%, transparent 50%)"
          }} />
        </div>
        <div className="container relative py-16 md:py-24">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-white/80">
              <Store className="h-4 w-4 text-primary" />
              Ghana's Digital Car Parts Marketplace
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Find the Right Part.{" "}
              <span className="text-primary">Fast.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-lg leading-relaxed">
              Search thousands of genuine and affordable car parts from verified vendors across Ghana. From Abossey Okai to your doorstep.
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts, e.g. 'Toyota Camry brake pads'"
                  className="pl-10 h-12 bg-white text-foreground border-0 shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                />
              </div>
              <Button
                size="lg"
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg"
                onClick={() => {
                  if (searchQuery.trim()) {
                    window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                  }
                }}
              >
                Search
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-white">1,000+</p>
                <p className="text-xs text-white/50">Parts Listed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-xs text-white/50">Verified Vendors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">16</p>
                <p className="text-xs text-white/50">Regions Covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-14 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Shop by Category</h2>
              <p className="text-sm text-muted-foreground mt-1">Find parts organized by system</p>
            </div>
            <Link href="/categories">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {(categories.data || []).slice(0, 12).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="no-underline">
                <Card className="hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {CATEGORY_ICONS[cat.slug] || <Cog className="h-6 w-6" />}
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight">{cat.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {(featured.data?.length || 0) > 0 && (
        <section className="py-14 bg-muted/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Featured Parts</h2>
                <p className="text-sm text-muted-foreground mt-1">Handpicked deals from top vendors</p>
              </div>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.data?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="py-14 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recently Added</h2>
              <p className="text-sm text-muted-foreground mt-1">Fresh inventory from our vendors</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                Browse All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {(latest.data?.length || 0) > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latest.data?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Marketplace is Getting Ready</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Vendors are setting up their shops. Check back soon for thousands of car parts, or register as a vendor to start selling.
                </p>
                {!isAuthenticated && (
                  <Button className="mt-6" asChild>
                    <a href={getLoginUrl()}>Get Started</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Value Props */}
      <section className="py-14 bg-voom-navy">
        <div className="container">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Why VOOM?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard
              icon={<ShieldCheck className="h-7 w-7" />}
              title="Verified Vendors"
              description="Every vendor is vetted and approved. Buy with confidence knowing you're dealing with legitimate businesses."
            />
            <ValueCard
              icon={<MessageCircle className="h-7 w-7" />}
              title="WhatsApp Integration"
              description="Communicate directly with vendors via WhatsApp. Negotiate, ask questions, and confirm orders instantly."
            />
            <ValueCard
              icon={<Truck className="h-7 w-7" />}
              title="Nationwide Delivery"
              description="From Accra to Tamale, get parts delivered across all 16 regions of Ghana with tracked shipping."
            />
          </div>
        </div>
      </section>

      {/* CTA for Vendors */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Are You a Spare Parts Dealer?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Join VOOM and reach thousands of buyers across Ghana. List your products, manage orders, and grow your business digitally.
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" asChild>
              <a href={getLoginUrl()} className="text-white no-underline">Start Selling Today</a>
            </Button>
            <Link href="/vendors">
              <Button size="lg" variant="outline">
                View Vendors
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center space-y-3 p-6">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-white">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}
