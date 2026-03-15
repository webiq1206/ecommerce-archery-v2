import { db } from "../lib/db";
import { categoriesTable, brandsTable, collectionsTable, distributorsTable, productsTable, productImagesTable, productVariantsTable, productSpecsTable, productCategoriesTable, productCollectionsTable, reviewsTable } from "../lib/db";

async function seed() {
  console.log("Seeding database...");

  const [catBows] = await db.insert(categoriesTable).values([
    { name: "Compound Bows", slug: "compound-bows", description: "High-performance compound bows for hunting and target shooting", sortOrder: 1, isActive: true },
  ]).returning();
  const [catCrossbows] = await db.insert(categoriesTable).values([
    { name: "Crossbows", slug: "crossbows", description: "Precision crossbows for hunters", sortOrder: 2, isActive: true },
  ]).returning();
  const [catArrows] = await db.insert(categoriesTable).values([
    { name: "Arrows & Broadheads", slug: "arrows", description: "Carbon arrows, broadheads, and field points", sortOrder: 3, isActive: true },
  ]).returning();
  const [catAccessories] = await db.insert(categoriesTable).values([
    { name: "Accessories", slug: "accessories", description: "Sights, rests, releases, stabilizers and more", sortOrder: 4, isActive: true },
  ]).returning();
  const [catApparel] = await db.insert(categoriesTable).values([
    { name: "Performance Apparel", slug: "apparel", description: "Technical hunting and archery apparel", sortOrder: 5, isActive: true },
  ]).returning();
  console.log("Categories created");

  const [brandMathews] = await db.insert(brandsTable).values({ name: "Mathews", slug: "mathews", description: "Industry-leading compound bows built for the committed bowhunter.", logoUrl: "https://placehold.co/200x80/1A1A1A/C8922A?text=Mathews", isActive: true }).returning();
  const [brandHoyt] = await db.insert(brandsTable).values({ name: "Hoyt", slug: "hoyt", description: "Premium archery equipment since 1931.", logoUrl: "https://placehold.co/200x80/1A1A1A/C8922A?text=Hoyt", isActive: true }).returning();
  const [brandEaston] = await db.insert(brandsTable).values({ name: "Easton", slug: "easton", description: "The gold standard in arrow technology.", logoUrl: "https://placehold.co/200x80/1A1A1A/C8922A?text=Easton", isActive: true }).returning();
  const [brandSitka] = await db.insert(brandsTable).values({ name: "Sitka Gear", slug: "sitka-gear", description: "Technically advanced hunting apparel.", logoUrl: "https://placehold.co/200x80/1A1A1A/C8922A?text=Sitka", isActive: true }).returning();
  const [brandQAD] = await db.insert(brandsTable).values({ name: "QAD", slug: "qad", description: "Quality Archery Designs — precision arrow rests.", logoUrl: "https://placehold.co/200x80/1A1A1A/C8922A?text=QAD", isActive: true }).returning();
  const [brandSpotHogg] = await db.insert(brandsTable).values({ name: "Spot Hogg", slug: "spot-hogg", description: "Rugged, precision bow sights and releases.", logoUrl: "https://placehold.co/200x80/1A1A1A/C8922A?text=Spot+Hogg", isActive: true }).returning();
  console.log("Brands created");

  const [colBestsellers] = await db.insert(collectionsTable).values({ name: "Best Sellers", slug: "best-sellers", description: "Our most popular gear", isActive: true, sortOrder: 1 }).returning();
  const [colNewArrivals] = await db.insert(collectionsTable).values({ name: "New Arrivals", slug: "new-arrivals", description: "Just dropped — latest gear", isActive: true, sortOrder: 2 }).returning();
  const [colHunting] = await db.insert(collectionsTable).values({ name: "Hunting Season Essentials", slug: "hunting-essentials", description: "Everything for a successful hunt", isActive: true, sortOrder: 3 }).returning();
  console.log("Collections created");

  const [dist1] = await db.insert(distributorsTable).values({ name: "Lancaster Archery Supply", contactName: "Mike Lancaster", email: "orders@lancasterarchery.example.com", phone: "717-555-0100", isActive: true }).returning();
  const [dist2] = await db.insert(distributorsTable).values({ name: "Kinsey's Archery", contactName: "John Kinsey", email: "wholesale@kinseys.example.com", phone: "570-555-0200", isActive: true }).returning();
  console.log("Distributors created");

  const productsData = [
    {
      name: "Mathews Phase4 33",
      slug: "mathews-phase4-33",
      sku: "MTH-P433-2024",
      status: "ACTIVE" as const,
      shortDescription: "The ultimate hunting bow — smooth draw, dead-in-hand stability.",
      description: "The Mathews Phase4 33 redefines what a hunting bow can be. Featuring the revolutionary Resistance Phase Damping system and center-grip design, this bow delivers unmatched accuracy and vibration dampening. At 33 inches axle-to-axle with a 6-inch brace height, it offers the perfect balance of speed and forgiveness for any hunting scenario.",
      price: "1299.99",
      compareAtPrice: "1399.99",
      cost: "850.00",
      weight: "4.68",
      brandId: brandMathews.id,
      distributorId: dist1.id,
      isFeatured: true,
      isNewArrival: true,
    },
    {
      name: "Hoyt VTM 34",
      slug: "hoyt-vtm-34",
      sku: "HYT-VTM34-2024",
      status: "ACTIVE" as const,
      shortDescription: "Tournament-level precision in a hunting-ready platform.",
      description: "The Hoyt VTM 34 delivers the smoothest draw cycle in its class thanks to the HBX Cam system. The Valspar V500 finish provides unmatched durability. At 34 inches ATA and weighing 4.5 lbs, this bow is purpose-built for western hunting where long-range accuracy matters most.",
      price: "1249.99",
      cost: "800.00",
      weight: "4.50",
      brandId: brandHoyt.id,
      distributorId: dist1.id,
      isFeatured: true,
      isNewArrival: false,
    },
    {
      name: "Mathews Lift 33",
      slug: "mathews-lift-33",
      sku: "MTH-LIFT33-2024",
      status: "ACTIVE" as const,
      shortDescription: "Lightweight performance for backcountry bowhunters.",
      description: "At just 4.14 lbs, the Mathews Lift 33 is purpose-built for the mountain bowhunter. Features the same Resist Phase Damping technology as the Phase4 but in a lighter package that won't weigh you down on those grueling backcountry miles.",
      price: "1199.99",
      cost: "775.00",
      weight: "4.14",
      brandId: brandMathews.id,
      distributorId: dist1.id,
      isFeatured: true,
      isNewArrival: true,
    },
    {
      name: "Easton 4MM FMJ",
      slug: "easton-4mm-fmj",
      sku: "EST-4MMFMJ-6PK",
      status: "ACTIVE" as const,
      shortDescription: "Full Metal Jacket arrows with devastating penetration.",
      description: "The Easton 4MM FMJ combines a micro-diameter carbon core with an alloy jacket for unmatched penetration. The small diameter reduces wind drift and delivers bone-crushing kinetic energy on impact. Perfect for elk and big game at distance.",
      price: "119.99",
      compareAtPrice: "139.99",
      cost: "65.00",
      weight: "0.25",
      brandId: brandEaston.id,
      distributorId: dist2.id,
      isFeatured: true,
      isNewArrival: false,
    },
    {
      name: "QAD Ultrarest MXT",
      slug: "qad-ultrarest-mxt",
      sku: "QAD-MXT-2024",
      status: "ACTIVE" as const,
      shortDescription: "The most trusted fall-away rest in professional archery.",
      description: "The QAD Ultrarest MXT features total arrow containment with a full-capture launcher that locks in place. The MXT version adds micro-adjust windage and elevation for dead-on tuning. Used by more professional archers than any other rest.",
      price: "249.99",
      cost: "140.00",
      weight: "0.31",
      brandId: brandQAD.id,
      distributorId: dist2.id,
      isFeatured: false,
      isNewArrival: true,
    },
    {
      name: "Spot Hogg Fast Eddie XL",
      slug: "spot-hogg-fast-eddie-xl",
      sku: "SH-FEXL-5PIN",
      status: "ACTIVE" as const,
      shortDescription: "Bulletproof 5-pin sight with micro-adjust pins.",
      description: "The Spot Hogg Fast Eddie XL features individually micro-adjustable pins in a large, hooded guard. Built from 6061 T6 aluminum, this sight will survive anything the backcountry throws at it. The dovetail mounting system allows for quick installation and easy adjustments.",
      price: "329.99",
      cost: "185.00",
      weight: "0.69",
      brandId: brandSpotHogg.id,
      distributorId: dist2.id,
      isFeatured: false,
      isNewArrival: false,
    },
    {
      name: "Sitka Ambient Jacket",
      slug: "sitka-ambient-jacket",
      sku: "STK-AMB-JKT",
      status: "ACTIVE" as const,
      shortDescription: "PrimaLoft insulated jacket for cold-weather stands.",
      description: "The Sitka Ambient Jacket uses PrimaLoft Gold Active insulation that maintains warmth even when wet. The DWR-treated face fabric sheds light moisture and the articulated cut allows full draw without restriction. An essential layering piece for late-season bowhunters.",
      price: "329.00",
      compareAtPrice: "369.00",
      cost: "180.00",
      weight: "1.20",
      brandId: brandSitka.id,
      distributorId: dist1.id,
      isFeatured: false,
      isNewArrival: true,
    },
    {
      name: "Hoyt Carbon RX-8",
      slug: "hoyt-carbon-rx8",
      sku: "HYT-CRX8-2024",
      status: "ACTIVE" as const,
      shortDescription: "Carbon riser bow for the weight-conscious hunter.",
      description: "The Carbon RX-8 features Hoyt's proprietary carbon riser technology, cutting weight without sacrificing stiffness. The RX Cam delivers blazing speeds with a smooth draw cycle. At just 3.9 lbs, this is the lightest fully-featured hunting bow on the market.",
      price: "1799.99",
      cost: "1100.00",
      weight: "3.90",
      brandId: brandHoyt.id,
      distributorId: dist1.id,
      isFeatured: true,
      isNewArrival: true,
    },
  ];

  for (const pData of productsData) {
    const [product] = await db.insert(productsTable).values(pData).returning();

    await db.insert(productImagesTable).values([
      { productId: product.id, url: `https://placehold.co/800x1000/1A1A1A/C8922A?text=${encodeURIComponent(product.name.split(' ')[0])}`, altText: product.name, sortOrder: 0 },
      { productId: product.id, url: `https://placehold.co/800x1000/2C4A2E/F7F6F4?text=${encodeURIComponent('Detail')}`, altText: `${product.name} detail`, sortOrder: 1 },
    ]);

    if (pData.price > "500") {
      await db.insert(productVariantsTable).values([
        { productId: product.id, sku: `${product.sku}-60`, name: "60 lb Draw", price: pData.price, inventory: 8, isAvailable: true, options: { drawWeight: "60 lb" } },
        { productId: product.id, sku: `${product.sku}-70`, name: "70 lb Draw", price: pData.price, inventory: 12, isAvailable: true, options: { drawWeight: "70 lb" } },
        { productId: product.id, sku: `${product.sku}-80`, name: "80 lb Draw", price: String(Number(pData.price) + 50), inventory: 5, isAvailable: true, options: { drawWeight: "80 lb" } },
      ]);
    }

    await db.insert(productSpecsTable).values([
      { productId: product.id, label: "Weight", value: `${pData.weight} lbs`, sortOrder: 0 },
      { productId: product.id, label: "Brand", value: pData.brandId === brandMathews.id ? "Mathews" : pData.brandId === brandHoyt.id ? "Hoyt" : pData.brandId === brandEaston.id ? "Easton" : pData.brandId === brandQAD.id ? "QAD" : pData.brandId === brandSpotHogg.id ? "Spot Hogg" : "Sitka", sortOrder: 1 },
    ]);

    const catId = pData.brandId === brandSitka.id ? catApparel.id :
                  pData.brandId === brandEaston.id ? catArrows.id :
                  (pData.brandId === brandQAD.id || pData.brandId === brandSpotHogg.id) ? catAccessories.id :
                  catBows.id;
    await db.insert(productCategoriesTable).values({ productId: product.id, categoryId: catId, isPrimary: true });

    if (pData.isFeatured) {
      await db.insert(productCollectionsTable).values({ productId: product.id, collectionId: colBestsellers.id });
    }
    if (pData.isNewArrival) {
      await db.insert(productCollectionsTable).values({ productId: product.id, collectionId: colNewArrivals.id });
    }
  }
  console.log("Products created");

  const allProducts = await db.select().from(productsTable).limit(8);
  const reviewNames = ["John D.", "Sarah K.", "Mike R.", "Emily T.", "Chris B.", "Jessica L."];
  const reviewBodies = [
    "Absolutely love this gear. Quality is top-notch and performance is unmatched.",
    "Best purchase I've made this season. Worth every penny.",
    "Exceeded my expectations. The build quality is incredible.",
    "Perfect for what I needed. Highly recommend to any serious archer.",
    "Great product, fast shipping. This store knows their stuff.",
  ];
  for (const product of allProducts) {
    const numReviews = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numReviews; i++) {
      await db.insert(reviewsTable).values({
        productId: product.id,
        authorName: reviewNames[Math.floor(Math.random() * reviewNames.length)],
        rating: Math.floor(Math.random() * 2) + 4,
        title: "Great quality",
        body: reviewBodies[Math.floor(Math.random() * reviewBodies.length)],
        isApproved: true,
        isVerified: Math.random() > 0.3,
      });
    }
  }
  console.log("Reviews created");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(console.error);
