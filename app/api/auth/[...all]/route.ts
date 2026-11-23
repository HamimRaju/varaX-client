import { auth } from "@/app/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: Request) {
  if (new URL(request.url).pathname.endsWith("/sign-up/email")) {
    try {
      const body = (await request.clone().json()) as { password?: unknown };
      if (
        typeof body.password !== "string" ||
        body.password.length < 6 ||
        body.password.length > 128 ||
        !/[A-Z]/.test(body.password) ||
        !/[a-z]/.test(body.password)
      ) {
        return Response.json(
          {
            message:
              "Use 6–128 characters, including one uppercase and one lowercase letter.",
          },
          { status: 400 },
        );
      }
    } catch {
      return Response.json(
        { message: "A valid registration request is required." },
        { status: 400 },
      );
    }
  }

  return handlers.POST(request);
}
