import { getPayload } from "payload";
import config from "@payload-config";

// Configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

/**
 * Utility: Fetch the correct Bank Code from Paystack
 */
const getBankCode = async (bankName: string) => {
  if (!IS_PROD) return "058"; // Mock GTB code for local testing

  try {
    const res = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const bank = data.data.find((b: any) =>
      b.name.toLowerCase().includes(bankName.toLowerCase())
    );

    return bank ? bank.code : null;
  } catch (err) {
    console.error("❌ Error fetching bank list:", err);
    return null;
  }
};

/**
 * Utility: Create the Live/Test Subaccount
 */
const createPaystackSubaccount = async (
  tenantName: string,
  bankCode: string,
  accountNumber: string
) => {
  if (!IS_PROD) {
    console.log("🧪 Test Environment: Skipping Paystack API call, using mock data.");
    return { subaccount_code: "ACCT_MOCK_123", business_name: `${tenantName} (Test)` };
  }

  const response = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: tenantName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 1.5, // Standard percentage
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Paystack API Error: ${data.message}`);
  }

  return data.data;
};

// Category definitions
const categories = [
  {
    name: "All",
    slug: "all",
  },

  // Electronics
  {
    name: "Electronics",
    color: "#2F80FF",
    slug: "electronics",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Tablets", slug: "tablets" },
      { name: "Laptops", slug: "laptops" },
      { name: "Smart Watches", slug: "smart-watches" },
      { name: "Headphones & Earbuds", slug: "headphones-earbuds" },
      { name: "Televisions", slug: "televisions" },
      { name: "Speakers & Home Audio", slug: "speakers-home-audio" },
      { name: "Cameras & Drones", slug: "cameras-drones" },
      { name: "Chargers & Power Banks", slug: "chargers-power-banks" },
      { name: "Gaming Consoles", slug: "gaming-consoles" },
    ],
  },

  // Fashion
  {
    name: "Fashion",
    color: "#FF2D75",
    slug: "fashion",
    subcategories: [
      { name: "Men’s Clothing", slug: "mens-clothing" },
      { name: "Women’s Clothing", slug: "womens-clothing" },
      { name: "Footwear", slug: "footwear" },
      { name: "Bags & Backpacks", slug: "bags-backpacks" },
      { name: "Watches & Jewelry", slug: "watches-jewelry" },
      { name: "Eyewear", slug: "eyewear" },
      { name: "Traditional Wear", slug: "traditional-wear" },
      { name: "Lingerie & Sleepwear", slug: "lingerie-sleepwear" },
    ],
  },

  // Health & Beauty
  {
    name: "Health & Beauty",
    color: "#FF4DBB",
    slug: "health-beauty",
    subcategories: [
      { name: "Makeup", slug: "makeup" },
      { name: "Skincare", slug: "skincare" },
      { name: "Hair Care", slug: "hair-care" },
      { name: "Fragrances", slug: "fragrances" },
      { name: "Personal Care", slug: "personal-care" },
      { name: "Men’s Grooming", slug: "mens-grooming" },
      { name: "Health Supplements", slug: "health-supplements" },
      { name: "Beauty Tools", slug: "beauty-tools" },
    ],
  },

  // Home & Living
  {
    name: "Home & Living",
    color: "#76E043",
    slug: "home-living",
    subcategories: [
      { name: "Furniture", slug: "furniture" },
      { name: "Home Decor", slug: "home-decor" },
      { name: "Bedding & Linens", slug: "bedding-linens" },
      { name: "Lighting", slug: "lighting" },
      { name: "Kitchenware", slug: "kitchenware" },
      { name: "Storage & Organization", slug: "storage-organization" },
      { name: "Bathroom Essentials", slug: "bathroom-essentials" },
      { name: "Cleaning Supplies", slug: "cleaning-supplies" },
    ],
  },

  // Automotive
  {
    name: "Automotive",
    color: "#5C6DFF",
    slug: "automotive",
    subcategories: [
      { name: "Car Parts", slug: "car-parts" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Car Electronics", slug: "car-electronics" },
      { name: "Tires & Wheels", slug: "tires-wheels" },
      { name: "Car Care", slug: "car-care" },
      { name: "Oils & Fluids", slug: "oils-fluids" },
      { name: "Tools & Equipment", slug: "tools-equipment" },
    ],
  },

  // Computers & Office
  {
    name: "Computers & Office",
    color: "#C63BFF",
    slug: "computers-office",
    subcategories: [
      { name: "Desktops", slug: "desktops" },
      { name: "Monitors", slug: "monitors" },
      { name: "Printers & Scanners", slug: "printers-scanners" },
      { name: "Networking Equipment", slug: "networking-equipment" },
      { name: "Computer Accessories", slug: "computer-accessories" },
      { name: "Storage Devices", slug: "storage-devices" },
      { name: "Office Furniture", slug: "office-furniture" },
      { name: "Office Supplies", slug: "office-supplies" },
    ],
  },

  // Groceries & Food
  {
    name: "Groceries & Food",
    color: "#FF8C1A",
    slug: "groceries-food",
    subcategories: [
      { name: "Beverages", slug: "beverages" },
      { name: "Snacks", slug: "snacks" },
      { name: "Cooking Ingredients", slug: "cooking-ingredients" },
      { name: "Grains & Pasta", slug: "grains-pasta" },
      { name: "Canned & Packaged", slug: "canned-packaged" },
      { name: "Spices & Condiments", slug: "spices-condiments" },
      { name: "Bakery & Dairy", slug: "bakery-dairy" },
      { name: "Organic & Healthy", slug: "organic-healthy" },
    ],
  },

  // Sports & Outdoors
  {
    name: "Sports & Outdoors",
    color: "#5368FF",
    slug: "sports-outdoors",
    subcategories: [
      { name: "Fitness Equipment", slug: "fitness-equipment" },
      { name: "Sportswear", slug: "sportswear" },
      { name: "Camping & Hiking", slug: "camping-hiking" },
      { name: "Cycling", slug: "cycling" },
      { name: "Team Sports", slug: "team-sports" },
      { name: "Water Sports", slug: "water-sports" },
      { name: "Outdoor Gear", slug: "outdoor-gear" },
    ],
  },

  // Toys & Babies
  {
    name: "Toys, Kids & Babies",
    color: "#FFC400",
    slug: "toys-kids-babies",
    subcategories: [
      { name: "Toys & Games", slug: "toys-games" },
      { name: "Baby Gear", slug: "baby-gear" },
      { name: "Nursery Furniture", slug: "nursery-furniture" },
      { name: "Feeding & Nursing", slug: "feeding-nursing" },
      { name: "Baby Care", slug: "baby-care" },
      { name: "Kids Clothing", slug: "kids-clothing" },
      { name: "School Supplies", slug: "school-supplies" },
    ],
  },

  // Real Estate
  {
    name: "Real Estate & Rentals",
    color: "#4A90E2",
    slug: "real-estate-rentals",
    subcategories: [
      { name: "Apartments", slug: "apartments" },
      { name: "Houses", slug: "houses" },
      { name: "Commercial Properties", slug: "commercial-properties" },
      { name: "Short Lets", slug: "short-lets" },
      { name: "Land", slug: "land" },
      { name: "Event Venues", slug: "event-venues" },
      { name: "Office Spaces", slug: "office-spaces" },
    ],
  },

  // Services
  {
    name: "Services",
    color: "#A3684A",
    slug: "services",
    subcategories: [
      { name: "Repairs & Maintenance", slug: "repairs-maintenance" },
      { name: "Cleaning Services", slug: "cleaning-services" },
      { name: "Home Services", slug: "home-services" },
      { name: "Tutoring & Education", slug: "tutoring-education" },
      { name: "Event Planning", slug: "event-planning" },
      { name: "Logistics & Delivery", slug: "logistics-delivery" },
      { name: "Graphic Design", slug: "graphic-design" },
      { name: "Digital Marketing", slug: "digital-marketing" },
    ],
  },

  // Books & Stationery
  {
    name: "Books & Stationery",
    color: "#00CCAA",
    slug: "books-stationery",
    subcategories: [
      { name: "Fiction", slug: "fiction" },
      { name: "Non-Fiction", slug: "non-fiction" },
      { name: "Children’s Books", slug: "childrens-books" },
      { name: "Educational", slug: "educational" },
      { name: "Comics & Graphic Novels", slug: "comics-graphic-novels" },
      { name: "Notebooks & Diaries", slug: "notebooks-diaries" },
      { name: "Office Stationery", slug: "office-stationery" },
    ],
  },

  // Pet Supplies
  {
    name: "Pet Supplies",
    color: "#FF6A3D",
    slug: "pet-supplies",
    subcategories: [
      { name: "Pet Food", slug: "pet-food" },
      { name: "Pet Accessories", slug: "pet-accessories" },
      { name: "Pet Grooming", slug: "pet-grooming" },
      { name: "Aquatic Supplies", slug: "aquatic-supplies" },
      { name: "Bird Supplies", slug: "bird-supplies" },
      { name: "Pet Health", slug: "pet-health" },
    ],
  },

  // Industrial & Tools
  {
    name: "Industrial & Tools",
    color: "#607DFF",
    slug: "industrial-tools",
    subcategories: [
      { name: "Power Tools", slug: "power-tools" },
      { name: "Hand Tools", slug: "hand-tools" },
      { name: "Safety Equipment", slug: "safety-equipment" },
      { name: "Building Materials", slug: "building-materials" },
      { name: "Electrical Equipment", slug: "electrical-equipment" },
      { name: "Machinery", slug: "machinery" },
    ],
  },

  // Travel & Luggage
  {
    name: "Travel & Luggage",
    color: "#4CEBFF",
    slug: "travel-luggage",
    subcategories: [
      { name: "Suitcases", slug: "suitcases" },
      { name: "Travel Bags", slug: "travel-bags" },
      { name: "Backpacks", slug: "backpacks" },
      { name: "Travel Accessories", slug: "travel-accessories" },
      { name: "Luggage Covers", slug: "luggage-covers" },
    ],
  },

  // Other
  {
    name: "Other",
    color: "#BDBDBD",
    slug: "other",
    subcategories: [
      { name: "Uncategorized", slug: "uncategorized" },
      { name: "Custom Items", slug: "custom-items" },
      { name: "Collectibles", slug: "collectibles" },
      { name: "Art & Crafts", slug: "art-crafts" },
      { name: "Limited Edition", slug: "limited-edition" },
      { name: "Handmade", slug: "handmade" },
      { name: "Miscellaneous", slug: "miscellaneous" },
    ],
  },
];

// --- Main Seed Execution ---
const seed = async () => {
  console.log(`\n🚀 Initializing Seed in ${NODE_ENV.toUpperCase()} mode...`);
  
  const payload = await getPayload({ config });

  // 1. Setup Live Credentials
  const tenantName = "Kelechi Paul Ndubuisi"; 
  const bankName = "Zenith Bank";
  const accountNumber = IS_PROD ? "2401536036" : "2401536036";

  // 2. Resolve Bank Code
  const bankCode = await getBankCode(bankName);
  if (!bankCode) throw new Error(`Could not find code for ${bankName}`);

  // 3. Create Subaccount (Real call in Live, Mock in Dev)
  const paystackAccount = await createPaystackSubaccount(
    tenantName,
    bankCode,
    accountNumber
  );

  // 4. Create Tenant in Payload
  console.log("📦 Creating Admin Tenant...");
  const adminTenant = await payload.create({
    collection: "tenants",
    data: {
      name: tenantName,
      slug: "admin",
      bankCode,
      accountNumber,
      paystackSubaccountCode: paystackAccount.subaccount_code,
      paystackDetailsSubmitted: true,
    },
  });

  // 5. Create Super-Admin User
  console.log("👤 Creating Super-Admin User...");
  await payload.create({
    collection: "users",
    data: {
      email: "ndubuisik216@gmail.com",
      password: "Kaycee#236", // CHANGE THIS IMMEDIATELY
      roles: ["super-admin"],
      username: "admin",
      tenants: [{ tenant: adminTenant.id }],
    },
  });

  // 6. Seed Categories & Subcategories
  console.log("📂 Seeding Categories...");
  for (const category of categories) {
    const parent = await payload.create({
      collection: "categories",
      data: {
        name: category.name,
        slug: category.slug,
        color: category.color || null,
        parent: null,
      },
    });

    for (const sub of category.subcategories || []) {
      await payload.create({
        collection: "categories",
        data: {
          name: sub.name,
          slug: sub.slug,
          parent: parent.id,
        },
      });
    }
  }

  console.log("\n✅ ALL DONE: Live seeding completed successfully!");
};

// RUN
seed().catch((err) => {
  console.error("\n❌ SEED FAILED:", err.message);
  process.exit(1);
});