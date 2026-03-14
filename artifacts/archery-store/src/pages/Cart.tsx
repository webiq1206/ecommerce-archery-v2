import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useGetCart, useRemoveFromCart, useUpdateCartItem } from "@workspace/api-client-react";
import { useSessionStore } from "@/hooks/use-session";
import { Trash2, Minus, Plus, ArrowRight } from "lucide-react";

export default function Cart() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const { data: cartItems, refetch } = useGetCart(sessionId ? { sessionId } : undefined);
  
  const removeMutation = useRemoveFromCart({
    mutation: { onSuccess: () => refetch() }
  });
  
  const updateMutation = useUpdateCartItem({
    mutation: { onSuccess: () => refetch() }
  });

  const handleUpdateQty = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    updateMutation.mutate({ data: { itemId, quantity: newQty } });
  };

  const handleRemove = (itemId: string) => {
    removeMutation.mutate({ params: { itemId } });
  };

  const subtotal = cartItems?.reduce((acc, item) => acc + (parseFloat(item.product.price) * item.quantity), 0) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h1 className="font-display text-4xl font-bold mb-10">Your Cart</h1>

        {!cartItems || cartItems.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-3xl">
            <p className="text-xl text-muted-foreground mb-6">Your cart is empty.</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold transition-transform hover:-translate-y-0.5 shadow-lg shadow-primary/20">
              Continue Shopping <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-6 p-6 bg-card border border-border/50 rounded-3xl shadow-sm">
                  <div className="w-24 h-32 bg-muted rounded-xl overflow-hidden shrink-0">
                    <img 
                      src={item.product.imageUrl || "https://images.unsplash.com/photo-1598134493179-51332e56807f?w=200&h=200&fit=crop"} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/products/${item.productId}`} className="font-display font-bold text-lg hover:text-primary transition-colors">
                        {item.product.name}
                      </Link>
                      <span className="font-bold text-lg">${item.product.price}</span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border rounded-lg bg-background">
                        <button 
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          disabled={updateMutation.isPending}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          disabled={updateMutation.isPending}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleRemove(item.id)}
                        disabled={removeMutation.isPending}
                        className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-secondary text-secondary-foreground p-8 rounded-3xl sticky top-28">
                <h3 className="font-display font-bold text-2xl mb-6">Order Summary</h3>
                
                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground/70">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground/70">Shipping</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground/70">Taxes</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="border-t border-secondary-foreground/10 pt-6 mb-8 flex justify-between items-end">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-display font-bold text-3xl text-primary">${subtotal.toFixed(2)}</span>
                </div>

                <Link href="/checkout" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 shadow-lg shadow-black/20 block text-center">
                  Proceed to Checkout <ArrowRight className="w-5 h-5" />
                </Link>
                
                <div className="mt-6 flex items-center justify-center gap-4 opacity-50">
                  {/* Stubs for payment icons */}
                  <div className="h-6 w-10 bg-white/20 rounded"></div>
                  <div className="h-6 w-10 bg-white/20 rounded"></div>
                  <div className="h-6 w-10 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
