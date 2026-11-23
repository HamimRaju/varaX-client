import { auth } from "@/app/lib/auth";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_IMAGE_SIZE + 64 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const uploadAttempts = new Map<string, { count: number; expiresAt: number }>();

function isUploadRateLimited(userId: string): boolean {
  const now = Date.now();
  if (uploadAttempts.size > 1_000) {
    for (const [key, value] of uploadAttempts) {
      if (value.expiresAt <= now) uploadAttempts.delete(key);
    }
  }
  const current = uploadAttempts.get(userId);
  if (!current || current.expiresAt <= now) {
    uploadAttempts.set(userId, { count: 1, expiresAt: now + 60_000 });
    return false;
  }
  if (current.count >= 10) return true;
  current.count += 1;
  return false;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json(
      { success: false, message: "Sign in before uploading an image." },
      { status: 401 },
    );
  }
  if (isUploadRateLimited(session.user.id)) {
    return Response.json(
      { success: false, message: "Too many image uploads. Try again in a minute." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_SIZE) {
    return Response.json(
      { success: false, message: "The image upload exceeds the 5 MB limit." },
      { status: 413 },
    );
  }

  const key = process.env.IMGBB_API_KEY?.trim();
  if (!key) {
    return Response.json(
      { success: false, message: "Image uploads are not configured." },
      { status: 503 },
    );
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("image");
  } catch {
    return Response.json(
      { success: false, message: "A valid image upload is required." },
      { status: 400 },
    );
  }

  if (
    !(file instanceof File) ||
    !ALLOWED_TYPES.has(file.type) ||
    file.size < 1 ||
    file.size > MAX_IMAGE_SIZE
  ) {
    return Response.json(
      {
        success: false,
        message: "Choose a PNG, JPEG, WEBP, or GIF image smaller than 5 MB.",
      },
      { status: 400 },
    );
  }

  const imageForm = new FormData();
  imageForm.set("image", file, file.name);
  let response: Response;
  try {
    response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`,
      { method: "POST", body: imageForm, cache: "no-store" },
    );
  } catch {
    return Response.json(
      { success: false, message: "The image service is temporarily unavailable." },
      { status: 502 },
    );
  }

  const result = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: { url?: string } }
    | null;
  if (!response.ok || !result?.success || !result.data?.url) {
    return Response.json(
      { success: false, message: "The image could not be stored. Try another image." },
      { status: 502 },
    );
  }

  return Response.json(
    { success: true, message: "Image uploaded.", data: { url: result.data.url } },
    { status: 201 },
  );
}
