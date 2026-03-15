"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, Home, Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { usePathname } from "next/navigation";

const mobileNav = [
  {
    label: "Bows",
    children: [
      { label: "Compound Bows", href: "/categories/bows/compound" },
      { label: "Recurve Bows", href: "/categories/bows/recurve" },
      { label: "Crossbows", href: "/categories/bows/crossbow" },
      { label: "Longbows", href: "/categories/bows/longbow" },
      { label: "Youth Bows", href: "/categories/bows/youth" },
    ],
  },
  {
    label: "Arrows & Shafts",
    children: [
      { label: "Carbon Arrows", href: "/categories/arrows/carbon" },
      { label: "Aluminum Arrows", href: "/categories/arrows/aluminum" },
      { label: "Broadheads", href: "/categories/arrows/broadheads" },
      { label: "Field Tips", href: "/categories/arrows/field-tips" },
    ],
  },
  {
    label: "Accessories",
    children: [
      { label: "Sights", href: "/categories/accessories/sights" },
      { label: "Arrow Rests", href: "/categories/accessories/rests" },
      { label: "Stabilizers", href: "/categories/accessories/stabilizers" },
      { label: "Releases", href: "/categories/accessories/releases" },
      { label: "Quivers", href: "/categories/accessories/quivers" },
    ],
  },
  {
    label: "Hunting Gear",
    children: [
      { label: "Rangefinders", href: "/categories/hunting/rangefinders" },
      { label: "Optics", href: "/categories/hunting/optics" },
      { label: "Tree Stands", href: "/categories/hunting/tree-stands" },
    ],
  },
  {
    label: "Targets",
    children: [
      { label: "Foam Targets", href: "/categories/targets/foam" },
      { label: "Bag Targets", href: "/categories/targets/bag" },
      { label: "3D Targets", href: "/categories/targets/3d" },
    ],
  },
  {
    label: "Apparel",
    children: [
      { label: "Gloves", href: "/categories/apparel/gloves" },
      { label: "Arm Guards", href: "/categories/apparel/arm-guards" },
      { label: "Performance Apparel", href: "/categories/apparel/performance" },
    ],
  },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const cartItemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const openCart = useCartStore((s) => s.openDrawer);
  const pathname = usePathname();

  return (
    <>
      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/5 lg:hidden">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-white/70 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center">
            <span className="font-display font-normal text-xl tracking-[0.25em] uppercase text-white">
              APEX<span className="text-primary">ARCHERY</span>
            </span>
          </Link>
          <button
            onClick={openCart}
            className="p-2 text-white/70 relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-background z-[70] transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <span className="font-display text-lg tracking-[0.2em] uppercase text-white">
            APEX<span className="text-primary">ARCHERY</span>
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white/70 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="py-4">
          {mobileNav.map((section, idx) => (
            <div key={section.label} className="border-b border-white/5">
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium tracking-wider uppercase text-white/80 hover:text-white min-h-[44px]"
              >
                {section.label}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedIndex === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedIndex === idx && (
                <div className="pb-3 px-6 space-y-1">
                  {section.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2.5 pl-4 text-sm text-white/50 hover:text-primary transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="px-6 pt-4 space-y-1">
            <Link
              href="/guides"
              onClick={() => setIsOpen(false)}
              className="block py-3 text-sm font-medium tracking-wider uppercase text-white/80 hover:text-white"
            >
              Guides
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsOpen(false)}
              className="block py-3 text-sm font-medium tracking-wider uppercase text-white/80 hover:text-white"
            >
              Blog
            </Link>
          </div>
        </nav>
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/98 backdrop-blur-md border-t border-white/5 z-50 lg:hidden">
        <div className="grid grid-cols-5 h-16">
          {[
            { icon: Home, label: "Home", href: "/" },
            { icon: ShoppingBag, label: "Shop", href: "/products" },
            { icon: Search, label: "Search", href: "/search" },
            { icon: User, label: "Account", href: "/account" },
            { icon: ShoppingCart, label: "Cart", href: "/cart" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                pathname === item.href ? "text-primary" : "text-white/40 hover:text-white/70"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wider uppercase">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
