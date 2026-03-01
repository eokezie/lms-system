import { ICategory, Category } from "./category.model";
import { CreateCategoryDto } from "./category.types";

export function createCourse(dto: CreateCategoryDto): Promise<ICategory> {
	return Category.create(dto);
}
