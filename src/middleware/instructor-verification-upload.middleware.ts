import type { RequestHandler } from "express";
import Multer from "multer";

const processFile = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

export const processInstructorVerificationFiles: RequestHandler =
  processFile.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "governmentIdFile", maxCount: 1 },
    { name: "relevantCertificateFile", maxCount: 1 },
    { name: "sampleLessonFile", maxCount: 1 },
  ]) as unknown as RequestHandler;
