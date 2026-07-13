import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown from Server Components, Server Actions, and Route
// Handlers — this is what gives us Server Errors / Server Actions / API
// Errors coverage without touching any of that code directly.
export const onRequestError = Sentry.captureRequestError;
