#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * UMBRASTRA — play with friends far away, in one command
 * ---------------------------------------------------------------------------
 * Builds the game if needed, opens a temporary public tunnel (Cloudflare),
 * then starts the server, only allowing that tunnel's address.
 *
 *   npm run share                    # port 3001 by default
 *   npm run share -- --port 4000     # another port
 *   npm run share -- --build         # force a rebuild
 *   npm run share -- --local         # no tunnel: local game only
 *   npm run share -- --check         # test the tunnel, then stop
 *   npm run share -- --verify URL    # test a link that is already open
 *   npm run share -- --verbose       # show cloudflared's output
 *
 * NAME RESOLUTION WITHOUT RELYING ON THE LOCAL RESOLVER
 * Many home networks (internet provider, antivirus, parental control) filter
 * the `trycloudflare.com` name: the tunnel opens fine, but the host machine
 * cannot translate its address. That does not stop friends from opening the
 * link. So the script resolves the name in cascade — system resolver, then
 * public DNS directly, then DNS-over-HTTPS — and checks the link on the IP it
 * got. Local filtering no longer prevents sharing.
 *
 * The link is temporary: it disappears as soon as you stop the command
 * (Ctrl+C). Nothing is published, nothing is indexed.
 */
import { spawn } from 'node:child_process';
import dnsPromises, { Resolver } from 'node:dns/promises';
import { chmodSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WINDOWS = process.platform === 'win32';
const BIN_DIR = path.join(ROOT, 'node_modules', '.cache', 'umbrastra');
const BIN_PATH = path.join(BIN_DIR, IS_WINDOWS ? 'cloudflared.exe' : 'cloudflared');
const RELEASE_BASE = 'https://github.com/cloudflare/cloudflared/releases/latest/download';
const TUNNEL_URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

/** Public resolvers asked when the system resolver fails. */
const PUBLIC_DNS = ['1.1.1.1', '8.8.8.8', '9.9.9.9'];
/** Same resolvers, over DNS-over-HTTPS: gets past a filtered port 53 too. */
const DOH_ENDPOINTS = [
  { name: '1.1.1.1', url: (host) => `https://1.1.1.1/dns-query?name=${host}&type=A` },
  { name: '8.8.8.8', url: (host) => `https://8.8.8.8/resolve?name=${host}&type=A` },
];

/** Lines by which cloudflared announces that the tunnel is up. */
const REGISTERED_PATTERN = /registered tunnel connection|connection [a-z0-9-]+ registered/i;

/** Label of a name resolved by the system's own resolver. */
const SYSTEM = 'system';
/** Notes this script appends to a tunnel's output, read back for advice. */
const NOT_PUBLISHED = /name not published/;
const NOT_REGISTERED = /no registered connection/;

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const readOption = (flag, fallback) => {
  const index = args.indexOf(flag);
  const next = index >= 0 ? args[index + 1] : undefined;
  return next !== undefined && !next.startsWith('--') ? next : fallback;
};

if (hasFlag('--help') || hasFlag('-h')) {
  console.log(`
UMBRASTRA — play with friends far away

  npm run share                     Builds the game, opens a Cloudflare tunnel
                                    and starts the server. Share the link.
  npm run share -- --port 4000      Uses another local port.
  npm run share -- --build          Forces a rebuild before starting.
  npm run share -- --local          Starts without a tunnel (local game).
  npm run share -- --check          Tests the tunnel and name resolution, then exits.
  npm run share -- --verify URL     Tests an existing link (name + game answer).
  npm run share -- --verbose        Shows all of cloudflared's output.

Ctrl+C stops the server and closes the tunnel.

The cloudflared binary is looked up in the PATH, otherwise downloaded once
into node_modules/.cache/umbrastra/. To force a given binary:
  CLOUDFLARED_BIN=/path/to/cloudflared npm run share

If your network filters the trycloudflare.com name, the script resolves it
through a public DNS (directly, then DNS-over-HTTPS): the link still works
for your friends.
`);
  process.exit(0);
}

const port = Number(readOption('--port', process.env['PORT'] ?? '3001'));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid port: ${String(readOption('--port', ''))}`);
  process.exit(1);
}

const verbose = hasFlag('--verbose');
const children = new Set();
let shuttingDown = false;

/** Kills a process, and all its children on Windows. */
function killChild(child) {
  if (!child.pid) {
    return;
  }
  if (IS_WINDOWS) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill();
  }
}

/** Runs a command line, showing its output (build, archives). */
function run(commandLine, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandLine, { cwd: ROOT, stdio: 'inherit', shell: true, ...options });
    children.add(child);
    child.on('error', reject);
    child.on('exit', (code) => {
      children.delete(child);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`"${commandLine}" failed (code ${String(code)})`));
      }
    });
  });
}

/** Runs a binary (no shell) and returns its whole output. */
function capture(command, commandArgs, timeoutMs) {
  return new Promise((resolve) => {
    let output = '';
    let child;
    try {
      child = spawn(command, commandArgs, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({ ok: false, output: error instanceof Error ? error.message : String(error) });
      return;
    }
    children.add(child);
    const onData = (chunk) => {
      output += String(chunk);
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    const timer = setTimeout(() => killChild(child), timeoutMs);
    child.on('error', (error) => {
      children.delete(child);
      clearTimeout(timer);
      resolve({ ok: false, output: `${output}${error.message}` });
    });
    child.on('exit', (code) => {
      children.delete(child);
      clearTimeout(timer);
      resolve({ ok: code === 0, output, code });
    });
  });
}

// ---------------------------------------------------------------------------
// cloudflared: the official binary
// ---------------------------------------------------------------------------

/** Name of the archive or binary Cloudflare publishes for this system. */
function releaseAsset() {
  const arch = process.arch;
  if (IS_WINDOWS) {
    return arch === 'arm64' ? 'cloudflared-windows-arm64.exe' : 'cloudflared-windows-amd64.exe';
  }
  if (process.platform === 'darwin') {
    return arch === 'arm64' ? 'cloudflared-darwin-arm64.tgz' : 'cloudflared-darwin-amd64.tgz';
  }
  if (process.platform === 'linux') {
    const suffix = { x64: 'amd64', arm64: 'arm64', arm: 'arm', ia32: '386' }[arch] ?? 'amd64';
    return `cloudflared-linux-${suffix}`;
  }
  return null;
}

/** Downloads the official binary into node_modules/.cache/umbrastra/. */
async function downloadCloudflared() {
  const asset = releaseAsset();
  if (!asset) {
    return { error: `Unknown system: ${process.platform}/${process.arch}` };
  }
  const url = `${RELEASE_BASE}/${asset}`;
  console.log(`Downloading cloudflared (${asset})…`);

  let buffer;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      return { error: `Download failed: HTTP ${String(response.status)} on ${url}` };
    }
    buffer = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    return {
      error: `Download failed (${error instanceof Error ? error.message : String(error)})`,
    };
  }

  mkdirSync(BIN_DIR, { recursive: true });
  if (asset.endsWith('.tgz')) {
    const archive = path.join(BIN_DIR, asset);
    writeFileSync(archive, buffer);
    try {
      await run(`tar -xzf "${archive}" -C "${BIN_DIR}"`, { stdio: 'ignore' });
    } catch (error) {
      return {
        error: `Unreadable archive (${error instanceof Error ? error.message : String(error)})`,
      };
    }
  } else {
    writeFileSync(BIN_PATH, buffer);
  }
  if (!IS_WINDOWS) {
    chmodSync(BIN_PATH, 0o755);
  }
  if (!existsSync(BIN_PATH) || statSync(BIN_PATH).size < 1_000_000) {
    return { error: 'The downloaded binary looks incomplete.' };
  }
  return { command: BIN_PATH };
}

/** Finds a working cloudflared: PATH, cache, then download. */
async function resolveCloudflared() {
  const custom = process.env['CLOUDFLARED_BIN'];
  if (custom) {
    return { command: custom };
  }
  const system = IS_WINDOWS ? 'cloudflared.exe' : 'cloudflared';
  if ((await capture(system, ['--version'], 20_000)).ok) {
    return { command: system };
  }
  if (existsSync(BIN_PATH) && (await capture(BIN_PATH, ['--version'], 20_000)).ok) {
    return { command: BIN_PATH };
  }
  const downloaded = await downloadCloudflared();
  if (downloaded.error) {
    return { error: downloaded.error };
  }
  if (!(await capture(downloaded.command, ['--version'], 30_000)).ok) {
    return { error: 'The downloaded binary does not start.' };
  }
  return { command: downloaded.command };
}

/** cloudflared's courtesy lines, useless for diagnosis. */
const NOISE = [
  /Thank you for trying Cloudflare Tunnel/i,
  /cloudflare\.com\/website-terms/i,
  /connect-apps/i,
];

/** Keeps the last useful lines of a command's output. */
function tail(text, lines = 10) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !NOISE.some((pattern) => pattern.test(line)))
    .slice(-lines)
    .join('\n');
}

/**
 * Opens a quick tunnel and returns its public address.
 * The returned object can also wait for more log lines: the URL is announced
 * before the connection is up and the name is published.
 */
function openTunnel(command, localPort, protocol) {
  return new Promise((resolve) => {
    const tunnelArgs = ['tunnel', '--url', `http://127.0.0.1:${String(localPort)}`];
    if (protocol) {
      tunnelArgs.push('--protocol', protocol);
    }
    const startedAt = Date.now();
    const commandLine = `${command} ${tunnelArgs.join(' ')}`;

    let settled = false;
    let output = '';
    let child;
    /** Patterns awaited by `waitForPattern`, resolved when they show up. */
    const watchers = new Set();

    try {
      child = spawn(command, tunnelArgs, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({
        commandLine,
        output: error instanceof Error ? error.message : String(error),
        seconds: 0,
      });
      return;
    }
    children.add(child);

    /** Waits for a pattern in the tunnel's output. */
    const waitForPattern = (pattern, timeoutMs) =>
      new Promise((resolveWatcher) => {
        if (pattern.test(output)) {
          resolveWatcher(true);
          return;
        }
        const watcher = { pattern, resolveWatcher };
        watchers.add(watcher);
        setTimeout(() => {
          if (watchers.delete(watcher)) {
            resolveWatcher(false);
          }
        }, timeoutMs).unref();
      });

    const finish = (result) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          commandLine,
          seconds: Math.round((Date.now() - startedAt) / 1000),
          waitForPattern,
          readOutput: () => output,
          ...result,
        });
      }
    };

    const onData = (chunk) => {
      const text = String(chunk);
      output += text;
      if (verbose) {
        process.stdout.write(text);
      }
      for (const watcher of [...watchers]) {
        if (watcher.pattern.test(output)) {
          watchers.delete(watcher);
          watcher.resolveWatcher(true);
        }
      }
      const match = TUNNEL_URL_PATTERN.exec(output);
      if (match) {
        finish({ child, url: match[0], output });
      }
    };

    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('error', (error) => {
      children.delete(child);
      finish({ output: `${output}${error.message}` });
    });
    child.on('exit', (code) => {
      children.delete(child);
      finish({ output, code });
    });

    const timer = setTimeout(() => {
      if (!settled) {
        killChild(child);
        finish({ output: `${output}\n(no public address after 60 seconds)` });
      }
    }, 60_000);
  });
}

