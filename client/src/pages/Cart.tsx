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
      <div className="container py-20 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your cart</h2>
        <p className="text-muted-foreground text-sm">You need to be signed in to manage your shopping cart.</p>
      </div>
    );
  }

  if (cart.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="container py-20 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm mb-6">Browse our marketplace to find the parts you need.</p>
        <Link href="/products"><Button>Browse Parts</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              const images = (product.images as string[] | null) || [];
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {images[0] ? (
                          <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${product.id}`} className="font-semibold text-sm hover:text-primary no-underline line-clamp-2">
                          {product.name}
                        </Link>
                        {product.vehicleMake && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.vehicleMake} {product.vehicleModel}
                          </p>
                        )}
                        <p className="text-primary font-bold mt-1">{formatGHS(product.price)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem.mutate({ id: item.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={item.quantity <= 1}
                            onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
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
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => clearCart.mutate()}>
              Clear Cart
            </Button>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.product?.name} x{item.quantity}
                      </span>
                      <span className="font-medium flex-shrink-0">
                        {formatGHS(parseFloat(item.product?.price || "0") * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatGHS(total)}</span>
                </div>
                <Button
                  className="w-full h-12 text-white"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
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
