# About this fork

**This is a modified version of CloudCLI UI. It is not the original software and is not
made, endorsed or supported by Siteboon AI B.V.**

Based on: CloudCLI UI (https://github.com/siteboon/claudecodeui), release `v1.37.8`.
License: AGPL-3.0-or-later, the same as upstream, including the additional terms in
[LICENSE](LICENSE). See [NOTICE](NOTICE) for the original copyright.

Please report problems with the changes below to this fork, not to the upstream project.

## What is changed (2026-11-23)

### Sidebar
- **Project menu (⋮).** On desktop, the separate rename and delete buttons on a project row
  are now one "Project options" menu (Copy project path, Rename, Delete). On phones, the menu
  is a bottom sheet, like the session sheet. A tap that closes the sheet no longer also
  toggles the project card.
- **Copy project path** in the project menu, the session menu (Projects and Chats lists)
  and the mobile session sheet. The recent-conversations API now also returns `projectPath`.
- **Recycle bin.** "Delete" for a chat or a project now moves it to a Recycle bin tab
  (trash icon, after Archive), with Restore and a two-step "Delete now". Items are removed
  for good after 30 days, by an hourly job on the server. Archive is unchanged and separate.
  - API: `DELETE .../sessions/:id?force=true` and `DELETE /api/projects/:id?force=true` now
    move the item to the bin; add `&permanent=true` to delete it at once. New:
    `GET /api/providers/sessions/trash`, `GET /api/projects/trash`.
  - Database: new nullable `trashedAt` column on `sessions` and `projects` (added by a
    migration; older versions ignore it).
- **Chat search is easier to find.** The "Conversations" tab is labelled "Chats", and typing
  two or more characters in the Projects search box shows a `Search chats for "…"` button.

### Chat
- **Project path in the header.** The chat header shows the project's full path, with a tooltip.
- **Ultracode is an on/off toggle** in the model menu, under the Reasoning levels, for models
  that support it. It is no longer one of the effort levels, because the Claude CLI runs it at
  any effort level. A stored effort value `ultracode` still works (xhigh + Ultracode). Haiku
  lists the five effort levels the Claude CLI reports for it.
- **"Build & bypass mode"** button on a plan card, next to Build: approves the plan and switches
  both the running turn and the composer to bypass-permissions mode. To allow this, every Claude
  run starts with the SDK's `allowDangerouslySkipPermissions` flag. The flag only lets a run
  switch into that mode; the mode itself is still off until it is chosen.
- **Changing a plan by typing.** While a plan card waits, the turn is paused inside
  `ExitPlanMode`, so a queued message would never be read. A message sent from the composer is
  now the revise text: the plan is declined with "The user wants the plan changed: <text>" and
  Claude writes a new plan. The "Revise" button is now "Change plan…" and focuses the composer.
  Text only: files attached to that message stay in the composer. Slash commands are not
  treated as a revise.
- **Model for the build.** The plan card shows the composer's model menu. Build and Build &
  bypass send the chosen model with the approval (`chat.permission-response` field `model`), and
  the server switches the running turn with the SDK's `setModel`. A model on another Claude
  account is not applied to the running turn (the account is the CLI process's environment); it
  applies from the next message. Reasoning effort is not changed inside a running turn.
- **Esc no longer stops a running turn.** Use the Stop button. The "esc" hint on Stop is gone.
- **Loading indicator** ("Loading all messages...") while a search hit loads the whole
  transcript before it jumps to the message.
- **`/usage` command**: the session's token use (like `/cost`) plus the Claude plan usage
  (5-hour and weekly windows) of the Claude login on the server machine. It reads
  `~/.claude/.credentials.json` (or `$CLAUDE_CONFIG_DIR`), only reads it, and never refreshes
  or rewrites the login. It uses the same **unofficial** endpoint as the Claude CLI's own
  `/usage`, so it can stop working at any time.
- **Slash commands keep your draft.** Picking a built-in command (such as `/usage` or `/cost`)
  from the slash menu while you are writing a message removes only the `/command` you typed;
  the rest of the draft stays. Typing a command alone and pressing Enter still clears the box.
- **Fork from a reply.** A Claude reply has a "Fork from here" button (branch icon) next to
  copy. The new chat ends with that reply, so you keep that answer and drop everything after
  it. The button on your own message still forks up to the prompt only. For this, the server
  now sends `transcriptAnchorId` (the transcript row uuid) on Claude reply text messages too,
  not only on user messages; `POST /api/providers/sessions/:id/fork` with that id as
  `upToAnchorId` is unchanged. Editing stays on user messages only.
- **Editing a sent message works with newer Claude Code (2.1.329+).** That CLI writes an
  attachment row after each reply and parents the next prompt on it, while an edit resumes at
  the reply itself, so the history read showed the old turns again with the edit at the
  bottom. Prompts are now grouped by their parent with attachment rows skipped.
- **PowerShell commands collapse like Bash.** Claude's Windows `PowerShell` tool used the old
  flat row that always showed the whole command wrapped. It now uses the Bash command row:
  one line, collapsed, with a chevron that opens the full command and its output.
- **Session titles**: a first or last message that is only a slash command (such as `/model`)
  is not used as the session name.
- **Running timer** counts the current turn of a terminal Claude session, not the time since
  the CLI process started.

### Models
- **Models first in the model menu.** The menu opens with the model list; the reasoning levels
  (and the Ultracode toggle) sit behind a "Reasoning: <level>" row with an arrow.
- **Drag to reorder the model list.** In the composer's model menu, drag a model by the grip
  on the right of its row (mouse or touch). The order is saved on the server, so every device
  and every model picker (new-chat dialog, `/models`) uses it. Models added later go to the end.
- **Claude built-in models are editable.** In the Model library ("Add model" / "Manage
  models"), the pencil on a built-in Claude model changes its name and the model ID sent to the
  Claude CLI, for example to point "Fable" at a newer model before CloudCLI ships it. Its
  internal value stays the same, so existing chats, extra accounts, reasoning levels and
  Ultracode keep working. An edited model shows "Edited" and a **Reset** button. A custom model
  with the same ID is hidden while the edit exists.
- API: `PUT /api/providers/:provider/models/order` `{ order: string[] }`,
  `PUT /api/providers/claude/models/builtin/:value` `{ label, id }`, and `DELETE` on the same
  path to reset. Catalog options of edited built-ins carry `cliModel`, `edited` and
  `builtinLabel`. Database: one `app_config` row per provider,
  `provider_models_layout:<provider>` (JSON `{ order, edits }`); no schema change.

### Extra Claude accounts
- Add any number of Claude accounts in `~/.cloudcli/claude-accounts.json` and pick the
  account per chat in the model menu ("Account" section). A chat keeps its account when you
  come back to it. See [Adding Claude accounts](#adding-claude-accounts).

### CLAUDE.md variants (optional)
- Keep several versions of your global `CLAUDE.md` as `CLAUDE_<name>.md` files in a
  `claude-md` folder inside your Claude config folder (`~/.claude/claude-md/`, or
  `$CLAUDE_CONFIG_DIR/claude-md/`). Without that folder nothing changes.
- **Switcher in the composer** (next to the model button; "MD" on phones): lists the variants
  and copies the one you pick over `~/.claude/CLAUDE.md`. The chat remembers its choice.
- **Each chat keeps its own CLAUDE.md.** A Claude chat records the variant it first runs with.
  When another chat switched `CLAUDE.md`, this chat copies its own variant back before it
  sends, when it is opened, and when the window gets focus. If its variant was deleted, a
  banner above the input asks you to **Use current** or switch the file yourself
  (**Refresh** checks again); sending waits until then.
- Edit a variant in `claude-md/`, not `CLAUDE.md` itself: a direct edit is replaced by the
  next switch-back (the edited file is kept in `claude-md/unsaved/` first).
- `CLAUDE.md` is one file for all chats: a running turn of another chat may read it after
  this chat switched it (for example after a compaction).
- Only the default Claude config folder is covered, not the `configDir` of an extra account.
- API: `GET /api/providers/claude/md-variants`, `POST /api/providers/claude/md-swap`
  `{ name, sessionId? }`, `GET /api/providers/sessions/:id/claude-md`,
  `POST /api/providers/sessions/:id/claude-md/confirm`. Database: new nullable `claude_md`
  column on `sessions` (variant file name, or `sha1:<hash>`).

### Look
- Fonts: Ubuntu for the UI and chat, Fira Code for code and the terminal (Google Fonts).
  Ubuntu has no Thai or CJK glyphs; those use the device's fonts.
- Dark (`#141414`) theme and background colour in the web app manifest (phone status bar).

## Install

**Easiest:** paste the prompt in [INSTALL-WITH-AI.md](INSTALL-WITH-AI.md) into an AI coding
assistant such as Claude Code, and it will do the steps below for you.

Requirements: Node.js 22 or later, git, and Claude Code installed and logged in.

```bash
git clone <this repository's URL> claudecodeui
cd claudecodeui
npm ci
npm run build
npm run server        # http://localhost:3001
```

The in-app **Update** button on a git install runs `git checkout main && git pull && npm install`
in this folder, so it pulls this fork's `main` branch. Run `npm run build` after it, then restart.
Do not run `npm install -g @cloudcli-ai/cloudcli`: that installs the original package, without
these changes.

## Adding Claude accounts

Without this file the app uses your normal Claude login only. To add more accounts, create
`~/.cloudcli/claude-accounts.json` (on Windows: `C:\Users\<you>\.cloudcli\claude-accounts.json`):

```json
{
  "accounts": [
    {
      "id": "work",
      "label": "Work",
      "env": { "CLAUDE_CODE_OAUTH_TOKEN": "sk-ant-oat01-..." }
    },
    {
      "id": "second",
      "label": "Second login",
      "configDir": "~/.claude-second"
    },
    {
      "id": "proxy",
      "label": "My proxy",
      "env": { "ANTHROPIC_BASE_URL": "https://example.com", "ANTHROPIC_AUTH_TOKEN": "..." }
    }
  ]
}
```

- `id`: lowercase letters, digits and `-` (up to 32). It is stored with each chat
  (`work:opus`), so do not rename it later. `label` is what the menu shows.
- The file is read again whenever it changes; reload the web page to see the new list.
- It holds secrets. It stays on the server and only `id` and `label` reach the browser. On
  macOS and Linux, run `chmod 600 ~/.cloudcli/claude-accounts.json`.
- Built-in models get one copy per account. Custom models (Manage models) run on the
  default login only.

There are three ways to set up an account:

**1. Token (simplest).** Sign in to the other Claude account in your browser, run
`claude setup-token` in a terminal, follow the link, and put the token it prints in
`env.CLAUDE_CODE_OAUTH_TOKEN`. Chats are stored with your other chats, so history, search
and resume work as usual. `/usage` may show "Unavailable" for such a token.

**2. Separate login folder (`configDir`).** Log in once in its own folder:

```bash
CLAUDE_CONFIG_DIR=~/.claude-second claude        # macOS / Linux, then type /login
```
```powershell
$env:CLAUDE_CONFIG_DIR="$HOME\.claude-second"; claude   # Windows PowerShell, then /login
```

The CLI writes chat history into that folder, but the app reads chats from `~/.claude/projects`.
Before the first chat on this account, replace its `projects` folder with a link to the main one:

```bash
rm -rf ~/.claude-second/projects && ln -s ~/.claude/projects ~/.claude-second/projects
```
```powershell
Remove-Item -Recurse -Force "$HOME\.claude-second\projects" -ErrorAction SilentlyContinue
New-Item -ItemType Junction -Path "$HOME\.claude-second\projects" -Target "$HOME\.claude\projects"
```

(Do the same for the `sessions` folder if you want the "running" indicator for terminal
chats on that account.) `/usage` reads this folder's login.

**3. Another Claude-compatible service.** Put its `ANTHROPIC_BASE_URL` and
`ANTHROPIC_AUTH_TOKEN` (or `ANTHROPIC_API_KEY`) in `env`. `/usage` is not available for it.

## Keeping up with upstream

```bash
git remote add upstream https://github.com/siteboon/claudecodeui.git
git fetch upstream --tags
git merge v1.37.9        # the next upstream release tag
```
