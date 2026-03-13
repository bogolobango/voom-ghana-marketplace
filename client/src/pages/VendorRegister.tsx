import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { GHANA_REGIONS, GHANA_CITIES } from "@shared/marketplace";
import { Store, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
        <Loader2 className="h-8 w-8 animate-spin text-primary/90" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <Store className="h-12 w-12 mx-auto mb-5 text-primary/90" />
        <h2 className="text-2xl font-light tracking-wide mb-3">Become a Vendor</h2>
        <p className="text-muted-foreground/70 mb-8 tracking-wide">Sign in to register your spare parts business on VOOM.</p>
        <Button size="lg" className="rounded-full px-8" asChild>
          <Link href="/sign-in?redirect=/vendor/register" className="no-underline text-white">Sign In to Continue</Link>
        </Button>
      </div>
    );
  }

  if (existingVendor.data) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-5 text-voom-green" />
        <h2 className="text-2xl font-light tracking-wide mb-3">Already Registered</h2>
        <p className="text-muted-foreground/70 mb-2 tracking-wide">
          Status: <strong className="capitalize">{existingVendor.data.status}</strong>
        </p>
        {existingVendor.data.status === "pending" && (
          <p className="text-sm text-muted-foreground/60 mb-8 tracking-wide">
            Your application is under review. You'll be notified once approved.
          </p>
        )}
        {existingVendor.data.status === "approved" && (
          <Button onClick={() => navigate("/vendor/dashboard")} className="mt-5 rounded-full px-8">
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
      <div className="container py-12 max-w-2xl">
        <Card className="glass-strong rounded-3xl border-white/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="h-7 w-7 text-primary/90" />
            </div>
            <CardTitle className="text-2xl font-light tracking-wide">Register as a Vendor</CardTitle>
            <CardDescription className="tracking-wide">
              List your spare parts on Ghana's digital marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div>
              <Label className="tracking-wide">Business Name *</Label>
              <Input
                className="rounded-2xl border-border/30 mt-1.5"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Kwame Auto Parts"
              />
            </div>

            <div>
              <Label className="tracking-wide">Business Description</Label>
              <Textarea
                className="rounded-2xl border-border/30 mt-1.5"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell buyers about your business, specialties, and experience..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="tracking-wide">Phone Number *</Label>
                <Input
                  className="rounded-2xl border-border/30 mt-1.5"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 0241234567"
                />
              </div>
              <div>
                <Label className="tracking-wide">WhatsApp Number</Label>
                <Input
                  className="rounded-2xl border-border/30 mt-1.5"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="e.g. 0241234567"
                />
              </div>
            </div>

            <div>
              <Label className="tracking-wide">Email</Label>
              <Input
                className="rounded-2xl border-border/30 mt-1.5"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="business@email.com"
              />
            </div>

            <div>
              <Label className="tracking-wide">Business Address</Label>
              <Input
                className="rounded-2xl border-border/30 mt-1.5"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Shop number, street, area"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="tracking-wide">City</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger className="rounded-2xl border-border/30 mt-1.5"><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {GHANA_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="tracking-wide">Region</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                  <SelectTrigger className="rounded-2xl border-border/30 mt-1.5"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {GHANA_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full h-12 text-white rounded-full"
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
            <p className="text-xs text-center text-muted-foreground/60 tracking-wide">
              Your application will be reviewed by our team. You'll be notified once approved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
