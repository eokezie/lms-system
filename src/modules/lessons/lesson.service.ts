import { logger } from "@/utils/logger";
import { ApiError } from "@/utils/apiError";
import { UpdateLessonDto } from "./lesson.type";
import { findLessonById, updateLessonById } from "./lesson.repository";
import { mux } from "@/libs/mux";
import { MuxStatus } from "./lesson.model";
import { env } from "@/config/env";

export async function updateLessonService(
  lessonId: string,
  dto: UpdateLessonDto,
) {
  const lesson = await updateLessonById(lessonId, dto);
  return lesson;
}

export async function createMuxUpload(lessonId: string) {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw ApiError.notFound("Lesson not found");

  const upload = await mux.video.uploads.create({
    cors_origin: "*",
    new_asset_settings: {
      playback_policy: ["public"],
      passthrough: lessonId, // ← tie the webhook back to this lesson
    },
  });

  // Persist the uploadId so the webhook can look up by assetId later
  lesson.mux = {
    uploadId: upload.id,
    status: MuxStatus.waiting,
  };
  await lesson.save();
  return upload;
}

export async function verifyMuxWebhook(req: any) {
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Is Buffer:", Buffer.isBuffer(req.body));
  console.log("Body type:", typeof req.body);

  const muxSigningSecret = env.MUX_SIGNING_SECRET;
  console.log("Secret:", muxSigningSecret);
  console.log("Body string:", req.body.toString().substring(0, 100));
  console.log("Sig header:", req.headers["mux-signature"]);

  console.log("In Webhook>>");

  try {
    console.log("ABout to Verify !!");
    mux.webhooks.verifySignature(
      req.body.toString(),
      req.headers,
      muxSigningSecret,
    );
  } catch (error: any) {
    console.error(error);
    throw ApiError.badRequest("Invalid Mux signature");
  }

  console.log("Verified!");
  const event = JSON.parse(req.body.toString());
  const { type, data } = event;

  console.log("Type >>", type);
  console.log("Data >>", data);

  switch (type) {
    // Fired when Mux starts processing
    case "video.asset.created": {
      const lessonId = data.passthrough;
      await updateLessonById(lessonId, {
        "mux.assetId": data.id,
        "mux.status": MuxStatus.preparing,
      });
      break;
    }

    // Fired when the asset is fully ready to stream
    case "video.asset.ready": {
      const lessonId = data.passthrough;
      const playbackId = data.playback_ids?.[0]?.id;

      await updateLessonById(lessonId, {
        "mux.assetId": data.id,
        "mux.playbackId": playbackId,
        "mux.status": MuxStatus.ready,
        // Mux gives duration in seconds as a float
        videoDuration: Math.round(data.duration ?? 0),
      });
      break;
    }

    case "video.asset.errored": {
      const lessonId = data.passthrough;
      await updateLessonById(lessonId, {
        "mux.status": MuxStatus.errored,
      });
      break;
    }

    default:
      break;
  }
  console.log("Done!");
}
