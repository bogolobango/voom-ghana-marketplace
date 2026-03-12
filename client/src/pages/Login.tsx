import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Phone, KeyRound, Store } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const utils = trpc.useUtils();

  const requestOtp = trpc.auth.requestOtp.useMutation({
    onSuccess: () => {
      toast.success("OTP sent to your phone");
      setStep("otp");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const verifyOtp = trpc.auth.verifyOtp.useMutation({
    onSuccess: async () => {
      toast.success("Welcome to VOOM!");
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const handleRequestOtp = () => {
    if (!phone.trim() || !name.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    requestOtp.mutate({ phone: phone.trim(), name: name.trim() });
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP code");
      return;
    }
    verifyOtp.mutate({ phone: phone.trim(), otp: otp.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 zen-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-light tracking-wide">VOOM Ghana</h1>
          <p className="text-sm text-muted-foreground mt-2 tracking-wide">Vehicle spare parts marketplace</p>
        </div>

        <Card className="zen-card rounded-3xl border-white/20 bg-white/50 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6">
            {step === "phone" ? (
              <div className="space-y-5">
                <div className="text-center">
                  <Phone className="h-6 w-6 mx-auto mb-2 text-primary/70" />
                  <h2 className="font-medium tracking-wide">Sign in with your phone</h2>
                  <p className="text-xs text-muted-foreground mt-1 tracking-wide">We'll send you a verification code</p>
                </div>

                <div>
                  <Label className="tracking-wide text-xs">Your Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kwame Asante"
                    className="mt-1.5 rounded-2xl border-border/30 h-12"
                  />
                </div>

                <div>
                  <Label className="tracking-wide text-xs">Phone Number</Label>
                  <div className="flex gap-2 mt-1.5">
                    <div className="flex items-center px-3 rounded-2xl border border-border/30 bg-muted/30 text-sm text-muted-foreground">
                      +233
                    </div>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="024 123 4567"
                      type="tel"
                      className="rounded-2xl border-border/30 h-12 flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-12 rounded-full text-white tracking-wide"
                  disabled={requestOtp.isPending || !phone.trim() || !name.trim()}
                  onClick={handleRequestOtp}
                >
                  {requestOtp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send OTP
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <KeyRound className="h-6 w-6 mx-auto mb-2 text-primary/70" />
                  <h2 className="font-medium tracking-wide">Enter verification code</h2>
                  <p className="text-xs text-muted-foreground mt-1 tracking-wide">
                    Sent to {phone}
                  </p>
                </div>

                <div>
                  <Label className="tracking-wide text-xs">OTP Code</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-1.5 rounded-2xl border-border/30 h-12 text-center text-lg tracking-[0.3em] font-mono"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  />
                </div>

                <Button
                  className="w-full h-12 rounded-full text-white tracking-wide"
                  disabled={verifyOtp.isPending || !otp.trim()}
                  onClick={handleVerifyOtp}
                >
                  {verifyOtp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify & Sign In
                </Button>

                <button
                  className="w-full text-xs text-muted-foreground hover:text-primary tracking-wide"
                  onClick={() => { setStep("phone"); setOtp(""); }}
                >
                  Use a different phone number
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground/50 mt-6 tracking-wide">
          By signing in, you agree to VOOM Ghana's terms of service
        </p>
      </div>
    </div>
  );
}
