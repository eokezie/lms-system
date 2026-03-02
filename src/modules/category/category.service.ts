import { CreateCategoryDto } from "./category.types";
import { createCategory, findAllCategories } from "./category.repository";
import { logger } from "@/utils/logger";
import { findCountOfCoursesPerCategory } from "../courses/course.repository";

export async function createCategoryService(dto: CreateCategoryDto) {
	const category = await createCategory({
		label: dto.label,
	});

	logger.info({ categoryId: category._id }, "Category created");
	return category;
}

export async function getCategoriesAndCountPerCourse(): Promise<any> {
	const [categories, courseCounts] = await Promise.all([
		findAllCategories(),
		findCountOfCoursesPerCategory(),
	]);

	const countMap = new Map(
		courseCounts.map((c) => [c._id.toString(), c.count]),
	);

	const result = categories.map((cat) => ({
		...cat,
		courseCount: countMap.get(cat._id.toString()) ?? 0,
	}));
	return result;
}
