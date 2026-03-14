import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { User, ShoppingBag, Heart, MapPin, Settings, LogIn } from "lucide-react";
import { Link } from "wouter";

const sections = [
  { icon: ShoppingBag, label: "Order History", description: "Track and view your past orders", href: "/account/orders" },
  { icon: Heart, label: "Wishlist", description: "Products you've saved for later", href: "/account/wishlist" },
  { icon: MapPin, label: "Addresses", description: "Manage shipping and billing addresses", href: "/account/addresses" },
  { icon: Settings, label: "Account Settings", description: "Update your profile and preferences", href: "/account/settings" },
];

export default function Account() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">Authentication integration coming in next phase</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {sections.map((section) => (
              <div key={section.label} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{section.label}</h3>
                    <p className="text-muted-foreground text-sm">{section.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center bg-secondary/50 rounded-2xl p-8">
            <LogIn className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Sign in to access your account</h2>
            <p className="text-muted-foreground mb-6">Create an account to track orders, save wishlists, and more.</p>
            <button className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold">
              Sign In / Register
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
