import { useState } from "react";
import { Shield, LogIn } from "lucide-react";
import { Link } from "wouter";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isAuthenticated] = useState(() => {
    return sessionStorage.getItem("admin_authenticated") === "true";
  });

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(isAuthenticated);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === "admin") {
      sessionStorage.setItem("admin_authenticated", "true");
      setAuthed(true);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  }

  if (authed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg border max-w-sm w-full">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Authentication required to access the admin panel
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        </form>
        <Link href="/" className="block text-center mt-4 text-sm text-muted-foreground hover:text-primary">
          Back to Store
        </Link>
      </div>
    </div>
  );
}
