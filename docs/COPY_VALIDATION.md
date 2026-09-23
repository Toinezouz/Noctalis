# Validating the copy

A record of the checks run when NOCTALIS was created (version 1.0): first
that the copy was **functionally identical to the original**, before any
change of identity, then that the transformed project still passed
everything. Later versions add their own section at the end.

## Provenance

| | |
| --- | --- |
| Source | `/home/user/Got-Five`, commit `f650a15`, clean tree |
| Destination | `/home/user/noctalis` |
| Method | `tar` archive excluding `node_modules`, `dist`, `.git`, `test-results`, `playwright-report` |
| Files copied | 119 |
| Git | new repository (`git init`), **no remote**, clean history |

The original's Git history was **not** copied: the new project starts from a
clean first commit, with no trace of the previous project.

## Results — unmodified copy

Commands actually run in `/home/user/noctalis`, outputs observed:

| Step | Command | Result |
| --- | --- | --- |
| Dependencies | `npm install` | 401 packages, no error |
| Types | `npm run typecheck` | ✅ 4 TypeScript projects, 0 errors |
| Lint | `npx eslint .` | ✅ 0 errors |
| Unit tests | `npx vitest run` | ✅ **154 tests**, 11 files |
| Build | `npm run build` | ✅ shared + server + client |
| End to end | `npx playwright test` | ✅ **58 tests** (desktop + mobile), 2.9 min |

No fix was needed: the copy worked as it was.

## State of the original after the copy

```
$ git -C /home/user/Got-Five status --short
(no output)
$ git -C /home/user/Got-Five log --oneline -1
f650a15 Mode sombre : automatique, clair ou sombre, au choix du joueur
```

Clean working tree, same commit as before the operation: **the original was
not touched.**

## Searching for the former identity — before

Measured before the transformation, to size the work left:

| Nature | Occurrences |
| --- | --- |
| `@gotfive/*` imports | 67 |
| "GOT FIVE" strings | 66 |
| `gotfive:*` keys | 6 |
| Branded `data-testid`s | 20 |

## Searching for the former identity — after

Filled in after the complete transformation, with a command anyone can run:

```
$ grep -ril "got.five\|gotfive" --exclude-dir=node_modules --exclude-dir=dist .
docs/COPY_VALIDATION.md
docs/MIGRATION_AUDIT.md
docs/ORIGINAL_PROJECT_AUDIT.md
docs/PROJECT_CONTRACT.md
scripts/check-contract.mjs
```

Five files, all on purpose:

- the **four audit documents** describe the migration — that is their
  subject;
- `scripts/check-contract.mjs` holds the search pattern that makes sure, on
  every CI run, that no other file contains it.

**No application code, interface, configuration or public documentation
file carries the former identity.** The contract checker fails if that
changes.

## Results — copy transformed into NOCTALIS 1.0

| Step | Result |
| --- | --- |
| `npm run typecheck` | ✅ 0 errors |
| `npx eslint .` | ✅ 0 errors |
| `npm run check:contract` | ✅ 58 exports, 22 types, 19 events, 291 keys |
| `npm test` | ✅ **154 tests** |
| `npm run test:e2e` | ✅ **58 tests** (desktop + mobile), 2.9 min |
| `npm run build` | ✅ |

The contract checker was itself put to the test: renaming
`toPublicGameState` on purpose made it report two violations, and it turned
green again once the name was restored.

## Searching for secrets

```
$ grep -rInE "(api[_-]?key|secret|token|password|passwd|bearer)\s*[:=]\s*['\"][^'\"]{8,}" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .
(no match)
$ ls .env 2>/dev/null
(absent)
```

The project uses no secret. `.env` is ignored by Git; `.env.example` only
holds example values.

## Version 1.1 — 2 to 4 players, new look, English

Version 1.1 brings games for two to four people, a new visual identity for the
stars, English as a third language (and the default one), gender-inclusive
wording in French and Spanish, and a repository written in English.
Everything below was run on 2026-09-23, before the push.

| Step | Result |
| --- | --- |
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run check:contract` | ✅ 63 exports, 23 types, 19 events, 303 keys × 3 languages |
| `npm test` | ✅ **193 tests** in 12 files |
| `npm run build` | ✅ |
| `npm run test:e2e` | ✅ **64 tests** (32 desktop + 32 mobile), 3.8 min |
| Render sequence on a clean copy (`npm ci --include=dev && npm run build`, then `npm start` with `NODE_ENV=production`) | ✅ `/health` answers `{"status":"ok",…,"env":"production"}`, 13 E2E tests (game flow, secrecy, table size) pass against it |
| Secret search (same command as above) | ✅ one hit, the deliberately fake `'invalid-token'` in a unit test; no `.env` |
| Original GOT FIVE! repository | ✅ untouched: clean working tree, still at `f650a15` |

The screenshots in `docs/images/` were taken from a real four-player game on
the production build.
