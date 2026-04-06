import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/config/env";
import { ApiError } from "@/utils/apiError";
import { findAllPublishedCoursesForAdvisory } from "./course-advisory.repository";
import { logger } from "@/utils/logger";

interface QuizAnswer {
  question: string;
  answer: string;
}

export interface CourseRecommendation {
  rank: number;
  courseId: string;
  title: string;
  slug: string;
  reasoning: string;
  coverImage?: string;
  instructorName?: string;
  totalLessons?: number;
  estimatedCompletionTime?: number;
  averageRating: number;
}

export async function getAdvisoryRecommendations(
  answers: QuizAnswer[],
): Promise<CourseRecommendation[]> {
  if (!env.ANTHROPIC_API_KEY) {
    throw ApiError.internal("Course advisory AI is not configured");
  }

  const courses = await findAllPublishedCoursesForAdvisory();
  if (courses.length === 0) {
    throw ApiError.notFound("No published courses available for recommendation");
  }

  const courseCatalog = courses.map((c: any) => ({
    id: c._id.toString(),
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    description: c.description?.slice(0, 500),
    skillLevel: c.skillLevel,
    category: c.category?.label ?? "Uncategorized",
    tags: c.tags,
    estimatedCompletionTime: c.estimatedCompletionTime,
    enrollmentCount: c.enrollmentCount,
    averageRating: c.averageRating,
    totalRatings: c.totalRatings,
    isFree: c.isFree,
    whatToLearn: c.whatToLearn?.slice(0, 5),
    requirements: c.requirements?.slice(0, 5),
    hasQuizzes: c.hasQuizzes,
    hasCertificate: c.hasCertificate,
    hasDownloadableResources: c.hasDownloadableResources,
    totalDuration: c.totalDuration,
    instructorName: c.instructor
      ? `${c.instructor.firstName} ${c.instructor.lastName}`
      : undefined,
    coverImage: c.coverImage?.fileUrl,
    totalLessons: c.courseModules?.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length ?? 0),
      0,
    ),
  }));

  const quizSummary = answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are the Infinix Tech Career Wiz — an intelligent course advisor for the Infinix Tech learning platform.

A student has completed a questionnaire about their learning preferences and goals. Based on their answers, recommend the top 3 courses from our catalog that best match their profile.

## Student's Questionnaire Answers
${quizSummary}

## Available Courses
${JSON.stringify(courseCatalog, null, 2)}

## Instructions
Analyze the student's answers holistically — consider their learning goals, familiarity with technology, preferred pace, time commitment, skill interests, task preferences, career orientation, and expected outcomes. Then match them to the most suitable courses.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text. The JSON must be an array of exactly 3 objects (or fewer if fewer than 3 courses are available), ranked from best match to third best:

[
  {
    "rank": 1,
    "courseId": "<course id>",
    "reasoning": "<2-3 sentence explanation of why this course is the best match>"
  },
  {
    "rank": 2,
    "courseId": "<course id>",
    "reasoning": "<2-3 sentence explanation>"
  },
  {
    "rank": 3,
    "courseId": "<course id>",
    "reasoning": "<2-3 sentence explanation>"
  }
]

Each courseId must be a valid id from the course catalog above. Do not invent course ids.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw ApiError.internal("AI returned an unexpected response format");
  }

  let parsed: Array<{ rank: number; courseId: string; reasoning: string }>;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    logger.error(
      { raw: textBlock.text },
      "[course-advisory] Failed to parse AI response",
    );
    throw ApiError.internal("AI returned an invalid response");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw ApiError.internal("AI returned no recommendations");
  }

  const courseMap = new Map(
    courseCatalog.map((c) => [c.id, c]),
  );

  const recommendations: CourseRecommendation[] = [];
  for (const rec of parsed) {
    const course = courseMap.get(rec.courseId);
    if (!course) continue;
    recommendations.push({
      rank: rec.rank,
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      reasoning: rec.reasoning,
      coverImage: course.coverImage,
      instructorName: course.instructorName,
      totalLessons: course.totalLessons,
      estimatedCompletionTime: course.estimatedCompletionTime,
      averageRating: course.averageRating,
    });
  }

  return recommendations;
}
