import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart, User, Menu, X, Bell, Store, LayoutDashboard,
  Package, LogOut, ChevronDown, Search,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const cart = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const notifications = trpc.notification.list.useQuery(undefined, { enabled: isAuthenticated });
  const unreadCount = notifications.data?.filter((n) => !n.read).length || 0;
  const cartCount = cart.data?.length || 0;

  return (
    <header className="sticky top-0 z-50 glass-strong shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-2xl bg-primary/90 flex items-center justify-center shadow-[0_2px_12px_-2px_rgba(0,0,0,0.1)]">
            <span className="text-white font-semibold text-lg tracking-wide">V</span>
          </div>
          <span className="text-xl font-light text-foreground tracking-[0.12em]">
            VOOM
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/products" active={location.startsWith("/products")}>
            Browse Parts
          </NavLink>
          <NavLink href="/vendors" active={location.startsWith("/vendors")}>
            Vendors
          </NavLink>
          <NavLink href="/categories" active={location.startsWith("/categories")}>
            Categories
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <Link href="/products">
            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-2xl">
              <Search className="h-[18px] w-[18px]" />
            </Button>
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground rounded-2xl">
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary/90 text-[10px] font-semibold text-white flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground rounded-2xl">
                  <ShoppingCart className="h-[18px] w-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary/90 text-[10px] font-semibold text-white flex items-center justify-center shadow-sm">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground rounded-2xl ml-1">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="hidden sm:inline text-sm font-normal tracking-wide">
                      {user?.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl glass-strong border-white/20 shadow-[0_8px_32px_-6px_rgba(0,0,0,0.08)]">
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2 no-underline">
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "vendor" && (
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/dashboard" className="flex items-center gap-2 no-underline">
                        <Store className="h-4 w-4" /> Vendor Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 no-underline">
                        <LayoutDashboard className="h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-full" asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
              <Button size="sm" className="rounded-full shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10)]" asChild>
                <a href={getLoginUrl()} className="text-white no-underline">
                  Sell Parts
                </a>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground rounded-2xl"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/15 glass-strong px-4 pb-5 pt-3 space-y-1">
          <MobileNavLink href="/products" onClick={() => setMobileOpen(false)}>Browse Parts</MobileNavLink>
          <MobileNavLink href="/vendors" onClick={() => setMobileOpen(false)}>Vendors</MobileNavLink>
          <MobileNavLink href="/categories" onClick={() => setMobileOpen(false)}>Categories</MobileNavLink>
          {isAuthenticated && (
            <>
              <MobileNavLink href="/orders" onClick={() => setMobileOpen(false)}>My Orders</MobileNavLink>
              {user?.role !== "user" && (
                <MobileNavLink href="/vendor/dashboard" onClick={() => setMobileOpen(false)}>Vendor Dashboard</MobileNavLink>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm tracking-wide transition-all duration-300 no-underline ${
        active
          ? "bg-white/50 text-foreground shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] backdrop-blur-sm font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-white/30"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 rounded-2xl text-sm tracking-wide text-foreground hover:bg-white/40 no-underline transition-colors duration-200">
      {children}
    </Link>
  );
}