// ---------------------------------------------------------------------------
// Name resolution, without relying on the local resolver
// ---------------------------------------------------------------------------

/** Asks a public resolver directly (UDP 53). */
async function resolveWithServer(hostname, server) {
  const resolver = new Resolver({ timeout: 4000, tries: 1 });
  resolver.setServers([server]);
  const addresses = await resolver.resolve4(hostname);
  if (addresses.length === 0) {
    throw new Error('no address');
  }
  return addresses[0];
}

/** Asks a public resolver over DNS-over-HTTPS (by its IP address). */
async function resolveWithDoh(hostname, endpoint) {
  const response = await fetch(endpoint.url(encodeURIComponent(hostname)), {
    headers: { accept: 'application/dns-json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  const payload = await response.json();
  const answer = (payload.Answer ?? []).find((entry) => entry.type === 1);
  if (!answer) {
    throw new Error('no A record in the answer');
  }
  return answer.data;
}

/**
 * Turns a name into an IP address, trying in order: the system resolver,
 * public DNS directly, then DNS-over-HTTPS. `via` tells which method worked —
 * that is the diagnosis of any filtering.
 */
async function resolveHostname(hostname) {
  const attempts = [];
  try {
    const entry = await dnsPromises.lookup(hostname);
    return { ip: entry.address, via: SYSTEM };
  } catch (error) {
    attempts.push(`system: ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const server of PUBLIC_DNS) {
    try {
      return { ip: await resolveWithServer(hostname, server), via: `DNS ${server}` };
    } catch (error) {
      attempts.push(`DNS ${server}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const endpoint of DOH_ENDPOINTS) {
    try {
      return { ip: await resolveWithDoh(hostname, endpoint), via: `DNS-over-HTTPS ${endpoint.name}` };
    } catch (error) {
      attempts.push(
        `DNS-over-HTTPS ${endpoint.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { error: attempts.join(' · ') };
}

/**
 * HTTP(S) request sent to a given IP address while keeping the original name
 * (Host header and SNI). This is what makes it possible to test a link the
 * local resolver refuses to translate.
 */
function requestPinned(urlString, ip, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const secure = url.protocol === 'https:';
    const transport = secure ? https : http;
    const request = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (secure ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: { host: url.hostname, accept: 'application/json, text/html' },
        servername: secure ? url.hostname : undefined,
        // Node calls this lookup either for a single address or for a list
        // ("happy eyeballs"): both forms must be honoured, otherwise the
        // connection goes to an undefined address.
        lookup: ip
          ? (_host, lookupOptions, callback) => {
              if (lookupOptions && lookupOptions.all) {
                callback(null, [{ address: ip, family: 4 }]);
              } else {
                callback(null, ip, 4);
              }
            }
          : undefined,
        timeout: timeoutMs,
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          if (body.length < 64_000) {
            body += chunk;
          }
        });
        response.on('end', () => {
          resolve({ status: response.statusCode ?? 0, body });
        });
      },
    );
    request.on('timeout', () => {
      request.destroy(new Error('timed out'));
    });
    request.on('error', reject);
    request.end();
  });
}

/**
 * Resolves a name, retrying: cloudflared announces a quick tunnel's address
 * before it is published in public DNS, and resolvers cache a first failure.
 * A few seconds of patience avoid wrongly concluding that the network
 * filters it.
 */
async function resolveHostnameWithPatience(hostname, totalMs = 45_000, onWait) {
  const deadline = Date.now() + totalMs;
  let last = await resolveHostname(hostname);
  let waited = 0;
  while (last.error && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    waited += 3;
    onWait?.(waited);
    last = await resolveHostname(hostname);
  }
  return { ...last, waited };
}

/**
 * Can the link be reached? Any HTTP answer will do: before the local server
 * starts, the tunnel legitimately answers with an error.
 */
async function probeReachable(url) {
  const hostname = new URL(url).hostname;
  const resolved = await resolveHostname(hostname);
  if (resolved.error) {
    return {
      ok: false,
      kind: 'dns',
      detail: `no DNS could resolve ${hostname} (${resolved.error})`,
    };
  }
  try {
    await requestPinned(url, resolved.via === SYSTEM ? null : resolved.ip);
    return { ok: true, via: resolved.via, ip: resolved.ip };
  } catch (error) {
    return {
      ok: false,
      kind: 'network',
      detail: `${hostname} (${resolved.ip}) does not answer from this machine (${
        error instanceof Error ? error.message : String(error)
      })`,
      via: resolved.via,
    };
  }
}

/** Checks that THIS server really is at the end of the link. */
async function verifyPublicLink(url) {
  const reachable = await probeReachable(url);
  if (!reachable.ok) {
    return reachable;
  }
  try {
    const response = await requestPinned(
      `${url}/health`,
      reachable.via === SYSTEM ? null : reachable.ip,
    );
    if (response.status < 200 || response.status >= 300) {
      return {
        ok: false,
        kind: 'http',
        detail: `the address answers, but with an HTTP ${String(response.status)} error`,
        via: reachable.via,
      };
    }
    let payload;
    try {
      payload = JSON.parse(response.body);
    } catch {
      payload = null;
    }
    if (!payload || payload.status !== 'ok' || typeof payload.rooms !== 'number') {
      return {
        ok: false,
        kind: 'wrong-service',
        detail: 'something answers at this address, but it is not the UMBRASTRA server',
        via: reachable.via,
      };
    }
    return { ok: true, via: reachable.via, ip: reachable.ip };
  } catch (error) {
    return {
      ok: false,
      kind: 'network',
      detail: `cannot reach ${url} (${
        error instanceof Error ? error.message : String(error)
      })`,
      via: reachable.via,
    };
  }
}

/** Targeted advice when the tunnel itself fails. */
function explainTunnelFailure(tunnel) {
  console.warn(`\nTunnel unavailable: ${String(tunnel.error)}`);
  if (tunnel.output) {
    console.warn('\n--- what cloudflared said ---');
    console.warn(tunnel.output);
    console.warn('------------------------------');
  }
  const text = String(tunnel.output ?? '');
  if (NOT_PUBLISHED.test(text)) {
    console.warn(
      [
        '',
        'The address was assigned, but no public resolver knew it yet:',
        'publishing it on the Cloudflare side is running late.',
        '',
        '  → Just run the command again: a new address is drawn.',
        '  → If it keeps happening, the tunnel probably never really comes up;',
        '    run it again with --verbose to watch the handshake live.',
      ].join('\n'),
    );
    return;
  }
  if (NOT_REGISTERED.test(text)) {
    console.warn(
      [
        '',
        'cloudflared could not connect to Cloudflare.',
        'Often: outgoing UDP is blocked (the HTTP/2 fallback was tried too), or',
        'outgoing HTTPS is filtered.',
        '',
        '  → Try again from a phone hotspot.',
        '  → If nothing gets through, a permanent host works around it',
        '    (see docs/DEPLOYMENT.md).',
      ].join('\n'),
    );
    return;
  }
  console.warn('\nRun again with --verbose to see all of cloudflared\'s output.');
}

/** Targeted advice when a link does not answer. */
function explainLinkFailure(result, url) {
  console.warn(`\nCareful: ${result.detail}.`);
  if (result.kind === 'dns') {
    console.warn(
      [
        '',
        'No resolver could translate this name, not even public DNS:',
        'your network probably blocks port 53 and DNS-over-HTTPS as well.',
        '',
        'Things to try:',
        '  1. try again from a phone hotspot;',
        '  2. switch DNS (1.1.1.1 or 8.8.8.8) on your machine or your router;',
        '  3. if nothing gets through, a permanent host works around it',
        '     (see docs/DEPLOYMENT.md).',
      ].join('\n'),
    );
    return;
  }
  if (result.kind === 'http' || result.kind === 'wrong-service') {
    console.warn(
      [
        '',
        'The tunnel works but does not reach the game: another program is',
        'probably using the port. Run again on a free port:',
        '  npm run share -- --port 4000',
      ].join('\n'),
    );
    return;
  }
  console.warn(
    [
      '',
      'The link does not answer from this machine. Ask a friend to try it:',
      `if ${url} opens on their side, your local network is filtering it, and`,
      'the game is still playable for everyone.',
    ].join('\n'),
  );
}

/**
 * Explains the situation when only a public DNS could resolve the name: the
 * link is fine, but the host machine's browser will refuse it.
 */
function explainLocalDnsBlocked(via, url, ip, localPort) {
  const hostname = new URL(url).hostname;
  console.log(
    [
      '',
      `Your resolver does not know ${hostname} (yet), but ${via} resolved it`,
      `to ${ip} and the game answers at that address.`,
      '',
      '  → The link works: your friends can open it normally.',
      `  → You can play on http://localhost:${String(localPort)}: it is the same game.`,
      '',
      'Two possible causes, two remedies:',
      '  - a plain negative cache (the name was only just created): try again',
      '    in a minute, it will open;',
      '  - your network filters it: switch your DNS to 1.1.1.1 or 8.8.8.8, or',
      '    add this line to your hosts file:',
      `      ${ip}  ${hostname}`,
      IS_WINDOWS
        ? '    (C:\\Windows\\System32\\drivers\\etc\\hosts, opened as administrator)'
        : '    (/etc/hosts, with sudo)',
    ].join('\n'),
  );
}

// ---------------------------------------------------------------------------
// Opening the tunnel, with an HTTP/2 fallback
// ---------------------------------------------------------------------------

/** Opens a Cloudflare tunnel and makes sure its address can be reached. */
async function startTunnel(localPort) {
  const bin = await resolveCloudflared();
  if (bin.error) {
    return { error: bin.error };
  }

  const attempts = [];
  // Default protocol (QUIC, over UDP), then HTTP/2 if UDP is blocked.
  for (const protocol of [null, 'http2']) {
    if (protocol) {
      console.log('Trying again over HTTP/2 (for networks that block UDP)…');
    }
    const tunnel = await openTunnel(bin.command, localPort, protocol);
    if (!tunnel.url) {
      attempts.push(tunnel);
      continue;
    }

    // cloudflared announces the address before the connection is up: wait
    // for the registration, without which the name is not published yet.
    const registered = await tunnel.waitForPattern(REGISTERED_PATTERN, 25_000);
    if (!registered) {
      attempts.push({
        ...tunnel,
        output: `${tunnel.readOutput()}\n(no registered connection after 25 seconds)`,
      });
      killChild(tunnel.child);
      continue;
    }

    process.stdout.write('Publishing the address in DNS');
    const resolved = await resolveHostnameWithPatience(new URL(tunnel.url).hostname, 45_000, () => {
      process.stdout.write('.');
    });
    console.log('');

    if (resolved.error) {
      attempts.push({
        ...tunnel,
        dnsError: resolved.error,
        output: `${tunnel.readOutput()}\n(name not published after ${String(resolved.waited)} seconds)`,
      });
      killChild(tunnel.child);
      continue;
    }

    // The name resolves: finally check that routing works.
    try {
      await requestPinned(tunnel.url, resolved.via === SYSTEM ? null : resolved.ip);
    } catch (error) {
      attempts.push({
        ...tunnel,
        dnsError: `${resolved.ip} does not answer (${
          error instanceof Error ? error.message : String(error)
        })`,
      });
      killChild(tunnel.child);
      continue;
    }

    return {
      ok: true,
      url: tunnel.url,
      child: tunnel.child,
      via: resolved.via,
      ip: resolved.ip,
      waited: resolved.waited,
    };
  }

  const report = attempts
    .map((attempt) => {
      const status =
        attempt.code === undefined ? 'still running' : `ended with code ${String(attempt.code)}`;
      const dns = attempt.dnsError ? `\n  DNS: ${String(attempt.dnsError)}` : '';
      const body = tail(attempt.output ?? attempt.readOutput?.() ?? '') || '(no output)';
      return `$ ${attempt.commandLine}\n  → ${status} after ${String(attempt.seconds)} s${dns}\n${body}`;
    })
    .join('\n\n');
  return { error: 'no usable tunnel.', output: report };
}

// ---------------------------------------------------------------------------
// Is the build fresh?
// ---------------------------------------------------------------------------

/** Sources whose changes require a rebuild. */
const SOURCE_PATHS = [
  'shared/src',
  'server/src',
  'client/src',
  'client/index.html',
  'client/vite.config.ts',
  'package.json',
  'package-lock.json',
  'client/package.json',
  'server/package.json',
  'shared/package.json',
];

/** Most recent modification time under a path (file or folder). */
function newestMtime(target) {
  let newest = 0;
  const visit = (entryPath) => {
    let info;
    try {
      info = statSync(entryPath);
    } catch {
      return;
    }
    if (info.isDirectory()) {
      for (const child of readdirSync(entryPath)) {
        visit(path.join(entryPath, child));
      }
      return;
    }
    newest = Math.max(newest, info.mtimeMs);
  };
  visit(target);
  return newest;
}

/**
 * Do the installed dependencies match `package-lock.json`?
 * npm copies the lock file into `node_modules/.package-lock.json` on every
 * install: comparing both dates is enough, and avoids a needless
 * `npm install` on every start.
 */
function dependenciesAreStale() {
  const installed = path.join(ROOT, 'node_modules/.package-lock.json');
  if (!existsSync(path.join(ROOT, 'node_modules'))) {
    return { stale: true, reason: 'no dependency installed' };
  }
  if (!existsSync(installed)) {
    return { stale: true, reason: 'incomplete install' };
  }
  const lock = path.join(ROOT, 'package-lock.json');
  if (existsSync(lock) && statSync(lock).mtimeMs > statSync(installed).mtimeMs) {
    return { stale: true, reason: 'the dependency list changed' };
  }
  return { stale: false };
}

/**
 * Is the build up to date?
 * After a `git pull`, `dist/` still exists but is older: without this check
 * the game would run the previous version.
 */
function buildIsStale() {
  const artefacts = [
    path.join(ROOT, 'client/dist/index.html'),
    path.join(ROOT, 'server/dist/index.js'),
  ];
  if (artefacts.some((file) => !existsSync(file))) {
    return { stale: true, reason: 'no build yet' };
  }
  const builtAt = Math.min(...artefacts.map((file) => statSync(file).mtimeMs));
  const sourceAt = Math.max(...SOURCE_PATHS.map((rel) => newestMtime(path.join(ROOT, rel))));
  if (sourceAt > builtAt) {
    return { stale: true, reason: 'sources changed since the last build' };
  }
  return { stale: false };
}

function banner(lines) {
  const width = Math.max(...lines.map((line) => line.length)) + 2;
  const edge = '─'.repeat(width);
  console.log(`\n┌${edge}┐`);
  for (const line of lines) {
    console.log(`│ ${line.padEnd(width - 1)}│`);
  }
  console.log(`└${edge}┘\n`);
}

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`\nStopping (${signal})…`);
  for (const child of children) {
    killChild(child);
  }
  setTimeout(() => process.exit(process.exitCode ?? 0), 300).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

/** Waits for the local server to answer (at most `timeoutMs`). */
async function waitForLocalServer(localPort, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${String(localPort)}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function main() {
  // Diagnosis: test a link that is already open.
  const urlToVerify = readOption('--verify', null);
  if (urlToVerify) {
    console.log(`Checking ${urlToVerify} …`);
    const verdict = await verifyPublicLink(urlToVerify);
    if (verdict.ok) {
      console.log(`This link answers correctly (name resolved by: ${String(verdict.via)}).`);
    } else {
      explainLinkFailure(verdict, urlToVerify);
      process.exitCode = 1;
    }
    return;
  }

  // Diagnosis: open a tunnel and test it, without starting the server.
  if (hasFlag('--check')) {
    console.log('Testing the tunnel (no server will be started)…');
    const tunnel = await startTunnel(port);
    if (tunnel.ok) {
      console.log(`\nTunnel working: ${tunnel.url}`);
      console.log(`Name resolved by: ${String(tunnel.via)} (${String(tunnel.ip)}).`);
      if (tunnel.via !== SYSTEM) {
        console.log(
          'Your local resolver does not know this name: the link will work for your\n' +
            'friends, not in your own browser.',
        );
      }
    } else {
      explainTunnelFailure(tunnel);
      process.exitCode = 1;
    }
    shutdown('end of test');
    return;
  }

  const deps = dependenciesAreStale();
  if (deps.stale) {
    console.log(`Installing dependencies — ${String(deps.reason)} (about a minute)…`);
    await run('npm install');
  }

  const freshness = buildIsStale();
  if (hasFlag('--build') || freshness.stale) {
    const why = hasFlag('--build') ? 'rebuild requested' : freshness.reason;
    console.log(`Building the game — ${String(why)} (a few seconds)…`);
    // Empty VITE_SERVER_URL: the client talks to the server that serves it,
    // hence to the tunnel, whatever its address.
    await run('npm run build', { env: { ...process.env, VITE_SERVER_URL: '' } });
  }

  let tunnelUrl = null;
  let resolvedVia = null;
  let resolvedIp = null;
  if (!hasFlag('--local')) {
    console.log('Opening the public tunnel…');
    const tunnel = await startTunnel(port);
    if (tunnel.ok) {
      tunnelUrl = tunnel.url;
      resolvedVia = tunnel.via;
      resolvedIp = tunnel.ip;
      if (tunnel.waited > 0) {
        console.log(`Address published after ${String(tunnel.waited)} seconds.`);
      }
    } else {
      explainTunnelFailure(tunnel);
      if (tunnel.child) {
        killChild(tunnel.child);
      }
      console.warn('\nThe game starts locally anyway.\n');
    }
  }

  const origins = [
    tunnelUrl,
    `http://localhost:${String(port)}`,
    `http://127.0.0.1:${String(port)}`,
  ]
    .filter(Boolean)
    .join(',');

  const server = spawn(process.execPath, ['server/dist/index.js'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'production',
      // Only these origins are accepted: the tunnel and the local machine.
      CLIENT_URL: origins,
    },
  });
  children.add(server);
  server.on('exit', (code) => {
    children.delete(server);
    if (!shuttingDown) {
      process.exit(code ?? 0);
    }
  });

  const localReady = await waitForLocalServer(port);
  if (!localReady) {
    console.warn(`\nThe local server does not answer on port ${String(port)}.`);
  }

  if (!tunnelUrl) {
    banner([`Game available on http://localhost:${String(port)}`]);
    return;
  }

  // Last check, this time with the game behind the tunnel.
  process.stdout.write('Checking the public link… ');
  const verdict = await verifyPublicLink(tunnelUrl);
  console.log(verdict.ok ? 'the game answers through the tunnel.' : 'failed.');

  if (verdict.ok) {
    banner([
      'Share this link with up to three friends:',
      '',
      tunnelUrl,
      '',
      'You: Start a game → you get a 5-character code.',
      'Everyone else: Join a game → type that code.',
      '',
      'Ctrl+C closes the tunnel: the link then stops working.',
    ]);
    if (verdict.via !== SYSTEM) {
      explainLocalDnsBlocked(String(resolvedVia ?? verdict.via), tunnelUrl, String(resolvedIp ?? verdict.ip), port);
    }
  } else {
    explainLinkFailure(verdict, tunnelUrl);
    banner([
      'Public link (not verified):',
      '',
      tunnelUrl,
      '',
      `Locally, the game answers on http://localhost:${String(port)}`,
    ]);
  }

  console.log(`Link to share: ${tunnelUrl}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
  shutdown('error');
});
