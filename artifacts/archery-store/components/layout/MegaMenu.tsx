"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface FeaturedCard {
  label: string;
  href: string;
  image: string;
}

interface MenuColumn {
  heading: string;
  links: { label: string; href: string }[];
}

interface MenuSection {
  label: string;
  href: string;
  columns: MenuColumn[];
  featured?: FeaturedCard;
}

const menuData: MenuSection[] = [
  {
    label: "Bows",
    href: "/categories/bows",
    columns: [
      {
        heading: "By Type",
        links: [
          { label: "Compound Bows", href: "/categories/bows/compound" },
          { label: "Recurve Bows", href: "/categories/bows/recurve" },
          { label: "Crossbows", href: "/categories/bows/crossbow" },
          { label: "Longbows", href: "/categories/bows/longbow" },
          { label: "Youth Bows", href: "/categories/bows/youth" },
        ],
      },
      {
        heading: "Popular",
        links: [
          { label: "Best Sellers", href: "/collections/best-selling-bows" },
          { label: "New Arrivals", href: "/collections/new-bows" },
          { label: "Bow Packages", href: "/collections/bow-packages" },
        ],
      },
    ],
    featured: { label: "Best Selling Bows", href: "/collections/best-selling-bows", image: "/images/featured/bows.jpg" },
  },
  {
    label: "Arrows & Shafts",
    href: "/categories/arrows",
    columns: [
      {
        heading: "Arrows",
        links: [
          { label: "Carbon Arrows", href: "/categories/arrows/carbon" },
          { label: "Aluminum Arrows", href: "/categories/arrows/aluminum" },
          { label: "Wooden Arrows", href: "/categories/arrows/wooden" },
        ],
      },
      {
        heading: "Components",
        links: [
          { label: "Broadheads", href: "/categories/arrows/broadheads" },
          { label: "Field Tips", href: "/categories/arrows/field-tips" },
          { label: "Nocks", href: "/categories/arrows/nocks" },
          { label: "Fletching", href: "/categories/arrows/fletching" },
        ],
      },
    ],
    featured: { label: "Carbon Arrow Guide", href: "/guides/carbon-arrows", image: "/images/featured/arrows.jpg" },
  },
  {
    label: "Accessories",
    href: "/categories/accessories",
    columns: [
      {
        heading: "Bow Accessories",
        links: [
          { label: "Sights", href: "/categories/accessories/sights" },
          { label: "Arrow Rests", href: "/categories/accessories/rests" },
          { label: "Stabilizers", href: "/categories/accessories/stabilizers" },
          { label: "Releases", href: "/categories/accessories/releases" },
          { label: "Quivers", href: "/categories/accessories/quivers" },
          { label: "Grips", href: "/categories/accessories/grips" },
        ],
      },
    ],
    featured: { label: "New Accessories", href: "/collections/new-accessories", image: "/images/featured/accessories.jpg" },
  },
  {
    label: "Hunting Gear",
    href: "/categories/hunting",
    columns: [
      {
        heading: "Hunting",
        links: [
          { label: "Calls & Scent Control", href: "/categories/hunting/calls" },
          { label: "Rangefinders", href: "/categories/hunting/rangefinders" },
          { label: "Optics", href: "/categories/hunting/optics" },
          { label: "Tree Stands", href: "/categories/hunting/tree-stands" },
          { label: "Blinds", href: "/categories/hunting/blinds" },
        ],
      },
    ],
    featured: { label: "Hunting Season Essentials", href: "/collections/hunting-essentials", image: "/images/featured/hunting.jpg" },
  },
  {
    label: "Targets",
    href: "/categories/targets",
    columns: [
      {
        heading: "By Type",
        links: [
          { label: "Foam Targets", href: "/categories/targets/foam" },
          { label: "Bag Targets", href: "/categories/targets/bag" },
          { label: "3D Targets", href: "/categories/targets/3d" },
          { label: "Practice Equipment", href: "/categories/targets/practice" },
        ],
      },
    ],
    featured: { label: "3D Target Collection", href: "/collections/3d-targets", image: "/images/featured/targets.jpg" },
  },
  {
    label: "Apparel",
    href: "/categories/apparel",
    columns: [
      {
        heading: "Protection",
        links: [
          { label: "Gloves", href: "/categories/apparel/gloves" },
          { label: "Arm Guards", href: "/categories/apparel/arm-guards" },
          { label: "Chest Protectors", href: "/categories/apparel/chest-protectors" },
          { label: "Performance Apparel", href: "/categories/apparel/performance" },
        ],
      },
    ],
    featured: { label: "Performance Gear", href: "/collections/performance-apparel", image: "/images/featured/apparel.jpg" },
  },
  {
    label: "Brands",
    href: "/brands",
    columns: [
      {
        heading: "Top Brands",
        links: [
          { label: "Hoyt", href: "/brands/hoyt" },
          { label: "Mathews", href: "/brands/mathews" },
          { label: "Bear Archery", href: "/brands/bear-archery" },
          { label: "PSE", href: "/brands/pse" },
          { label: "Bowtech", href: "/brands/bowtech" },
        ],
      },
      {
        heading: "More Brands",
        links: [
          { label: "Gold Tip", href: "/brands/gold-tip" },
          { label: "Easton", href: "/brands/easton" },
          { label: "TenPoint", href: "/brands/tenpoint" },
          { label: "View All Brands", href: "/brands" },
        ],
      },
    ],
    featured: { label: "Shop All Brands", href: "/brands", image: "/images/featured/brands.jpg" },
  },
  {
    label: "Guides",
    href: "/guides",
    columns: [
      {
        heading: "Resources",
        links: [
          { label: "Buying Guides", href: "/guides" },
          { label: "Blog", href: "/blog" },
        ],
      },
    ],
    featured: { label: "Beginner's Guide", href: "/guides/beginners-guide", image: "/images/featured/guides.jpg" },
  },
];

