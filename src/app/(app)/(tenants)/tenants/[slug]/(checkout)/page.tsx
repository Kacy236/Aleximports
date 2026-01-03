import { CheckoutView } from "@/modules/checkout/ui/views/checkout-view"; // Adjust this import path based on where your CheckoutView is located

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const CheckoutPage = async ({ params }: PageProps) => {
  const { slug } = await params;

  return (
    <CheckoutView tenantSlug={slug} />
  );
};

export default CheckoutPage;