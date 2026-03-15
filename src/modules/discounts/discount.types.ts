import { AppliesTo } from "./discount.model";

export interface CreateDiscountDto {
  courseId?: string | null;
  discountName: string;
  percentage: number;
  appliesTo: AppliesTo;
  expiresAt: Date;
  purchaseLimit?: number | null;
  displayOnDashboard?: boolean;
}

export interface UpdateDiscountDto {
  discountName?: string;
  percentage?: number;
  appliesTo?: AppliesTo;
  expiresAt?: Date;
  purchaseLimit?: number | null;
  displayOnDashboard?: boolean;
}
