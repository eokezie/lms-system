import Multer from "multer";

const processFile = Multer({
	storage: Multer.memoryStorage(),
	limits: {
		fileSize: 25 * 1024 * 1024,
	},
});

export const processFiles = processFile.fields([
	{ name: "thumbnailImage", maxCount: 1 },
	{ name: "captionFile", maxCount: 1 },
	{ name: "coverImage", maxCount: 1 },
	{ name: "resources", maxCount: 10 }, // adjust cap as needed
]);
