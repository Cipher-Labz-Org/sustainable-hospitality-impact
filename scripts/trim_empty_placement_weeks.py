"""Remove unfilled week-block rows from month sheets in the placement record book."""
from __future__ import annotations

from pathlib import Path

import openpyxl

SCRIPTS = Path(r"C:\Users\chanithma\Documents\OpenskyErp\scripts")
WORKBOOK = SCRIPTS / (
    "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_october_gstc_filled.xlsx"
)
FALLBACK = SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_READY.xlsx"

MONTH_SHEETS = (
    "June - 2026",
    "July -2026",
    "August -2026",
    "September -2026",
    "October -2026",
)


def unmerge_from_row(ws, from_row: int) -> None:
    for merged in list(ws.merged_cells.ranges):
        if merged.min_row >= from_row:
            ws.unmerge_cells(str(merged))


def week_ending_rows(ws) -> list[int]:
    rows: list[int] = []
    for i in range(1, ws.max_row + 1):
        if ws.cell(i, 1).value == "WEEK ENDING":
            rows.append(i)
    return rows


def block_has_work(ws, week_start: int) -> bool:
    for r in range(week_start + 2, week_start + 9):
        val = ws.cell(r, 2).value
        if val is not None and str(val).strip():
            return True
    return False


def last_filled_row(ws) -> int | None:
    we = week_ending_rows(ws)
    if not we:
        return None
    last_end = None
    for idx, start in enumerate(we):
        end = we[idx + 1] - 1 if idx + 1 < len(we) else ws.max_row
        if block_has_work(ws, start):
            last_end = end
    return last_end


def trim_sheet(ws, keep_through_row: int) -> int:
    delete_from = keep_through_row + 1
    if delete_from > ws.max_row:
        return 0
    unmerge_from_row(ws, delete_from)
    count = ws.max_row - delete_from + 1
    ws.delete_rows(delete_from, count)
    return count


def main() -> None:
    path = WORKBOOK if WORKBOOK.is_file() else FALLBACK
    wb = openpyxl.load_workbook(path)
    total = 0
    for sheet_name in MONTH_SHEETS:
        if sheet_name not in wb.sheetnames:
            continue
        ws = wb[sheet_name]
        last_row = last_filled_row(ws)
        if last_row is None:
            print(f"{sheet_name}: no filled weeks, skipped")
            continue
        removed = trim_sheet(ws, last_row)
        total += removed
        print(f"{sheet_name}: removed {removed} rows (kept 1–{last_row})")

    targets = [
        WORKBOOK,
        SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix.xlsx",
        SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_october_gstc_filled.xlsx",
    ]
    saved = None
    for dest in targets:
        try:
            wb.save(dest)
            saved = dest
            break
        except PermissionError:
            continue
    if not saved:
        alt = SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_TRIMMED.xlsx"
        wb.save(alt)
        saved = alt
    print(f"Saved: {saved} (total rows removed: {total})")


if __name__ == "__main__":
    main()
