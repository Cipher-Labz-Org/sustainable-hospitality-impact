"""Update October sheet: short 5–9 Oct, medium 12–14 Oct only."""
from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment

SCRIPTS = Path(r"C:\Users\chanithma\Documents\OpenskyErp\scripts")
WORKBOOK = SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix.xlsx"
SOURCE = SCRIPTS / (
    "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_backup_before_october_gstc.xlsx"
)
SHEET = "October -2026"
WRAP = Alignment(wrap_text=True, vertical="top")

WEEK1_START = 1
WEEK1_SUN = date(2026, 10, 11)  # Fri 09/10
WEEK1_DAYS: list[tuple[str, str]] = [
    (
        "Reviewed GSTC Industry Criteria PDF and CHECKLIST (3).xlsx; scoped sections A–D "
        "sustainability assessment for one hotel organisation per login.",
        "2.1",
    ),
    (
        "Started GSTC on Next.js 16 (TypeScript): Prisma, NextAuth, Zod, Tailwind; "
        "initial routes for home, login, assessment, and My Space profile.",
        "4.2",
    ),
    (
        "Defined Prisma models for users, organisation, criteria, responses, and evidence files; "
        "configured Docker PostgreSQL and DATABASE_URL for local development.",
        "3.4",
    ),
    (
        "Seeded checklist questions from data/criteria.json with prisma/seed.ts; "
        "verified section A–D sort order for the assessment hub.",
        "6.3",
    ),
    (
        "Implemented credentials login, session helpers, and proxy guards for "
        "/assessment, /space, and /admin; tested sign-in redirect.",
        "4.2",
    ),
]

WEEK2_START = 22
WEEK2_SUN = date(2026, 10, 18)  # Fri 16/10
WEEK2_DAYS: list[tuple[str, str] | None] = [
    (
        "Ran initial Prisma migration on local Postgres; built /assessment hub with "
        "section A–D cards and workspace layout; checked sidebar and mobile navigation.",
        "4.2",
    ),
    (
        "Added YES/NO/NA answers, notes, and saveResponse server actions with Zod validation; "
        "implemented evidence upload to private storage/ linked to each criterion.",
        "4.2",
    ),
    (
        "Built secure evidence download API and assignment report PDF export (Puppeteer); "
        "smoke-tested sample answers with file attachments on npm run dev.",
        "5.3",
    ),
    None,  # Thu 15
    None,  # Fri 16
]

OTHER_WEEK_STARTS = (43, 64, 84, 104, 124, 144, 164, 184, 204)


def friday_of_week(week_ending_sunday: date) -> date:
    return week_ending_sunday - timedelta(days=2)


def set_wrapped(ws, row: int, col: int, value: str | None) -> None:
    cell = ws.cell(row, col, value)
    cell.alignment = WRAP


def clear_day_block(ws, start_row: int) -> None:
    set_wrapped(ws, start_row, 2, None)
    for i in range(5):
        row = start_row + 2 + i
        set_wrapped(ws, row, 2, None)
        ws.cell(row, 3, None)
    for r in (start_row + 9, start_row + 10):
        for c in (1, 2, 3):
            if r == start_row + 9 and c == 2:
                ws.cell(r, c, "PROBELMS ENCOUNTERED")
            elif r == start_row + 9 and c == 3:
                ws.cell(r, c, "SOLUTIONS FOUND")
            elif r == start_row + 10:
                set_wrapped(ws, r, c, None)


def fill_week(
    ws,
    start_row: int,
    week_ending_sunday: date,
    days: list[tuple[str, str] | None],
) -> None:
    set_wrapped(ws, start_row, 2, friday_of_week(week_ending_sunday).strftime("%d/%m/%Y"))
    for i, entry in enumerate(days):
        row = start_row + 2 + i
        if entry is None:
            set_wrapped(ws, row, 2, None)
            ws.cell(row, 3, None)
        else:
            desc, act = entry
            set_wrapped(ws, row, 2, desc)
            ws.cell(row, 3, act)


def main() -> None:
    load = SOURCE if SOURCE.is_file() else WORKBOOK
    wb = openpyxl.load_workbook(load)
    ws = wb[SHEET]

    for start in OTHER_WEEK_STARTS:
        if start <= ws.max_row:
            clear_day_block(ws, start)

    fill_week(ws, WEEK1_START, WEEK1_SUN, WEEK1_DAYS)
    fill_week(ws, WEEK2_START, WEEK2_SUN, WEEK2_DAYS)

    # Light problem note week 1 only
    ws.cell(WEEK1_START + 9, 2, "PROBELMS ENCOUNTERED")
    ws.cell(WEEK1_START + 9, 3, "SOLUTIONS FOUND")
    set_wrapped(
        ws,
        WEEK1_START + 10,
        1,
        "Seed failed on first run when DATABASE_URL did not point at Docker Postgres.",
    )
    set_wrapped(
        ws,
        WEEK1_START + 10,
        3,
        "Started docker compose, corrected .env, ran migrate deploy and seed.",
    )
    set_wrapped(ws, WEEK2_START + 10, 1, None)
    set_wrapped(ws, WEEK2_START + 10, 3, None)

    dests = [
        WORKBOOK,
        SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_READY.xlsx",
    ]
    saved = None
    for dest in dests:
        try:
            wb.save(dest)
            saved = dest
            break
        except PermissionError:
            continue
    if not saved:
        alt = SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_UPDATED.xlsx"
        wb.save(alt)
        saved = alt
    print(f"Saved: {saved}")


if __name__ == "__main__":
    main()
