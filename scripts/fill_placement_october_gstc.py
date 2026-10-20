"""Fill October 2026 — GSTC assessment web app (Industrial Placement Record Book)."""
from __future__ import annotations

import shutil
from datetime import date, timedelta
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment

SCRIPTS = Path(r"c:\Users\chanithma\Documents\OpenskyErp\scripts")
WORKBOOK = SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix.xlsx"
SOURCE = SCRIPTS / (
    "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_backup_before_october_gstc.xlsx"
)
SHEET = "October -2026"

WEEK_BLOCKS: list[tuple[int, date]] = [
    (1, date(2026, 10, 11)),
    (22, date(2026, 10, 18)),
    (43, date(2026, 10, 25)),
    (64, date(2026, 11, 1)),
]

WRAP = Alignment(wrap_text=True, vertical="top")

WEEK_ENTRIES: list[list[tuple[str, str]]] = [
    [
        (
            "Studied the GSTC Industry Criteria for Hotels (with SDGs) PDF and the organisation’s "
            "CHECKLIST (3).xlsx. Listed how criteria group into sections A–D (sustainability management, "
            "social, cultural, environmental). Wrote a short scope note: one login per hotel organisation, "
            "no public multi-tenant signup, answers stored per criterion with YES/NO/NA, notes, and file "
            "evidence. Identified data entities needed (organisation profile, contact, brand logo, checklist "
            "questions, responses, uploads).",
            "2.1",
        ),
        (
            "Created the GSTC repository from Create Next App (Next.js 16, React 19, TypeScript). Added "
            "dependencies: Prisma ORM, bcryptjs, NextAuth v5 beta, Zod validation, Puppeteer for future PDF "
            "reports, Sharp for images. Set up app/ routes for home, login, signup (optional), space (profile), "
            "assessment area, and admin. Configured ESLint and Tailwind CSS 4 with global styles for the GSTC "
            "brand layout.",
            "4.2",
        ),
        (
            "Designed and implemented the database layer in prisma/schema.prisma: User (email, password hash, "
            "admin flag, canChangePassword), Organization (address and business types JSON), Contact, "
            "BrandAsset, Criterion (section, category, ref, question, sortOrder), Response (status, notes), "
            "and EvidenceFile (stored file metadata). Added docker-compose.yml for PostgreSQL and documented "
            "DATABASE_URL and AUTH_SECRET in README. Ran initial migration 20261012103000_init.",
            "3.4",
        ),
        (
            "Exported checklist content into data/criteria.json (section, category code/name, criterion ref, "
            "question text, sort order). Built prisma/seed.ts to upsert every criterion by unique ref so "
            "re-seeding updates wording without duplicating rows. Confirmed seed count and noted source quirks "
            "(e.g. repeated reporting questions in section C, D1.3 category placement). Tested that sections "
            "A–D can be queried in sort order for the assessment UI.",
            "6.3",
        ),
        (
            "Implemented authentication end-to-end: auth.config.ts pages and callbacks, auth.ts Credentials "
            "provider with bcrypt compare, and API route app/api/auth/[...nextauth]/route.ts. Built login form "
            "and session helpers (lib/get-session.ts, lib/session.ts with requireOrganization). Added proxy.ts "
            "to guard /assessment, /space, and /admin for signed-in users. Smoke-tested sign-in and redirect to "
            "assessment hub.",
            "4.2",
        ),
    ],
    [
        (
            "Built assessment hub at /assessment with section cards for A–D (lib/sections.ts, "
            "section-cards-grid.tsx). Implemented per-section pages /assessment/[section] and assessment "
            "workspace layout with sidebar, mobile nav, breadcrumbs, and section colour tones for navigation "
            "clarity.",
            "3.3",
        ),
        (
            "Developed assessment-panel.tsx: YES/NO/NA status, notes field, and save per criterion. Added server "
            "actions in lib/actions/assessment.ts with Zod responseSchema; upsert Response rows per organisation "
            "and criterion ref; revalidatePath for section and evidence library routes.",
            "4.2",
        ),
        (
            "Implemented evidence upload: storeUpload in lib/storage.ts under private storage/, EvidenceFile "
            "records linked to responses, max files per question. Built evidence-library.tsx and secure download "
            "route app/api/files/evidence/[id] with organisation scope checks.",
            "4.2",
        ),
        (
            "Added signed report download tokens (lib/evidence-download-token.ts) so PDF/HTML reports can link "
            "evidence without exposing public file URLs. Tested upload, list, and authenticated download for "
            "sample image and PDF attachments on section A questions.",
            "5.2",
        ),
        (
            "Implemented My Space profile at /space: organization, contact, and brand forms (profile-forms.tsx, "
            "lib/actions/profile.ts). Added country-select, business types JSON, and brand logo upload API "
            "app/api/files/brand. Verified organisation context loads before assessment saves.",
            "3.3",
        ),
    ],
    [
        (
            "Built admin users module (/admin/users): admin-users-panel.tsx and lib/actions/admin-users.ts to "
            "create managed users with fixed passwords (canChangePassword false). CLI scripts create-user.ts and "
            "set-admin.ts documented in README for provisioning outside the UI.",
            "4.2",
        ),
        (
            "Wired assessment sub-modules from lib/assessment-nav.ts: assignment report, action plans, "
            "sustainability, remarks, publish, share, audit, all documents library, and overview pages with "
            "shared assessment layout and workspace backdrop components.",
            "3.3",
        ),
        (
            "Implemented assignment report API app/api/assessment/report/route.ts: HTML report from criteria "
            "and responses, embedded evidence thumbnails, CSV export columns. Integrated Puppeteer PDF "
            "generation in lib/report-pdf.ts and report-download-buttons on assessment report UI.",
            "4.2",
        ),
        (
            "Extended NextAuth session typing (types/next-auth.d.ts) for user id and isAdmin. Hardened validators "
            "in lib/validators.ts for profile and response payloads. Fixed build issues for Next.js 16 conventions "
            "per project AGENTS.md guidance.",
            "9.2",
        ),
        (
            "Regression-tested assessment flow: answer questions in sections B and C, attach evidence, open "
            "overview progress, generate PDF report, and confirm evidence links work with reportToken query "
            "parameter on download API.",
            "5.3",
        ),
    ],
    [
        (
            "Polished public home page (home-hero.tsx, page.tsx) and site header/footer with GSTC branding. "
            "Implemented optional public signup behind PUBLIC_SIGNUP env flag and multi-step signup-wizard.tsx "
            "linking new user to organisation creation.",
            "3.3",
        ),
        (
            "Completed sustainability-management.ts helpers and sustainability report page; remarks and action-plans "
            "report shells aligned with assessment-report-ui patterns. Added assessment report settings component "
            "for report metadata before export.",
            "4.2",
        ),
        (
            "Ran docker compose Postgres locally; prisma migrate deploy and db seed on clean database. Updated "
            "README with admin user:create / user:admin commands and note that managed users cannot self-change "
            "password in My Space.",
            "6.4",
        ),
        (
            "Authored scripts/verify-flow.ts for automated smoke checks after setup. Ran npm run build and lint; "
            "fixed TypeScript paths and proxy auth redirects for unauthenticated access to /assessment.",
            "5.2",
        ),
        (
            "End-to-end demo preparation: seeded criteria, admin-created hotel user, sample YES/NO answers with "
            "notes and evidence, PDF report download, and evidence library listing. Documented deployment "
            "assumptions (AUTH_SECRET, DATABASE_URL, storage directory) for supervisor review.",
            "9.2",
        ),
    ],
]

