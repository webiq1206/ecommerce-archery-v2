import Link from "next/link";
import { ShoppingCart, Search, User, Target } from "lucide-react";

export function Navbar() {
  const navLinks = [
    { name: "Shop", href: "/products" },
    { name: "Bows", href: "/products?category=bows" },
    { name: "Apparel", href: "/products?category=apparel" },
    { name: "Guides", href: "/guides" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Target className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform duration-300" />
          <span className="font-display font-bold text-2xl tracking-wide uppercase">
            APEX<span className="text-primary">ARCHERY</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium tracking-wider uppercase transition-colors hover:text-primary text-muted-foreground"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/search" className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </Link>
          <Link href="/admin" className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <Link href="/cart" className="p-2 text-muted-foreground hover:text-primary transition-colors relative">
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
