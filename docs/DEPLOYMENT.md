# Deployment

UMBRASTRA deploys as **a single service**. The Express server serves the
built client, the API and Socket.IO at once: same origin, no CORS settings,
no second service to pay for or keep an eye on.

```
git push  →  GitHub Actions   →  Render
             types, lint,         build, start,
             contract, tests,     /health probe
             build, E2E
```

## What the repository already provides

| Piece | Where | Status |
| --- | --- | --- |
| Service description | [`render.yaml`](../render.yaml) | ready |
| Listens on `0.0.0.0` and `process.env.PORT` | `server/src/index.ts` | ready |
| Health probe `GET /health` | `server/src/createServer.ts` | ready |
| Clean shutdown on `SIGTERM` | `server/src/index.ts` | ready |
| Client served by the server | `createServer.ts` (`express.static` + SPA fallback) | ready |
| Checks before deploying | `.github/workflows/ci.yml` | ready |

No secret is needed: the project uses none.

## Putting the service online

1. On [render.com](https://render.com), connect your GitHub account and allow
   access to the repository.
2. **New → Blueprint**, then pick the repository (or your fork).
3. Render reads `render.yaml` and offers a Web Service called `noctalis`
   (see *The name change* below):
   - build: `npm ci --include=dev && npm run build`
   - start: `npm start`
   - probe: `/health`
   - automatic deploys **only once the checks pass**
     (`autoDeployTrigger: checksPass`)
4. Confirm. The first build takes a few minutes.

## The name change (1.4)

The game was called NOCTALIS up to version 1.3. The code, the texts and the
link previews now say UMBRASTRA, but two things outside the repository still
carry the old name, on purpose:

- **the Render service** is still called `noctalis`, and so is its address,
  `noctalis.onrender.com`. On Render, the `onrender.com` address is chosen
  when a service is created and never changes afterwards; renaming the
  service in `render.yaml` would make the blueprint create a *second*
  service rather than rename the first. `render.yaml` therefore keeps
  `name: noctalis` until a new service is deliberately created;
- **the GitHub repository** is still `Toinezouz/Noctalis`. Renaming it is
  done on GitHub (Settings → General → Repository name), and GitHub then
  redirects the old address, clones included. The links in the README,
  `package.json` and `client/src/lib/project.ts` will be updated after that.

Browsers keep their saved settings: `noctalis:*` storage keys are carried
over to `umbrastra:*` on the first visit (`migrateLegacyStorage`).

## A trap worth knowing: `NODE_ENV` during the build

`render.yaml` sets `NODE_ENV=production`, and that variable **also applies to
the build**. But `npm ci` skips `devDependencies` when `NODE_ENV` is
`production` — that is, exactly esbuild, TypeScript and Vite, the tools that
build the project. The build then fails with:

```
sh: 1: esbuild: not found
```

Hence the `--include=dev` in the build command:

```yaml
buildCommand: npm ci --include=dev && npm run build
```

Development dependencies are only used to build; the running service only
uses `express`, `socket.io` and `cors`.

## The public instance

The project's reference table is
[noctalis.onrender.com](https://noctalis.onrender.com), deployed from `main`
by the blueprint above. Checked online on 23 September 2026 (version 1.0):

```
GET /health → {"status":"ok","rooms":1,"uptime":290.4,"env":"production"}
GET /       → <title>NOCTALIS - Devine ta constellation avant lui</title>
```

From version 1.1 on, the served title was
`NOCTALIS - Find your constellation before anyone else`; from version 1.4 on,
it is `UMBRASTRA - Find your constellation before anyone else`.

## Checking that everything works

```bash
# 1. The service answers
curl https://<your-service>.onrender.com/health
# expected: {"status":"ok","rooms":0,"uptime":...,"env":"production"}

# 2. The client is served
curl -s https://<your-service>.onrender.com/ | grep -o '<title>.*</title>'
# expected: <title>UMBRASTRA - Find your constellation before anyone else</title>
```

Then, in a browser:

1. open the public address;
2. start a game — a 5-character code shows up;
3. open **one to three more windows** (or other devices) and join with the
   invite link shown in the lobby: the code must already be filled in;
4. play a few turns: reveal, PLACE, GAUGE;
5. open the star chart, cross out a few numbers;
6. reload one of the pages: the game must pick up where it was;
7. make a call to reach the end of the game;
8. check the footer links: source code, licence, About, support.

If step 3 works, Socket.IO gets through — the only thing that could go wrong
behind a host.

To check the link preview, look at the tags the server writes:

```bash
curl -s "https://<your-service>.onrender.com/?join=AB7K9&lang=fr" | grep 'og:'
# expected: og:title "Une partie d’UMBRASTRA t’attend", and an og:image that
# starts with https://<your-service>.onrender.com/
```

Chat apps keep previews in cache for a while: after a change, a new link (or
a debugger such as the one of the social network concerned) shows the fresh
card.

### Replaying Render's sequence locally

Before pushing a change that touches deployment, the same sequence can be
replayed exactly on your machine:

```bash
git clone . /tmp/render-sim && cd /tmp/render-sim
NODE_ENV=production npm ci --include=dev
NODE_ENV=production npm run build
NODE_ENV=production PORT=3001 CLIENT_URL=127.0.0.1:3001 npm start

# in another terminal
curl -s localhost:3001/health
```

`CLIENT_URL` is deliberately given **without a scheme**: that is what
Render's `fromService` provides, and the server must complete it by itself.

## Render's free plan

A free service **falls asleep after 15 minutes without traffic**. Waking up
takes 30 to 60 seconds, and **games in progress are lost**: rooms live in
memory.

That is no trouble for a game among friends — open the link, wait for it to
wake, play. It becomes one if you want a service that is always ready: you
then need a paid plan, or to accept the wake-up.

## A deliberate limit: memory

`RoomManager` keeps games in memory. As a consequence:

- a restart, a deploy or a sleep loses the games in progress;
- the service must stay **a single instance** — with two machines, a player
  could land on the one that does not know their room.

That is a choice, not an oversight: a database would be dead weight for
games played in one sitting. Should the need arise, `RoomManager` is the only
piece to replace.

## Hosting elsewhere

The project only needs Node 20, a port and a long-running process. Any
platform able to run `npm ci --include=dev && npm run build` and then
`npm start` will do — as long as it **supports WebSockets** and does not run
the service in a stateless way.

Set `PUBLIC_URL` to the public address (for example
`https://umbrastra.example.org`) so that link previews use absolute URLs.
Without it, the server uses the address each request came in on, which works
behind most proxies as long as they pass the `Host` and `X-Forwarded-Proto`
headers along.

For a one-off game among friends, without hosting anything:

```bash
npm run share
```

opens a temporary tunnel to your machine and prints a link to share (on
Windows, double-click `play.cmd`).
