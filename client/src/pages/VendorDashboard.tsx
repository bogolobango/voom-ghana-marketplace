import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { formatGHS, VEHICLE_MAKES, PART_CONDITIONS } from "@shared/marketplace";
import {
  Package, ShoppingCart, Plus, Loader2, Store, TrendingUp,
  Edit, Trash2, Eye, Upload, X, ChevronDown, ChevronUp, User, MapPin, Phone as PhoneIcon,
  MessageSquare, CheckCircle, XCircle, ArrowLeft, ArrowRight, ImageIcon, Car, Tag,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function VendorDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const vendor = trpc.vendor.me.useQuery(undefined, { enabled: isAuthenticated });
  const myProducts = trpc.product.myProducts.useQuery(undefined, { enabled: !!vendor.data && vendor.data.status === "approved" });
  const vendorOrders = trpc.order.vendorOrders.useQuery(undefined, { enabled: !!vendor.data && vendor.data.status === "approved" });
  const vendorInquiries = trpc.inquiry.vendorInquiries.useQuery(undefined, { enabled: !!vendor.data && vendor.data.status === "approved" });
  const categories = trpc.category.list.useQuery();
  const utils = trpc.useUtils();

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", categoryId: "", brand: "",
    condition: "new" as "new" | "used" | "refurbished",
    vehicleMake: "", vehicleModel: "", yearFrom: "", yearTo: "",
    quantity: "1", sku: "", oemPartNumber: "",
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.upload.image.useMutation();

  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.myProducts.invalidate();
      setShowAddProduct(false);
      setProductForm({
        name: "", description: "", price: "", categoryId: "", brand: "",
        condition: "new", vehicleMake: "", vehicleModel: "", yearFrom: "", yearTo: "",
        quantity: "1", sku: "", oemPartNumber: "",
      });
      setProductImages([]);
      toast.success("Product listed successfully!");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => { utils.product.myProducts.invalidate(); toast.success("Product removed"); },
  });

  const updateOrderStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => { utils.order.vendorOrders.invalidate(); toast.success("Order status updated"); },
    onError: (err) => toast.error(err.message),
  });

  const updateInquiry = trpc.inquiry.updateStatus.useMutation({
    onSuccess: () => { utils.inquiry.vendorInquiries.invalidate(); toast.success("Inquiry updated"); },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  if (loading || vendor.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
      </div>
    );
  }

  if (!vendor.data || vendor.data.status !== "approved") {
    return (
      <div className="container py-24 text-center">
        <Store className="h-12 w-12 mx-auto mb-6 text-muted-foreground/30" />
        <h2 className="text-xl font-light tracking-wide mb-3">
          {vendor.data ? "Application Pending" : "Not a Vendor"}
        </h2>
        <p className="text-muted-foreground text-sm tracking-wide mb-8">
          {vendor.data
            ? "Your vendor application is under review."
            : "Register as a vendor to access the dashboard."}
        </p>
        {!vendor.data && (
          <Button onClick={() => navigate("/vendor/register")} className="rounded-full">Register as Vendor</Button>
        )}
      </div>
    );
  }

  const products = myProducts.data || [];
  const orders = vendorOrders.data || [];
  const inquiriesList = vendorInquiries.data || [];
  const pendingInquiries = inquiriesList.filter(i => i.status === "pending");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const confirmedOrders = orders.filter(o => ["confirmed", "processing", "shipped"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "delivered");
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (productImages.length >= 5) {
      toast.error("Maximum 5 images per product");
      return;
    }

    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        if (productImages.length >= 5) break;
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(file);
        });
        const result = await uploadImage.mutateAsync({
          base64,
          fileName: file.name,
          contentType: file.type,
        });
        setProductImages((prev) => [...prev, result.url]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price) {
      toast.error("Product name and price are required");
      return;
    }
    createProduct.mutate({
      name: productForm.name,
      description: productForm.description || undefined,
      price: productForm.price,
      categoryId: productForm.categoryId ? Number(productForm.categoryId) : undefined,
      brand: productForm.brand || undefined,
      condition: productForm.condition,
      vehicleMake: productForm.vehicleMake || undefined,
      vehicleModel: productForm.vehicleModel || undefined,
      yearFrom: productForm.yearFrom ? Number(productForm.yearFrom) : undefined,
      yearTo: productForm.yearTo ? Number(productForm.yearTo) : undefined,
      quantity: Number(productForm.quantity) || 1,
      sku: productForm.sku || undefined,
      oemPartNumber: productForm.oemPartNumber || undefined,
      images: productImages.length > 0 ? productImages : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="zen-hero py-12">
        <div className="container">
          <h1 className="text-2xl font-light tracking-wide text-white">Vendor Dashboard</h1>
          <p className="text-white/50 mt-2 tracking-wide">{vendor.data.businessName}</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Package className="h-5 w-5" />} label="Listings" value={products.length} />
          <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Pending" value={pendingOrders.length} />
          <StatCard icon={<Eye className="h-5 w-5" />} label="In Progress" value={confirmedOrders.length} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Completed" value={completedOrders.length} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Revenue" value={formatGHS(totalRevenue)} />
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6 bg-white/50 backdrop-blur-xl rounded-2xl">
            <TabsTrigger value="products" className="tracking-wide rounded-xl">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="orders" className="tracking-wide rounded-xl">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="inquiries" className="tracking-wide rounded-xl">
              Inquiries ({inquiriesList.length})
              {pendingInquiries.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-primary text-white rounded-full">
                  {pendingInquiries.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium tracking-wide">My Products</h2>
              <AddProductWizard
                open={showAddProduct}
                onOpenChange={setShowAddProduct}
                productForm={productForm}
                setProductForm={setProductForm}
                productImages={productImages}
                setProductImages={setProductImages}
                uploadingImage={uploadingImage}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                handleAddProduct={handleAddProduct}
                createProductPending={createProduct.isPending}
                categories={categories.data || []}
              />
            </div>

            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => {
                  const images = (product.images as string[] | null) || [];
                  return (
                    <Card key={product.id} className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 overflow-hidden flex-shrink-0">
                          {images[0] ? (
                            <img src={images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium tracking-wide text-sm truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-primary/90 font-medium tracking-wide text-sm">{formatGHS(product.price)}</span>
                            <Badge variant="secondary" className="text-[10px] rounded-full">{product.condition}</Badge>
                            <span className="text-xs text-muted-foreground tracking-wide">Qty: {product.quantity}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive/70 hover:text-destructive rounded-2xl"
                          onClick={() => {
                            if (confirm("Delete this product?")) {
                              deleteProduct.mutate({ id: product.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed border-white/20 rounded-3xl bg-white/30 backdrop-blur-xl">
                <CardContent className="py-16 text-center">
                  <Package className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-medium tracking-wide mb-1">No products yet</p>
                  <p className="text-sm text-muted-foreground tracking-wide">Add your first product to start selling.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <h2 className="text-lg font-medium tracking-wide mb-6">Orders</h2>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const orderItems = (order as any).items || [];
                  return (
                  <Card key={order.id} className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium tracking-wide">{order.orderNumber}</span>
                          <span className="text-xs text-muted-foreground tracking-wide">
                            {new Date(order.createdAt).toLocaleDateString("en-GH")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="capitalize rounded-full">
                            {order.status}
                          </Badge>
                          <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Buyer info + items (expandable) */}
                      {isExpanded && (
                        <div className="mb-4 space-y-3">
                          <div className="bg-white/30 rounded-xl p-3 text-xs space-y-1.5">
                            {order.buyerName && (
                              <div className="flex items-center gap-2 text-muted-foreground/80">
                                <User className="h-3 w-3" /> <span className="tracking-wide">{order.buyerName}</span>
                              </div>
                            )}
                            {order.buyerPhone && (
                              <div className="flex items-center gap-2 text-muted-foreground/80">
                                <PhoneIcon className="h-3 w-3" /> <span className="tracking-wide">{order.buyerPhone}</span>
                              </div>
                            )}
                            {order.shippingAddress && (
                              <div className="flex items-center gap-2 text-muted-foreground/80">
                                <MapPin className="h-3 w-3" /> <span className="tracking-wide">{order.shippingAddress}, {order.shippingCity}, {order.shippingRegion}</span>
                              </div>
                            )}
                          </div>
                          {orderItems.length > 0 && (
                            <div className="space-y-1.5">
                              {orderItems.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-xs tracking-wide px-1">
                                  <span className="text-muted-foreground/80">{item.productName} × {item.quantity}</span>
                                  <span className="font-medium">{formatGHS(item.totalPrice)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {order.notes && (
                            <p className="text-xs text-muted-foreground/60 tracking-wide italic px-1">Note: {order.notes}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-primary/90 font-medium tracking-wide">{formatGHS(order.totalAmount)}</span>
                        {order.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-border/30"
                              onClick={() => updateOrderStatus.mutate({ id: order.id, status: "confirmed" })}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive/70 rounded-full"
                              onClick={() => updateOrderStatus.mutate({ id: order.id, status: "cancelled" })}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {order.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-border/30"
                            onClick={() => updateOrderStatus.mutate({ id: order.id, status: "processing" })}
                          >
                            Mark Processing
                          </Button>
                        )}
                        {order.status === "processing" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-border/30"
                            onClick={() => updateOrderStatus.mutate({ id: order.id, status: "shipped" })}
                          >
                            Mark Shipped
                          </Button>
                        )}
                        {order.status === "shipped" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus.mutate({ id: order.id, status: "delivered" })}
                            className="text-white rounded-full"
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed border-white/20 rounded-3xl bg-white/30 backdrop-blur-xl">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-medium tracking-wide mb-1">No orders yet</p>
                  <p className="text-sm text-muted-foreground tracking-wide">Orders will appear here when buyers purchase your products.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries">
            <h2 className="text-lg font-medium tracking-wide mb-6">Buyer Inquiries</h2>
            {inquiriesList.length > 0 ? (
              <div className="space-y-3">
                {inquiriesList.map((inq: any) => {
                  const INQUIRY_STATUS_COLORS: Record<string, string> = {
                    pending: "bg-amber-50 text-amber-700 border border-amber-200/40",
                    responded: "bg-sky-50 text-sky-700 border border-sky-200/40",
                    sold: "bg-emerald-50 text-emerald-700 border border-emerald-200/40",
                    closed: "bg-gray-50 text-gray-600 border border-gray-200/40",
                  };
                  return (
                    <Card key={inq.id} className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="h-5 w-5 text-primary/80" />
                            </div>
                            <div>
                              <p className="font-medium text-sm tracking-wide">{inq.product?.name || "Unknown Product"}</p>
                              <p className="text-xs text-muted-foreground/70 tracking-wide mt-0.5">
                                {inq.buyer?.name || "Anonymous"} {inq.buyerPhone && `• ${inq.buyerPhone}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full capitalize ${INQUIRY_STATUS_COLORS[inq.status] || ""}`}>
                              {inq.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 tracking-wide">
                              {new Date(inq.createdAt).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>

                        {inq.message && (
                          <p className="text-sm text-muted-foreground/80 tracking-wide mb-3 pl-[52px]">
                            "{inq.message}"
                          </p>
                        )}

                        {inq.product?.price && (
                          <p className="text-sm text-primary/90 font-medium tracking-wide mb-3 pl-[52px]">
                            Listed at {formatGHS(inq.product.price)}
                          </p>
                        )}

                        {inq.status === "pending" && (
                          <div className="flex gap-2 pl-[52px]">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-border/30 text-xs"
                              disabled={updateInquiry.isPending}
                              onClick={() => updateInquiry.mutate({ id: inq.id, status: "responded" })}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Mark Responded
                            </Button>
                            <Button
                              size="sm"
                              className="rounded-full text-white text-xs"
                              disabled={updateInquiry.isPending}
                              onClick={() => updateInquiry.mutate({ id: inq.id, status: "sold" })}
                            >
                              Mark Sold
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full text-muted-foreground text-xs"
                              disabled={updateInquiry.isPending}
                              onClick={() => updateInquiry.mutate({ id: inq.id, status: "closed" })}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Close
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed border-white/20 rounded-3xl bg-white/30 backdrop-blur-xl">
                <CardContent className="py-16 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-medium tracking-wide mb-1">No inquiries yet</p>
                  <p className="text-sm text-muted-foreground tracking-wide">Buyer inquiries will appear here when they express interest in your products.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const PRODUCT_STEPS = [
  { id: 1, label: "Basics", icon: Tag },
  { id: 2, label: "Vehicle", icon: Car },
  { id: 3, label: "Images", icon: ImageIcon },
] as const;

function AddProductWizard({
  open, onOpenChange, productForm, setProductForm, productImages, setProductImages,
  uploadingImage, fileInputRef, handleImageUpload, handleAddProduct, createProductPending,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productForm: any;
  setProductForm: (v: any) => void;
  productImages: string[];
  setProductImages: React.Dispatch<React.SetStateAction<string[]>>;
  uploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddProduct: () => void;
  createProductPending: boolean;
  categories: { id: number; name: string }[];
}) {
  const [step, setStep] = useState(1);

  const resetAndClose = (v: boolean) => {
    if (!v) setStep(1);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 text-white rounded-full">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white/80 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="font-light tracking-wide text-lg">Add New Product</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 pt-2 pb-4">
          {PRODUCT_STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isCompleted ? "bg-primary text-white" : isActive ? "bg-primary/15 text-primary ring-2 ring-primary/30" : "bg-muted/30 text-muted-foreground/40"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className={`text-[10px] tracking-wide ${isActive ? "text-primary font-medium" : "text-muted-foreground/50"}`}>
                    {s.label}
                  </span>
                </div>
                {i < PRODUCT_STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 mb-4 rounded-full ${step > s.id ? "bg-primary" : "bg-muted/20"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-5">
          {/* Step 1: Basics */}
          {step === 1 && (
            <>
              <p className="text-xs text-muted-foreground/60 tracking-wide">Enter the essential product details. Fields marked * are required.</p>
              <div>
                <Label className="tracking-wide">Product Name *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e: any) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Front Brake Pads Set"
                  className="rounded-2xl border-border/30"
                />
              </div>
              <div>
                <Label className="tracking-wide">Description</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e: any) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Product details, specifications..."
                  rows={3}
                  className="rounded-2xl border-border/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="tracking-wide">Price (GH₵) *</Label>
                  <Input
                    value={productForm.price}
                    onChange={(e: any) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="0.00" type="number" step="0.01"
                    className="rounded-2xl border-border/30"
                  />
                </div>
                <div>
                  <Label className="tracking-wide">Quantity</Label>
                  <Input
                    value={productForm.quantity}
                    onChange={(e: any) => setProductForm({ ...productForm, quantity: e.target.value })}
                    type="number" className="rounded-2xl border-border/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="tracking-wide">Category</Label>
                  <Select value={productForm.categoryId} onValueChange={(v) => setProductForm({ ...productForm, categoryId: v })}>
                    <SelectTrigger className="rounded-2xl border-border/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="tracking-wide">Condition</Label>
                  <Select value={productForm.condition} onValueChange={(v: any) => setProductForm({ ...productForm, condition: v })}>
                    <SelectTrigger className="rounded-2xl border-border/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {PART_CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="tracking-wide">Brand</Label>
                  <Input value={productForm.brand} onChange={(e: any) => setProductForm({ ...productForm, brand: e.target.value })} placeholder="e.g. Bosch, Denso" className="rounded-2xl border-border/30" />
                </div>
                <div>
                  <Label className="tracking-wide">SKU</Label>
                  <Input value={productForm.sku} onChange={(e: any) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="Optional" className="rounded-2xl border-border/30" />
                </div>
              </div>
              <div>
                <Label className="tracking-wide">OEM Part Number</Label>
                <Input value={productForm.oemPartNumber} onChange={(e: any) => setProductForm({ ...productForm, oemPartNumber: e.target.value })} placeholder="e.g. 04465-33471" className="rounded-2xl border-border/30" />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => {
                  if (!productForm.name || !productForm.price) { toast.error("Product name and price are required"); return; }
                  setStep(2);
                }} className="rounded-full text-white gap-2 px-6">
                  Next: Vehicle Fit <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Vehicle Compatibility */}
          {step === 2 && (
            <>
              <p className="text-xs text-muted-foreground/60 tracking-wide">
                Which vehicles does this part fit? This helps buyers find your product when searching by car. You can skip this if the part is universal.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="tracking-wide">Vehicle Make</Label>
                  <Select value={productForm.vehicleMake} onValueChange={(v) => setProductForm({ ...productForm, vehicleMake: v })}>
                    <SelectTrigger className="rounded-2xl border-border/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {VEHICLE_MAKES.map((make) => (
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="tracking-wide">Vehicle Model</Label>
                  <Input value={productForm.vehicleModel} onChange={(e: any) => setProductForm({ ...productForm, vehicleModel: e.target.value })} placeholder="e.g. Camry, Corolla" className="rounded-2xl border-border/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="tracking-wide">Year From</Label>
                  <Input value={productForm.yearFrom} onChange={(e: any) => setProductForm({ ...productForm, yearFrom: e.target.value })} placeholder="e.g. 2010" type="number" className="rounded-2xl border-border/30" />
                </div>
                <div>
                  <Label className="tracking-wide">Year To</Label>
                  <Input value={productForm.yearTo} onChange={(e: any) => setProductForm({ ...productForm, yearTo: e.target.value })} placeholder="e.g. 2024" type="number" className="rounded-2xl border-border/30" />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-full gap-2 border-white/20">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="rounded-full text-white gap-2 px-6">
                  Next: Photos <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <>
              <p className="text-xs text-muted-foreground/60 tracking-wide">
                Add up to 5 clear photos of your product. Good photos increase sales significantly.
              </p>
              <div>
                <Label className="tracking-wide">Product Images (max 5)</Label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {productImages.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/30">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setProductImages((prev) => prev.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-black/50 rounded-bl-lg p-0.5">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {productImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-1 hover:border-primary/40 transition-colors"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground/60" />
                          <span className="text-[9px] text-muted-foreground/50">Add Photo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-full gap-2 border-white/20">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="rounded-full text-white gap-2 px-6"
                  disabled={createProductPending}
                  onClick={handleAddProduct}
                >
                  {createProductPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  List Product
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="zen-card rounded-2xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
      <CardContent className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/90 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground tracking-wide">{label}</p>
          <p className="text-lg font-light tracking-[0.03em]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
