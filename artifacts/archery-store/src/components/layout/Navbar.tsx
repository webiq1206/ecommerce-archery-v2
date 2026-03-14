import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, Menu, User, Target } from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";
import { useSessionStore } from "@/hooks/use-session";

export function Navbar() {
  const [location] = useLocation();
  const sessionId = useSessionStore((s) => s.sessionId);
  const { data: cartItems } = useGetCart(sessionId ? { sessionId } : undefined);

  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const navLinks = [
    { name: "Shop", href: "/products" },
    { name: "Bows", href: "/products?category=bows" },
    { name: "Apparel", href: "/products?category=apparel" },
    { name: "Guides", href: "/guides" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-foreground hover:text-primary transition-colors">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Target className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform duration-300" />
          <span className="font-display font-bold text-2xl tracking-wide uppercase">
            APEX<span className="text-primary">ARCHERY</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className={`text-sm font-medium tracking-wider uppercase transition-colors hover:text-primary ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/search" className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </Link>
          <Link href="/admin" className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <Link href="/cart" className="p-2 text-muted-foreground hover:text-primary transition-colors relative group">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute 0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
