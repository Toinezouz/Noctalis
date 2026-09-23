#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * GOT FIVE! — partie à distance, en une commande
 * ---------------------------------------------------------------------------
 * Construit le jeu si besoin, ouvre un tunnel public temporaire (Cloudflare),
 * puis démarre le serveur en n'autorisant que l'adresse de ce tunnel.
 *
 *   npm run share                    # port 3001 par défaut
 *   npm run share -- --port 4000     # autre port
 *   npm run share -- --build         # force une reconstruction
 *   npm run share -- --local         # aucun tunnel : partie en local
 *   npm run share -- --check         # teste le tunnel, puis s'arrête
 *   npm run share -- --verify URL    # teste un lien déjà ouvert
 *   npm run share -- --verbose       # affiche la sortie de cloudflared
 *
 * RÉSOLUTION DU NOM SANS DÉPENDRE DU RÉSOLVEUR LOCAL
 * Beaucoup de réseaux domestiques (fournisseur d'accès, antivirus, contrôle
 * parental) filtrent le nom `trycloudflare.com` : le tunnel s'ouvre très bien,
 * mais la machine hôte ne sait pas traduire son adresse. Cela n'empêche en rien
 * l'ami d'ouvrir le lien. Le script résout donc le nom en cascade — résolveur
 * système, puis DNS publics en direct, puis DNS-over-HTTPS — et vérifie le lien
 * sur l'adresse IP obtenue. Un filtrage local n'empêche plus de partager.
 *
 * Le lien est temporaire : il disparaît dès que tu arrêtes la commande
 * (Ctrl+C). Rien n'est publié, rien n'est indexé.
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
const BIN_DIR = path.join(ROOT, 'node_modules', '.cache', 'gotfive');
const BIN_PATH = path.join(BIN_DIR, IS_WINDOWS ? 'cloudflared.exe' : 'cloudflared');
const RELEASE_BASE = 'https://github.com/cloudflare/cloudflared/releases/latest/download';
const TUNNEL_URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

/** Résolveurs publics interrogés quand le résolveur du système échoue. */
const PUBLIC_DNS = ['1.1.1.1', '8.8.8.8', '9.9.9.9'];
/** Mêmes résolveurs, en DNS-over-HTTPS : franchit aussi un port 53 filtré. */
const DOH_ENDPOINTS = [
  { name: '1.1.1.1', url: (host) => `https://1.1.1.1/dns-query?name=${host}&type=A` },
  { name: '8.8.8.8', url: (host) => `https://8.8.8.8/resolve?name=${host}&type=A` },
];

/** Lignes par lesquelles cloudflared annonce que le tunnel est etabli. */
const REGISTERED_PATTERN = /registered tunnel connection|connection [a-z0-9-]+ registered/i;

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const readOption = (flag, fallback) => {
  const index = args.indexOf(flag);
  const next = index >= 0 ? args[index + 1] : undefined;
  return next !== undefined && !next.startsWith('--') ? next : fallback;
};

if (hasFlag('--help') || hasFlag('-h')) {
  console.log(`
GOT FIVE! — jouer à distance avec un ami

  npm run share                     Construit le jeu, ouvre un tunnel Cloudflare
                                    et démarre le serveur. Partage le lien.
  npm run share -- --port 4000      Utilise un autre port local.
  npm run share -- --build          Force la reconstruction avant de démarrer.
  npm run share -- --local          Démarre sans tunnel (jeu accessible en local).
  npm run share -- --check          Teste le tunnel et la résolution, puis sort.
  npm run share -- --verify URL     Teste un lien existant (nom + réponse du jeu).
  npm run share -- --verbose        Affiche toute la sortie de cloudflared.

Ctrl+C arrête le serveur et ferme le tunnel.

Le binaire cloudflared est cherché dans le PATH, sinon téléchargé une fois dans
node_modules/.cache/gotfive/. Pour imposer un binaire précis :
  CLOUDFLARED_BIN=/chemin/vers/cloudflared npm run share

Si ton réseau filtre le nom trycloudflare.com, le script le résout par un DNS
public (direct, puis DNS-over-HTTPS) : le lien reste valable pour ton ami.
`);
  process.exit(0);
}

