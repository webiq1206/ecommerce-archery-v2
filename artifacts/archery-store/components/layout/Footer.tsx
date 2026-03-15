"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";
import { analytics } from "@/lib/analytics/track";

const trustBadges = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $99" },
  { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free returns" },
  { icon: ShieldCheck, title: "Secure Checkout", desc: "SSL encrypted" },
  { icon: Headphones, title: "Expert Support", desc: "Archery pros on call" },
];

const shopLinks = [
  { label: "Compound Bows", href: "/categories/bows/compound" },
  { label: "Recurve Bows", href: "/categories/bows/recurve" },
  { label: "Crossbows", href: "/categories/bows/crossbow" },
  { label: "Arrows & Shafts", href: "/categories/arrows" },
  { label: "Broadheads", href: "/categories/arrows/broadheads" },
  { label: "Accessories", href: "/categories/accessories" },
  { label: "Hunting Gear", href: "/categories/hunting" },
  { label: "Targets", href: "/categories/targets" },
  { label: "Apparel", href: "/categories/apparel" },
];

const infoLinks = [
  { label: "About Us", href: "/pages/about" },
  { label: "Blog", href: "/blog" },
  { label: "Buying Guides", href: "/guides" },
  { label: "Brands", href: "/brands" },
];

const supportLinks = [
  { label: "Order Tracking", href: "/account/orders" },
  { label: "Returns & Exchanges", href: "/pages/returns" },
  { label: "Shipping Info", href: "/pages/shipping" },
  { label: "FAQ", href: "/pages/faq" },
  { label: "Contact Us", href: "/pages/contact" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      setSubscribed(true);
      analytics.emailSubscribed("footer");
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-background text-foreground border-t border-border">
      {/* Trust Badges */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-start gap-4">
                <div className="p-3 bg-white/5 rounded-xl shrink-0">
                  <badge.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white normal-case tracking-normal">{badge.title}</h4>
                  <p className="text-xs text-white/40 mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-6">
              <span className="font-display font-normal text-2xl tracking-[0.25em] uppercase">
                APEX<span className="text-primary">ARCHERY</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm">
              Equipping hunters and target archers with precision gear for the perfect shot. Built for the wild, engineered for accuracy.
            </p>

            {subscribed ? (
              <p className="text-primary text-sm font-medium">Thanks for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe}>
                <p className="text-white/60 text-sm font-medium mb-3">Join the Pack</p>
                <div className="flex max-w-sm">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-l-lg w-full focus:outline-none focus:border-primary placeholder:text-white/30 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-r-lg transition-colors flex items-center justify-center disabled:opacity-50"
                    aria-label="Subscribe to newsletter"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-display font-normal text-lg mb-6 tracking-wide text-white">Shop</h4>
            <ul className="space-y-3 text-sm text-white/40">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h4 className="font-display font-normal text-lg mb-6 tracking-wide text-white">Information</h4>
            <ul className="space-y-3 text-sm text-white/40">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-display font-normal text-lg mb-6 tracking-wide text-white">Customer Service</h4>
            <ul className="space-y-3 text-sm text-white/40">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-white/30 gap-4">
          <p>&copy; {new Date().getFullYear()} Apex Archery. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/pages/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/pages/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <div className="flex items-center gap-3 text-white/20">
            <span className="text-[10px] font-medium border border-white/10 px-2 py-0.5 rounded">VISA</span>
            <span className="text-[10px] font-medium border border-white/10 px-2 py-0.5 rounded">MC</span>
            <span className="text-[10px] font-medium border border-white/10 px-2 py-0.5 rounded">AMEX</span>
            <span className="text-[10px] font-medium border border-white/10 px-2 py-0.5 rounded">APPLE PAY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
