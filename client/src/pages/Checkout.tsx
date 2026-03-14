import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { formatGHS, generateWhatsAppLink, GHANA_REGIONS, GHANA_CITIES } from "@shared/marketplace";
import { MessageCircle, Loader2, CheckCircle2, Package, Smartphone, CreditCard, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type PaymentMethod = "mobile_money" | "card" | "pay_on_delivery";

export default function Checkout() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState<{
    orderNumber: string;
    vendorWhatsappLinks: { vendorName: string; link: string }[];
    paymentMethod: PaymentMethod;
  } | null>(null);

  // Handle Paystack redirect callback — verify payment
  const paystackReference = searchParams.get("reference");
  useEffect(() => {
    if (paystackReference) {
      fetch(`/api/payments/verify/${encodeURIComponent(paystackReference)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            toast.success("Payment confirmed!");
          } else {
            toast.error("Payment could not be verified. Please contact support.");
          }
        })
        .catch(() => {
          toast.error("Failed to verify payment");
        });
    }
  }, [paystackReference]);

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

    setIsProcessing(true);

    try {
      // Create one order per vendor
      const vendorWhatsappLinks: { vendorName: string; link: string }[] = [];
      let lastOrderNumber = "";

      for (const [vendorId, vendorItems] of Array.from(vendorGroups.entries())) {
        const orderItemsData = vendorItems.map((item: CartItemWithProduct) => ({
          productId: item.product!.id,
          productName: item.product!.name,
          quantity: item.quantity,
          unitPrice: item.product!.price,
          totalPrice: (parseFloat(item.product!.price) * item.quantity).toFixed(2),
        }));

        const result = await createOrder.mutateAsync({
          vendorId,
          ...form,
          paymentMethod,
          items: orderItemsData,
        });

        lastOrderNumber = result.orderNumber || "";

        // Build WhatsApp message for vendor
        const itemsList = vendorItems.map((vi: CartItemWithProduct) =>
          `- ${vi.product!.name} x${vi.quantity} @ ${formatGHS(vi.product!.price)}`
        ).join("\n");

        const vendorTotal = vendorItems.reduce(
          (s: number, vi: CartItemWithProduct) => s + parseFloat(vi.product!.price) * vi.quantity, 0
        );

        const payMethodLabel = paymentMethod === "mobile_money" ? "MoMo" : paymentMethod === "card" ? "Card" : "Pay on Pickup/Delivery";
        const msg = `*New VOOM Order: ${lastOrderNumber}*\n\nBuyer: ${form.buyerName}\nPhone: ${form.buyerPhone}\nPayment: ${payMethodLabel}\n\nItems:\n${itemsList}\n\n*Total: ${formatGHS(vendorTotal)}*\n\nShipping to: ${form.shippingAddress}, ${form.shippingCity}, ${form.shippingRegion}${form.notes ? `\n\nNotes: ${form.notes}` : ""}`;

        // Try to get vendor WhatsApp — use buyer phone as fallback for the link target
        const vendorPhone = (vendorItems[0]?.product as any)?.vendor?.whatsapp || form.buyerPhone;
        const vendorName = (vendorItems[0]?.product as any)?.vendor?.businessName || "Vendor";
        vendorWhatsappLinks.push({
          vendorName,
          link: generateWhatsAppLink(vendorPhone, msg),
        });

        // For MoMo/Card payment — initialize Paystack
        if (paymentMethod === "mobile_money" || paymentMethod === "card") {
          try {
            const payRes = await fetch("/api/payments/initialize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: lastOrderNumber,
                email: user?.email || `buyer_${form.buyerPhone.replace(/\D/g, "")}@voom.gh`,
                amount: vendorTotal.toFixed(2),
                phone: form.buyerPhone,
                metadata: {
                  buyerName: form.buyerName,
                  vendorId,
                  paymentMethod,
                },
              }),
            });

            const payData = await payRes.json();

            if (payData.authorization_url) {
              // Redirect to Paystack payment page
              utils.cart.list.invalidate();
              window.location.href = payData.authorization_url;
              return; // Don't show confirmation — user is redirected
            }
          } catch (err) {
            console.error("Paystack initialization failed:", err);
            toast.error("Payment gateway unavailable. Order created — pay on pickup instead.");
          }
        }
      }

      utils.cart.list.invalidate();
      setOrderCreated({
        orderNumber: lastOrderNumber,
        vendorWhatsappLinks,
        paymentMethod,
      });
      toast.success("Order placed successfully!");
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  if (orderCreated) {
    return (
      <div className="container py-16 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
          </div>
          <h1 className="text-2xl font-light tracking-wide mb-3">Order Placed!</h1>
          <p className="text-muted-foreground/70 tracking-wide mb-1">
            Order Number: <span className="font-medium font-mono">{orderCreated.orderNumber}</span>
          </p>
          <p className="text-sm text-muted-foreground/60 tracking-wide">
            {orderCreated.paymentMethod === "pay_on_delivery"
              ? "Pay when you pick up your parts from the vendor."
              : orderCreated.paymentMethod === "mobile_money"
                ? "Payment via MoMo is being processed."
                : "Payment via card is being processed."}
          </p>
        </div>

        {/* WhatsApp vendor contact buttons */}
        {orderCreated.vendorWhatsappLinks.length > 0 && (
          <Card className="zen-card glass rounded-2xl border-white/20 mb-6">
            <CardContent className="p-5 space-y-3">
              <p className="text-sm font-medium tracking-wide">Contact your vendor to coordinate pickup/delivery:</p>
              {orderCreated.vendorWhatsappLinks.map((v, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full h-11 border-voom-green/60 text-voom-green hover:bg-voom-green/5 rounded-full tracking-wide justify-start gap-2"
                  asChild
                >
                  <a href={v.link} target="_blank" rel="noopener noreferrer" className="no-underline">
                    <MessageCircle className="h-4 w-4" />
                    Chat with {v.vendorName} on WhatsApp
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Button className="w-full h-12 text-white rounded-full" onClick={() => navigate("/orders")}>
            View My Orders
          </Button>
          <Button variant="outline" className="w-full h-12 rounded-full border-white/20" onClick={() => navigate("/products")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <Package className="h-12 w-12 mx-auto mb-6 text-muted-foreground/30" />
        <h2 className="text-xl font-light tracking-wide mb-3">Your cart is empty</h2>
        <Button onClick={() => navigate("/products")} className="mt-6 rounded-full px-8">Browse Parts</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container py-10">
        <h1 className="text-2xl font-light tracking-wide mb-8">Checkout</h1>

        {vendorGroups.size > 1 && (
          <div className="mb-8 rounded-2xl border border-amber-300/50 bg-amber-50/80 backdrop-blur-sm p-5 flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">!</span>
            <div>
              <p className="font-semibold tracking-wide text-amber-900">Multiple vendors detected</p>
              <p className="text-sm text-amber-800/70 mt-1 tracking-wide leading-relaxed">
                Your cart contains items from {vendorGroups.size} different vendors. A separate order will be created for each vendor.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="zen-card glass rounded-2xl border-white/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-4">
                <CardTitle className="font-medium tracking-wide">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="tracking-wide">Full Name *</Label>
                    <Input
                      value={form.buyerName}
                      onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label className="tracking-wide">Phone Number *</Label>
                    <Input
                      value={form.buyerPhone}
                      type="tel"
                      inputMode="numeric"
                      onChange={(e) => setForm({ ...form, buyerPhone: e.target.value.replace(/[^0-9\s-]/g, "") })}
                      placeholder="e.g. 0241234567"
                      className={form.buyerPhone && form.buyerPhone.length > 3 && !/^0[2-9]\d\d{3}\d{4}$/.test(form.buyerPhone.replace(/[\s-]/g, "")) ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}
                    />
                    {form.buyerPhone && form.buyerPhone.length > 3 && !/^0[2-9]\d\d{3}\d{4}$/.test(form.buyerPhone.replace(/[\s-]/g, "")) && (
                      <p className="text-xs text-destructive/70 mt-1.5 tracking-wide">Enter a valid Ghana phone (e.g. 024 123 4567)</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className="zen-card glass rounded-2xl border-white/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-4">
                <CardTitle className="font-medium tracking-wide">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PaymentOption
                  selected={paymentMethod === "mobile_money"}
                  onClick={() => setPaymentMethod("mobile_money")}
                  icon={<Smartphone className="h-5 w-5" />}
                  label="Mobile Money (MoMo)"
                  description="Pay with MTN MoMo, Vodafone Cash, or AirtelTigo Money"
                  recommended
                />
                <PaymentOption
                  selected={paymentMethod === "card"}
                  onClick={() => setPaymentMethod("card")}
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Card Payment"
                  description="Pay with Visa or Mastercard"
                />
                <PaymentOption
                  selected={paymentMethod === "pay_on_delivery"}
                  onClick={() => setPaymentMethod("pay_on_delivery")}
                  icon={<MapPin className="h-5 w-5" />}
                  label="Pay on Pickup"
                  description="Pay cash when you collect from the vendor"
                />
              </CardContent>
            </Card>

            <Card className="zen-card glass rounded-2xl border-white/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-4">
                <CardTitle className="font-medium tracking-wide">Shipping / Pickup Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="tracking-wide">Address</Label>
                  <Input
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    placeholder="Street address or landmark"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="tracking-wide">City</Label>
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
                    <Label className="tracking-wide">Region</Label>
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
                  <Label className="tracking-wide">Order Notes (optional)</Label>
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
                  disabled={isProcessing || createOrder.isPending}
                  onClick={handleSubmit}
                >
                  {isProcessing || createOrder.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : paymentMethod === "pay_on_delivery" ? (
                    <>Place Order</>
                  ) : (
                    <>Pay {formatGHS(total)}</>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60 tracking-wide justify-center">
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

function PaymentOption({
  selected, onClick, icon, label, description, recommended,
}: {
  selected: boolean; onClick: () => void; icon: React.ReactNode;
  label: string; description: string; recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
        selected
          ? "border-primary/70 bg-primary/5"
          : "border-white/20 hover:border-primary/30 bg-white/30"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        selected ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-wide text-sm">{label}</span>
          {recommended && (
            <span className="text-[10px] font-medium bg-voom-green/10 text-voom-green px-2 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 tracking-wide">{description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? "border-primary" : "border-muted-foreground/30"
      }`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
    </button>
  );
}
