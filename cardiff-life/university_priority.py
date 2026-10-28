"""Read local university evidence without copying mailbox bodies or identifiers."""
import csv
import hashlib
import io
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


def university_data(root):
    def read_json(name, default):
        p = root / name
        return json.loads(p.read_text(encoding="utf-8-sig")) if p.exists() else default

    status = read_json("university-status.json", {"coverage": "University sources have not been checked."})
    opportunities = read_json("opportunities.json", [])
    seen = set()
    for item in opportunities:
        if not item.get("id") or item["id"] in seen:
            raise ValueError("University opportunities need unique stable IDs")
        seen.add(item["id"])
        if item.get("deadline"):
            datetime.fromisoformat(item["deadline"])
        if item["status"] not in {"open", "needs_verification", "closed", "cancelled"}:
            raise ValueError("Invalid opportunity status")
        if not item.get("source_url", "").startswith("https://"):
            raise ValueError("University opportunity needs a source link")
    config = read_json("timetable-source.json", {})
    result = dict(status=status, opportunities=opportunities, teaching=[], timetable_note="No timetable source configured.")
    if not config.get("path"):
        return result
    try:
        path = Path(config["path"])
        raw = path.read_text(encoding="utf-8-sig")
    except OSError:
        result["timetable_note"] = "Saved timetable could not be read. Class availability is unknown."
        return result
    lines = raw.splitlines()
    header = next((i for i, line in enumerate(lines) if line.startswith("Begin date,")), None)
    if header is None:
        raise ValueError("TimeEdit CSV header not found")
    sessions = []
    for row in csv.DictReader(io.StringIO("\n".join(lines[header:]))):
        if not row.get("Begin date"):
            continue
        date = datetime.strptime(row["Begin date"], "%d/%m/%Y").date().isoformat()
        end_date = datetime.strptime(row["End date"], "%d/%m/%Y").date().isoformat()
        start, end = row["Begin time"], row["End time"]
        for value in (start, end):
            datetime.strptime(value, "%H:%M")
        if date != end_date:
            raise ValueError("Multiday teaching session requires explicit handling")
        module = row["Module Code"]
        activity = row["Activity Type"]
        location = row["Room,Building"]
        evidence = "Saved TimeEdit export; not a live timetable check."
        for change in config.get("overrides", []):
            if change["module"] in [x.strip() for x in module.split(",")] and change["activity"].lower() in activity.lower() and change["from"] <= date <= change.get("through", "9999-12-31"):
                start, end, location = change["start_time"], change["end_time"], change["location"]
                evidence = change["source_note"]
        identity = "|".join([date, row["Begin time"], module, activity])
        sessions.append(dict(event_id="teaching-" + hashlib.sha256(identity.encode()).hexdigest()[:18], date=date, start_time=start, end_time=end, name=module + " · " + activity, location=location, evidence=evidence))
    if len({s["event_id"] for s in sessions}) != len(sessions):
        raise ValueError("Duplicate teaching sessions")
    modified = datetime.fromtimestamp(path.stat().st_mtime, ZoneInfo("Europe/London")).date().isoformat()
    result.update(teaching=sessions, timetable_note=f"Saved timetable file dated {modified}. Email corrections are labelled; other later changes may be missing. Gaps are not confirmed free time.")
    return result
