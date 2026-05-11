# Git Auto Commit

Commits the working state automatically on VS Code window close, and provides a command to commit and optionally push.

## Features

- **Auto-commit on close** — when VS Code shuts down, any uncommitted changes are staged and committed with a message describing the changed files, e.g. `Update extension.js, README.md YYMMDD.HHMM`. No prompt, no UI, runs silently.
- **Save State command** — commits and asks whether to push. Available via Command Palette or keybinding.

## Keybinding

| Action | Windows/Linux | macOS |
|---|---|---|
| Save State (commit + ask to push) | `Ctrl+Shift+Alt+S` | `Cmd+Shift+⌥ Option+S` |

## Notes

- Does nothing if the workspace is not a git repository or has no uncommitted changes.
- Push timeout is 30 seconds.
- Only operates on the first workspace folder in multi-root workspaces.
