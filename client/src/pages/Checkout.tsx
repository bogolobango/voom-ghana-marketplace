import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { formatGHS, generateWhatsAppLink, GHANA_REGIONS, GHANA_CITIES } from "@shared/marketplace";
import { MessageCircle, Loader2, CheckCircle2, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Checkout() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const cart = trpc.cart.list.useQuery();
  const createOrder = trpc.order.create.useMutation();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    buyerName: user?.name || "",
    buyerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingRegion: "",
    notes: "",
  });
  const [orderCreated, setOrderCreated] = useState<{ orderNumber: string; whatsappLink: string } | null>(null);

  const items = cart.data || [];
  const total = items.reduce((sum, item) => {
    const price = item.product ? parseFloat(item.product.price) : 0;
    return sum + price * item.quantity;
  }, 0);

  // Group items by vendor
  type CartItemWithProduct = (typeof items)[number];
  const vendorGroups = new Map<number, CartItemWithProduct[]>();
  items.forEach((item) => {
    if (item.product) {
      const vid = item.product.vendorId;
      if (!vendorGroups.has(vid)) vendorGroups.set(vid, []);
      vendorGroups.get(vid)!.push(item);
    }
  });

  const handleSubmit = async () => {
    if (!form.buyerName || !form.buyerPhone) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    try {
      // Create one order per vendor
      let lastOrderNumber = "";
      let lastWhatsappLink = "";

      for (const [vendorId, vendorItems] of Array.from(vendorGroups.entries())) {
        const orderItems = vendorItems.map((item: CartItemWithProduct) => ({
          productId: item.product!.id,
          productName: item.product!.name,
          quantity: item.quantity,
          unitPrice: item.product!.price,
          totalPrice: (parseFloat(item.product!.price) * item.quantity).toFixed(2),
        }));

        const result = await createOrder.mutateAsync({
          vendorId,
          ...form,
          items: orderItems,
        });

        lastOrderNumber = result.orderNumber || "";

        // Build WhatsApp message for vendor
        const itemsList = vendorItems.map((vi: CartItemWithProduct) =>
          `- ${vi.product!.name} x${vi.quantity} @ ${formatGHS(vi.product!.price)}`
        ).join("\n");

        const vendorTotal = vendorItems.reduce((s: number, vi: CartItemWithProduct) => s + parseFloat(vi.product!.price) * vi.quantity, 0);
        const msg = `🛒 *New VOOM Order: ${lastOrderNumber}*\n\nBuyer: ${form.buyerName}\nPhone: ${form.buyerPhone}\n\nItems:\n${itemsList}\n\n*Total: ${formatGHS(vendorTotal)}*\n\nShipping to: ${form.shippingAddress}, ${form.shippingCity}, ${form.shippingRegion}\n\n${form.notes ? `Notes: ${form.notes}` : ""}`;

        // Get vendor WhatsApp from first item
        // We'll use a generic link for now
        lastWhatsappLink = generateWhatsAppLink(form.buyerPhone, msg);
      }

      utils.cart.list.invalidate();
      setOrderCreated({ orderNumber: lastOrderNumber, whatsappLink: lastWhatsappLink });
      toast.success("Order placed successfully!");
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
    }
  };

  if (cart.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orderCreated) {
    return (
      <div className="container py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-voom-green/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-voom-green" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
        <p className="text-muted-foreground mb-2">Order Number: <strong>{orderCreated.orderNumber}</strong></p>
        <p className="text-sm text-muted-foreground mb-8">
          Your order has been sent to the vendor. You can track it in your orders page.
        </p>
        <div className="space-y-3">
          <Button className="w-full h-12 text-white" onClick={() => navigate("/orders")}>
            View My Orders
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={() => navigate("/products")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <Button onClick={() => navigate("/products")} className="mt-4">Browse Parts</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={form.buyerName}
                      onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      value={form.buyerPhone}
                      onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                      placeholder="e.g. 0241234567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Address</Label>
                  <Input
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    placeholder="Street address or landmark"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Select value={form.shippingCity} onValueChange={(v) => setForm({ ...form, shippingCity: v })}>
                      <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                      <SelectContent>
                        {GHANA_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Region</Label>
                    <Select value={form.shippingRegion} onValueChange={(v) => setForm({ ...form, shippingRegion: v })}>
                      <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        {GHANA_REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Order Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any special instructions for the vendor..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
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
                  disabled={createOrder.isPending}
                  onClick={handleSubmit}
                >
                  {createOrder.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...</>
                  ) : (
                    <>Place Order</>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Vendor will confirm via WhatsApp
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
