import { rm } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { storageRoot, storeUpload } from "@/backend/lib/storage";

const base = process.env.BASE_URL ?? "http://localhost:3001";
const prisma = new PrismaClient();
const email = `verify-${Date.now()}@example.com`;
const password = "correct-horse";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function mergeCookies(current: string, response: Response) {
  const jar = new Map<string, string>();
  for (const part of current.split("; ").filter(Boolean)) {
    const [name, ...rest] = part.split("=");
    jar.set(name, rest.join("="));
  }
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const [name, ...rest] = pair.split("=");
    jar.set(name, rest.join("="));
  }
  return Array.from(jar.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
}

async function main() {
  const home = await fetch(`${base}/`);
  const homeHtml = await home.text();
  assert(home.status === 200, `home status ${home.status}`);
  const publicSignup = process.env.PUBLIC_SIGNUP === "true";
  assert(
    publicSignup ? homeHtml.includes("Create an account") : homeHtml.includes("Sign in"),
    publicSignup ? "home missing signup link" : "home missing sign-in link",
  );
  assert(!homeHtml.toLowerCase().includes("good travel"), "home copied reference marketing");

  const space = await fetch(`${base}/space`, { redirect: "manual" });
  assert(space.status >= 300 && space.status < 400, `space should redirect, got ${space.status}`);
  assert(space.headers.get("location")?.includes("/login"), `space location ${space.headers.get("location")}`);

  const assessment = await fetch(`${base}/assessment`, { redirect: "manual" });
  assert(assessment.headers.get("location")?.includes("/login"), "assessment should require sign-in");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      organization: { create: { name: "Verify Villas", country: "Sri Lanka", language: "English", contact: { create: { firstName: "Asha", lastName: "Perera" } } } },
    },
  });

  let cookies = "";
  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  cookies = mergeCookies(cookies, csrfResponse);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  assert(csrfToken, "missing csrf");

  const signIn = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${base}/assessment`,
    }),
  });
  cookies = mergeCookies(cookies, signIn);
  assert(signIn.status >= 300 && signIn.status < 400, `sign-in status ${signIn.status}`);
  const session = await fetch(`${base}/api/auth/session`, { headers: { cookie: cookies } });
  const sessionJson = (await session.json()) as { user?: { email?: string } };
  assert(sessionJson.user?.email === email, `session missing user: ${JSON.stringify(sessionJson)}`);

  const signedAssessment = await fetch(`${base}/assessment`, { headers: { cookie: cookies } });
  const assessmentHtml = await signedAssessment.text();
  assert(signedAssessment.status === 200, `signed assessment ${signedAssessment.status}`);
  assert(assessmentHtml.includes("Sustainable management"), "assessment overview missing sections");
  assert(assessmentHtml.includes("of 203"), "question total missing");

  const section = await fetch(`${base}/assessment/A`, { headers: { cookie: cookies } });
  const sectionHtml = await section.text();
  assert(section.status === 200, `section ${section.status}`);
  assert(sectionHtml.includes("A1.1"), "section A missing first question");
  assert(sectionHtml.includes("Sustainability Management System"), "missing category");

  const library = await fetch(`${base}/assessment/library`, { headers: { cookie: cookies } });
  assert(library.status === 200, `library ${library.status}`);
  assert((await library.text()).includes("All documents"), "library heading missing");

  const spacePage = await fetch(`${base}/space`, { headers: { cookie: cookies } });
  const spaceHtml = await spacePage.text();
  assert(spacePage.status === 200, `space ${spacePage.status}`);
  assert(spaceHtml.includes("Verify Villas"), "organization name missing from My Space");

  const organization = await prisma.organization.findUniqueOrThrow({ where: { userId: user.id } });
  const pdf = new File([Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")], "policy.pdf", { type: "application/pdf" });
  const stored = await storeUpload("evidence", organization.id, pdf);
  assert(stored.ok, `pdf upload failed ${!stored.ok && stored.error}`);
  const fake = new File([Buffer.from("not a pdf")], "notes.pdf", { type: "application/pdf" });
  const rejected = await storeUpload("evidence", organization.id, fake);
  assert(!rejected.ok, "invalid pdf should be rejected");

  const criterion = await prisma.criterion.findUniqueOrThrow({ where: { ref: "A1.1" } });
  const response = await prisma.response.create({
    data: { organizationId: organization.id, criterionId: criterion.id, status: "YES", notes: "Policy is in the file." },
  });
  if (!stored.ok) throw new Error("unreachable");
  const file = await prisma.evidenceFile.create({
    data: {
      responseId: response.id,
      originalName: stored.originalName,
      storedName: stored.storedName,
      mimeType: stored.mimeType,
      size: stored.size,
    },
  });

  const download = await fetch(`${base}/api/files/evidence/${file.id}?download=1`, { headers: { cookie: cookies } });
  assert(download.status === 200, `download ${download.status}`);
  assert((await download.text()).startsWith("%PDF"), "downloaded bytes are not the pdf");
  const hidden = await fetch(`${base}/api/files/evidence/${file.id}`);
  assert(hidden.status === 401, `anonymous download should be 401, got ${hidden.status}`);

  const answered = await fetch(`${base}/assessment/A?ref=A1.1`, { headers: { cookie: cookies } });
  const answeredHtml = await answered.text();
  assert(answeredHtml.includes("Policy is in the file."), "saved explanation did not render");
  assert(answeredHtml.includes('aria-checked="true"'), "saved Yes status did not render");

  await prisma.user.delete({ where: { id: user.id } });
  await rm(path.join(storageRoot(), "evidence", organization.id), { recursive: true, force: true });
  console.log("verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
