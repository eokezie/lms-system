import { FileType, IArticle, IMuxData, IQuestion } from "./lesson.model";

export interface UpdateLessonDto {
	lessonId: string;
	title: string;
	experiencePoints: number;
	type: string;
	mux?: IMuxData;
	article?: IArticle;
	questions?: IQuestion[];
}

export interface CreateLessonDto {
	title: string;
	moduleId: string;
	moduleTitle?: string;
	courseId: string;
	experiencePoints: string;
	estimatedCompletionTime: number;
	type: string;
	description: string;
	questions?: {
		type: string;
		text: string;
		options: {
			content: string;
			isAnswer: string;
		}[];
		reason: string;
	}[];
	thumbnailImage?: FileType;
	captionFile?: FileType;
	resources?: FileType[];
}
