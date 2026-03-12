import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { formatGHS } from "@shared/marketplace";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const cart = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const updateItem = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });
  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); toast.success("Item removed"); },
  });
  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); toast.success("Cart cleared"); },
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-24 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto mb-6 text-muted-foreground/30" />
        <h2 className="text-xl font-light tracking-wide mb-3">Sign in to view your cart</h2>
        <p className="text-muted-foreground/70 text-sm tracking-wide">You need to be signed in to manage your shopping cart.</p>
      </div>
    );
  }

  if (cart.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  const items = cart.data || [];
  const total = items.reduce((sum, item) => {
    const price = item.product ? parseFloat(item.product.price) : 0;
    return sum + price * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto mb-6 text-muted-foreground/30" />
        <h2 className="text-xl font-light tracking-wide mb-3">Your cart is empty</h2>
        <p className="text-muted-foreground/70 text-sm tracking-wide mb-8">Browse our marketplace to find the parts you need.</p>
        <Link href="/products"><Button className="rounded-full px-8">Browse Parts</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container py-10">
        <h1 className="text-2xl font-light tracking-wide mb-8">Shopping Cart ({items.length} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              const images = (product.images as string[] | null) || [];
              return (
                <Card key={item.id} className="zen-card glass rounded-2xl border-white/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                  <CardContent className="p-5">
                    <div className="flex gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-white/30 backdrop-blur-sm overflow-hidden flex-shrink-0">
                        {images[0] ? (
                          <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${product.id}`} className="font-medium tracking-wide text-sm hover:text-primary/80 no-underline line-clamp-2">
                          {product.name}
                        </Link>
                        {product.vehicleMake && (
                          <p className="text-xs text-muted-foreground/60 tracking-wide mt-1">
                            {product.vehicleMake} {product.vehicleModel}
                          </p>
                        )}
                        <p className="text-primary/90 font-medium tracking-wide mt-1.5">{formatGHS(product.price)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/50 hover:text-destructive/80 rounded-xl"
                          onClick={() => removeItem.mutate({ id: item.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-xl border-white/20"
                            disabled={item.quantity <= 1}
                            onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium tracking-wide w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-xl border-white/20"
                            onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Button variant="ghost" size="sm" className="text-destructive/70 tracking-wide" onClick={() => clearCart.mutate()}>
              Clear Cart
            </Button>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-20 glass-strong rounded-3xl border-white/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium tracking-wide">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground/70 tracking-wide truncate mr-2">
                        {item.product?.name} x{item.quantity}
                      </span>
                      <span className="font-medium tracking-wide flex-shrink-0">
                        {formatGHS(parseFloat(item.product?.price || "0") * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between font-medium tracking-wide text-lg">
                  <span>Total</span>
                  <span className="text-primary/90">{formatGHS(total)}</span>
                </div>
                <Button
                  className="w-full h-12 text-white rounded-full"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-[11px] text-center text-muted-foreground/60 tracking-wide">
                  Orders are confirmed via WhatsApp with the vendor
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
