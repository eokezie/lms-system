import { uploadFile } from "@/libs/spacesFileUpload";
import { FileType } from "@/modules/lessons/lesson.model";
import { Request } from "express";

type MulterFiles = { [fieldname: string]: Express.Multer.File[] };

export type UploadedFiles = {
	thumbnailImage: Express.Multer.File | null;
	captionFile: Express.Multer.File | null;
	resources: Express.Multer.File[];
};

export function getUploadedFiles(req: Request) {
	const files = req.files as MulterFiles;

	return {
		thumbnailImage: files?.["thumbnailImage"]?.[0] ?? null,
		captionFile: files?.["captionFile"]?.[0] ?? null,
		resources: files?.["resources"] ?? [],
	};
}
