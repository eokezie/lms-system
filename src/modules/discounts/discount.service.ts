import mongoose from "mongoose";
import { ApiError } from "@/utils/apiError";
import { logger } from "@/utils/logger";
import type { UserRole } from "@/modules/users/user.model";
import { fetchCourseIdsForInstructor } from "@/modules/admin-dashboard/admin-dashboard.repository";
import { isCourseOwnedByInstructor } from "@/modules/courses/course.repository";
import {
  createDiscount,
  findDiscountById,
  findDiscountsPaginated,
  findActiveDiscountsPaginated,
  findInactiveDiscountsPaginated,
  findActiveDiscountForCourse,
  updateDiscountById,
  deleteDiscountById,
} from "./discount.repository";
import { IDiscount } from "./discount.model";
import { CreateDiscountDto, UpdateDiscountDto } from "./discount.types";

async function resolveDiscountListScope(
  role: UserRole,
  userId: string,
): Promise<mongoose.Types.ObjectId[] | undefined> {
  if (role === "admin" || role === "super_admin") return undefined;
  return fetchCourseIdsForInstructor(userId);
}

function discountCourseIdString(discount: IDiscount): string | null {
  const c = discount.course as
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId }
    | null
    | undefined;
  if (c == null) return null;
  if (typeof c === "object" && "_id" in c) return String(c._id);
  return String(c);
}

async function assertDiscountAccess(
  discount: IDiscount,
  role: UserRole,
  userId: string,
): Promise<void> {
  if (role === "admin" || role === "super_admin") return;
  if (role !== "instructor") {
    throw ApiError.forbidden("Insufficient permissions");
  }
  const cid = discountCourseIdString(discount);
  if (!cid) {
    throw ApiError.forbidden(
      "Only admins can manage platform-wide discounts",
    );
  }
  const owns = await isCourseOwnedByInstructor(cid, userId);
  if (!owns) {
    throw ApiError.forbidden("You can only manage discounts for your own courses");
  }
}

export async function createDiscountService(
  dto: CreateDiscountDto,
  role: UserRole,
  userId: string,
) {
  if (role === "instructor") {
    if (!dto.courseId) {
      throw ApiError.forbidden(
        "Instructors must attach a discount to one of their courses",
      );
    }
    const owns = await isCourseOwnedByInstructor(dto.courseId, userId);
    if (!owns) {
      throw ApiError.forbidden("You can only create discounts for your own courses");
    }
  }
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
  courseId: string | undefined,
  role: UserRole,
  userId: string,
) {
  const restrictToCourseIds = await resolveDiscountListScope(role, userId);
  const { discounts, total } = await findDiscountsPaginated(
    page,
    limit,
    courseId,
    restrictToCourseIds,
  );
  return {
    discounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listActiveDiscountsService(
  page: number,
  limit: number,
  courseId: string | undefined,
  role: UserRole,
  userId: string,
) {
  const restrictToCourseIds = await resolveDiscountListScope(role, userId);
  const { discounts, total } = await findActiveDiscountsPaginated(
    page,
    limit,
    courseId,
    restrictToCourseIds,
  );
  return {
    discounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listInactiveDiscountsService(
  page: number,
  limit: number,
  courseId: string | undefined,
  role: UserRole,
  userId: string,
) {
  const restrictToCourseIds = await resolveDiscountListScope(role, userId);
  const { discounts, total } = await findInactiveDiscountsPaginated(
    page,
    limit,
    courseId,
    restrictToCourseIds,
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
  role: UserRole,
  userId: string,
) {
  const discount = await findDiscountById(id);
  if (!discount) throw ApiError.notFound("Discount not found");
  await assertDiscountAccess(discount, role, userId);
  if (dto.expiresAt && new Date(dto.expiresAt) <= new Date()) {
    throw ApiError.badRequest("Expires date must be in the future");
  }
  const updated = await updateDiscountById(id, dto);
  if (!updated) throw ApiError.notFound("Discount not found");
  logger.info({ discountId: id }, "Discount updated");
  return updated;
}

export async function deleteDiscountService(
  id: string,
  role: UserRole,
  userId: string,
) {
  const discount = await findDiscountById(id);
  if (!discount) throw ApiError.notFound("Discount not found");
  await assertDiscountAccess(discount, role, userId);
  await deleteDiscountById(id);
  logger.info({ discountId: id }, "Discount deleted");
  return { deleted: true };
}

export async function getDiscountByIdService(
  id: string,
  role: UserRole,
  userId: string,
) {
  const discount = await findDiscountById(id);
  if (!discount) throw ApiError.notFound("Discount not found");
  await assertDiscountAccess(discount, role, userId);
  return discount;
}

/** Active discount for a course (for display or checkout). Returns null if none. */
export async function getActiveDiscountForCourseService(courseId: string) {
  return findActiveDiscountForCourse(courseId);
}
