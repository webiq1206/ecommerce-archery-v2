import { Link } from "wouter";
import { Target, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Target className="w-8 h-8 text-primary" />
              <span className="font-display font-bold text-2xl tracking-wide uppercase">
                APEX<span className="text-primary">ARCHERY</span>
              </span>
            </Link>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed mb-6">
              Equipping hunters and target archers with precision gear for the perfect shot. Built for the wild, engineered for accuracy.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6 tracking-wide">Shop</h4>
            <ul className="space-y-4 text-sm text-secondary-foreground/70">
              <li><Link href="/products?category=compound-bows" className="hover:text-primary transition-colors">Compound Bows</Link></li>
              <li><Link href="/products?category=recurve-bows" className="hover:text-primary transition-colors">Recurve Bows</Link></li>
              <li><Link href="/products?category=arrows" className="hover:text-primary transition-colors">Arrows & Broadheads</Link></li>
              <li><Link href="/products?category=apparel" className="hover:text-primary transition-colors">Performance Apparel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6 tracking-wide">Support</h4>
            <ul className="space-y-4 text-sm text-secondary-foreground/70">
              <li><Link href="/guides" className="hover:text-primary transition-colors">Buying Guides</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ & Shipping</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6 tracking-wide">Join the Pack</h4>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Subscribe for exclusive drops, hunting tips, and early access to sales.
            </p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-secondary-foreground/10 border border-secondary-foreground/20 text-white px-4 py-2 rounded-l-md w-full focus:outline-none focus:border-primary placeholder:text-secondary-foreground/40"
              />
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-r-md transition-colors flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row items-center justify-between text-xs text-secondary-foreground/50">
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
