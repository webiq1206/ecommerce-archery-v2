"use client";

import { useState, useMemo } from "react";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: string | null;
  inventory: number;
  isAvailable: boolean;
  options: Record<string, string> | null;
  imageUrl: string | null;
}

interface VariantSelectorProps {
  variants: Variant[];
  basePrice: string;
  onVariantChange: (variant: Variant | null) => void;
}

export function VariantSelector({ variants, basePrice, onVariantChange }: VariantSelectorProps) {
  const optionGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    for (const v of variants) {
      if (!v.options) continue;
      for (const [key, value] of Object.entries(v.options)) {
        if (!groups.has(key)) groups.set(key, new Set());
        groups.get(key)!.add(value);
      }
    }
    return Array.from(groups.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [variants]);

  const [selections, setSelections] = useState<Record<string, string>>({});

  const selectedVariant = useMemo(() => {
    if (optionGroups.length === 0) return null;
    const allSelected = optionGroups.every((g) => selections[g.name]);
    if (!allSelected) return null;
    return (
      variants.find((v) => {
        if (!v.options) return false;
        return optionGroups.every((g) => v.options![g.name] === selections[g.name]);
      }) ?? null
    );
  }, [selections, variants, optionGroups]);

  const handleSelect = (optionName: string, value: string) => {
    const next = { ...selections, [optionName]: value };
    setSelections(next);

    const allSelected = optionGroups.every((g) => next[g.name]);
    if (allSelected) {
      const match = variants.find((v) => {
        if (!v.options) return false;
        return optionGroups.every((g) => v.options![g.name] === next[g.name]);
      });
      onVariantChange(match ?? null);
    } else {
      onVariantChange(null);
    }
  };

  const isValueAvailable = (optionName: string, value: string) => {
    const testSelections = { ...selections, [optionName]: value };
    return variants.some((v) => {
      if (!v.options || !v.isAvailable) return false;
      return Object.entries(testSelections).every(
        ([k, val]) => !val || v.options![k] === val
      );
    });
  };

  if (optionGroups.length === 0) return null;

  return (
    <div className="space-y-6">
      {optionGroups.map((group) => {
        const nameLower = group.name.toLowerCase();
        const isColor = nameLower.includes("color") || nameLower.includes("camo");
        const isHand = nameLower.includes("hand");
        const isWeight = nameLower.includes("weight");
        const isLength = nameLower.includes("length");

        return (
          <div key={group.name}>
            <label className="text-xs font-bold tracking-wider uppercase text-white/60 mb-3 block">
              {group.name}
              {selections[group.name] && (
                <span className="text-white ml-2 font-normal normal-case tracking-normal">
                  {selections[group.name]}
                </span>
              )}
            </label>

            {isLength ? (
              <select
                value={selections[group.name] ?? ""}
                onChange={(e) => handleSelect(group.name, e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-[#0D0D0D] text-white/50">
                  Select {group.name}
                </option>
                {group.values.map((value) => {
                  const available = isValueAvailable(group.name, value);
                  return (
                    <option
                      key={value}
                      value={value}
                      disabled={!available}
                      className="bg-[#0D0D0D] text-white"
                    >
                      {value}{!available ? " (Unavailable)" : ""}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => {
                  const available = isValueAvailable(group.name, value);
                  const selected = selections[group.name] === value;

                  if (isColor) {
                    return (
                      <button
                        key={value}
                        onClick={() => handleSelect(group.name, value)}
                        disabled={!available}
                        title={value}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selected ? "border-primary ring-2 ring-primary/30" : "border-white/10"
                        } ${!available ? "opacity-30 cursor-not-allowed" : "hover:border-white/30"}`}
                        style={{ backgroundColor: value.toLowerCase().replace(/\s/g, "") }}
                      />
                    );
                  }

                  return (
                    <button
                      key={value}
                      onClick={() => handleSelect(group.name, value)}
                      disabled={!available}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : available
                          ? "border-white/10 text-white/70 hover:border-white/20"
                          : "border-white/5 text-white/20 line-through cursor-not-allowed"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
