# Claude Setup

Shared Claude Code configuration for Abhilash and Jinu — skills, house rules,
and credentials, kept in one **private** repo so either of us can pick up
work on any machine.

## Setup guide

1. **Log in to Claude / Claude Code** on the machine you're setting up.
2. **Clone this repo:**

   ```bash
   git clone git@github.com:AbhilashTUofficial/Claude-Setup.git
   cd Claude-Setup
   ```

   (Use the HTTPS remote instead if you haven't got SSH keys set up on this
   machine: `https://github.com/AbhilashTUofficial/Claude-Setup.git`.)

3. **Run the setup script:**

   ```bash
   ./claude-setup.sh
   ```

   This is machine-wide, not project-specific — it symlinks every skill in
   [`skills/`](skills/) and the shared [`config/`](config/) files into your
   **global** `~/.claude/` folder (falling back to a copy if symlinks aren't
   available on your machine), so a skill either of us creates shows up for
   both of us on every project, on every machine. It also prints what to add
   to your global `CLAUDE.md` for [`rules/`](rules/) and how to load
   [`credentials/`](credentials/) — it never copies those two, since one's
   meant to be adapted rather than symlinked and the other is live secrets.
   Safe to re-run; it skips anything that already exists. Pass a path if you
   want it wired into one project's `.claude/` instead:
   `./claude-setup.sh /path/to/a/project`. See each folder's own README for
   the manual/per-file version of the same convention.

4. **Pull before you start, push when you're done** — that's what keeps
   skills and tokens in sync between machines/people.

## Ground rules

- **Keep this repo private.** It contains real credentials. Never fork it to
  a public account, never make it public, never paste its contents into a
  public place (issue, gist, chat with a third party, etc.).
- Only Abhilash and Jinu should have access. If that ever changes (lost
  device, offboarding, suspected leak), rotate everything in
  `credentials/` immediately.
- Don't commit machine-specific secrets that only one of you needs (personal
  logins, etc.) — this repo is for what we *both* use.
