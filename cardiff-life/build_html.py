"""Rebuild the offline Cardiff Life reader from the maintained research files."""
from pathlib import Path
import csv
import html
import json
import re
import tomllib
from datetime import datetime
from zoneinfo import ZoneInfo
from university_priority import university_data

ROOT = Path(__file__).resolve().parent


def read(name):
    return (ROOT / name).read_text(encoding="utf-8-sig")


def inline(text):
    """Small, escaped Markdown subset used by the maintained project documents."""
    links = []
    def link(match):
        label, url = match.groups()
        if not url.startswith(("https://", "http://")):
            return label
        links.append('<a href="' + html.escape(url, quote=True) + '" target="_blank" rel="noopener noreferrer">' + html.escape(label) + '</a>')
        return f"LINKTOKEN{len(links)-1}END"
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, text)
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    for i, value in enumerate(links):
        text = text.replace(f"LINKTOKEN{i}END", value)
    return text


def communities(markdown):
    groups, section = [], "Communities"
    for line in markdown.splitlines():
        if line.startswith("## "):
            section = line[3:]
        identifier = re.search(r"ID: `([^`]+)`", line)
        title = re.search(r"\[([^\]]+)\]\((https?://[^)]+)\)", line)
        if not identifier or not title:
            continue
        if line.startswith("|"):
            cells = re.split(r"\s+\|\s+", line.strip().strip("|"))
            if len(cells) != 4:
                raise ValueError("Community tables must have four columns; escape literal pipes as \\|.")
            body = [inline(re.sub(r"\s*ID: `[^`]+`\.?", "", cell.strip()).replace("\\|", "|")) for cell in cells[1:]]
        else:
            remainder = re.sub(r"\s*ID: `[^`]+`\.?", "", line[title.end():]).lstrip("* —-")
            body = [inline(remainder)]
        groups.append(dict(id=identifier.group(1), name=title.group(1), url=title.group(2), section=section, body=body))
    if not groups or len({g["id"] for g in groups}) != len(groups):
        raise ValueError("Communities need distinct stable IDs and official links.")
    return groups


def schedules():
    result = []
    days = {"MO":"Monday", "TU":"Tuesday", "WE":"Wednesday", "TH":"Thursday", "FR":"Friday", "SA":"Saturday", "SU":"Sunday"}
    for slug, label in [("su-university", "SU + University"), ("eventbrite-wider-cardiff", "Wider Cardiff"), ("university-outlook", "University Outlook")]:
        path = Path.home() / ".codex" / "automations" / ("cardiff-life-" + slug) / "automation.toml"
        try:
            cfg = tomllib.loads(path.read_text(encoding="utf-8"))
            rule = dict(p.split("=", 1) for p in cfg["rrule"].removeprefix("RRULE:").split(";") if "=" in p)
            when = "Daily" if rule.get("FREQ") == "DAILY" else ", ".join(days.get(d, d) for d in rule.get("BYDAY", "").split(","))
            when += f' · {int(rule.get("BYHOUR", 0)):02d}:{int(rule.get("BYMINUTE", 0)):02d}'
            result.append(dict(name=label, when=when, state=cfg["status"].lower()))
        except (OSError, KeyError, ValueError):
            result.append(dict(name=label, when="Schedule unavailable", state="unknown"))
    return result



def report_selection(rows, report, today=None):
    """Keep all active occurrences when a report links to a shared programme."""
    today = today or datetime.now(ZoneInfo("Europe/London")).date().isoformat()
    by_url = {}
    for row in rows:
        if row["status"] not in {"upcoming", "needs_verification", "recurring"}:
            continue
        if row["date"] and row["date"] < today:
            continue
        by_url.setdefault(row["source_url"].rstrip("/"), []).append(row)
    ranked, featured, section = [], [], ""
    for line in report.splitlines():
        if line.startswith("## "):
            section = line[3:].lower()
        for url in re.findall(r"\]\((https?://[^)]+)\)", line):
            matches = by_url.get(url.rstrip("/"), [])
            for row in sorted(matches, key=lambda r: (r["date"], r.get("start_time", ""), r["event_id"])):
                if row["event_id"] not in ranked:
                    ranked.append(row["event_id"])
                if "best things" in section and row["community_id"] not in featured:
                    featured.append(row["community_id"])
    return ranked, featured


def main():
    with (ROOT / "events.csv").open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
    required = {"event_id", "name", "source_url", "date", "last_checked", "status", "community_id", "cost", "activity", "description", "experience"}
    if not required.issubset(reader.fieldnames or []):
        raise ValueError("Required events.csv columns are missing.")
    if any(None in row or None in row.values() for row in rows):
        raise ValueError("A CSV record has the wrong field count.")
    if len({r["event_id"] for r in rows}) != len(rows):
        raise ValueError("Duplicate event IDs.")
    for row in rows:
        if row["activity"] not in {"sport", "dance", "creative", "music", "social", "professional", "volunteering"}:
            raise ValueError(f'Invalid activity category: {row["event_id"]}')
        if not row["event_id"] or not row["description"]:
            raise ValueError("Every event needs a stable ID and a plain-language description.")
        if row["status"] not in {"upcoming", "needs_verification", "recurring", "sold_out", "cancelled", "postponed", "expired"}:
            raise ValueError(f'Invalid availability status: {row["event_id"]}')
        for field in ["start_time", "end_time"]:
            if row.get(field):
                datetime.strptime(row[field], "%H:%M")
        for field in ["date", "last_checked", "first_seen", "last_shown", "booking_deadline"]:
            if row.get(field) and field != "booking_deadline":
                datetime.strptime(row[field], "%Y-%m-%d")
        if not row["source_url"].startswith(("https://", "http://")):
            raise ValueError(f'Invalid source URL: {row["event_id"]}')
    report = read("events.md")
    ranked, featured = report_selection(rows, report)
    if rows and not ranked:
        raise ValueError("events.md must link to current event source URLs before rebuilding.")
    deadlines = []
    match = re.search(r"^## Deadlines / act soon\s*\n(.*?)(?=^## |\Z)", report, re.M | re.S)
    if match:
        deadlines = [inline(line[2:]) for line in match.group(1).splitlines() if line.startswith("- ")]
    payload = dict(university=university_data(ROOT), events=rows, ranked=ranked, featured=featured[:3], communities=communities(read("communities.md")), deadlines=deadlines, schedules=schedules(), built=datetime.now(ZoneInfo("Europe/London")).isoformat(timespec="minutes"))
    encoded = json.dumps(payload, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    template = read("html_template.html")
    if template.count("__CARDIFF_DATA__") != 1:
        raise ValueError("Template must contain exactly one data placeholder.")
    if template.count("__CARDIFF_SCRIPT__") != 1:
        raise ValueError("Template must contain exactly one script placeholder.")
    script = read("university.js") + "\n" + read("planner.js")
    if "</script" in script.lower():
        raise ValueError("Planner script contains an unsafe closing script tag.")
    output = template.replace("__CARDIFF_SCRIPT__", script).replace("__CARDIFF_DATA__", encoded)
    temporary = ROOT / "index.html.tmp"
    temporary.write_text(output, encoding="utf-8")
    temporary.replace(ROOT / "index.html")
    print(json.dumps({"output": str(ROOT / "index.html"), "teaching_records":len(payload["university"]["teaching"]), "opportunity_records":len(payload["university"]["opportunities"]), "event_records":len(rows), "recommended_records":len(ranked), "communities":len(payload["communities"]), "bytes":len(output.encode("utf-8"))}))


if __name__ == "__main__":
    main()
