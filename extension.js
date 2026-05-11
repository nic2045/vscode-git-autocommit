const vscode = require('vscode');
const { execSync } = require('child_process');

function buildStamp() {
  const n = new Date();
  const pad = v => String(v).padStart(2, '0');
  const yy = String(n.getFullYear()).slice(2);
  return `${yy}${pad(n.getMonth() + 1)}${pad(n.getDate())}.${pad(n.getHours())}${pad(n.getMinutes())}`;
}

function repoRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length > 0 ? folders[0].uri.fsPath : null;
}

function isGitRepo(cwd) {
  try { execSync('git rev-parse --git-dir', { cwd, stdio: 'ignore' }); return true; }
  catch { return false; }
}

function hasChanges(cwd) {
  try { return execSync('git status --porcelain', { cwd }).toString().trim().length > 0; }
  catch { return false; }
}

// Silent commit used by deactivate() — no UI available during shutdown
function commitSilent(cwd) {
  if (!isGitRepo(cwd) || !hasChanges(cwd)) return;
  const stamp = buildStamp();
  execSync('git add -A', { cwd });
  execSync(`git commit -m "WIP: ${stamp}"`, { cwd });
}

// Interactive commit + optional push used by the command/keybinding
async function saveState() {
  const cwd = repoRoot();
  if (!cwd) { vscode.window.showWarningMessage('Git Auto Commit: no workspace folder open.'); return; }
  if (!isGitRepo(cwd)) { vscode.window.showWarningMessage('Git Auto Commit: not a git repository.'); return; }
  if (!hasChanges(cwd)) { vscode.window.showInformationMessage('Git Auto Commit: nothing to commit.'); return; }

  const stamp = buildStamp();
  try {
    execSync('git add -A', { cwd });
    execSync(`git commit -m "WIP: ${stamp}"`, { cwd });
  } catch (e) {
    vscode.window.showErrorMessage(`Git Auto Commit: commit failed — ${e.message}`);
    return;
  }

  const answer = await vscode.window.showInformationMessage(
    `Committed WIP: ${stamp} — push now?`,
    'Push', 'No'
  );

  if (answer === 'Push') {
    try {
      execSync('git push', { cwd, timeout: 30000 });
      vscode.window.showInformationMessage('Git Auto Commit: pushed.');
    } catch (e) {
      vscode.window.showErrorMessage(`Git Auto Commit: push failed — ${e.message}`);
    }
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('gitAutoCommit.saveState', saveState)
  );
}

// Called on VS Code shutdown — UI is gone, run synchronously and silently
function deactivate() {
  const cwd = repoRoot();
  if (cwd) { try { commitSilent(cwd); } catch { /* ignore */ } }
}

module.exports = { activate, deactivate };
