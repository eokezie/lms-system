import type { RequestHandler } from "express";
import Multer from "multer";

const processFile = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

export const processFiles: RequestHandler = processFile.fields([
  { name: "thumbnailImage", maxCount: 1 },
  { name: "captionFile", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "resources", maxCount: 10 }, // adjust cap as needed
]) as unknown as RequestHandler;

export const processProfileMediaFiles: RequestHandler = processFile.fields([
  { name: "avatar", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]) as unknown as RequestHandler;

const SUPPORT_ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const supportFile = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (SUPPORT_ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

export const processSupportFile: RequestHandler = supportFile.single(
  "file",
) as unknown as RequestHandler;
