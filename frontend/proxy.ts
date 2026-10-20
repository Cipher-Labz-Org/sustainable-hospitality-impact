export { auth as proxy } from "@/backend/auth";

export const config = {
  matcher: ["/space/:path*", "/assessment", "/assessment/:path*", "/admin", "/admin/:path*", "/login"],
};
