"use client";

import Link from "next/link";
import { useSearchParams, Suspense } from "next/navigation";

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error");

  const messages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link has expired or was already used.",
    Default: "An unexpected error occurred during authentication.",
  };

  const message = messages[errorType ?? ""] ?? messages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="font-display text-3xl tracking-wider text-foreground">Authentication Error</h1>
        <p className="text-secondary-foreground">{message}</p>
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ErrorContent />
    </Suspense>
  );
}
