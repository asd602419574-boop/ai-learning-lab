"""Rebuild the allowlisted static outputs in isolation; never repair the checkout.

Run: python scripts/check_generated.py (requires Node and requirements-build.txt).
CRLF/LF differences are ignored so Windows authors and Linux CI agree.
"""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

INPUT_FILES = ('scripts/build_textbook.py', 'scripts/build_ui.js',
               'content/extra-lessons.json', 'content/foundations.js')


def copy_inputs(root, target):
    for relative in INPUT_FILES:
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / relative, destination)
    shutil.copytree(root / 'content/lessons', target / 'content/lessons')


def outputs(root):
    return {'index.html', 'content/manifest.json'} | {
        path.relative_to(root).as_posix()
        for path in (root / 'content/rendered').glob('*.html')}


def check(root):
    with tempfile.TemporaryDirectory(prefix='ai-learning-generated-') as directory:
        generated = Path(directory)
        copy_inputs(root, generated)
        for command in ([sys.executable, 'scripts/build_textbook.py'],
                        ['node', 'scripts/build_ui.js']):
            subprocess.run(command, cwd=generated, check=True, capture_output=True,
                           text=True, encoding='utf-8')
        changed = []
        for relative in sorted(outputs(root) | outputs(generated)):
            actual, expected = root / relative, generated / relative
            if (not actual.is_file() or not expected.is_file()
                    or actual.read_text('utf-8') != expected.read_text('utf-8')):
                changed.append(relative)
        return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1],
                        help='checkout or isolated fixture to inspect')
    args = parser.parse_args()
    try:
        changed = check(args.root.resolve())
    except (OSError, subprocess.CalledProcessError) as error:
        print('Generated output check could not run:', error, file=sys.stderr)
        if isinstance(error, subprocess.CalledProcessError):
            print(error.stderr, file=sys.stderr)
        return 2
    if changed:
        print('Generated output drift (checkout was not modified):', file=sys.stderr)
        print('\n'.join(changed), file=sys.stderr)
        print('Rebuild intentionally: python scripts/build_textbook.py; node scripts/build_ui.js',
              file=sys.stderr)
        return 1
    print('Generated outputs match authored sources (checkout was not modified).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
