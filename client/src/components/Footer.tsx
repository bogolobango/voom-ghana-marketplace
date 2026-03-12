import { Link } from "wouter";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-voom-navy text-white/80">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-extrabold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">VOOM</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Ghana's premier digital marketplace for automotive spare parts. Connecting vendors and buyers across the nation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <div className="space-y-2.5">
              <FooterLink href="/products">Browse Parts</FooterLink>
              <FooterLink href="/vendors">Find Vendors</FooterLink>
              <FooterLink href="/categories">Categories</FooterLink>
            </div>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Vendors</h4>
            <div className="space-y-2.5">
              <FooterLink href="/vendor/register">Register as Vendor</FooterLink>
              <FooterLink href="/vendor/dashboard">Vendor Dashboard</FooterLink>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>Abossey Okai, Accra, Ghana</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+233 XX XXX XXXX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>hello@voom.gh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} VOOM Ghana. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Built for Ghana's automotive market
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-sm text-white/60 hover:text-primary transition-colors no-underline">
      {children}
    </Link>
  );
}
