import { IArticle, IMuxData, IQuestion } from "./lesson.model";

export interface UpdateLessonDto {
	lessonId: string;
	title: string;
	experiencePoints: number;
	type: string;
	mux?: IMuxData;
	article?: IArticle;
	questions?: IQuestion[];
}
