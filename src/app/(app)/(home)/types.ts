import { Categories } from "@/payload-types";

export type CustomCategory = Categories & {
    subCategories : Categories[];
}