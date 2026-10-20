"""Fill DESIGNATION row on every week block in month sheets."""
from __future__ import annotations

from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment

SCRIPTS = Path(r"C:\Users\chanithma\Documents\OpenskyErp\scripts")
WORKBOOK = SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_TRIMMED.xlsx"

TITLE = "Chief Operations Officer"
NAME = "Tharinda Senadheera"
WRAP = Alignment(wrap_text=True, vertical="top")


def is_month_sheet(name: str) -> bool:
    return name.endswith("2026") and name not in ("Cover", "Details", "Activity Nos")


def fill_designations(ws) -> int:
    count = 0
    for row in range(1, ws.max_row + 1):
        if ws.cell(row, 1).value != "DESIGNATION":
            continue
        ws.cell(row, 2, TITLE)
        ws.cell(row, 3, NAME)
        ws.cell(row, 2).alignment = WRAP
        ws.cell(row, 3).alignment = WRAP
        count += 1
    return count


def main() -> None:
    if not WORKBOOK.is_file():
        raise SystemExit(f"Not found: {WORKBOOK}")
    wb = openpyxl.load_workbook(WORKBOOK)
    total = 0
    for name in wb.sheetnames:
        if not is_month_sheet(name):
            continue
        n = fill_designations(wb[name])
        print(f"{name}: {n} designation row(s)")
        total += n

    targets = [
        WORKBOOK,
        SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix.xlsx",
        SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_october_gstc_filled.xlsx",
    ]
    for dest in targets:
        try:
            wb.save(dest)
            print(f"Saved: {dest}")
            return
        except PermissionError:
            continue
    alt = SCRIPTS / "Chanithma Dangalla_INDUSTRIAL PLACEMENT RECORD BOOK 2026_27_layoutfix_WITH_DESIGNATION.xlsx"
    wb.save(alt)
    print(f"Saved: {alt} ({total} rows total)")


if __name__ == "__main__":
    main()
