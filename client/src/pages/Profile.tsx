import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { User, Mail, Phone, Shield, Calendar, Edit, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      utils.auth.me.invalidate();
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const startEditing = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate({
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-24 text-center">
        <User className="h-12 w-12 mx-auto mb-6 text-muted-foreground/30" />
        <h2 className="text-xl font-light tracking-wide mb-2">
          Sign in to view your profile
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white/60">
      <div className="container py-10 max-w-2xl">
        <h1 className="text-2xl font-light tracking-wide mb-8">My Profile</h1>

        <Card className="rounded-3xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-light tracking-wide">
              Account Information
            </CardTitle>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl"
                onClick={startEditing}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-2xl"
                  onClick={() => setEditing(false)}
                  disabled={updateProfile.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-2xl"
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" /> Name
                  </Label>
                  <Input
                    id="name"
                    className="rounded-2xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="rounded-2xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" /> Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    className="rounded-2xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2">
                  <User className="h-5 w-5 text-muted-foreground/50" />
                  <div>
                    <p className="text-xs text-muted-foreground tracking-wide uppercase">Name</p>
                    <p className="font-light">{user.name || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Mail className="h-5 w-5 text-muted-foreground/50" />
                  <div>
                    <p className="text-xs text-muted-foreground tracking-wide uppercase">Email</p>
                    <p className="font-light">{user.email || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Phone className="h-5 w-5 text-muted-foreground/50" />
                  <div>
                    <p className="text-xs text-muted-foreground tracking-wide uppercase">Phone</p>
                    <p className="font-light">{user.phone || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Shield className="h-5 w-5 text-muted-foreground/50" />
                  <div>
                    <p className="text-xs text-muted-foreground tracking-wide uppercase">Role</p>
                    <p className="font-light capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Calendar className="h-5 w-5 text-muted-foreground/50" />
                  <div>
                    <p className="text-xs text-muted-foreground tracking-wide uppercase">Member Since</p>
                    <p className="font-light">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-GH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </>
            )}

            {user.role === "vendor" && !editing && (
              <div className="pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="rounded-2xl w-full"
                  onClick={() => navigate("/vendor/dashboard")}
                >
                  Go to Vendor Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
