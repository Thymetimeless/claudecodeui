# Install with an AI assistant

Copy everything inside the box below and paste it into an AI coding assistant that can run
commands on your computer, such as Claude Code (`claude` in a terminal). It installs this fork,
starts it, and can add extra Claude accounts. It asks you before anything that needs your input.

````text
Please install and start this fork of CloudCLI UI on this computer for me. It is a modified
version of CloudCLI UI (a web UI for Claude Code), from this GitHub repository:
https://github.com/Iconofy/claudecodeui

Work step by step, show me each command before you run it, and stop to ask me whenever
something needs my decision or my login. Never type a password or token for me unless I
paste it to you for that step. Do not install anything system-wide without asking first.

1. Check the requirements and tell me what is missing:
   - git
   - Node.js 22 or newer (`node --version`). If it is missing or older, suggest the usual way
     to install it on my operating system and ask before doing it.
   - Claude Code (`claude --version`), logged in. If it is not installed, install it the way
     https://docs.claude.com/en/docs/claude-code/setup describes for my system. If it is not
     logged in, ask me to run `claude` in a terminal and type /login, then wait for me.

2. Get the code: `git clone https://github.com/Iconofy/claudecodeui.git` into a folder of
   my choice (suggest ~/claudecodeui-fork). It is a public repository; no GitHub login is needed.

3. In that folder, run:
       npm ci
       npm run build
   If the build or the first start fails with an error about better-sqlite3, node-pty or
   bcrypt, run `npm rebuild better-sqlite3 node-pty bcrypt` and try again.

4. Start it with `npm run server` and keep it running (in a separate terminal, or in the
   background). Check that http://localhost:3001 answers. Then tell me to open that address
   in my browser and create the local user account it asks for (that account only protects
   this web page; it is not a Claude login).

5. Ask me if I want it to start automatically when I log in. If yes, set that up the normal
   way for my operating system (for example a Task Scheduler task on Windows, a LaunchAgent
   on macOS, a systemd user service on Linux) running `npm run server` in the install folder.

6. Ask me if I want to add more Claude accounts (to switch between them per chat in the
   model menu). If yes, follow "Adding Claude accounts" in the FORK.md file of the
   repository exactly. For each account, ask me which method I want:
   - Token: I log in to the other account in the browser, and we run `claude setup-token`
     to get a long-lived token for it. This is the simplest method.
   - Separate login folder: a second Claude login in its own folder, with its chat history
     folder linked to the main one as FORK.md describes.
   - Another Claude-compatible service: I give you its base URL and key.
   Write the file ~/.cloudcli/claude-accounts.json as FORK.md shows, make it readable only
   by me (on macOS/Linux: chmod 600), and never print tokens back in full. Then tell me to
   reload the web page: the accounts appear under "Account" in the model menu.

7. Ask me if I keep more than one global CLAUDE.md (for example one per kind of work) and
   want to switch between them per chat. If yes, follow "CLAUDE.md variants" in FORK.md:
   create the folder `claude-md` inside my Claude config folder (`~/.claude/claude-md/`, or
   `$CLAUDE_CONFIG_DIR/claude-md/` if I set that), and move or copy each version there as
   `CLAUDE_<short name>.md` (ask me for the names). Copy my current `~/.claude/CLAUDE.md`
   there first so nothing is lost; never delete or overwrite `CLAUDE.md` itself. Then tell me
   to reload the web page: an "MD" / variant button appears next to the model button, each
   chat remembers its choice, and I should edit the files in `claude-md/` from now on.

8. Finish with a short summary: where it is installed, how to start and stop it, and how
   to update it later (the in-app Update button, or `git pull`, then `npm ci`,
   `npm run build`, and a restart). Mention that the model list in the model menu can be
   reordered by dragging the grip on each row, and that built-in Claude models can be renamed
   and pointed at another model ID with the pencil in the Model library ("Add model"); neither
   needs any setup. Also mention the plan card: while a plan waits, a message I type changes
   the plan instead of being queued, and the model button on the card picks the model that
   builds it. Also mention that a Claude reply has a fork button (branch icon) under it, which
   starts a new chat that ends with that reply (no setup needed). Remind me not to run
   `npm install -g @cloudcli-ai/cloudcli`, which installs the original app without these
   changes.
````

If something goes wrong, paste the error back to the same assistant and ask it to fix it.
