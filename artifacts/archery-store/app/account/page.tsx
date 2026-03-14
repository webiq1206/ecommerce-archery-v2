import type { Metadata } from "next";
import { User } from "lucide-react";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your Apex Archery account.",
};

export default function AccountPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <h1 className="font-display text-4xl font-normal mb-8">My Account</h1>
      <div className="bg-card border border-border rounded-3xl p-12 text-center">
        <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-2xl font-normal mb-2">Account Coming Soon</h2>
        <p className="text-muted-foreground">
          Sign in and account management features will be available in a future update.
        </p>
      </div>
    </div>
  );
}
