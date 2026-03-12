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
  Edit, Trash2, Eye,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VendorDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const vendor = trpc.vendor.me.useQuery(undefined, { enabled: isAuthenticated });
  const myProducts = trpc.product.myProducts.useQuery(undefined, { enabled: !!vendor.data && vendor.data.status === "approved" });
  const vendorOrders = trpc.order.vendorOrders.useQuery(undefined, { enabled: !!vendor.data && vendor.data.status === "approved" });
  const categories = trpc.category.list.useQuery();
  const utils = trpc.useUtils();

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", categoryId: "", brand: "",
    condition: "new" as "new" | "used" | "refurbished",
    vehicleMake: "", vehicleModel: "", yearFrom: "", yearTo: "",
    quantity: "1", sku: "",
  });

  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.myProducts.invalidate();
      setShowAddProduct(false);
      setProductForm({
        name: "", description: "", price: "", categoryId: "", brand: "",
        condition: "new", vehicleMake: "", vehicleModel: "", yearFrom: "", yearTo: "",
        quantity: "1", sku: "",
      });
      toast.success("Product listed successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => { utils.product.myProducts.invalidate(); toast.success("Product removed"); },
  });

  const updateOrderStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => { utils.order.vendorOrders.invalidate(); toast.success("Order status updated"); },
  });

  if (loading || vendor.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor.data || vendor.data.status !== "approved") {
    return (
      <div className="container py-20 text-center">
        <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold mb-2">
          {vendor.data ? "Application Pending" : "Not a Vendor"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {vendor.data
            ? "Your vendor application is under review."
            : "Register as a vendor to access the dashboard."}
        </p>
        {!vendor.data && (
          <Button onClick={() => navigate("/vendor/register")}>Register as Vendor</Button>
        )}
      </div>
    );
  }

  const products = myProducts.data || [];
  const orders = vendorOrders.data || [];
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

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
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-voom-navy py-8">
        <div className="container">
          <h1 className="text-2xl font-bold text-white">Vendor Dashboard</h1>
          <p className="text-white/60 mt-1">{vendor.data.businessName}</p>
        </div>
      </div>

      <div className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Package className="h-5 w-5" />} label="Products" value={products.length} />
          <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Orders" value={orders.length} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Revenue" value={formatGHS(totalRevenue)} />
          <StatCard icon={<Eye className="h-5 w-5" />} label="Rating" value={vendor.data.rating || "N/A"} />
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-4">
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Products</h2>
              <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1 text-white">
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Product Name *</Label>
                      <Input
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g. Front Brake Pads Set"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Product details, specifications..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price (GH₵) *</Label>
                        <Input
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          value={productForm.quantity}
                          onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                          type="number"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={productForm.categoryId} onValueChange={(v) => setProductForm({ ...productForm, categoryId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {(categories.data || []).map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Condition</Label>
                        <Select value={productForm.condition} onValueChange={(v: any) => setProductForm({ ...productForm, condition: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PART_CONDITIONS.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Brand</Label>
                        <Input
                          value={productForm.brand}
                          onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                          placeholder="e.g. Bosch, Denso"
                        />
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input
                          value={productForm.sku}
                          onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Vehicle Make</Label>
                        <Select value={productForm.vehicleMake} onValueChange={(v) => setProductForm({ ...productForm, vehicleMake: v })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {VEHICLE_MAKES.map((make) => (
                              <SelectItem key={make} value={make}>{make}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Vehicle Model</Label>
                        <Input
                          value={productForm.vehicleModel}
                          onChange={(e) => setProductForm({ ...productForm, vehicleModel: e.target.value })}
                          placeholder="e.g. Camry, Corolla"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Year From</Label>
                        <Input
                          value={productForm.yearFrom}
                          onChange={(e) => setProductForm({ ...productForm, yearFrom: e.target.value })}
                          placeholder="e.g. 2010"
                          type="number"
                        />
                      </div>
                      <div>
                        <Label>Year To</Label>
                        <Input
                          value={productForm.yearTo}
                          onChange={(e) => setProductForm({ ...productForm, yearTo: e.target.value })}
                          placeholder="e.g. 2024"
                          type="number"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full text-white"
                      disabled={createProduct.isPending}
                      onClick={handleAddProduct}
                    >
                      {createProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      List Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map((product) => {
                  const images = (product.images as string[] | null) || [];
                  return (
                    <Card key={product.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {images[0] ? (
                            <img src={images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-primary font-bold text-sm">{formatGHS(product.price)}</span>
                            <Badge variant="secondary" className="text-[10px]">{product.condition}</Badge>
                            <span className="text-xs text-muted-foreground">Qty: {product.quantity}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
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
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-medium mb-1">No products yet</p>
                  <p className="text-sm text-muted-foreground">Add your first product to start selling.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <h2 className="text-lg font-semibold mb-4">Orders</h2>
            {orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(order.createdAt).toLocaleDateString("en-GH")}
                          </span>
                        </div>
                        <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="capitalize">
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">{formatGHS(order.totalAmount)}</span>
                        {order.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus.mutate({ id: order.id, status: "confirmed" })}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
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
                            onClick={() => updateOrderStatus.mutate({ id: order.id, status: "processing" })}
                          >
                            Mark Processing
                          </Button>
                        )}
                        {order.status === "processing" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus.mutate({ id: order.id, status: "shipped" })}
                          >
                            Mark Shipped
                          </Button>
                        )}
                        {order.status === "shipped" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus.mutate({ id: order.id, status: "delivered" })}
                            className="text-white"
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-medium mb-1">No orders yet</p>
                  <p className="text-sm text-muted-foreground">Orders will appear here when buyers purchase your products.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
