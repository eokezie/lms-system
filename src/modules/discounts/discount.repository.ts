import mongoose from "mongoose";
import { Discount, IDiscount } from "./discount.model";
import { CreateDiscountDto, UpdateDiscountDto } from "./discount.types";

function buildDiscountCourseFilter(
  courseId: string | undefined,
  restrictToCourseIds: mongoose.Types.ObjectId[] | undefined,
): Record<string, unknown> {
  if (restrictToCourseIds === undefined) {
    if (!courseId) return {};
    return { course: new mongoose.Types.ObjectId(courseId) };
  }
  if (restrictToCourseIds.length === 0) {
    return { _id: { $in: [] } };
  }
  if (courseId) {
    const oid = new mongoose.Types.ObjectId(courseId);
    const allowed = restrictToCourseIds.some((id) => id.equals(oid));
    if (!allowed) return { _id: { $in: [] } };
    return { course: oid };
  }
  return { course: { $in: restrictToCourseIds } };
}

export function createDiscount(dto: CreateDiscountDto): Promise<IDiscount> {
  return Discount.create({
    course: dto.courseId ? new mongoose.Types.ObjectId(dto.courseId) : null,
    discountName: dto.discountName,
    percentage: dto.percentage,
    appliesTo: dto.appliesTo,
    expiresAt: dto.expiresAt,
    purchaseLimit: dto.purchaseLimit ?? null,
    displayOnDashboard: dto.displayOnDashboard ?? true,
  });
}

export function findDiscountById(id: string): Promise<IDiscount | null> {
  return Discount.findById(id).populate("course", "title slug").exec();
}

export async function findDiscountsPaginated(
  page: number,
  limit: number,
  courseId?: string,
  restrictToCourseIds?: mongoose.Types.ObjectId[],
): Promise<{ discounts: IDiscount[]; total: number }> {
  const skip = (page - 1) * limit;
  const filter = buildDiscountCourseFilter(courseId, restrictToCourseIds);
  const [discounts, total] = await Promise.all([
    Discount.find(filter)
      .populate("course", "title slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Discount.countDocuments(filter),
  ]);
  return { discounts: discounts as unknown as IDiscount[], total };
}

export async function findActiveDiscountsPaginated(
  page: number,
  limit: number,
  courseId?: string,
  restrictToCourseIds?: mongoose.Types.ObjectId[],
): Promise<{ discounts: IDiscount[]; total: number }> {
  const skip = (page - 1) * limit;
  const now = new Date();
  const activeAnd: Record<string, unknown> = {
    $and: [
      { expiresAt: { $gt: now } },
      {
        $or: [
          { purchaseLimit: null },
          { $expr: { $lt: ["$timesUsed", "$purchaseLimit"] } },
        ],
      },
    ],
  };
  const courseFilter = buildDiscountCourseFilter(courseId, restrictToCourseIds);
  const filter: Record<string, unknown> =
    Object.keys(courseFilter).length === 0
      ? activeAnd
      : { $and: [activeAnd, courseFilter] };
  const [discounts, total] = await Promise.all([
    Discount.find(filter)
      .populate("course", "title slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Discount.countDocuments(filter),
  ]);
  return { discounts: discounts as unknown as IDiscount[], total };
}

export async function findInactiveDiscountsPaginated(
  page: number,
  limit: number,
  courseId?: string,
  restrictToCourseIds?: mongoose.Types.ObjectId[],
): Promise<{ discounts: IDiscount[]; total: number }> {
  const skip = (page - 1) * limit;
  const now = new Date();
  const inactiveOr: Record<string, unknown> = {
    $or: [
      { expiresAt: { $lte: now } },
      {
        $and: [
          { purchaseLimit: { $ne: null } },
          { $expr: { $gte: ["$timesUsed", "$purchaseLimit"] } },
        ],
      },
    ],
  };
  const courseFilter = buildDiscountCourseFilter(courseId, restrictToCourseIds);
  const filter: Record<string, unknown> =
    Object.keys(courseFilter).length === 0
      ? inactiveOr
      : { $and: [inactiveOr, courseFilter] };
  const [discounts, total] = await Promise.all([
    Discount.find(filter)
      .populate("course", "title slug")
      .sort({ expiresAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Discount.countDocuments(filter),
  ]);
  return { discounts: discounts as unknown as IDiscount[], total };
}

export function updateDiscountById(
  id: string,
  dto: UpdateDiscountDto,
): Promise<IDiscount | null> {
  return Discount.findByIdAndUpdate(
    id,
    { $set: dto },
    { new: true, runValidators: true },
  )
    .populate("course", "title slug")
    .exec();
}

export function deleteDiscountById(id: string): Promise<IDiscount | null> {
  return Discount.findByIdAndDelete(id).exec();
}

export function findActiveDiscountForCourse(
  courseId: string,
): Promise<
  (IDiscount & { course?: { _id: string; title: string; slug: string } }) | null
> {
  const now = new Date();
  return Discount.findOne({
    $and: [
      {
        $or: [
          { course: new mongoose.Types.ObjectId(courseId) },
          { course: null },
        ],
      },
      { expiresAt: { $gt: now } },
      {
        $or: [
          { purchaseLimit: null },
          { $expr: { $lt: ["$timesUsed", "$purchaseLimit"] } },
        ],
      },
    ],
  })
    .sort({ course: -1 }) // course-specific first, then global
    .populate("course", "title slug")
    .lean()
    .exec() as Promise<any>;
}

export function incrementDiscountTimesUsed(id: string): Promise<unknown> {
  return Discount.findByIdAndUpdate(id, { $inc: { timesUsed: 1 } }).exec();
}
