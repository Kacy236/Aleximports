import { getPayload } from "payload";
import config from "@payload-config";
import fetch from "node-fetch";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Utility: get a Paystack bank code from the bank name (production only)
 */
const getBankCode = async (bankName: string) => {
  if (NODE_ENV !== "production") return "001"; // mock for dev/test

  try {
    const res = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();
    const bank = data.data.find((b: any) =>
      b.name.toLowerCase().includes(bankName.toLowerCase())
    );
    return bank ? bank.code : null;
  } catch (err) {
    console.warn("⚠️ Unable to fetch bank code:", err);
    return null;
  }
};

/**
 * Creates a Paystack subaccount safely
 */
const createPaystackSubaccount = async (tenantName: string, bankCode: string, accountNumber: string) => {
  if (NODE_ENV !== "production") {
    console.log("🧪 Test mode: using mock Paystack subaccount.");
    return { subaccount_code: "001", business_name: `${tenantName} (Test)` };
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
      percentage_charge: 0,
      description: `Paystack subaccount for ${tenantName}`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Paystack Error:", data);
    throw new Error(data.message || "Failed to create Paystack subaccount");
  }

  console.log("✅ Paystack subaccount created:", data.data.subaccount_code);
  return data.data;
};

// Categories
const categories = [
  {
    name: "All",
    slug: "all",
  },
  {
    name: "Business & Money",
    color: "#FFB347",
    slug: "business-money",
    subcategories: [
      { name: "Accounting", slug: "accounting" },
      { name: "Entrepreneurship", slug: "entrepreneurship" },
      { name: "Gigs & Side Projects", slug: "gigs-side-projects" },
      { name: "Investing", slug: "investing" },
      { name: "Management & Leadership", slug: "management-leadership" },
      { name: "Marketing & Sales", slug: "marketing-sales" },
      { name: "Networking, Careers & Jobs", slug: "networking-careers-jobs" },
      { name: "Personal Finance", slug: "personal-finance" },
      { name: "Real Estate", slug: "real-estate" },
    ],
  },
  {
    name: "Software Development",
    color: "#7EC8E3",
    slug: "software-development",
    subcategories: [
      { name: "Web Development", slug: "web-development" },
      { name: "Mobile Development", slug: "mobile-development" },
      { name: "Game Development", slug: "game-development" },
      { name: "Programming Languages", slug: "programming-languages" },
      { name: "DevOps", slug: "devops" },
    ],
  },
  {
    name: "Writing & Publishing",
    color: "#D8B5FF",
    slug: "writing-publishing",
    subcategories: [
      { name: "Fiction", slug: "fiction" },
      { name: "Non-Fiction", slug: "non-fiction" },
      { name: "Blogging", slug: "blogging" },
      { name: "Copywriting", slug: "copywriting" },
      { name: "Self-Publishing", slug: "self-publishing" },
    ],
  },
  {
    name: "Other",
    slug: "other",
  },
  {
    name: "Education",
    color: "#FFE066",
    slug: "education",
    subcategories: [
      { name: "Online Courses", slug: "online-courses" },
      { name: "Tutoring", slug: "tutoring" },
      { name: "Test Preparation", slug: "test-preparation" },
      { name: "Language Learning", slug: "language-learning" },
    ],
  },
  {
    name: "Self Improvement",
    color: "#96E6B3",
    slug: "self-improvement",
    subcategories: [
      { name: "Productivity", slug: "productivity" },
      { name: "Personal Development", slug: "personal-development" },
      { name: "Mindfulness", slug: "mindfulness" },
      { name: "Career Growth", slug: "career-growth" },
    ],
  },
  {
    name: "Fitness & Health",
    color: "#FF9AA2",
    slug: "fitness-health",
    subcategories: [
      { name: "Workout Plans", slug: "workout-plans" },
      { name: "Nutrition", slug: "nutrition" },
      { name: "Mental Health", slug: "mental-health" },
      { name: "Yoga", slug: "yoga" },
    ],
  },
  {
    name: "Design",
    color: "#B5B9FF",
    slug: "design",
    subcategories: [
      { name: "UI/UX", slug: "ui-ux" },
      { name: "Graphic Design", slug: "graphic-design" },
      { name: "3D Modeling", slug: "3d-modeling" },
      { name: "Typography", slug: "typography" },
    ],
  },
  {
    name: "Drawing & Painting",
    color: "#FFCAB0",
    slug: "drawing-painting",
    subcategories: [
      { name: "Watercolor", slug: "watercolor" },
      { name: "Acrylic", slug: "acrylic" },
      { name: "Oil", slug: "oil" },
      { name: "Pastel", slug: "pastel" },
      { name: "Charcoal", slug: "charcoal" },
    ],
  },
  {
    name: "Music",
    color: "#FFD700",
    slug: "music",
    subcategories: [
      { name: "Songwriting", slug: "songwriting" },
      { name: "Music Production", slug: "music-production" },
      { name: "Music Theory", slug: "music-theory" },
      { name: "Music History", slug: "music-history" },
    ],
  },
  {
    name: "Photography",
    color: "#FF6B6B",
    slug: "photography",
    subcategories: [
      { name: "Portrait", slug: "portrait" },
      { name: "Landscape", slug: "landscape" },
      { name: "Street Photography", slug: "street-photography" },
      { name: "Nature", slug: "nature" },
      { name: "Macro", slug: "macro" },
    ],
  },
];


const seed = async () => {
  const payload = await getPayload({ config });

  // Tenant bank details
  const tenantName = "admin";
  const bankName = "Access Bank";
  const accountNumber = NODE_ENV !== "production" ? "0001234567" : "0690000031";

  const bankCode = await getBankCode(bankName);
  if (!bankCode) throw new Error(`Bank code not found for ${bankName}`);

  // Create Paystack subaccount
  const paystackAccount = await createPaystackSubaccount(tenantName, bankCode, accountNumber);

  // Create admin tenant
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

  // Create admin user
  await payload.create({
    collection: "users",
    data: {
      email: "ndubuisik216@gmail.com",
      password: "demo",
      roles: ["super-admin"],
      username: "admin",
      tenants: [{ tenant: adminTenant.id }],
    },
  });

  // Seed categories
  for (const category of categories) {
    const parentCategory = await payload.create({
      collection: "categories",
      data: {
        name: category.name,
        slug: category.slug,
        color: category.color || null,
        parent: null,
      },
    });

    for (const subCategory of category.subcategories || []) {
      await payload.create({
        collection: "categories",
        data: {
          name: subCategory.name,
          slug: subCategory.slug,
          parent: parentCategory.id,
        },
      });
    }
  }

  console.log("✅ Database seed completed successfully!");
};

await seed();
process.exit(0);
