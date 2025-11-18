"use client";

import { CategoriesGetManyOutput } from "@/modules/categories/types";
import { Category } from "@/payload-types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  category: CategoriesGetManyOutput[1];
  isOpen: boolean;
  onCloseSidebar?: () => void; // optional callback to close sidebar
}

export const SubcategoryMenu = ({ category, isOpen, onCloseSidebar }: Props) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen || !category.subcategories || category.subcategories.length === 0) {
    return null;
  }

  const backgroundColor = category.color || "#F5F5F5";

  const handleClick = (subcategory: Category) => {
    router.push(`/${category.slug}/${subcategory.slug}`);
    if (isMobile && onCloseSidebar) {
      onCloseSidebar(); // close sidebar on mobile
    }
  };

  return (
    <div
      className="absolute z-50"
      style={{ top: "100%", left: 0 }}
    >
      {/* Invisible bridge to maintain hover */}
      <div className="h-3 w-60" />
      <div
        style={{ backgroundColor }}
        className="w-60 text-black rounded-md overflow-hidden border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[2px] -translate-y-[2px]"
      >
        <div>
          {category.subcategories.map((subcategory: Category) => (
            <button
              key={subcategory.slug}
              className="w-full text-left p-4 hover:bg-black hover:text-white flex justify-between items-center underline font-medium"
              onClick={() => handleClick(subcategory)}
            >
              {subcategory.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
