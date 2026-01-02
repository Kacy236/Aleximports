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
    // This enables the cookie auth on localhost
    // But it will not work wih subdomains turned on
    ...(process.env.NODE_ENV !== "development" && {
       sameSite: "none",
       secure: true,
       domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
       
    })
  });
};
