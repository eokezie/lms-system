import mongoose from "mongoose";
import { Discount, IDiscount } from "./discount.model";
import { CreateDiscountDto, UpdateDiscountDto } from "./discount.types";

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
): Promise<{ discounts: IDiscount[]; total: number }> {
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (courseId) filter.course = new mongoose.Types.ObjectId(courseId);
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

/** Active discount for a course (or global) for checkout/display. Not expired, under purchaseLimit if set. */
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
