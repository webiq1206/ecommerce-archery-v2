import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Storefront */}
      <Route path="/" component={Home} />
      <Route path="/products" component={Catalog} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      
      {/* Placeholder Checkout/Guides */}
      <Route path="/checkout">
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full">
            <h1 className="text-2xl font-bold font-display mb-2">Checkout</h1>
            <p className="text-muted-foreground">Stripe integration pending in next phase.</p>
            <a href="/" className="mt-6 inline-block text-primary font-bold hover:underline">Back to Store</a>
          </div>
        </div>
      </Route>

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/:path*">
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full">
            <h1 className="text-2xl font-bold font-display mb-2">Admin Section</h1>
            <p className="text-muted-foreground">This admin module is pending implementation.</p>
            <a href="/admin" className="mt-6 inline-block text-primary font-bold hover:underline">Back to Dashboard</a>
          </div>
        </div>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
