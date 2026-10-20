/** When false (default), only admins can create accounts via /admin/users or CLI. */
export function isPublicSignupEnabled() {
  return process.env.PUBLIC_SIGNUP === "true";
}
