import { useState } from "react";
import { useRoute } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useGetProduct, useAddToCart } from "@workspace/api-client-react";
import { useSessionStore } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { Check, Shield, Truck, Minus, Plus, ShoppingCart } from "lucide-react";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = params?.id || "";
  
  const { data: product, isLoading } = useGetProduct(id);
  const addToCartMutation = useAddToCart();
  const sessionId = useSessionStore((s) => s.sessionId);
  const { toast } = useToast();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Require variant selection if variants exist
    if (product.variants?.length > 0 && !selectedVariant) {
      toast({
        title: "Please select an option",
        description: "You must choose a variant before adding to cart.",
        variant: "destructive"
      });
      return;
    }

    addToCartMutation.mutate(
      { data: { productId: product.id, variantId: selectedVariant || undefined, quantity, sessionId } },
      {
        onSuccess: () => {
          toast({
            title: "Added to cart",
            description: `${quantity}x ${product.name} added successfully.`,
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20">Product not found</div>;

  const images = product.images?.length > 0 
    ? product.images.map(i => i.url) 
    : ["https://images.unsplash.com/photo-1598134493179-51332e56807f?w=800&h=800&fit=crop"];

  const currentPrice = selectedVariant 
    ? product.variants.find(v => v.id === selectedVariant)?.price || product.price
    : product.price;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb stub */}
        <div className="text-sm text-muted-foreground mb-8">
          Home / {product.categories?.[0]?.name || "Products"} / <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Images */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-4 overflow-x-auto md:w-24 shrink-0">
              {images.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all shrink-0 w-20 md:w-full ${
                    activeImage === idx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex-1 bg-muted/30 rounded-3xl overflow-hidden aspect-[4/5] relative">
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col pt-4">
            {product.brand && (
              <p className="text-sm font-bold tracking-widest text-primary uppercase mb-2">
                {product.brand.name}
              </p>
            )}
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-medium">${currentPrice}</span>
              {product.compareAtPrice && (
                <span className="text-xl text-muted-foreground line-through">${product.compareAtPrice}</span>
              )}
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mb-8">
                <h4 className="font-bold mb-3 flex items-center justify-between">
                  Select Option
                  {selectedVariant && <span className="text-primary text-sm">Selected</span>}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                        selectedVariant === variant.id 
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-sm shadow-primary/10" 
                          : "border-border hover:border-foreground/30 bg-card"
                      }`}
                    >
                      <div className="block">{variant.name}</div>
                      {variant.price && variant.price !== product.price && (
                         <div className="text-xs mt-1 opacity-70">+${(parseFloat(variant.price) - parseFloat(product.price)).toFixed(2)}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-8 border-border" />

            {/* Actions */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-border rounded-xl bg-card h-14">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {addToCartMutation.isPending ? "Adding..." : (
                  <>
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-4 mt-auto p-6 bg-muted/50 rounded-2xl">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold">Fast Shipping</h5>
                  <p className="text-xs text-muted-foreground">Ships within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold">Authorized Dealer</h5>
                  <p className="text-xs text-muted-foreground">Full factory warranty</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Content Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="flex border-b border-border mb-8">
            <button className="px-8 py-4 border-b-2 border-primary text-primary font-bold">Description</button>
            <button className="px-8 py-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Specifications</button>
          </div>
          <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
            <p>{product.description}</p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
