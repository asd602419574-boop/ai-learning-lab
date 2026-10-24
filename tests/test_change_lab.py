"""V2.3 changes operate on disposable copies, with real subprocess HTTP/SQLite."""
import importlib.util
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'scripts/change_lab.py').is_file(), '独立变更实验工具尚未实现'
spec=importlib.util.spec_from_file_location('change_lab',ROOT/'scripts/change_lab.py')
lab=importlib.util.module_from_spec(spec);spec.loader.exec_module(lab)

class ChangeLabTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.labs=Path(self.temp.name)
    def tearDown(self): self.temp.cleanup()
    def test_red_green_reference_retry_and_original_preserved(self):
        original=lab.source_hashes(ROOT/'teaching_server')
        attempt=lab.prepare('attempt',self.labs)
        before=lab.digest(attempt/'instance/approval.sqlite3')
        red=lab.check('attempt',self.labs)
        self.assertFalse(red['passed'])
        self.assertTrue(any(not c['passed'] for c in red['checks']))
        self.assertEqual(before,lab.digest(attempt/'instance/approval.sqlite3'))
        example=lab.prepare('example',self.labs)
        lab.apply_reference('example',self.labs)
        green=lab.check('example',self.labs)
        self.assertTrue(green['passed'],green['checks'])
        self.assertEqual(before,lab.digest(attempt/'instance/approval.sqlite3'))
        self.assertEqual(original,lab.source_hashes(ROOT/'teaching_server'))
        self.assertTrue((example/'baseline/architecture-workspace.js').is_file())
        baseline_front=lab.digest(example/'baseline/architecture-workspace.js')
        (example/'learning/architecture-workspace.js').write_text('// learner edit')
        retry=lab.prepare('retry',self.labs,baseline_from='example')
        self.assertEqual(baseline_front,lab.digest(retry/'learning/architecture-workspace.js'))
        self.assertEqual(lab.source_hashes(retry/'teaching_server'),original)
        self.assertEqual({t:lab.rows(example/'baseline/approval.sqlite3','SELECT * FROM '+t+' ORDER BY id') for t in lab.TABLES}, {t:lab.rows(retry/'instance/approval.sqlite3','SELECT * FROM '+t+' ORDER BY id') for t in lab.TABLES})
        with self.assertRaises(ValueError): lab.prepare('attempt',self.labs)
        with self.assertRaises(ValueError): lab.prepare('../escape',self.labs)
        with self.assertRaises(ValueError): lab.apply_reference('example',self.labs)
    def test_partial_migration_failure_rolls_back_columns_and_version(self):
        attempt=lab.prepare('rollback',self.labs)
        lab.apply_reference('rollback',self.labs)
        database=attempt/'instance/approval.sqlite3'
        before={t:lab.rows(database,'SELECT * FROM '+t+' ORDER BY id') for t in lab.TABLES}
        p=attempt/'teaching_server/db.py'
        text=p.read_text()
        marker='                for operation in ('
        self.assertIn(marker,text)
        p.write_text(text.replace(marker,"                raise RuntimeError('injected migration fault')\n"+marker))
        result=subprocess.run([sys.executable,'-c','from teaching_server.db import initialize; import sys; initialize(sys.argv[1])',str(database)],cwd=attempt,env=lab.clean_env(),capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('injected migration fault',result.stderr)
        self.assertEqual(lab.rows(database,'PRAGMA user_version'),[{'user_version':1}])
        self.assertNotIn('urgency',[r['name'] for r in lab.rows(database,'PRAGMA table_info(applications)')])
        self.assertEqual(before,{t:lab.rows(database,'SELECT * FROM '+t+' ORDER BY id') for t in lab.TABLES})

    def test_independent_variant_fails_then_real_code_change_passes(self):
        attempt=lab.prepare('variant',self.labs)
        lab.apply_reference('variant',self.labs)
        red=lab.check('variant',self.labs,variant=True)
        self.assertFalse(red['passed'])
        p=attempt/'teaching_server/service.py'
        text=p.read_text();self.assertIn("not urgent_reason",text)
        p.write_text(text.replace("not urgent_reason", "len(urgent_reason) < 12"))
        p=attempt/'teaching_server/db.py'
        p.write_text(p.read_text().replace('length(trim(NEW.urgent_reason))=0','length(trim(NEW.urgent_reason))<12'))
        green=lab.check('variant',self.labs,variant=True)
        self.assertTrue(green['passed'],green['checks'])

if __name__=='__main__': unittest.main()
