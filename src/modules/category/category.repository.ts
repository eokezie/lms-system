import { ICategory, Category } from "./category.model";
import { CreateCategoryDto } from "./category.types";

export function createCategory(dto: CreateCategoryDto): Promise<ICategory> {
	return Category.create(dto);
}

export function findAllCategories() {
	return Category.find().lean();
}
