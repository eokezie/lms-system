import { z } from "zod";
import { CareerPathSkillLevel } from "./career-path.model";

const skillEnum = z.enum([
  CareerPathSkillLevel.Beginner,
  CareerPathSkillLevel.Intermediate,
  CareerPathSkillLevel.Advanced,
]);

/** Multipart sends booleans as strings */
const boolFromForm = z.preprocess((val) => {
  if (val === true || val === "true" || val === "on" || val === "1")
    return true;
  return false;
}, z.boolean());

export const createCareerPathSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(2000),
  careerOutcome: z
    .string()
    .trim()
    .min(1, "Career outcome is required")
    .max(8000),
  industryRecognizedCertificate: boolFromForm.default(false),
  estimatedDuration: z
    .string()
    .trim()
    .min(1, "Estimated duration is required")
    .max(120),
  skillLevel: skillEnum,
  /** JSON string array of course ObjectIds, e.g. '["...","..."]' */
  courseIds: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  slug: z.string().trim().min(1).max(200).optional(),
});

/** PATCH: all fields optional; multipart may omit unchanged fields */
export const updateCareerPathSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  shortDescription: z.string().trim().min(1).max(2000).optional(),
  careerOutcome: z.string().trim().min(1).max(8000).optional(),
  industryRecognizedCertificate: boolFromForm.optional(),
  estimatedDuration: z.string().trim().min(1).max(120).optional(),
  skillLevel: skillEnum.optional(),
  courseIds: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  slug: z.string().trim().min(1).max(200).optional(),
});

export const careerPathIdParamSchema = z.object({
  id: z.string().length(24, "Invalid career path id"),
});

export const listCareerPathsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  status: z
    .enum(["draft", "published", "archived", "all"])
    .optional()
    .default("all"),
  /** Most recent = newest first by createdAt; oldest = oldest first */
  sort: z.enum(["recent", "oldest"]).optional().default("recent"),
});

export const exploreCareerPathsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  skillLevel: skillEnum.optional(),
});
