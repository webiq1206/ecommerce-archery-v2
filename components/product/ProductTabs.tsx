"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ReviewSection } from "./ReviewSection";

interface Spec {
  id: string;
  label: string;
  value: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface ProductTabsProps {
  description: string | null;
  specs: Spec[];
  faqs: FAQ[];
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  productId: string;
}

export function ProductTabs({ description, specs, faqs, reviews, averageRating, reviewCount, productId }: ProductTabsProps) {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <Tabs.Root defaultValue="description" className="w-full">
      <Tabs.List className="flex border-b border-white/10 overflow-x-auto">
        <Tabs.Trigger
          value="description"
          className="px-6 py-4 text-sm font-medium tracking-wider uppercase text-white/50 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors whitespace-nowrap"
        >
          Description
        </Tabs.Trigger>
        {specs.length > 0 && (
          <Tabs.Trigger
            value="specs"
            className="px-6 py-4 text-sm font-medium tracking-wider uppercase text-white/50 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors whitespace-nowrap"
          >
            Specifications
          </Tabs.Trigger>
        )}
        <Tabs.Trigger
          value="reviews"
          className="px-6 py-4 text-sm font-medium tracking-wider uppercase text-white/50 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors whitespace-nowrap"
        >
          Reviews ({reviewCount})
        </Tabs.Trigger>
        {faqs.length > 0 && (
          <Tabs.Trigger
            value="faq"
            className="px-6 py-4 text-sm font-medium tracking-wider uppercase text-white/50 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors whitespace-nowrap"
          >
            FAQ
          </Tabs.Trigger>
        )}
      </Tabs.List>

      <Tabs.Content value="description" className="pt-8">
        {description ? (
          <div
            className="prose prose-invert prose-sm max-w-none text-white/60 prose-headings:text-white prose-headings:font-display prose-headings:tracking-wider prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <p className="text-white/40">No description available.</p>
        )}
      </Tabs.Content>

      {specs.length > 0 && (
        <Tabs.Content value="specs" className="pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {specs.map((spec, i) => (
              <div
                key={spec.id}
                className={`flex justify-between py-3 ${
                  i < specs.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <span className="text-sm text-white/50">{spec.label}</span>
                <span className="text-sm font-medium text-white">{spec.value}</span>
              </div>
            ))}
          </div>
        </Tabs.Content>
      )}

      <Tabs.Content value="reviews" className="pt-8">
        <ReviewSection
          productId={productId}
          reviews={reviews}
          averageRating={averageRating}
          reviewCount={reviewCount}
        />
      </Tabs.Content>

      {faqs.length > 0 && (
        <Tabs.Content value="faq" className="pt-8">
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-white hover:text-primary transition-colors"
                >
                  <span className="normal-case">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${expandedFaq === faq.id ? "rotate-180" : ""}`} />
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-6 pb-4 text-sm text-white/50">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </Tabs.Content>
      )}
    </Tabs.Root>
  );
}
