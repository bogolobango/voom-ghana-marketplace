import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
export default function SignIn() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect") || "/";

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.refetch();
      toast.success("Welcome back!");
      navigate(redirect);
    },
    onError: (e) => toast.error(e.message),
  });

  const signup = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      await utils.auth.me.refetch();
      toast.success("Account created! Welcome to VOOM.");
      navigate(redirect);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/voom-logo.png" alt="VOOM" className="h-12 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm tracking-wide">
            Ghana's Digital Car Parts Marketplace
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="w-full rounded-2xl bg-muted/60 p-1 mb-6">
            <TabsTrigger value="login" className="flex-1 rounded-xl gap-2 data-[state=active]:shadow-sm">
              <LogIn className="h-4 w-4" /> Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1 rounded-xl gap-2 data-[state=active]:shadow-sm">
              <UserPlus className="h-4 w-4" /> Create Account
            </TabsTrigger>
          </TabsList>

          {/* ── Sign In ── */}
          <TabsContent value="login">
            <Card className="rounded-3xl border-white/30 glass-strong shadow-[0_4px_32px_-8px_rgba(0,0,0,0.07)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-light tracking-wide">Welcome back</CardTitle>
                <CardDescription className="tracking-wide">Sign in to your VOOM account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div>
                  <Label className="tracking-wide text-sm">Email</Label>
                  <Input
                    type="email"
                    data-testid="input-login-email"
                    className="rounded-2xl border-border/30 mt-1.5"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && login.mutate(loginForm)}
                  />
                </div>
                <div>
                  <Label className="tracking-wide text-sm">Password</Label>
                  <Input
                    type="password"
                    data-testid="input-login-password"
                    className="rounded-2xl border-border/30 mt-1.5"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && login.mutate(loginForm)}
                  />
                </div>
                <Button
                  data-testid="button-login"
                  className="w-full h-11 rounded-full text-white mt-2"
                  disabled={login.isPending || !loginForm.email || !loginForm.password}
                  onClick={() => login.mutate(loginForm)}
                >
                  {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Create Account ── */}
          <TabsContent value="signup">
            <Card className="rounded-3xl border-white/30 glass-strong shadow-[0_4px_32px_-8px_rgba(0,0,0,0.07)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-light tracking-wide">Create account</CardTitle>
                <CardDescription className="tracking-wide">Join thousands of buyers and sellers on VOOM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div>
                  <Label className="tracking-wide text-sm">Full Name</Label>
                  <Input
                    data-testid="input-signup-name"
                    className="rounded-2xl border-border/30 mt-1.5"
                    placeholder="Kwame Mensah"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="tracking-wide text-sm">Email</Label>
                  <Input
                    type="email"
                    data-testid="input-signup-email"
                    className="rounded-2xl border-border/30 mt-1.5"
                    placeholder="your@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="tracking-wide text-sm">Password</Label>
                  <Input
                    type="password"
                    data-testid="input-signup-password"
                    className="rounded-2xl border-border/30 mt-1.5"
                    placeholder="At least 8 characters"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="tracking-wide text-sm">Confirm Password</Label>
                  <Input
                    type="password"
                    data-testid="input-signup-confirm"
                    className="rounded-2xl border-border/30 mt-1.5"
                    placeholder="••••••••"
                    value={signupForm.confirm}
                    onChange={(e) => setSignupForm({ ...signupForm, confirm: e.target.value })}
                  />
                </div>
                <Button
                  data-testid="button-signup"
                  className="w-full h-11 rounded-full text-white mt-2"
                  disabled={signup.isPending || !signupForm.name || !signupForm.email || !signupForm.password}
                  onClick={() => {
                    if (signupForm.password !== signupForm.confirm) {
                      toast.error("Passwords do not match");
                      return;
                    }
                    if (signupForm.password.length < 8) {
                      toast.error("Password must be at least 8 characters");
                      return;
                    }
                    signup.mutate({ name: signupForm.name, email: signupForm.email, password: signupForm.password });
                  }}
                >
                  {signup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
