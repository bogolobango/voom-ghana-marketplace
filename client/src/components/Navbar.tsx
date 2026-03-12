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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-extrabold text-lg">V</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
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
        <div className="flex items-center gap-2">
          <Link href="/products">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
              <Button size="sm" asChild>
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
            className="md:hidden text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 pb-4 pt-2 space-y-1">
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
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted no-underline">
      {children}
    </Link>
  );
}
