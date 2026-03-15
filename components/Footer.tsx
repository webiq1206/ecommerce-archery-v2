import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background text-foreground pt-20 pb-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <Link href="/" className="flex items-center mb-6">
              <span className="font-display font-normal text-2xl tracking-[0.25em] uppercase">
                APEX<span className="text-primary">ARCHERY</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Equipping hunters and target archers with precision gear for the perfect shot. Built for the wild, engineered for accuracy.
            </p>
          </div>

          <div>
            <h4 className="font-display font-normal text-lg mb-6 tracking-wide text-white">Shop</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><Link href="/products?category=compound-bows" className="hover:text-primary transition-colors">Compound Bows</Link></li>
              <li><Link href="/products?category=recurve-bows" className="hover:text-primary transition-colors">Recurve Bows</Link></li>
              <li><Link href="/products?category=arrows" className="hover:text-primary transition-colors">Arrows & Broadheads</Link></li>
              <li><Link href="/products?category=apparel" className="hover:text-primary transition-colors">Performance Apparel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-normal text-lg mb-6 tracking-wide text-white">Support</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><Link href="/guides" className="hover:text-primary transition-colors">Buying Guides</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ & Shipping</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-normal text-lg mb-6 tracking-wide text-white">Join the Pack</h4>
            <p className="text-white/40 text-sm mb-4">
              Subscribe for exclusive drops, hunting tips, and early access to sales.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email Address"
                className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-l-lg w-full focus:outline-none focus:border-primary placeholder:text-white/30 text-sm"
              />
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-r-lg transition-colors flex items-center justify-center" aria-label="Subscribe to newsletter">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-white/30">
          <p>&copy; {new Date().getFullYear()} Apex Archery. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
