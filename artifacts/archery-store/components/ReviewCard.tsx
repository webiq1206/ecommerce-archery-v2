import { Star } from "lucide-react";

interface ReviewCardProps {
  review: {
    id: string;
    authorName: string;
    rating: number;
    title?: string | null;
    body: string;
    isVerified?: boolean;
    createdAt: string;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        {review.isVerified && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            Verified Purchase
          </span>
        )}
      </div>
      {review.title && (
        <h4 className="font-normal text-foreground mb-2">{review.title}</h4>
      )}
      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4">
        {review.body}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{review.authorName}</span>
        <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>
  );
}
