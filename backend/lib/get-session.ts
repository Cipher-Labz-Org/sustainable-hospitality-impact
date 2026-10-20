import { cache } from "react";
import { connection } from "next/server";
import { auth } from "@/backend/auth";

/** Session for the current request; avoids stale cached header vs page auth state. */
export const getSession = cache(async () => {
  await connection();
  try {
    const session = await auth();
    // Auth.js may return `{ expires }` without a user when the JWT is stale (e.g. after a DB reset).
    if (!session?.user?.id) return null;
    return session;
  } catch {
    // Stale session cookie or DB unavailable — treat as signed out.
    return null;
  }
});
