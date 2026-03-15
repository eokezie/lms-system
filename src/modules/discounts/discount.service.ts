import { ApiError } from "@/utils/apiError";
import { logger } from "@/utils/logger";
import {
  createDiscount,
  findDiscountById,
  findDiscountsPaginated,
  findActiveDiscountForCourse,
  updateDiscountById,
  deleteDiscountById,
} from "./discount.repository";
import { CreateDiscountDto, UpdateDiscountDto } from "./discount.types";

export async function createDiscountService(dto: CreateDiscountDto) {
  if (dto.expiresAt && new Date(dto.expiresAt) <= new Date()) {
    throw ApiError.badRequest("Expires date must be in the future");
  }
  const discount = await createDiscount(dto);
  logger.info(
    { discountId: discount._id, discountName: discount.discountName },
    "Discount created",
  );
  return discount;
}

export async function listDiscountsService(
  page: number,
  limit: number,
  courseId?: string,
) {
  const { discounts, total } = await findDiscountsPaginated(
    page,
    limit,
    courseId,
  );
  return {
    discounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateDiscountService(
  id: string,
  dto: UpdateDiscountDto,
) {
  const discount = await findDiscountById(id);
  if (!discount) throw ApiError.notFound("Discount not found");
  if (dto.expiresAt && new Date(dto.expiresAt) <= new Date()) {
    throw ApiError.badRequest("Expires date must be in the future");
  }
  const updated = await updateDiscountById(id, dto);
  if (!updated) throw ApiError.notFound("Discount not found");
  logger.info({ discountId: id }, "Discount updated");
  return updated;
}

export async function deleteDiscountService(id: string) {
  const discount = await findDiscountById(id);
  if (!discount) throw ApiError.notFound("Discount not found");
  await deleteDiscountById(id);
  logger.info({ discountId: id }, "Discount deleted");
  return { deleted: true };
}

export async function getDiscountByIdService(id: string) {
  const discount = await findDiscountById(id);
  if (!discount) throw ApiError.notFound("Discount not found");
  return discount;
}

/** Active discount for a course (for display or checkout). Returns null if none. */
export async function getActiveDiscountForCourseService(courseId: string) {
  return findActiveDiscountForCourse(courseId);
}
