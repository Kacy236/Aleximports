import { Categories } from "@/payload-types"
import { CategoryDropdown } from "./category-dropdown";

interface Props {
    data: any;
};

export const Category = ({ data }: Props) => {
    return (
        <div className="relative w-full">

            <div className="flex flex-nowrap items-center">
            {data.map((category: Categories ) => (
             <div key={category.id}>
                 <CategoryDropdown 
                   category={category}
                   isActive={false}
                   isNavigationHovered={false}
                 />
             </div>   
            ))}
            </div>
        </div>
    );
};