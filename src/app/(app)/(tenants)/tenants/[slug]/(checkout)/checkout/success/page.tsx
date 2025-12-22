import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Props {
  params: { slug: string };
  searchParams: {
    reference?: string;
    trxref?: string;
  };
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const reference =
    searchParams.reference || searchParams.trxref;

  if (!reference) {
    redirect(`/tenants/${params.slug}`);
  }

  // ✅ VERIFY PAYMENT & CREATE ORDER
  await api.checkout.verifyTransaction({
    reference,
  });

  // ✅ GO TO LIBRARY
  redirect(`/tenants/${params.slug}/library`);
}
