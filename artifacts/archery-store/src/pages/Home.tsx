import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Truck, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useListProducts } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";

export default function Home() {
  const { data: featuredProducts } = useListProducts({ featured: true, limit: 4 });

  const categories = [
    { name: "Compound Bows", slug: "compound-bows", image: `${import.meta.env.BASE_URL}images/cat-bows.png` },
    { name: "Arrows & Broadheads", slug: "arrows", image: `${import.meta.env.BASE_URL}images/cat-arrows.png` },
    { name: "Performance Apparel", slug: "apparel", image: `${import.meta.env.BASE_URL}images/cat-apparel.png` },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Bowhunter at dawn"
              className="w-full h-full object-cover object-center scale-105 animate-fade-in"
            />
          </div>
          
          <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <div className="max-w-2xl text-white">
              <span className="inline-block py-1 px-3 border border-primary/50 text-primary uppercase tracking-widest text-xs font-bold mb-6 rounded-full bg-primary/10 backdrop-blur-sm">
                Pursue Perfection
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6">
                Engineered for the <br /> <span className="text-primary italic">Wild.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-xl font-light">
                Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/products" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-center transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                  Shop All Gear
                </Link>
                <Link 
                  href="/products?category=compound-bows" 
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-xl font-semibold text-center transition-all"
                >
                  Explore Bows
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="bg-secondary text-secondary-foreground py-8 border-y border-secondary-foreground/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-secondary-foreground/20">
            <div className="flex flex-col items-center gap-3 pt-4 md:pt-0">
              <Truck className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-bold tracking-wide">Free Shipping</h4>
                <p className="text-sm text-secondary-foreground/70">On all orders over $150</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 pt-4 md:pt-0">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-bold tracking-wide">Lifetime Warranty</h4>
                <p className="text-sm text-secondary-foreground/70">On select flagship bows</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 pt-4 md:pt-0">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-bold tracking-wide">Expert Support</h4>
                <p className="text-sm text-secondary-foreground/70">Tuning & setup advice</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display text-4xl font-bold mb-4">Shop by Category</h2>
              <p className="text-muted-foreground text-lg">Equipment for every discipline.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="group relative aspect-square rounded-3xl overflow-hidden bg-muted">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                  <h3 className="text-white font-display text-2xl font-bold mb-2">{cat.name}</h3>
                  <span className="text-primary font-medium flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                    Explore <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-display text-4xl font-bold mb-4">Featured Gear</h2>
                <p className="text-muted-foreground text-lg">Top tier performance selected by pros.</p>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-primary font-medium hover:underline">
                View all products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
              {featuredProducts?.products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              
              {/* Skeleton loading state */}
              {!featuredProducts && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-2xl aspect-[3/4] mb-4" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-5 bg-muted rounded w-1/4" />
                </div>
              ))}
            </div>
            
            <Link href="/products" className="mt-12 flex sm:hidden items-center justify-center gap-2 w-full py-4 bg-secondary text-white rounded-xl font-medium">
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Brand Story */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
              <img 
                src={`${import.meta.env.BASE_URL}images/brand-story.png`}
                alt="Brand Story"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="max-w-xl">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Built on the foundation of absolute <span className="text-primary italic">accuracy</span>.
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We don't just sell gear; we field-test every bow, arrow, and accessory in the harshest conditions. Our curated selection represents the pinnacle of modern archery technology.
              </p>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Whether you're packing out for a backcountry elk hunt or stepping up to the 3D target line, we provide the confidence that your equipment will perform flawlessly when the moment arrives.
              </p>
              <Link href="/guides" className="inline-flex items-center gap-2 border-b-2 border-primary text-primary font-bold pb-1 hover:text-primary/80 transition-colors">
                Read our gear guides <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
