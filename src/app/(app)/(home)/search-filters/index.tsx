import { CustomCategory } from "../types";
import { Category } from "./category";
import { SearchInput } from "./search-input";

interface Props {
    data: CustomCategory[];
}

export const SearchFilters = ({
    data,
}: Props)=> {
    return (
        <div className="px-4 lg:px-12 py-8 border-b flex flex-col gap-4 w-full">
            <SearchInput/>
            <Category data={data} />
        </div>
    );
};