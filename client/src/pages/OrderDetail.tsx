import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation, Link } from "wouter";
import { formatGHS } from "@shared/marketplace";
import { Loader2, ArrowLeft, XCircle, Package, MapPin, Phone, User, CreditCard, Clock, Home, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200/40",
  confirmed: "bg-sky-50 text-sky-700 border border-sky-200/40",
  processing: "bg-indigo-50 text-indigo-700 border border-indigo-200/40",
  shipped: "bg-violet-50 text-violet-700 border border-violet-200/40",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200/40",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200/40",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pay_on_delivery: "Pay on Delivery",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
};

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const order = trpc.order.getById.useQuery(
    { id: Number(params.id) },
    { enabled: !!params.id }
  );

  const cancelOrder = trpc.order.cancel.useMutation({
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      order.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (order.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white/60">
        <div className="container py-10 max-w-4xl">
          <Skeleton className="h-9 w-32 rounded-full mb-6" />
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl border-white/20 bg-white/50">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-white/20 bg-white/50">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-2xl border-white/20 bg-white/50 mt-6">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-24 mb-3" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (order.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white/60">
        <div className="container py-10">
          <Button
            variant="ghost"
            className="mb-6 rounded-full text-muted-foreground/70"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <Card className="rounded-3xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
            <CardContent className="py-20 text-center">
              <Package className="h-10 w-10 mx-auto mb-6 text-muted-foreground/30" />
              <h3 className="font-light tracking-wide text-lg mb-3">Order not found</h3>
              <p className="text-muted-foreground/70 text-sm tracking-wide">
                {order.error.message}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const data = order.data;
  if (!data) return null;

  const statusHistory = (data.statusHistory as { status: string; at: string; by?: string }[]) || [];
  const isBuyer = user?.id === data.userId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white/60">
      <div className="container py-10 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground/70 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary/90 no-underline tracking-wide">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/orders" className="hover:text-primary/90 no-underline tracking-wide">Orders</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground/80 tracking-wide">{data?.orderNumber || "..."}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              Order {data.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground/70 tracking-wide mt-1">
              Placed on{" "}
              {new Date(data.createdAt).toLocaleDateString("en-GH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Badge
            className={`text-xs font-medium tracking-wide px-4 py-1.5 rounded-full capitalize ${STATUS_COLORS[data.status] || "bg-gray-50 text-gray-600"}`}
          >
            {data.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Buyer Info */}
          <Card className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-wide text-muted-foreground/80 uppercase">
                Buyer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.buyerName && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm tracking-wide">{data.buyerName}</span>
                </div>
              )}
              {data.buyerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm tracking-wide">{data.buyerPhone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-sm tracking-wide">
                  {PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-wide text-muted-foreground/80 uppercase">
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.shippingAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground/50 mt-0.5" />
                  <span className="text-sm tracking-wide">{data.shippingAddress}</span>
                </div>
              )}
              {(data.shippingCity || data.shippingRegion) && (
                <div className="flex items-center gap-3 pl-7">
                  <span className="text-sm tracking-wide text-muted-foreground/70">
                    {[data.shippingCity, data.shippingRegion].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-light tracking-wide text-muted-foreground/80 uppercase">
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium tracking-wide">{item.productName}</p>
                    <p className="text-xs text-muted-foreground/60 tracking-wide mt-0.5">
                      {formatGHS(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium tracking-wide">
                    {formatGHS(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-4 bg-border/30" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-light tracking-wide text-muted-foreground/80">
                Total
              </span>
              <span className="text-lg font-medium tracking-wide text-primary">
                {formatGHS(data.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        {statusHistory.length > 0 && (
          <Card className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-wide text-muted-foreground/80 uppercase">
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-border/40" />
                <div className="space-y-5">
                  {statusHistory.map((entry, index) => (
                    <div key={index} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-white ${
                          index === statusHistory.length - 1
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] font-medium tracking-wide px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[entry.status] || "bg-gray-50 text-gray-600"}`}
                          >
                            {entry.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground/60 tracking-wide mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.at).toLocaleDateString("en-GH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Button */}
        {data.status === "pending" && isBuyer && (
          <div className="mt-6 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full text-rose-600 border-rose-200/50 hover:bg-rose-50/50 tracking-wide"
                  disabled={cancelOrder.isPending}
                >
                  {cancelOrder.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel order {data.orderNumber}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your order. If you've already paid, contact the vendor for a refund.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Keep Order</AlertDialogCancel>
                  <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => cancelOrder.mutate({ id: data.id })}>
                    Cancel Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
