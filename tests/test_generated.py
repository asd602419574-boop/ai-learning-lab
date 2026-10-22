"""Exercise real generators against disposable copies, including drift failures."""
import hashlib
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('check_generated', ROOT / 'scripts/check_generated.py')
generated = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generated)


def snapshot(root):
    return {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file()}


class GeneratedOutputTests(unittest.TestCase):
    def test_real_build_and_drift_leave_checkout_untouched(self):
        watched = (set(generated.INPUT_FILES) | generated.outputs(ROOT) | {
            p.relative_to(ROOT).as_posix() for p in (ROOT / 'content/lessons').glob('*.md')})
        original = {name: (ROOT / name).read_bytes() for name in watched}
        with tempfile.TemporaryDirectory(prefix='ai-learning-generated-test-') as directory:
            fixture = Path(directory)
            generated.copy_inputs(ROOT, fixture)
            subprocess.run([sys.executable, 'scripts/build_textbook.py'], cwd=fixture,
                           check=True, capture_output=True)
            subprocess.run(['node', 'scripts/build_ui.js'], cwd=fixture,
                           check=True, capture_output=True)
            before = snapshot(fixture)
            self.assertEqual(generated.check(fixture), [])
            self.assertEqual(snapshot(fixture), before)

            # Platform checkout line endings are not content drift.
            index = fixture / 'index.html'
            index.write_bytes(index.read_bytes().replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'))
            self.assertEqual(generated.check(fixture), [])

            source = next((fixture / 'content/lessons').glob('*.md'))
            source.write_text(source.read_text('utf-8') + '\n新增教材说明。\n', encoding='utf-8')
            before = snapshot(fixture)
            changes = generated.check(fixture)
            self.assertIn('content/manifest.json', changes)
            self.assertIn('content/rendered/' + source.stem + '.html', changes)
            self.assertEqual(snapshot(fixture), before)

            index = fixture / 'index.html'
            index.write_text(index.read_text('utf-8') + '\n<!-- stale -->', encoding='utf-8')
            before = snapshot(fixture)
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/check_generated.py'),
                                     '--root', str(fixture)], capture_output=True,
                                    text=True, encoding='utf-8')
            self.assertEqual(result.returncode, 1)
            self.assertIn('index.html', result.stderr)
            self.assertEqual(snapshot(fixture), before)

            (fixture / 'content/rendered/orphan.html').write_text('stale', encoding='utf-8')
            self.assertIn('content/rendered/orphan.html', generated.check(fixture))
        self.assertEqual({name: (ROOT / name).read_bytes() for name in watched}, original)


if __name__ == '__main__':
    unittest.main()
