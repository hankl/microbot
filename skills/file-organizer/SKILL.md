---
name: file-organizer
description: Automatically organize files by type, move files to appropriate directories based on their extensions, and maintain a clean project structure.
---

# File Organizer Skill

## Instructions

When organizing files, follow these rules:

1. **Analyze file types**: Identify file extensions and categorize them:
   - Source code: `.ts`, `.js`, `.py`, `.go`, `.java`, `.rs`
   - Configuration: `.json`, `.yaml`, `.yml`, `.toml`, `.ini`, `.cfg`
   - Documentation: `.md`, `.txt`, `.rst`, `.adoc`
   - Media: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.mp3`, `.mp4`
   - Archives: `.zip`, `.tar`, `.gz`, `.7z`

2. **Create category directories**: Use singular form (e.g., `src/`, `docs/`, `configs/`)

3. **Move files**: Use `git mv` if in a git repository to preserve history

4. **Update imports**: If files are moved, update all import statements in dependent files

## Examples

- Organizing a messy project:
  ```
  Move all .ts files to src/ directory
  Move configuration files to configs/
  Move documentation to docs/
  ```

- Cleaning up temporary files:
  ```
  Identify and remove .tmp, .bak, .log files
  Archive old versions to archive/ directory
  ```

## Guidelines

- Always ask for confirmation before moving files
- Preserve file modification timestamps when possible
- Keep the directory structure flat but organized
- Never move hidden files (starting with `.`) unless explicitly requested
