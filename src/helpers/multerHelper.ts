import { Request } from "express";

type MulterFiles = { [fieldname: string]: Express.Multer.File[] };

export type UploadedFiles = {
  thumbnailImage: Express.Multer.File | null;
  captionFile: Express.Multer.File | null;
  resources: Express.Multer.File[];
  coverImage: Express.Multer.File | null;
  /** Career path thumbnail */
  thumbnail: Express.Multer.File | null;
};

export function getUploadedFiles(req: Request) {
  const files = req.files as MulterFiles;

  return {
    thumbnailImage: files?.["thumbnailImage"]?.[0] ?? null,
    captionFile: files?.["captionFile"]?.[0] ?? null,
    resources: files?.["resources"] ?? [],
    coverImage: files?.["coverImage"]?.[0] ?? null,
    thumbnail: files?.["thumbnail"]?.[0] ?? null,
  };
}
