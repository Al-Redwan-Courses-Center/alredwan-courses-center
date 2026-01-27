#!/usr/bin/env python3
"""
Safely delete Django migration files across the repository.

- Skips __init__.py files inside migrations folders.
- Skips common virtualenv / node / git folders.
- Supports --dry-run and --yes (no prompt) flags.

Usage:
    python3 backend/scripts/delete_migrations.py --dry-run
    python3 backend/scripts/delete_migrations.py    # interactive confirmation
    python3 backend/scripts/delete_migrations.py --yes  # non-interactive
"""

from __future__ import annotations
import argparse
import os
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
IGNORE_DIR_NAMES = {
    'rdvenv', 'venv', 'env', '.git', 'node_modules', 'static', 'media', '__pycache__'
}


def find_migration_files(root: pathlib.Path):
    migration_files = []
    pycache_dirs = []
    for dirpath, dirnames, filenames in os.walk(root):
        # skip ignored directory trees early
        parts = set(pathlib.Path(dirpath).parts)
        if parts & IGNORE_DIR_NAMES:
            continue
        if os.path.basename(dirpath) == 'migrations':
            for fn in filenames:
                if fn.endswith('.py') and fn != '__init__.py':
                    migration_files.append(pathlib.Path(dirpath) / fn)
                if fn.endswith('.pyc'):
                    migration_files.append(pathlib.Path(dirpath) / fn)
            # check for __pycache__ inside this migrations folder
            cache_dir = pathlib.Path(dirpath) / '__pycache__'
            if cache_dir.exists() and cache_dir.is_dir():
                pycache_dirs.append(cache_dir)
    return migration_files, pycache_dirs


def confirm(prompt: str) -> bool:
    try:
        return input(prompt).strip().lower() in ('y', 'yes')
    except KeyboardInterrupt:
        print('\nAborted.')
        return False


def remove_files(files: list[pathlib.Path]):
    removed = 0
    for p in files:
        try:
            p.unlink()
            removed += 1
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"Failed to remove {p}: {e}")
    return removed


def remove_dirs(dirs: list[pathlib.Path]):
    removed = 0
    for d in dirs:
        try:
            shutil.rmtree(d)
            removed += 1
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"Failed to remove dir {d}: {e}")
    return removed


def main():
    parser = argparse.ArgumentParser(description="Delete Django migration files (except __init__.py)")
    parser.add_argument('--dry-run', action='store_true', help='Show files that would be deleted')
    parser.add_argument('--yes', '-y', action='store_true', help='Do not prompt for confirmation')
    parser.add_argument('--root', type=str, default=str(ROOT), help='Root path to search (default: project root)')

    args = parser.parse_args()
    root_path = pathlib.Path(args.root).resolve()

    if not root_path.exists():
        print(f"Root path does not exist: {root_path}")
        sys.exit(1)

    migration_files, pycache_dirs = find_migration_files(root_path)

    if not migration_files and not pycache_dirs:
        print('No migration files or migration __pycache__ directories found.')
        return

    print('\nFound migration files:')
    for p in migration_files:
        print('  -', p)
    if pycache_dirs:
        print('\nFound migration __pycache__ dirs:')
        for d in pycache_dirs:
            print('  -', d)

    if args.dry_run:
        print('\nDry run - no files will be removed.')
        return

    if not args.yes:
        ok = confirm('\nDelete the files listed above? [y/N]: ')
        if not ok:
            print('Aborted by user.')
            return

    removed_files = remove_files(migration_files)
    removed_dirs = remove_dirs(pycache_dirs)

    print(f"\nRemoved {removed_files} migration files and {removed_dirs} __pycache__ dirs.")


if __name__ == '__main__':
    main()
