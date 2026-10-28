import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('university_priority', ROOT / 'university_priority.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class UniversityEvidence(unittest.TestCase):
    def test_missing_sources_are_explicit(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as temp:
            result = module.university_data(Path(temp))
            self.assertEqual(result['teaching'], [])
            self.assertIn('not been checked', result['status']['coverage'])

    def test_timetable_correction_preserves_other_sessions_and_identity(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as temp:
            root = Path(temp)
            timetable = root / 'teaching.csv'
            timetable.write_text('Export\nBegin date,Begin time,End date,End time,Module Code,Activity Type,"Room,Building"\n29/10/2026,16:10,29/10/2026,18:00,TEST101,Practical,Old room\n29/10/2026,09:00,29/10/2026,10:50,TEST101,Lecture,Lecture room\n')
            config = {'path': str(timetable)}
            settings = root / 'timetable-source.json'
            settings.write_text(json.dumps(config))
            before = module.university_data(root)['teaching']
            config['overrides'] = [{'module':'TEST101','activity':'Practical','from':'2026-10-14','start_time':'16:20','end_time':'18:00','location':'New room','source_note':'Verified school notice'}]
            settings.write_text(json.dumps(config))
            after = module.university_data(root)['teaching']
            self.assertEqual(before[0]['event_id'], after[0]['event_id'])
            self.assertEqual(after[0]['start_time'], '16:20')
            self.assertEqual(after[0]['location'], 'New room')
            self.assertEqual(before[1], after[1])
            self.assertEqual(set(after[0]), {'event_id','date','start_time','end_time','name','location','evidence'})

    def test_deadline_is_separate_from_event_stage(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as temp:
            root = Path(temp)
            item = {'id':'sample-competition','status':'closed','deadline':'2026-10-09T17:00:00+01:00','source_url':'https://example.org/competition','stages':[{'date':'2026-10-28','name':'Shortlisted presentations'}]}
            (root/'opportunities.json').write_text(json.dumps([item]))
            result = module.university_data(root)['opportunities'][0]
            self.assertEqual(result['status'], 'closed')
            self.assertEqual(result['deadline'], item['deadline'])


if __name__ == '__main__':
    unittest.main()
