import { cookies } from "next/headers";

interface Props {
  prefix: string;
  value: string;
}

export const generateAuthCookie = async ({ prefix, value }: Props) => {
  const cookieStore = await cookies(); // ✅ await needed in Next 15

  cookieStore.set({
    name: `${prefix}-token`,
    value,
    httpOnly: true,
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
    domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN?.replace(/^https?:\/\//, ""),
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
};