const port = Number(readOption('--port', process.env['PORT'] ?? '3001'));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Port invalide : ${String(readOption('--port', ''))}`);
  process.exit(1);
}

const verbose = hasFlag('--verbose');
const children = new Set();
let shuttingDown = false;

/** Tue un processus, et toute sa descendance sous Windows. */
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

/** Lance une ligne de commande en affichant sa sortie (build, archives). */
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
        reject(new Error(`« ${commandLine} » a échoué (code ${String(code)})`));
      }
    });
  });
}

/** Lance un binaire (sans interpréteur) et renvoie sa sortie complète. */
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
// cloudflared : binaire officiel
// ---------------------------------------------------------------------------

/** Nom de l'archive ou du binaire publié par Cloudflare pour ce système. */
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

/** Télécharge le binaire officiel dans node_modules/.cache/gotfive/. */
async function downloadCloudflared() {
  const asset = releaseAsset();
  if (!asset) {
    return { error: `Système non reconnu : ${process.platform}/${process.arch}` };
  }
  const url = `${RELEASE_BASE}/${asset}`;
  console.log(`Téléchargement de cloudflared (${asset})…`);

  let buffer;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      return { error: `Téléchargement impossible : HTTP ${String(response.status)} sur ${url}` };
    }
    buffer = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    return {
      error: `Téléchargement impossible (${error instanceof Error ? error.message : String(error)})`,
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
        error: `Archive illisible (${error instanceof Error ? error.message : String(error)})`,
      };
    }
  } else {
    writeFileSync(BIN_PATH, buffer);
  }
  if (!IS_WINDOWS) {
    chmodSync(BIN_PATH, 0o755);
  }
  if (!existsSync(BIN_PATH) || statSync(BIN_PATH).size < 1_000_000) {
    return { error: 'Le binaire téléchargé semble incomplet.' };
  }
  return { command: BIN_PATH };
}

/** Trouve un cloudflared utilisable : PATH, cache, puis téléchargement. */
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
    return { error: 'Le binaire téléchargé ne démarre pas.' };
  }
  return { command: downloaded.command };
}

/** Lignes de politesse de cloudflared, sans intérêt pour le diagnostic. */
const NOISE = [
  /Thank you for trying Cloudflare Tunnel/i,
  /cloudflare\.com\/website-terms/i,
  /connect-apps/i,
];

/** Garde les dernières lignes utiles d'une sortie de commande. */
function tail(text, lines = 10) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !NOISE.some((pattern) => pattern.test(line)))
    .slice(-lines)
    .join('\n');
}

/**
 * Ouvre un tunnel rapide et renvoie son adresse publique.
 * L'objet rendu permet aussi d'attendre d'autres lignes de journal : l'URL est
 * annoncee avant que la connexion ne soit etablie et le nom publie.
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
    /** Motifs attendus par `waitForPattern`, resolus a leur apparition. */
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

    /** Attend l'apparition d'un motif dans la sortie du tunnel. */
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
        finish({ output: `${output}\n(aucune adresse publique après 60 secondes)` });
      }
    }, 60_000);
  });
}

// ---------------------------------------------------------------------------
// Résolution du nom, sans dépendre du résolveur local
// ---------------------------------------------------------------------------

/** Interroge un résolveur public en direct (UDP 53). */
async function resolveWithServer(hostname, server) {
  const resolver = new Resolver({ timeout: 4000, tries: 1 });
  resolver.setServers([server]);
  const addresses = await resolver.resolve4(hostname);
  if (addresses.length === 0) {
    throw new Error('aucune adresse');
  }
  return addresses[0];
}

/** Interroge un résolveur public en DNS-over-HTTPS (par son adresse IP). */
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
    throw new Error('aucune réponse de type A');
  }
  return answer.data;
}

/**
 * Traduit un nom en adresse IP, en essayant dans l'ordre :
 * le résolveur du système, les DNS publics en direct, puis DNS-over-HTTPS.
 * `via` indique quelle méthode a réussi — c'est le diagnostic du filtrage.
 */
async function resolveHostname(hostname) {
  const attempts = [];
  try {
    const entry = await dnsPromises.lookup(hostname);
    return { ip: entry.address, via: 'système' };
  } catch (error) {
    attempts.push(`système : ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const server of PUBLIC_DNS) {
    try {
      return { ip: await resolveWithServer(hostname, server), via: `DNS ${server}` };
    } catch (error) {
      attempts.push(`DNS ${server} : ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const endpoint of DOH_ENDPOINTS) {
    try {
      return { ip: await resolveWithDoh(hostname, endpoint), via: `DNS-over-HTTPS ${endpoint.name}` };
    } catch (error) {
      attempts.push(
        `DNS-over-HTTPS ${endpoint.name} : ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { error: attempts.join(' · ') };
}

/**
 * Requête HTTP(S) dirigée vers une adresse IP précise, tout en gardant le nom
 * d'origine (en-tête Host et SNI). C'est ce qui permet de tester un lien que le
 * résolveur local refuse de traduire.
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
        // Node interroge ce « lookup » soit pour une adresse unique, soit pour
        // une liste (algorithme « happy eyeballs ») : les deux formes doivent
        // etre honorees, sinon la connexion part sur une adresse indefinie.
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
      request.destroy(new Error('délai dépassé'));
    });
    request.on('error', reject);
    request.end();
  });
}

/**
 * Résout un nom en réessayant : l'adresse d'un tunnel rapide est annoncée par
 * cloudflared avant d'être publiée dans le DNS public, et un premier échec est
 * mis en cache négatif par les résolveurs. Quelques secondes de patience
 * évitent de conclure à tort que le réseau filtre.
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
 * Le lien est-il joignable ? On accepte n'importe quelle réponse HTTP : avant
 * que le serveur local ne démarre, le tunnel répond légitimement une erreur.
 */
async function probeReachable(url) {
  const hostname = new URL(url).hostname;
  const resolved = await resolveHostname(hostname);
  if (resolved.error) {
    return {
      ok: false,
      kind: 'dns',
      detail: `le nom ${hostname} n'a pu être résolu par aucun DNS (${resolved.error})`,
    };
  }
  try {
    await requestPinned(url, resolved.via === 'système' ? null : resolved.ip);
    return { ok: true, via: resolved.via, ip: resolved.ip };
  } catch (error) {
    return {
      ok: false,
      kind: 'network',
      detail: `${hostname} (${resolved.ip}) ne répond pas depuis cette machine (${
        error instanceof Error ? error.message : String(error)
      })`,
      via: resolved.via,
    };
  }
}

/** Vérifie qu'au bout du lien se trouve bien CE serveur. */
async function verifyPublicLink(url) {
  const reachable = await probeReachable(url);
  if (!reachable.ok) {
    return reachable;
  }
  try {
    const response = await requestPinned(
      `${url}/health`,
      reachable.via === 'système' ? null : reachable.ip,
    );
    if (response.status < 200 || response.status >= 300) {
      return {
        ok: false,
        kind: 'http',
        detail: `l'adresse répond, mais avec une erreur HTTP ${String(response.status)}`,
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
        detail: "quelque chose répond à cette adresse, mais ce n'est pas le serveur GOT FIVE!",
        via: reachable.via,
      };
    }
    return { ok: true, via: reachable.via, ip: reachable.ip };
  } catch (error) {
    return {
      ok: false,
      kind: 'network',
      detail: `impossible d'atteindre ${url} (${
        error instanceof Error ? error.message : String(error)
      })`,
      via: reachable.via,
    };
  }
}

/** Conseils ciblés quand le tunnel lui-même n'aboutit pas. */
function explainTunnelFailure(tunnel) {
  console.warn(`\nTunnel indisponible : ${String(tunnel.error)}`);
  if (tunnel.output) {
    console.warn("\n--- ce qu'a répondu cloudflared ---");
    console.warn(tunnel.output);
    console.warn('-----------------------------------');
  }
  const text = String(tunnel.output ?? '');
  if (/nom non publié/.test(text)) {
    console.warn(
      [
        '',
        "L'adresse a bien été attribuée, mais aucun résolveur public ne la",
        "connaissait encore : la publication côté Cloudflare a pris du retard.",
        '',
        '  → Relance simplement la commande : une nouvelle adresse est tirée.',
        "  → Si cela se répète, le tunnel ne s'établit sans doute pas vraiment ;",
        '    relance avec --verbose pour voir la négociation en direct.',
      ].join('\n'),
    );
    return;
  }
  if (/aucune connexion enregistrée/.test(text)) {
    console.warn(
      [
        '',
        "cloudflared n'a pas réussi à établir sa connexion vers Cloudflare.",
        'Souvent : UDP sortant bloqué (le repli HTTP/2 a aussi été tenté), ou',
        'sortie HTTPS filtrée.',
        '',
        '  → Teste depuis un partage de connexion mobile.',
        "  → Si rien ne passe, un hébergement permanent contourne le problème",
        '    (section « Build et déploiement » du README).',
      ].join('\n'),
    );
    return;
  }
  console.warn('\nRelance avec --verbose pour voir toute la sortie de cloudflared.');
}

/** Conseils ciblés quand un lien ne répond pas. */
function explainLinkFailure(result, url) {
  console.warn(`\nAttention : ${result.detail}.`);
  if (result.kind === 'dns') {
    console.warn(
      [
        '',
        'Aucun résolveur n\'a pu traduire ce nom, pas même les DNS publics :',
        'ton réseau bloque sans doute aussi le port 53 et le DNS-over-HTTPS.',
        '',
        'À essayer :',
        '  1. teste depuis un partage de connexion mobile ;',
        '  2. change de DNS (1.1.1.1 ou 8.8.8.8) sur ta machine ou ta box ;',
        '  3. si rien ne passe, un hébergement permanent contourne le problème',
        '     (section « Build et déploiement » du README).',
      ].join('\n'),
    );
    return;
  }
  if (result.kind === 'http' || result.kind === 'wrong-service') {
    console.warn(
      [
        '',
        "Le tunnel fonctionne mais n'atteint pas le jeu : un autre programme",
        'occupe sans doute le port. Relance sur un port libre :',
        '  npm run share -- --port 4000',
      ].join('\n'),
    );
    return;
  }
  console.warn(
    [
      '',
      'Le lien ne répond pas depuis cette machine. Fais-le tester à ton ami :',
      `si ${url} s'ouvre chez lui, c'est ton réseau local qui filtre, et la`,
      'partie reste jouable pour vous deux.',
    ].join('\n'),
  );
}

/**
 * Explique la situation quand le nom n'a été résolu que par un DNS public :
 * le lien est bon, mais le navigateur de la machine hôte le refusera.
 */
function explainLocalDnsBlocked(via, url, ip, localPort) {
  const hostname = new URL(url).hostname;
  console.log(
    [
      '',
      `Ton résolveur ne connaît pas (encore) ${hostname}, mais ${via} l'a résolu`,
      `en ${ip} et le jeu répond bien à cette adresse.`,
      '',
      "  → Le lien est valable : ton ami peut l'ouvrir normalement.",
      `  → Toi, joue sur http://localhost:${String(localPort)} : c'est la même partie.`,
      '',
      'Deux causes possibles, deux remèdes :',
      '  - simple cache négatif (le nom venait juste d\'être créé) : réessaie',
      '    dans une minute, il s\'ouvrira ;',
      '  - filtrage de ton réseau : passe ton DNS à 1.1.1.1 ou 8.8.8.8, ou',
      '    ajoute cette ligne à ton fichier hosts :',
      `      ${ip}  ${hostname}`,
      IS_WINDOWS
        ? '    (C:\\Windows\\System32\\drivers\\etc\\hosts, à ouvrir en administrateur)'
        : '    (/etc/hosts, avec sudo)',
    ].join('\n'),
  );
}

// ---------------------------------------------------------------------------
// Ouverture du tunnel, avec repli HTTP/2
// ---------------------------------------------------------------------------

/** Ouvre un tunnel Cloudflare et s'assure que son adresse est joignable. */
async function startTunnel(localPort) {
  const bin = await resolveCloudflared();
  if (bin.error) {
    return { error: bin.error };
  }

  const attempts = [];
  // Protocole par défaut (QUIC, sur UDP), puis HTTP/2 si l'UDP est bloqué.
  for (const protocol of [null, 'http2']) {
    if (protocol) {
      console.log("Nouvelle tentative en HTTP/2 (réseaux bloquant l'UDP)…");
    }
    const tunnel = await openTunnel(bin.command, localPort, protocol);
    if (!tunnel.url) {
      attempts.push(tunnel);
      continue;
    }

    // cloudflared annonce l'adresse avant d'avoir établi la connexion : on
    // attend l'enregistrement, sans quoi le nom n'est pas encore publié.
    const registered = await tunnel.waitForPattern(REGISTERED_PATTERN, 25_000);
    if (!registered) {
      attempts.push({
        ...tunnel,
        output: `${tunnel.readOutput()}\n(aucune connexion enregistrée après 25 secondes)`,
      });
      killChild(tunnel.child);
      continue;
    }

    process.stdout.write('Publication de l\'adresse dans le DNS');
    const resolved = await resolveHostnameWithPatience(new URL(tunnel.url).hostname, 45_000, () => {
      process.stdout.write('.');
    });
    console.log('');

    if (resolved.error) {
      attempts.push({
        ...tunnel,
        dnsError: resolved.error,
        output: `${tunnel.readOutput()}\n(nom non publié après ${String(resolved.waited)} secondes)`,
      });
      killChild(tunnel.child);
      continue;
    }

    // Le nom répond : on vérifie enfin que l'acheminement fonctionne.
    try {
      await requestPinned(tunnel.url, resolved.via === 'système' ? null : resolved.ip);
    } catch (error) {
      attempts.push({
        ...tunnel,
        dnsError: `${resolved.ip} ne répond pas (${
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
        attempt.code === undefined ? 'en cours' : `terminé avec le code ${String(attempt.code)}`;
      const dns = attempt.dnsError ? `\n  DNS : ${String(attempt.dnsError)}` : '';
      const body = tail(attempt.output ?? attempt.readOutput?.() ?? '') || '(aucune sortie)';
      return `$ ${attempt.commandLine}\n  → ${status} après ${String(attempt.seconds)} s${dns}\n${body}`;
    })
    .join('\n\n');
  return { error: "aucun tunnel utilisable.", output: report };
}

// ---------------------------------------------------------------------------
// Fraîcheur du build
// ---------------------------------------------------------------------------

/** Sources dont une modification impose une reconstruction. */
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

/** Date de modification la plus récente sous un chemin (fichier ou dossier). */
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
 * Le build est-il à jour ?
 * Après un « git pull », `dist/` existe toujours mais date d'avant : sans
 * cette vérification, la partie se jouerait avec l'ancienne version.
 */
/**
 * Les dépendances installées correspondent-elles au `package-lock.json` ?
 * npm recopie le verrou dans `node_modules/.package-lock.json` à chaque
 * installation : comparer les deux dates suffit, et évite un `npm install`
 * inutile à chaque démarrage.
 */
function dependenciesAreStale() {
  const installed = path.join(ROOT, 'node_modules/.package-lock.json');
  if (!existsSync(path.join(ROOT, 'node_modules'))) {
    return { stale: true, reason: 'aucune dépendance installée' };
  }
  if (!existsSync(installed)) {
    return { stale: true, reason: 'installation incomplète' };
  }
  const lock = path.join(ROOT, 'package-lock.json');
  if (existsSync(lock) && statSync(lock).mtimeMs > statSync(installed).mtimeMs) {
    return { stale: true, reason: 'la liste des dépendances a changé' };
  }
  return { stale: false };
}

function buildIsStale() {
  const artefacts = [
    path.join(ROOT, 'client/dist/index.html'),
    path.join(ROOT, 'server/dist/index.js'),
  ];
  if (artefacts.some((file) => !existsSync(file))) {
    return { stale: true, reason: 'aucun build présent' };
  }
  const builtAt = Math.min(...artefacts.map((file) => statSync(file).mtimeMs));
  const sourceAt = Math.max(...SOURCE_PATHS.map((rel) => newestMtime(path.join(ROOT, rel))));
  if (sourceAt > builtAt) {
    return { stale: true, reason: 'sources modifiées depuis le dernier build' };
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
  console.log(`\nArrêt (${signal})…`);
  for (const child of children) {
    killChild(child);
  }
  setTimeout(() => process.exit(process.exitCode ?? 0), 300).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

/** Attend que le serveur local réponde (au plus `timeoutMs`). */
async function waitForLocalServer(localPort, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${String(localPort)}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Le serveur n'écoute pas encore.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function main() {
  // Diagnostic : tester un lien déjà ouvert.
  const urlToVerify = readOption('--verify', null);
  if (urlToVerify) {
    console.log(`Vérification de ${urlToVerify} …`);
    const verdict = await verifyPublicLink(urlToVerify);
    if (verdict.ok) {
      console.log(`Ce lien répond correctement (nom résolu par : ${String(verdict.via)}).`);
    } else {
      explainLinkFailure(verdict, urlToVerify);
      process.exitCode = 1;
    }
    return;
  }

  // Diagnostic : ouvrir un tunnel et le tester, sans démarrer le serveur.
  if (hasFlag('--check')) {
    console.log('Test du tunnel (aucun serveur ne sera démarré)…');
    const tunnel = await startTunnel(port);
    if (tunnel.ok) {
      console.log(`\nTunnel opérationnel : ${tunnel.url}`);
      console.log(`Nom résolu par : ${String(tunnel.via)} (${String(tunnel.ip)}).`);
      if (tunnel.via !== 'système') {
        console.log(
          "Ton résolveur local ne connaît pas ce nom : le lien marchera pour ton ami,\n" +
            'pas dans ton propre navigateur.',
        );
      }
    } else {
      explainTunnelFailure(tunnel);
      process.exitCode = 1;
    }
    shutdown('fin du test');
    return;
  }

  const deps = dependenciesAreStale();
  if (deps.stale) {
    console.log(`Installation des dépendances — ${String(deps.reason)} (une minute environ)…`);
    await run('npm install');
  }

  const freshness = buildIsStale();
  if (hasFlag('--build') || freshness.stale) {
    const why = hasFlag('--build') ? 'reconstruction demandée' : freshness.reason;
    console.log(`Construction du jeu — ${String(why)} (quelques secondes)…`);
    // VITE_SERVER_URL vide : le client parle au serveur qui le sert, donc au
    // tunnel, quelle que soit son adresse.
    await run('npm run build', { env: { ...process.env, VITE_SERVER_URL: '' } });
  }

  let tunnelUrl = null;
  let resolvedVia = null;
  let resolvedIp = null;
  if (!hasFlag('--local')) {
    console.log('Ouverture du tunnel public…');
    const tunnel = await startTunnel(port);
    if (tunnel.ok) {
      tunnelUrl = tunnel.url;
      resolvedVia = tunnel.via;
      resolvedIp = tunnel.ip;
      if (tunnel.waited > 0) {
        console.log(`Adresse publiée après ${String(tunnel.waited)} secondes.`);
      }
    } else {
      explainTunnelFailure(tunnel);
      if (tunnel.child) {
        killChild(tunnel.child);
      }
      console.warn('\nLe jeu démarre quand même en local.\n');
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
      // Seules ces origines sont acceptées : le tunnel et la machine locale.
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
    console.warn(`\nLe serveur local ne répond pas sur le port ${String(port)}.`);
  }

  if (!tunnelUrl) {
    banner([`Jeu disponible sur http://localhost:${String(port)}`]);
    return;
  }

  // Dernière vérification, cette fois avec le jeu derrière le tunnel.
  process.stdout.write('Vérification du lien public… ');
  const verdict = await verifyPublicLink(tunnelUrl);
  console.log(verdict.ok ? 'le jeu répond bien à travers le tunnel.' : 'échec.');

  if (verdict.ok) {
    banner([
      'Partage ce lien avec ton ami :',
      '',
      tunnelUrl,
      '',
      'Toi : Créer une partie → tu obtiens un code à 5 caractères.',
      'Lui : Rejoindre une partie → il saisit ce code.',
      '',
      'Ctrl+C ferme le tunnel : le lien cesse alors de fonctionner.',
    ]);
    if (verdict.via !== 'système') {
      explainLocalDnsBlocked(String(resolvedVia ?? verdict.via), tunnelUrl, String(resolvedIp ?? verdict.ip), port);
    }
  } else {
    explainLinkFailure(verdict, tunnelUrl);
    banner([
      'Lien public (non vérifié) :',
      '',
      tunnelUrl,
      '',
      `En local, le jeu répond sur http://localhost:${String(port)}`,
    ]);
  }

  console.log(`Lien à partager : ${tunnelUrl}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
  shutdown('erreur');
});