export function MegaMenu() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelLinksRef = useRef<HTMLAnchorElement[]>([]);

  const openMenu = useCallback((index: number) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveIndex(index);
  }, []);

  const closeMenu = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const startClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setActiveIndex(null);
    }, 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (activeIndex !== null && panelRef.current) {
      panelLinksRef.current = Array.from(
        panelRef.current.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']")
      );
    } else {
      panelLinksRef.current = [];
    }
  }, [activeIndex]);

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndex === idx) {
            closeMenu();
          } else {
            openMenu(idx);
            requestAnimationFrame(() => {
              panelLinksRef.current[0]?.focus();
            });
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (idx < menuData.length - 1) {
            triggerRefs.current[idx + 1]?.focus();
            openMenu(idx + 1);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (idx > 0) {
            triggerRefs.current[idx - 1]?.focus();
            openMenu(idx - 1);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (activeIndex === idx) {
            panelLinksRef.current[0]?.focus();
          } else {
            openMenu(idx);
            requestAnimationFrame(() => {
              panelLinksRef.current[0]?.focus();
            });
          }
          break;
        case "Escape":
          e.preventDefault();
          closeMenu();
          triggerRefs.current[idx]?.focus();
          break;
        case "Tab":
          closeMenu();
          break;
      }
    },
    [activeIndex, openMenu, closeMenu]
  );

  const handlePanelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const links = panelLinksRef.current;
      const currentIdx = links.indexOf(e.target as HTMLAnchorElement);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIdx < links.length - 1) {
            links[currentIdx + 1]?.focus();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIdx > 0) {
            links[currentIdx - 1]?.focus();
          } else if (activeIndex !== null) {
            triggerRefs.current[activeIndex]?.focus();
          }
          break;
        case "Escape":
          e.preventDefault();
          if (activeIndex !== null) {
            triggerRefs.current[activeIndex]?.focus();
          }
          closeMenu();
          break;
        case "Tab":
          closeMenu();
          break;
      }
    },
    [activeIndex, closeMenu]
  );

  return (
    <nav role="navigation" aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
      <div role="menubar" className="flex items-center gap-1">
        {menuData.map((section, idx) => (
          <div
            key={section.label}
            className="relative"
            onMouseEnter={() => openMenu(idx)}
            onMouseLeave={startClose}
          >
            <button
              ref={(el) => { triggerRefs.current[idx] = el; }}
              role="menuitem"
              aria-haspopup="true"
              aria-expanded={activeIndex === idx}
              className={`px-3 py-2 text-sm font-medium tracking-wider uppercase transition-colors ${
                activeIndex === idx ? "text-white" : "text-white/70 hover:text-white"
              }`}
              onFocus={() => openMenu(idx)}
              onKeyDown={(e) => handleTriggerKeyDown(e, idx)}
            >
              {section.label}
            </button>
            {activeIndex === idx && (
              <div
                ref={panelRef}
                role="menu"
                aria-label={`${section.label} submenu`}
                className="fixed left-0 right-0 top-20 bg-secondary/98 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                onMouseEnter={cancelClose}
                onMouseLeave={startClose}
                onKeyDown={handlePanelKeyDown}
              >
                <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-4 gap-10">
                  {section.columns.map((col) => (
                    <div key={col.heading} role="group" aria-label={col.heading}>
                      <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-secondary-foreground mb-4">
                        {col.heading}
                      </h3>
                      <ul role="none" className="space-y-3">
                        {col.links.map((link) => (
                          <li key={link.href} role="none">
                            <Link
                              href={link.href}
                              role="menuitem"
                              tabIndex={-1}
                              className="text-sm text-white/60 hover:text-primary focus:text-primary focus:outline-none transition-colors block py-0.5"
                              onClick={closeMenu}
                              onFocus={cancelClose}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {section.featured && (
                    <div className="flex flex-col">
                      <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-secondary-foreground mb-4">
                        Featured
                      </h3>
                      <Link
                        href={section.featured.href}
                        role="menuitem"
                        tabIndex={-1}
                        className="group block rounded-lg overflow-hidden border border-white/5 hover:border-primary/40 transition-colors"
                        onClick={closeMenu}
                        onFocus={cancelClose}
                      >
                        <div className="aspect-[4/3] bg-muted overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={section.featured.image}
                            alt={section.featured.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <span className="block px-3 py-2 text-sm font-medium text-white group-hover:text-primary transition-colors">
                          {section.featured.label} &rarr;
                        </span>
                      </Link>
                    </div>
                  )}
                  <div className="col-span-4 pt-4 border-t border-white/5">
                    <Link
                      href={section.href}
                      role="menuitem"
                      tabIndex={-1}
                      className="text-sm font-medium text-primary hover:text-primary/80 focus:outline-none transition-colors"
                      onClick={closeMenu}
                      onFocus={cancelClose}
                    >
                      View All {section.label} &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
