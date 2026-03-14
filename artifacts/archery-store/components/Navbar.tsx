"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Search, User } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Shop", href: "/products" },
    { name: "Bows", href: "/products?category=compound-bows" },
    { name: "Apparel", href: "/products?category=apparel" },
    { name: "Guides", href: "/guides" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <span className="font-display font-normal text-2xl tracking-[0.25em] uppercase text-white">
            APEX<span className="text-primary">ARCHERY</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium tracking-wider uppercase transition-colors text-white/70 hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/search" className="p-2 text-white/70 hover:text-primary transition-colors" aria-label="Search products">
            <Search className="w-5 h-5" />
          </Link>
          <Link href="/admin" className="p-2 text-white/70 hover:text-primary transition-colors" aria-label="Account">
            <User className="w-5 h-5" />
          </Link>
          <Link href="/cart" className="p-2 text-white/70 hover:text-primary transition-colors relative" aria-label="Shopping cart">
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
