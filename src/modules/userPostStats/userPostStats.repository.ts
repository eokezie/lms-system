import { UserPostStats } from "./userPostStats.model";

export function findStatsByUserIdAndUpdate(userId: string) {
  return UserPostStats.updateOne(
    { user: userId },
    {
      $inc: { postCount: 1 },
      $set: { lastActiveAt: new Date() },
    },
    { upsert: true },
  );
}

export function findTopContributors() {
  return UserPostStats.find()
    .populate({ path: "user", select: "fullName avatar" })
    .sort({ postCount: -1, commentCount: -1 });
}

export function countTopContributors() {
  return UserPostStats.countDocuments();
}
