import os
import subprocess

def get_conflicted_files():
    result = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], capture_output=True, text=True)
    return [line for line in result.stdout.split('\n') if line.strip()]

def show_conflicts():
    files = get_conflicted_files()
    with open('all_conflicts.txt', 'w', encoding='utf-8') as out:
        for f in files:
            out.write(f"=== {f} ===\n")
            with open(f, 'r', encoding='utf-8') as infile:
                lines = infile.readlines()
                in_conflict = False
                for i, line in enumerate(lines):
                    if line.startswith('<<<<<<< HEAD'):
                        in_conflict = True
                        out.write(f"Line {i+1}:\n")
                    if in_conflict:
                        out.write(line)
                    if line.startswith('>>>>>>>'):
                        in_conflict = False
                        out.write("\n")

if __name__ == '__main__':
    show_conflicts()
