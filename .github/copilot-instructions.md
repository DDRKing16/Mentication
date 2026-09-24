# Rules for Copilot (and any AI agent) working on Mentication

The owner has been burned by changes appearing on `main` without approval. These
rules are not optional.

## Never change `main` directly
- Never commit, push, merge or force-push to `main`. Work on a branch (for example
  `copilot/<short-description>`) and stop there. The owner reviews and decides what
  gets merged.
- Never say something is "live", "published" or "in main" unless the owner has merged
  it. Always give the branch name and commit hash and confirm the push worked.

## Never disturb the owner's working folder
The folder `/Users/dylandesai-rogers/Documents/GitHub/Mentication` is what the owner
previews from, and it may hold unsaved work. In that folder:
- Do NOT run `git pull`, `git rebase`, `git reset`, `git stash`, `git checkout <other
  branch>` or anything that rewrites files, unless the owner explicitly asks.
- Do NOT overwrite files to "match GitHub". A previous automatic pull replaced the
  owner's newer local versions of several interventions; this must not happen again.
- If you need to change code, make your own worktree/branch instead and leave that
  folder alone.

## Finished builds must not be replaced
Signal Lock (`public/signal-lock/`), Vector Shift (`public/vector-shift/`) and Night
Channel (`public/night-channel/`) are finished, self-contained builds supplied by the
owner. Do not swap them for simplified in-code versions or edit their contents unless
the owner asks. They open on the routes `/signal-lock`, `/vector-shift` and
`/night-channel` (see `src/lib/standaloneInterventions.js`).

## Leave alone unless asked
- The Dear 2100 flow (`src/components/dear2100/`, `src/pages/Dear2100.jsx`,
  `src/lib/dear2100*`, `src/styles/dear2100.css`, `design-boards/dear-2100/`): the owner
  is designing it elsewhere.
- Intervention wording, clinical logic, step order, the recommendation engine, and
  safety/crisis content.
- Never add libraries or services without asking.

## Before you finish
Run `npm test -- --run`, `npm run typecheck`, `npm run lint` and `npm run build`, and
report the result plainly, including anything that fails.
