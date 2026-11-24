<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project workflow

- Single npm package; Node.js 20.19+. Use `npm ci` and keep `package-lock.json` in sync.
- Commands: `npm run dev`, `npm run lint`, `npx eslint app/path/to/file.tsx` (focused lint), `npx tsc --noEmit`, `npm run build`.
- No test script or test-runner configuration is present.

## App boundaries and auth

- `app/(site)` holds public pages; `app/dashboard` holds role workspaces. Marketplace data comes from the Express API via `app/lib/api.ts`, not local fixtures.
- Configure local env from `.env.example`. Better Auth's MongoDB connection is in `app/lib/auth.ts`; client/server must share a database (`MONGODB_DB_NAME`, default `varax`). `NEXT_PUBLIC_BACKEND_URL` is the API origin without `/api`.
- `proxy.ts` only checks for a session cookie to guide navigation; Express verifies JWTs and current roles for protected data. Do not treat the proxy check as authorization.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
