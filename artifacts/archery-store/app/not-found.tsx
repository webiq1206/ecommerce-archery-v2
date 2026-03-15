import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-7xl text-white mb-4">404</h1>
      <h2 className="font-display text-2xl text-white/80 mb-4">Page Not Found</h2>
      <p className="text-white/40 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-8 py-3 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5"
        >
          Shop Products
        </Link>
      </div>
    </div>
  );
}
