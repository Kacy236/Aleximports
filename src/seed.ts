import { getPayload } from "payload";
import config from "@payload-config";

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
const createPaystackSubaccount = async (
  tenantName: string,
  bankCode: string,
  accountNumber: string
) => {
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

// Category definitions
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
  // ... (rest of your categories unchanged)
];

const seed = async () => {
  const payload = await getPayload({ config });

  const tenantName = "admin";
  const bankName = "Access Bank";
  const accountNumber =
    NODE_ENV !== "production" ? "0001234567" : "0690000031";

  const bankCode = await getBankCode(bankName);
  if (!bankCode) throw new Error(`Bank code not found for ${bankName}`);

  const paystackAccount = await createPaystackSubaccount(
    tenantName,
    bankCode,
    accountNumber
  );

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
