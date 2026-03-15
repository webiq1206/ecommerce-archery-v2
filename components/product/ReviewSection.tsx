"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle } from "lucide-react";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewSectionProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

function Stars({ rating, size = 14, interactive, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={interactive ? "button" : undefined}
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        >
          <Star
            className={`${i <= displayRating ? "fill-primary text-primary" : "text-white/20"}`}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) { setError("Please select a rating."); return; }
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          authorName: name.trim(),
          authorEmail: email.trim(),
          rating,
          title: title.trim() || null,
          body: body.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit review.");
        return;
      }

      setSuccess(true);
      setRating(0);
      setName("");
      setEmail("");
      setTitle("");
      setBody("");
      onSubmitted();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 bg-primary/5 rounded-xl border border-primary/10">
        <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
        <p className="text-white font-medium">Thank you for your review!</p>
        <p className="text-sm text-white/40 mt-1">Your review will appear once approved.</p>
        <button onClick={() => setSuccess(false)} className="mt-4 text-sm text-primary hover:text-primary/80">
          Write another review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white/[0.02] rounded-xl border border-white/5 p-6">
      <h3 className="font-display text-lg text-white">Write a Review</h3>

      <div>
        <label className="text-sm text-white/60 mb-2 block">Rating *</label>
        <Stars rating={rating} size={24} interactive onChange={setRating} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-white/60 mb-1.5 block">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="text-sm text-white/60 mb-1.5 block">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-primary"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-white/60 mb-1.5 block">Review Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-primary"
          placeholder="Summarize your experience"
        />
      </div>

      <div>
        <label className="text-sm text-white/60 mb-1.5 block">Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
          placeholder="Tell others about your experience with this product..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Review
      </button>
    </form>
  );
}

export function ReviewSection({ productId, reviews, averageRating, reviewCount }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  return (
    <div id="reviews-section">
      <div className="flex items-start gap-8 mb-10 pb-8 border-b border-white/5">
        <div className="text-center">
          <div className="text-5xl font-display text-white mb-2">{averageRating.toFixed(1)}</div>
          <Stars rating={Math.round(averageRating)} />
          <p className="text-xs text-white/40 mt-2">{reviewCount} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = localReviews.filter((r) => r.rating === star).length;
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-6">{star}&#9733;</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-white/40 w-8">{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all"
          >
            Write a Review
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-10">
          <ReviewForm productId={productId} onSubmitted={() => setShowForm(false)} />
        </div>
      )}

      {localReviews.length > 0 ? (
        <div className="space-y-6">
          {localReviews.map((review) => (
            <div key={review.id} className="pb-6 border-b border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <Stars rating={review.rating} size={12} />
                {review.isVerified && (
                  <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                )}
              </div>
              {review.title && (
                <h4 className="text-sm font-medium text-white mb-1 normal-case">{review.title}</h4>
              )}
              {review.body && (
                <p className="text-sm text-white/50 mb-2">{review.body}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span>{review.authorName}</span>
                <span>&middot;</span>
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-center py-8">No reviews yet. Be the first to review this product!</p>
      )}
    </div>
  );
}
