"""Regression checks for distinct events sharing one official programme URL."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from build_html import report_selection

class ShortlistTests(unittest.TestCase):
    def row(self, ident, date="2030-10-20", status="upcoming", url="https://example.org/programme"):
        return dict(event_id=ident, date=date, status=status, source_url=url,
                    community_id="walks", start_time="10:00")

    def test_shared_url_keeps_each_occurrence_and_excludes_inactive(self):
        rows = [self.row("later", "2030-10-22"), self.row("earlier", "2030-10-18"),
                self.row("past", "2030-10-15"), self.row("cancelled", status="cancelled"),
                self.row("sold", status="sold_out"), self.row("expired", status="expired")]
        ranked, featured = report_selection(rows, "## Best things to consider\n[Walks](https://example.org/programme/)", "2030-10-16")
        self.assertEqual(ranked, ["earlier", "later"])
        self.assertEqual(featured, ["walks"])

    def test_report_order_and_repeated_links(self):
        rows = [self.row("a"), self.row("b", url="https://example.org/b")]
        ranked, _ = report_selection(rows, "[B](https://example.org/b)\n[A](https://example.org/programme)\n[A again](https://example.org/programme)", "2030-10-16")
        self.assertEqual(ranked, ["b", "a"])

    def test_undated_series_and_conditional_occurrence(self):
        rows = [self.row("series", "", "recurring"), self.row("conditional", status="needs_verification")]
        ranked, _ = report_selection(rows, "[Group](https://example.org/programme)", "2030-10-16")
        self.assertEqual(ranked, ["series", "conditional"])

if __name__ == "__main__":
    unittest.main()
