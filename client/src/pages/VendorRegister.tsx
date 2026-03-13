import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { GHANA_REGIONS, GHANA_CITIES } from "@shared/marketplace";
import { Loader2, CheckCircle2, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function VendorRegister() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [mounted, setMounted] = useState(false);
  const existingVendor = trpc.vendor.me.useQuery(undefined, { enabled: isAuthenticated });
  const registerVendor = trpc.vendor.register.useMutation();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

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
      <div className="min-h-screen flex flex-col">
        <div className="vendor-hero flex-shrink-0 flex flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="text-3xl font-light tracking-wide text-white mb-3">Become a Vendor</h1>
          <p className="text-white/60 mb-10 max-w-xs leading-relaxed">
            Sign in to list your spare parts on Ghana's digital marketplace.
          </p>
          <Button size="lg" className="rounded-full px-8 bg-white text-foreground hover:bg-white/90 font-medium gap-2" asChild>
            <Link href="/sign-in?redirect=/vendor/register" className="no-underline">
              Sign In to Continue <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (existingVendor.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-light tracking-wide mb-2">Already Registered</h2>
          <p className="text-muted-foreground/70 mb-1 tracking-wide">
            Status: <span className="font-medium capitalize text-foreground">{existingVendor.data.status}</span>
          </p>
          {existingVendor.data.status === "pending" && (
            <p className="text-sm text-muted-foreground/60 mt-3 max-w-xs mx-auto leading-relaxed">
              Your application is under review. We'll notify you once it's approved.
            </p>
          )}
          {existingVendor.data.status === "approved" && (
            <Button onClick={() => navigate("/vendor/dashboard")} className="mt-7 rounded-full px-8 gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
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
      toast.success("Application submitted! You'll be notified once approved.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero banner ── */}
      <div className="vendor-hero px-6 pt-14 pb-16 text-center relative overflow-hidden">
        <div
          className={`transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-white mb-3 leading-tight">
            Register as a<br />Vendor
          </h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-xs mx-auto">
            List your spare parts on Ghana's fastest-growing auto marketplace.
          </p>
        </div>

        {/* Trust chips */}
        <div
          className={`flex flex-wrap justify-center gap-2 mt-7 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {[
            { icon: <Zap className="h-3 w-3" />, label: "Free to join" },
            { icon: <ShieldCheck className="h-3 w-3" />, label: "Approved in 24 hrs" },
            { icon: <Users className="h-3 w-3" />, label: "1,000+ vendors" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-xs text-white/70 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1"
            >
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="relative -mt-6 z-10">
        <div
          className={`bg-background rounded-t-3xl px-5 sm:px-8 pt-8 pb-10 max-w-2xl mx-auto transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {/* Section: Business */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
            Business Details
          </p>

          <div className="space-y-4 mb-8">
            <div className="vendor-field">
              <Label className="tracking-wide text-sm font-medium">Business Name <span className="text-primary">*</span></Label>
              <Input
                className="vendor-input mt-1.5"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Kwame Auto Parts"
              />
            </div>

            <div className="vendor-field">
              <Label className="tracking-wide text-sm font-medium">Business Description</Label>
              <Textarea
                className="vendor-input mt-1.5 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell buyers about your specialties, years of experience, brands you carry…"
                rows={3}
              />
            </div>
          </div>

          {/* Section: Contact */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
            Contact Info
          </p>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="vendor-field">
                <Label className="tracking-wide text-sm font-medium">Phone Number <span className="text-primary">*</span></Label>
                <Input
                  className="vendor-input mt-1.5"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0241234567"
                />
              </div>
              <div className="vendor-field">
                <Label className="tracking-wide text-sm font-medium">WhatsApp Number</Label>
                <Input
                  className="vendor-input mt-1.5"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="0241234567"
                />
              </div>
            </div>

            <div className="vendor-field">
              <Label className="tracking-wide text-sm font-medium">Email</Label>
              <Input
                className="vendor-input mt-1.5"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="business@email.com"
                type="email"
              />
            </div>
          </div>

          {/* Section: Location */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
            Location
          </p>

          <div className="space-y-4 mb-10">
            <div className="vendor-field">
              <Label className="tracking-wide text-sm font-medium">Street / Shop Address</Label>
              <Input
                className="vendor-input mt-1.5"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Shop number, street, area"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="vendor-field">
                <Label className="tracking-wide text-sm font-medium">City</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger className="vendor-input mt-1.5"><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {GHANA_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="vendor-field">
                <Label className="tracking-wide text-sm font-medium">Region</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                  <SelectTrigger className="vendor-input mt-1.5"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {GHANA_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            className="vendor-cta w-full h-13 text-base font-medium rounded-2xl gap-2"
            size="lg"
            disabled={registerVendor.isPending}
            onClick={handleSubmit}
          >
            {registerVendor.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            ) : (
              <>Submit Application <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground/50 mt-4 tracking-wide leading-relaxed">
            Your application is reviewed by our team within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
