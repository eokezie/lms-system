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
