import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { formatGHS } from "@shared/marketplace";
import { Package, Loader2, ShoppingCart } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const { isAuthenticated, loading } = useAuth();
  const orders = trpc.order.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your orders</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {orders.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (orders.data?.length || 0) > 0 ? (
          <div className="space-y-3">
            {orders.data?.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(order.createdAt).toLocaleDateString("en-GH", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-lg">{formatGHS(order.totalAmount)}</span>
                    {order.shippingCity && (
                      <span className="text-xs text-muted-foreground">
                        Ship to: {order.shippingCity}, {order.shippingRegion}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <ShoppingCart className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Start shopping to see your orders here.</p>
              <Link href="/products"><Button>Browse Parts</Button></Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
