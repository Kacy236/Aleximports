import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CircleXIcon, LockIcon } from "lucide-react";

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
            <div className="flex items-center justify-between p-4 border-b bg-neutral-50/50">
                <h4 className="font-bold text-lg text-neutral-900">Order Summary</h4>
            </div>
            
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-dashed">
                    <h4 className="font-bold text-xl text-neutral-900">Total</h4>
                    <p className="font-bold text-xl text-green-700">
                        {formatCurrency(total)}
                    </p>
                </div>

                <Button
                    variant="elevated"
                    disabled={disabled}
                    onClick={onPurchase}
                    size="lg"
                    className="text-base w-full text-white bg-primary hover:bg-green-600 font-bold h-12 transition-all active:scale-[0.98]"
                >
                    {disabled ? "Processing..." : "Pay Now with Paystack"}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 font-medium">
                    <LockIcon className="size-3" />
                    Secure encrypted checkout
                </div>
            </div>

            {isCanceled && (
                <div className="p-4 flex justify-center items-center border-t bg-red-50">
                    <div className="bg-white border border-red-200 font-medium px-4 py-3 rounded-lg flex items-center w-full shadow-sm">
                        <div className="flex items-center text-red-600 text-sm">
                            <CircleXIcon className="size-5 mr-2 fill-red-500 text-white" />
                            <span>Payment was canceled or failed. Please try again.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};