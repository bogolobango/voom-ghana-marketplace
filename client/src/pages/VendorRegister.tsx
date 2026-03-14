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
import { Store, Loader2, CheckCircle2, Upload, X, CreditCard, Building2 } from "lucide-react";
import { useState, useRef } from "react";
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
    ghanaCardNumber: "",
    ghanaCardImageUrl: "",
    businessRegNumber: "",
    businessRegImageUrl: "",
  });
  const [uploadingGhanaCard, setUploadingGhanaCard] = useState(false);
  const [uploadingBusinessReg, setUploadingBusinessReg] = useState(false);
  const ghanaCardInputRef = useRef<HTMLInputElement>(null);
  const businessRegInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.upload.image.useMutation();

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
          <a href={getLoginUrl()}>Sign In to Continue</a>
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

  const handleDocUpload = async (
    file: File,
    setUploading: (v: boolean) => void,
    field: "ghanaCardImageUrl" | "businessRegImageUrl"
  ) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be less than 5MB"); return; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({ base64, fileName: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/avif" });
      setForm((prev) => ({ ...prev, [field]: result.url }));
      toast.success("Document uploaded");
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.businessName || !form.phone) { toast.error("Business name and phone number are required"); return; }
    if (!form.ghanaCardNumber) { toast.error("Ghana Card number is required for verification"); return; }
    try {
      const payload: Record<string, any> = { ...form };
      if (!payload.ghanaCardImageUrl) delete payload.ghanaCardImageUrl;
      if (!payload.businessRegImageUrl) delete payload.businessRegImageUrl;
      if (!payload.businessRegNumber) delete payload.businessRegNumber;
      await registerVendor.mutateAsync(payload as any);
      toast.success("You're all set! Start listing your products.");
      navigate("/vendor/dashboard");
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

            {/* Ghana Card Section */}
            <div className="pt-4 border-t border-border/20">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary/70" />
                <h3 className="font-medium tracking-wide">Identity Verification</h3>
              </div>
              <p className="text-xs text-muted-foreground/70 tracking-wide mb-5">
                A valid Ghana Card is required to verify your identity.
              </p>
              <div>
                <Label className="tracking-wide">Ghana Card Number *</Label>
                <Input className="rounded-2xl border-border/30 mt-1.5" value={form.ghanaCardNumber}
                  onChange={(e) => setForm({ ...form, ghanaCardNumber: e.target.value })} placeholder="GHA-XXXXXXXXX-X" />
              </div>
              <div className="mt-4">
                <Label className="tracking-wide">Ghana Card Photo (front)</Label>
                <input ref={ghanaCardInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, setUploadingGhanaCard, "ghanaCardImageUrl"); e.target.value = ""; }} />
                {form.ghanaCardImageUrl ? (
                  <div className="relative mt-2 w-full h-32 rounded-2xl overflow-hidden border border-border/30 bg-muted/20">
                    <img src={form.ghanaCardImageUrl} alt="Ghana Card" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setForm({ ...form, ghanaCardImageUrl: "" })} className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => ghanaCardInputRef.current?.click()} disabled={uploadingGhanaCard}
                    className="w-full mt-2 h-24 rounded-2xl border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 transition-colors">
                    {uploadingGhanaCard ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                      <><Upload className="h-5 w-5 text-muted-foreground/50" /><span className="text-xs text-muted-foreground/60 tracking-wide">Upload Ghana Card photo</span></>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Business Registration Section */}
            <div className="pt-4 border-t border-border/20">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary/70" />
                <h3 className="font-medium tracking-wide">Business Registration</h3>
              </div>
              <p className="text-xs text-muted-foreground/70 tracking-wide mb-5">
                Optional — If your business is registered with the Registrar General's Department.
              </p>
              <div>
                <Label className="tracking-wide">Business Registration Number</Label>
                <Input className="rounded-2xl border-border/30 mt-1.5" value={form.businessRegNumber}
                  onChange={(e) => setForm({ ...form, businessRegNumber: e.target.value })} placeholder="e.g. CS123456789" />
              </div>
              <div className="mt-4">
                <Label className="tracking-wide">Business Certificate Photo</Label>
                <input ref={businessRegInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, setUploadingBusinessReg, "businessRegImageUrl"); e.target.value = ""; }} />
                {form.businessRegImageUrl ? (
                  <div className="relative mt-2 w-full h-32 rounded-2xl overflow-hidden border border-border/30 bg-muted/20">
                    <img src={form.businessRegImageUrl} alt="Business Certificate" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setForm({ ...form, businessRegImageUrl: "" })} className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => businessRegInputRef.current?.click()} disabled={uploadingBusinessReg}
                    className="w-full mt-2 h-24 rounded-2xl border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 transition-colors">
                    {uploadingBusinessReg ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                      <><Upload className="h-5 w-5 text-muted-foreground/50" /><span className="text-xs text-muted-foreground/60 tracking-wide">Upload business certificate</span></>
                    )}
                  </button>
                )}
              </div>
            </div>

            <Button className="w-full h-12 text-white rounded-full" size="lg"
              disabled={registerVendor.isPending || uploadingGhanaCard || uploadingBusinessReg} onClick={handleSubmit}>
              {registerVendor.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>) : "Start Selling"}
            </Button>
            <p className="text-xs text-center text-muted-foreground/60 tracking-wide">
              You'll be able to list products immediately after registration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
