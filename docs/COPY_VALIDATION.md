# Validation de la copie

Vérification que la copie est **fonctionnellement identique à l'original**,
exécutée avant toute transformation d'identité.

## Provenance

| | |
| --- | --- |
| Source | `/home/user/Got-Five`, commit `f650a15`, arbre propre |
| Destination | `/home/user/noctalis` |
| Méthode | archive `tar` excluant `node_modules`, `dist`, `.git`, `test-results`, `playwright-report` |
| Fichiers copiés | 119 |
| Git | dépôt neuf (`git init`), **aucun remote**, historique vierge |

L'historique Git de l'original n'a **pas** été copié : le nouveau projet part
d'un premier commit propre, sans trace du projet précédent.

## Résultats — copie non modifiée

Commandes réellement exécutées dans `/home/user/noctalis`, sorties observées :

| Étape | Commande | Résultat |
| --- | --- | --- |
| Dépendances | `npm install` | 401 paquets, aucune erreur |
| Types | `npm run typecheck` | ✅ 4 projets TypeScript, 0 erreur |
| Style | `npx eslint .` | ✅ 0 erreur |
| Tests unitaires | `npx vitest run` | ✅ **154 tests**, 11 fichiers |
| Build | `npm run build` | ✅ shared + serveur + client |
| Bout en bout | `npx playwright test` | ✅ **58 tests** (desktop + mobile), 2,9 min |

Aucune correction n'a été nécessaire : la copie fonctionne telle quelle.

## État de l'original après la copie

```
$ git -C /home/user/Got-Five status --short
(aucune sortie)
$ git -C /home/user/Got-Five log --oneline -1
f650a15 Mode sombre : automatique, clair ou sombre, au choix du joueur
```

Arbre de travail propre, même commit qu'avant l'opération : **l'original n'a
pas été touché.**

## Recherche de l'ancienne identité — état initial

Relevé avant transformation, pour mesurer le travail restant :

| Nature | Occurrences |
| --- | --- |
| Imports `@gotfive/*` | 67 |
| Chaînes « GOT FIVE » | 66 |
| Clés `gotfive:*` | 6 |
| `data-testid` portant la marque | 20 |

Le relevé après transformation figure plus bas, complété en fin de migration.

## Recherche de l'ancienne identité — état final

Rempli après la transformation complète, par la commande vérifiable :

```
$ grep -ril "got.five\|gotfive" --exclude-dir=node_modules --exclude-dir=dist .
docs/COPY_VALIDATION.md
docs/MIGRATION_AUDIT.md
docs/ORIGINAL_PROJECT_AUDIT.md
docs/PROJECT_CONTRACT.md
scripts/check-contract.mjs
```

Cinq fichiers, tous volontaires :

- les **quatre documents d'audit** décrivent la migration — c'est leur sujet ;
- `scripts/check-contract.mjs` porte le motif de recherche qui garantit,
  à chaque exécution de la CI, qu'aucun autre fichier ne le contient.

**Aucun fichier de code applicatif, d'interface, de configuration ou de
documentation publique ne porte l'ancienne identité.** Le vérificateur de
contrat échoue si cela change.

## Résultats — copie transformée en NOCTALIS

| Étape | Résultat |
| --- | --- |
| `npm run typecheck` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npm run check:contract` | ✅ 58 exports, 22 types, 19 événements, 291 clés |
| `npm test` | ✅ **154 tests** |
| `npm run test:e2e` | ✅ **58 tests** (desktop + mobile), 2,9 min |
| `npm run build` | ✅ |

Le vérificateur de contrat a lui-même été éprouvé : en renommant
volontairement `toPublicGameState`, il signale bien deux violations, puis
repasse au vert une fois le nom restauré.

## Recherche de secrets

```
$ grep -rInE "(api[_-]?key|secret|token|password|passwd|bearer)\s*[:=]\s*['\"][^'\"]{8,}" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .
(aucune correspondance)
$ ls .env 2>/dev/null
(absent)
```

Le projet n'utilise aucun secret. `.env` est ignoré par Git ; `.env.example`
ne contient que des valeurs d'exemple.
