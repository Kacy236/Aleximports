import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

import { CustomCategory } from "../types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: CustomCategory[]; // TODO: Remove this later
}

export const CategoriesSidebar = ({
    open,
    onOpenChange,
    data,
}: Props) => {
    const [parentCategories, setParentCategories] = useState<CustomCategory[] | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CustomCategory | null>(null); 

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
             side="left"
             className="p-0 transition-none"
             style={{ backgroundColor: "white"}}
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                        Categories
                    </SheetTitle>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    );
};