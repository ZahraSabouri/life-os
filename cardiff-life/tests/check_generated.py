"""Check generated structure and record counts without claiming browser rendering."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import csv
import json

root = Path(__file__).resolve().parent.parent

class Structure(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.remote_assets = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.append(values["id"])
        if tag in {"script", "img", "iframe"} and values.get("src"):
            self.remote_assets.append(values["src"])
        if tag == "link" and values.get("rel") == "stylesheet":
            self.remote_assets.append(values.get("href"))

parser = Structure()
parser.feed((root / "index.html").read_text(encoding="utf-8"))
assert len(parser.ids) == len(set(parser.ids)), "Duplicate HTML ids"
assert not parser.remote_assets, "Standalone HTML unexpectedly loads external assets"
with (root / "events.csv").open(encoding="utf-8-sig", newline="") as handle:
    records = list(csv.DictReader(handle))
assert all(None not in row and None not in row.values() for row in records)
assert len(records) == len({r["event_id"] for r in records})
print(json.dumps({"records": len(records), "dated": sum(bool(r["date"]) for r in records), "categories": dict(Counter(r["activity"] for r in records)), "html_ids": len(parser.ids), "external_assets": len(parser.remote_assets)}))
