import { ApiError } from "@/utils/apiError";

import {
  addAdminNote,
  createFeedback,
  deleteFeedbackById,
  findFeedbackById,
  findFeedbacksPaginated,
} from "./feedback.repository";
import type { ListFeedbackQuery } from "./feedback.validation";

export async function createFeedbackService(
  userId: string,
  title: string,
  body: string,
) {
  return createFeedback({ userId, title, body });
}

export async function listFeedbackService(query: ListFeedbackQuery) {
  return findFeedbacksPaginated(query);
}

export async function getFeedbackByIdService(id: string) {
  const doc = await findFeedbackById(id);
  if (!doc) throw ApiError.notFound("Feedback not found");
  return doc;
}

export async function addNoteToFeedbackService(id: string, note: string) {
  const doc = await addAdminNote(id, note);
  if (!doc) throw ApiError.notFound("Feedback not found");
  return doc;
}

export async function deleteFeedbackService(id: string) {
  const deleted = await deleteFeedbackById(id);
  if (!deleted) throw ApiError.notFound("Feedback not found");
}
