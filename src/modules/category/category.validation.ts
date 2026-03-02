import { z } from "zod";

export const createCategorySchema = z.object({
	label: z.string().min(1).max(50).trim(),
});
