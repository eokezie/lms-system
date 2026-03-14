import { FileType } from "./lesson.model";

export interface UpdateLessonDto {
	lessonId: string;
	title: string;
	moduleId: string;
	moduleTitle?: string;
	courseId: string;
	experiencePoints: number;
	estimatedCompletionTime: number;
	type: string;
	description: string;
	// questions?: {
	// 	type: string;
	// 	text: string;
	// 	options: {
	// 		content: string;
	// 		isAnswer: string;
	// 	}[];
	// 	reason: string;
	// }[];
	questions?: string;
	article?: string;
	thumbnailImage?: FileType;
	captionFile?: FileType;
	resources?: FileType[];
}

export interface CreateLessonDto {
	moduleId: string;
	moduleTitle?: string;
	courseId: string;
}