PROBLEMS: dict[int, tuple[str, str]] = {
    0: (
        "First prisma migrate and seed failed when local DATABASE_URL did not match the running Postgres "
        "instance; empty DB had no criteria rows.",
        "Started Postgres via docker compose up -d, set DATABASE_URL in .env, ran npx prisma migrate deploy "
        "and npx tsx prisma/seed.ts; confirmed criteria loaded before login tests.",
    ),
    2: (
        "PDF report initially could not load evidence images from private storage paths.",
        "Issued short-lived reportToken on evidence download URLs in report HTML so Puppeteer can fetch "
        "files through /api/files/evidence without public storage exposure.",
    ),
}


def friday_of_week(week_ending_sunday: date) -> date:
    return week_ending_sunday - timedelta(days=2)


def set_wrapped(ws, row: int, col: int, value: str) -> None:
    cell = ws.cell(row, col, value)
    cell.alignment = WRAP


def fill_block(
    ws,
    start_row: int,
    week_ending_sunday: date,
    days: list[tuple[str, str]],
) -> None:
    friday = friday_of_week(week_ending_sunday)
    set_wrapped(ws, start_row, 2, friday.strftime("%d/%m/%Y"))
    for i, (desc, act) in enumerate(days):
        row = start_row + 2 + i
        set_wrapped(ws, row, 2, desc)
        ws.cell(row, 3, act)
        ws.cell(row, 3).alignment = Alignment(vertical="top")


def fill_problems(ws, start_row: int, prob: str, sol: str) -> None:
    ws.cell(start_row + 9, 2, "PROBELMS ENCOUNTERED")
    ws.cell(start_row + 9, 3, "SOLUTIONS FOUND")
    set_wrapped(ws, start_row + 10, 1, prob)
    set_wrapped(ws, start_row + 10, 3, sol)


def main() -> None:
    load_path = SOURCE if SOURCE.is_file() else WORKBOOK
    if not load_path.is_file():
        raise SystemExit(f"Workbook not found: {load_path}")

    wb = openpyxl.load_workbook(load_path)
    ws = wb[SHEET]
    for idx, (start_row, we_sun) in enumerate(WEEK_BLOCKS):
        fill_block(ws, start_row, we_sun, WEEK_ENTRIES[idx])
        if idx in PROBLEMS:
            fill_problems(ws, start_row, *PROBLEMS[idx])

    for dest in (WORKBOOK, SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27.xlsx"):
        try:
            wb.save(dest)
            print(f"Saved: {dest}")
            if dest != WORKBOOK:
                print(
                    "Close the open layoutfix.xlsx in Excel, then replace it with this file "
                    "or re-run after closing."
                )
            return
        except PermissionError:
            continue
    raise SystemExit(f"Could not save — close Excel files in {SCRIPTS} and try again.")


if __name__ == "__main__":
    main()
