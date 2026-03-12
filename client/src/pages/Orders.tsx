import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { formatGHS } from "@shared/marketplace";
import { Package, Loader2, ShoppingCart } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200/40",
  confirmed: "bg-sky-50 text-sky-700 border border-sky-200/40",
  processing: "bg-indigo-50 text-indigo-700 border border-indigo-200/40",
  shipped: "bg-violet-50 text-violet-700 border border-violet-200/40",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200/40",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200/40",
};

export default function Orders() {
  const { isAuthenticated, loading } = useAuth();
  const orders = trpc.order.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-24 text-center">
        <Package className="h-12 w-12 mx-auto mb-6 text-muted-foreground/30" />
        <h2 className="text-xl font-light tracking-wide mb-2">Sign in to view your orders</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white/60">
      <div className="container py-10">
        <h1 className="text-2xl font-light tracking-wide mb-8">My Orders</h1>

        {orders.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          </div>
        ) : (orders.data?.length || 0) > 0 ? (
          <div className="space-y-4">
            {orders.data?.map((order) => (
              <Card key={order.id} className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-mono text-sm font-medium tracking-wide">{order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground/70 ml-3 tracking-wide">
                        {new Date(order.createdAt).toLocaleDateString("en-GH", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                    <span className={`text-xs font-medium tracking-wide px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-medium tracking-wide text-lg">{formatGHS(order.totalAmount)}</span>
                    {order.shippingCity && (
                      <span className="text-xs text-muted-foreground/60 tracking-wide">
                        Ship to: {order.shippingCity}, {order.shippingRegion}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-white/20 rounded-3xl bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
            <CardContent className="py-20 text-center">
              <ShoppingCart className="h-10 w-10 mx-auto mb-6 text-muted-foreground/30" />
              <h3 className="font-light tracking-wide text-lg mb-3">No orders yet</h3>
              <p className="text-muted-foreground/70 text-sm tracking-wide mb-8">Start shopping to see your orders here.</p>
              <Link href="/products"><Button className="rounded-full px-8">Browse Parts</Button></Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
