import AWS from "aws-sdk";
import { env } from "@/config/env";

const spacesEndpoint = new AWS.Endpoint("fra1.digitaloceanspaces.com");

let s3Instance: AWS.S3 | null = null;

/** True when Spaces keys are present — uploads will work. */
export function isSpacesConfigured(): boolean {
  return Boolean(
    env.DIGITAL_OCEAN_SPACES_ACCESS_KEY_ID &&
    env.DIGITAL_OCEAN_SPACES_SECRET_ACCESS_KEY,
  );
}

function getS3(): AWS.S3 {
  const accessKeyId = env.DIGITAL_OCEAN_SPACES_ACCESS_KEY_ID;
  const secretAccessKey = env.DIGITAL_OCEAN_SPACES_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "DigitalOcean Spaces is not configured. Set DIGITAL_OCEAN_SPACES_ACCESS_KEY_ID and DIGITAL_OCEAN_SPACES_SECRET_ACCESS_KEY in your environment (see DigitalOcean Spaces API keys).",
    );
  }
  if (!s3Instance) {
    s3Instance = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId,
      secretAccessKey,
    });
  }
  return s3Instance;
}

const options = { partSize: 10 * 1024 * 1024, queueSize: 10 };

const generateTransactionReference = (length: number) => {
  let a =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890".split("");
  let b = [];
  for (let i = 0; i < length; i++) {
    let result = Math.random() * (a.length - 1);
    let j = result.toFixed(0);
    b[i] = a[Number(j)];
  }
  return b.join("");
};

// safer key (avoid collisions + unsafe characters)
export const buildSafeKey = (originalName: string) => {
  const rand = generateTransactionReference(8);
  const clean = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${Date.now()}_${rand}_${clean}`;
};

export const uploadFile = async (
  file: Express.Multer.File,
  folderName: string,
) => {
  const s3 = getS3();
  const params = {
    Bucket: `smv-spaces/LMS/${folderName}`, // Replace with your DigitalOcean Space name
    Key: buildSafeKey(file.originalname), // Unique file name in the space
    Body: file.buffer, // Stream the file directly to the upload body
    ACL: "public-read", // File will be publicly accessible (optional)
    ContentType: file.mimetype, // Set the content type to the uploaded file's mimetype
  };

  const data = await s3.upload(params, options).promise();
  return {
    fileType: file.mimetype,
    fileName: file.originalname,
    fileSize: file.size,
    fileUrl: data.Location,
  };
};
