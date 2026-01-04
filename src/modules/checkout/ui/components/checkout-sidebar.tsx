import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CircleXIcon } from "lucide-react";

interface CheckoutSidebarProps {
    total: number;
    onPurchase: () => void;
    isCanceled?: boolean;
    disabled?: boolean;
}

export const CheckoutSidebar = ({
    total,
    onPurchase,
    isCanceled,
    disabled,
}: CheckoutSidebarProps) => {
    return (
        <div className="border rounded-md overflow-hidden bg-white flex flex-col shadow-sm">
            <div className="flex items-center justify-between p-6 border-b bg-neutral-50/50">
                <h4 className="font-semibold text-lg uppercase tracking-tight text-muted-foreground">
                    Order Summary
                </h4>
            </div>
            
            <div className="flex items-center justify-between p-6">
                <span className="text-xl font-medium">Total Amount</span>
                <p className="font-bold text-2xl text-green-600">
                    {formatCurrency(total)}
                </p>
            </div>

            <div className="p-6 pt-0 flex items-center justify-center">
                <Button
                    variant="elevated"
                    disabled={disabled || total <= 0}
                    onClick={onPurchase}
                    size="lg"
                    className="text-base w-full py-6 font-bold cursor-pointer transition-all duration-200 bg-black text-white hover:bg-green-500 hover:border-green-600"
                >
                    {disabled ? "Processing..." : "Complete Purchase"}
                </Button>
            </div>

            {isCanceled && (
                <div className="p-4 mx-6 mb-6 flex justify-center items-center border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center text-red-800 text-sm font-medium">
                        <CircleXIcon className="size-5 mr-2 fill-red-500 text-white" />
                        <span>Transaction cancelled. Items are still in your cart.</span>
                    </div>
                </div>
            )}
        </div>
    )
};