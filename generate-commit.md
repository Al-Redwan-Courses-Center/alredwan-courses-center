# Task: Generate Commit Message & Copy to Clipboard

You are an expert developer assistant. Your task is to generate a professional git commit message based on currently staged changes and copy it directly to the user's clipboard.

## Instructions

1.  **Analyze Staged Changes**
    *   Run `git diff --cached` to retrieve the diff of staged files.
    *   If the output is empty, inform the user that nothing is staged and exit.

2.  **Draft Commit Message**
    *   Follow **Conventional Commits** specification (`<type>(<scope>): <subject>`).
    *   **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
    *   **Subject:** Use imperative mood ("Add feature" not "Added feature"). Max 50 characters.
    *   **Body:** (Optional but recommended for non-trivial changes) Explain *what* and *why* vs *how*. Wrap lines at 72 characters.
    *   **Footer:** (Optional) Reference breaking changes or issue IDs.

3.  **Copy to Clipboard (Windows)**
    *   To ensure the message is copied correctly (handling newlines and special characters), perform the following shell steps:
        1.  Write the generated commit message to a temporary file (e.g., `commit_msg_temp.txt`).
        2.  Execute `Get-Content commit_msg_temp.txt | Set-Clipboard` (PowerShell) or `type commit_msg_temp.txt | clip` (CMD).
        3.  Delete the temporary file.

4.  **Final Output**
    *   Print the generated commit message in a markdown code block for the user to see.
    *   Confirm clearly that the message is now in their clipboard.
