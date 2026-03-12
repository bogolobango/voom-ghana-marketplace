import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { GHANA_REGIONS, GHANA_CITIES } from "@shared/marketplace";
import { Store, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function VendorRegister() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const existingVendor = trpc.vendor.me.useQuery(undefined, { enabled: isAuthenticated });
  const registerVendor = trpc.vendor.register.useMutation();

  const [form, setForm] = useState({
    businessName: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    region: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center max-w-md mx-auto">
        <Store className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Become a Vendor</h2>
        <p className="text-muted-foreground mb-6">Sign in to register your spare parts business on VOOM.</p>
        <Button size="lg" asChild>
          <a href={getLoginUrl()}>Sign In to Continue</a>
        </Button>
      </div>
    );
  }

  if (existingVendor.data) {
    return (
      <div className="container py-20 text-center max-w-md mx-auto">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-voom-green" />
        <h2 className="text-2xl font-bold mb-2">Already Registered</h2>
        <p className="text-muted-foreground mb-2">
          Status: <strong className="capitalize">{existingVendor.data.status}</strong>
        </p>
        {existingVendor.data.status === "pending" && (
          <p className="text-sm text-muted-foreground mb-6">
            Your application is under review. You'll be notified once approved.
          </p>
        )}
        {existingVendor.data.status === "approved" && (
          <Button onClick={() => navigate("/vendor/dashboard")} className="mt-4">
            Go to Dashboard
          </Button>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!form.businessName || !form.phone) {
      toast.error("Business name and phone number are required");
      return;
    }
    try {
      await registerVendor.mutateAsync(form);
      toast.success("Vendor application submitted! You'll be notified once approved.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Register as a Vendor</CardTitle>
            <CardDescription>
              List your spare parts on Ghana's digital marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Business Name *</Label>
              <Input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Kwame Auto Parts"
              />
            </div>

            <div>
              <Label>Business Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell buyers about your business, specialties, and experience..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 0241234567"
                />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="e.g. 0241234567"
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="business@email.com"
              />
            </div>

            <div>
              <Label>Business Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Shop number, street, area"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
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
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {GHANA_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full h-12 text-white"
              size="lg"
              disabled={registerVendor.isPending}
              onClick={handleSubmit}
            >
              {registerVendor.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit Application"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your application will be reviewed by our team. You'll be notified once approved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
