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
      {/* Hero Section — with car background */}
      <section className="zen-hero" style={{
        backgroundImage: "linear-gradient(145deg, rgba(20,20,30,0.78) 0%, rgba(15,15,25,0.65) 50%, rgba(10,10,20,0.72) 100%), url('/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}>
        <div className="container relative py-20 md:py-28 lg:py-32">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2.5 glass-dark rounded-full px-5 py-2 text-sm text-white/80 tracking-wide">
              <Store className="h-4 w-4 text-primary/80" />
              Ghana's Digital Car Parts Marketplace
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-[1.1] tracking-[0.02em]">
              Find the Right Part.{" "}
              <span className="text-primary font-normal">Fast.</span>
            </h1>
            <p className="text-lg text-white/55 max-w-lg leading-relaxed tracking-wide font-light">
              Search thousands of genuine and affordable car parts from verified vendors across Ghana. From Abossey Okai to your doorstep.
            </p>

            {/* Search Bar — frosted glass capsule */}
            <div className="flex gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <Input
                  placeholder="Search parts, e.g. 'Toyota Camry brake pads'"
                  className="pl-11 h-13 bg-white/90 text-foreground border-white/30 rounded-[100px] shadow-[0_8px_32px_-6px_rgba(0,0,0,0.12)] backdrop-blur-xl"
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
                className="h-13 px-7 bg-primary/90 hover:bg-primary text-white rounded-[100px] shadow-[0_8px_32px_-6px_rgba(0,0,0,0.15)]"
                onClick={() => {
                  if (searchQuery.trim()) {
                    window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                  }
                }}
              >
                Search
              </Button>
            </div>

            {/* Quick Stats — glass tiles */}
            <div className="flex gap-6 pt-6">
              <div className="glass-dark rounded-2xl px-5 py-3">
                <p className="text-2xl font-light text-white tracking-wide">1,000+</p>
                <p className="text-[11px] text-white/40 tracking-wider uppercase mt-0.5">Parts Listed</p>
              </div>
              <div className="glass-dark rounded-2xl px-5 py-3">
                <p className="text-2xl font-light text-white tracking-wide">50+</p>
                <p className="text-[11px] text-white/40 tracking-wider uppercase mt-0.5">Verified Vendors</p>
              </div>
              <div className="glass-dark rounded-2xl px-5 py-3">
                <p className="text-2xl font-light text-white tracking-wide">16</p>
                <p className="text-[11px] text-white/40 tracking-wider uppercase mt-0.5">Regions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories + Recently Added — shared blurred background */}
      <div className="relative overflow-hidden" style={{
        backgroundImage: "url('/categories-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}>
        {/* Blur + white overlay */}
        <div className="absolute inset-0 backdrop-blur-2xl" style={{ background: "rgba(255,255,255,0.82)" }} />

      {/* Categories Grid — glassmorphism tiles */}
      <section className="zen-section relative">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-light text-foreground tracking-wide">Shop by Category</h2>
              <p className="text-sm text-muted-foreground mt-2 tracking-wide">Find parts organized by system</p>
            </div>
            <Link href="/categories">
              <Button variant="ghost" size="sm" className="text-primary gap-1.5 rounded-full tracking-wide">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {(categories.data || []).slice(0, 12).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="no-underline">
                <Card className="hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.06)] transition-all duration-400 group cursor-pointer h-full zen-card border-white/25">
                  <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                    <div className="w-13 h-13 rounded-2xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/90 group-hover:text-white transition-all duration-400 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)]">
                      {CATEGORY_ICONS[cat.slug] || <Cog className="h-6 w-6" />}
                    </div>
                    <span className="text-xs font-medium text-foreground/80 leading-tight tracking-wide">{cat.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {(featured.data?.length || 0) > 0 && (
        <section className="zen-section relative">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-light text-foreground tracking-wide">Featured Parts</h2>
                <p className="text-sm text-muted-foreground mt-2 tracking-wide">Handpicked deals from top vendors</p>
              </div>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-primary gap-1.5 rounded-full tracking-wide">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featured.data?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="zen-section relative">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-light text-foreground tracking-wide">Recently Added</h2>
              <p className="text-sm text-muted-foreground mt-2 tracking-wide">Fresh inventory from our vendors</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="text-primary gap-1.5 rounded-full tracking-wide">
                Browse All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {(latest.data?.length || 0) > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {latest.data?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/30">
              <CardContent className="py-20 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-2 tracking-wide">Marketplace is Getting Ready</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto tracking-wide leading-relaxed">
                  Vendors are setting up their shops. Check back soon for thousands of car parts, or register as a vendor to start selling.
                </p>
                {!isAuthenticated && (
                  <Button className="mt-8 rounded-full" size="lg" asChild>
                    <a href={getLoginUrl()}>Get Started</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      </div>{/* end blurred bg wrapper */}

      {/* Value Props — atmospheric dark section */}
      <section className="zen-hero zen-section" style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.72) 100%), url('/why-voom-bg.jpg') center 55% / cover no-repeat",
      }}>
        <div className="container relative">
          <h2 className="text-2xl font-light text-white text-center mb-12 tracking-[0.04em]">Why VOOM?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      {/* CTA for Vendors — glass overlay */}
      <section className="zen-section" style={{ background: "rgba(255,255,255,0.3)" }}>
        <div className="container text-center">
          <h2 className="text-3xl font-light text-foreground mb-5 tracking-wide">Are You a Spare Parts Dealer?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-10 tracking-wide leading-relaxed">
            Join VOOM and reach thousands of buyers across Ghana. List your products, manage orders, and grow your business digitally.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="rounded-full" asChild>
              <a href={getLoginUrl()} className="text-white no-underline">Start Selling Today</a>
            </Button>
            <Link href="/vendors">
              <Button size="lg" variant="outline" className="rounded-full">
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
    <div className="text-center space-y-4 glass-dark rounded-3xl p-8">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-primary/80">
        {icon}
      </div>
      <h3 className="font-medium text-lg text-white tracking-wide">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed tracking-wide">{description}</p>
    </div>
  );
}
