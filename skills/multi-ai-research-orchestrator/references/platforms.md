# Platform notes

Read this before dispatching to any platform. UIs drift — treat everything below as a starting point, confirm with `read_page`/`find` on the live page, and fix this file when it's wrong rather than silently working around it (that's how the next run benefits too).

General flow for every platform: navigate (reuse a tab if one's already on the right site) → check sign-in state → find the composer textbox (`find` with a query like "message input" beats guessing coordinates) → type the assignment → submit → poll until generation stops → read the last response.

**Getting real source URLs**: `get_page_text` is the fastest way to read a response, but it strips citation chips down to their link text ("blog.google +2") without the underlying href. When the evidence ledger needs the literal URL behind a citation, use `read_page` instead (or `find` for a specific citation) — its accessibility-tree output includes `href` attributes that `get_page_text` discards.

## Availability check

A platform is **available** when its composer textbox is visible and there's no sign-in/login wall over it. It's **unavailable** when you hit any of: a sign-in page, a CAPTCHA, a paywall for the feature you need, or a browser-level redirect you can't script past (see Copilot below). Don't attempt to log in or solve anything — mark it unavailable with the reason and move on. If the user is logged in on one shared browser profile but a platform clearly belongs to someone else's account, say so and ask before using it.

## ChatGPT — chatgpt.com

- Composer: `find("message input")` or the "Ask ChatGPT" textbox at the bottom of the page.
- Submit: Enter, or the up-arrow send button to the composer's right.
- Generating signal: a stop/square icon replaces the send arrow while generating; it reverts to the send arrow when done. Poll every few seconds rather than a single fixed wait — response length varies a lot.
- Reading the response: the last assistant turn in the thread. `get_page_text` on a fresh chat is usually clean; if the sidebar/nav text leaks in, scope with `read_page` on the main content region instead.
- Free tier is usually logged in as "<name>" (shown bottom-left) with a "Free" badge — that's fine, Free-tier chat is exactly what this skill needs. Don't try to upgrade or enable paid features.
- New chat each assignment: click "New chat" first so an old conversation's context doesn't bleed into the new assignment.

## Gemini — gemini.google.com/app

- Composer: "Ask Gemini" textbox, center of a blank conversation.
- Submit: the send icon is more reliable than Enter — in testing, Enter sometimes left the text sitting drafted in the composer with a transient "Something went wrong" toast and no submission. If a few seconds after pressing Enter the composer still shows your text, click the send button directly rather than retrying Enter.
- Generating signal: Gemini shows a loading/streaming indicator and a stop control; wait for it to clear.
- Reading the response: last model turn in the conversation pane.
- Signed-in state rides on the user's Google account already logged into the browser profile — if you land on a Google sign-in page instead of the composer, it's unavailable, don't attempt sign-in.
- New chat via the "+" / "New chat" control in the left rail before each fresh assignment.

## Perplexity — perplexity.ai

- Composer: "Ask anything…" textbox in the main pane.
- Perplexity works **signed out** (guest) — you'll see a "Sign In" button in the sidebar rather than a wall; that's a usable, just rate-limited, state. Treat it as available unless the composer itself is blocked.
- **If a guest-mode request is refused with a rate-limit/quota message** (rather than just answering), that's the platform's own limit — stop sending it requests for this research round, mark it `unavailable` in `agent-assignments.md` with "guest rate limit hit", and continue with the other agents. Don't retry, don't ask the user to sign in on your behalf; if signing in would clearly help, tell the user and let them decide.
- Screenshots on this page can intermittently time out (a background canvas animation keeps the page "busy"). If `computer screenshot` times out, don't retry it repeatedly — fall back to `read_page`/`get_page_text`, which work fine and don't depend on the canvas settling.
- Generating signal: a stop control appears next to the composer while answering; sources/citations populate above the answer as it streams — wait for both the text and the stop control to settle.
- Reading the response: the answer pane includes inline citation markers; pull the linked URLs out into the response file's source list, don't leave them as bare numbers.

## Copilot — copilot.microsoft.com

- **Known failure mode**: on a Windows machine running Edge with Claude in Chrome, navigating here can redirect into an internal `edge://` extensions-gallery page that the extension is blocked from scripting at all (every tool call errors with "The extensions gallery cannot be scripted"). This isn't a login wall you can work around — if you hit it, mark Copilot unavailable immediately and don't retry the same URL.
- If you want to try anyway in an environment where that redirect doesn't happen: composer is the chat input at the bottom of the page, submit via Enter or the send icon, generating signal is a stop control replacing send.
- Because this platform is the least reliable to reach via automation, treat it as optional in every mode — never block a research round on it.

## Adding another platform

To extend this skill to a new free AI chat platform, add a section here with: URL, composer locator, submit method, generating-signal, and any sign-in quirk — then it's usable from Phase 1-3 of SKILL.md without changing the main skill file.
