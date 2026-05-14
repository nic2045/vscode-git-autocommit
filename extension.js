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

function buildCommitMessage(cwd) {
  const stamp = buildStamp();
  try {
    const lines = execSync('git status --porcelain', { cwd }).toString().trim().split('\n').filter(Boolean);
    const statuses = lines.map(l => l[0] !== ' ' ? l[0] : l[1]);
    const files = lines.map(l => l.slice(3).trim().split(' -> ').pop());

    const onlyAdds = statuses.every(s => s === 'A' || s === '?');
    const onlyDeletes = statuses.every(s => s === 'D');
    const verb = onlyAdds ? 'Add' : onlyDeletes ? 'Remove' : 'Update';

    const listed = files.length <= 3
      ? files.join(', ')
      : `${files.slice(0, 2).join(', ')} and ${files.length - 2} more`;

    const msg = `${verb} ${listed} ${stamp}`;
    return msg.length <= 72 ? msg : `${verb} ${files.length} files ${stamp}`;
  } catch {
    return `Save working state ${stamp}`;
  }
}

// Silent commit used by deactivate() — no UI available during shutdown
function commitSilent(cwd) {
  if (!isGitRepo(cwd) || !hasChanges(cwd)) return;
  const msg = buildCommitMessage(cwd);
  execSync('git add -A', { cwd });
  execSync(`git commit -m "${msg}"`, { cwd });
}

// Interactive commit + optional push used by the command/keybinding
async function saveState() {
  const cwd = repoRoot();
  if (!cwd) { vscode.window.showWarningMessage('Git Auto Commit: no workspace folder open.'); return; }
  if (!isGitRepo(cwd)) { vscode.window.showWarningMessage('Git Auto Commit: not a git repository.'); return; }
  if (!hasChanges(cwd)) { vscode.window.showInformationMessage('Git Auto Commit: nothing to commit.'); return; }

  const msg = buildCommitMessage(cwd);
  try {
    execSync('git add -A', { cwd });
    execSync(`git commit -m "${msg}"`, { cwd });
  } catch (e) {
    vscode.window.showErrorMessage(`Git Auto Commit: commit failed — ${e.message}`);
    return;
  }

  const answer = await vscode.window.showInformationMessage(
    `Committed: ${msg} — push now?`,
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
