# Contribuer à NOCTALIS

Merci de vous intéresser au projet. Toute contribution est bienvenue :
correction, traduction, accessibilité, idée de règle, relecture.

## Démarrer

Pré-requis : **Node.js ≥ 20**.

```bash
git clone https://github.com/Toinezouz/noctalis.git
cd noctalis
npm install
npm run dev
```

- Client : http://localhost:5173
- Serveur : http://localhost:3001 (état : `GET /health`)

Pour jouer, ouvrez **deux navigateurs** (ou une fenêtre privée) : chaque
onglet est un observateur distinct.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur + client en développement |
| `npm run build` | construit `shared`, `server`, puis `client` |
| `npm start` | démarre le serveur compilé |
| `npm test` | tests unitaires et d'intégration (Vitest) |
| `npm run test:e2e` | tests bout en bout (Playwright) |
| `npm run typecheck` | TypeScript strict, 4 projets |
| `npm run lint` | ESLint |
| `npm run check:contract` | vérifie que le code respecte `docs/PROJECT_CONTRACT.md` |

## Avant d'ouvrir une pull request

Ces quatre commandes doivent passer :

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Et, si vous touchez à l'interface :

```bash
npm run test:e2e
```

## Conventions

**Le contrat prime.** `docs/PROJECT_CONTRACT.md` fige les noms de types, les
signatures, les événements Socket.IO et les `data-testid`. Un même concept n'a
qu'un seul nom dans tout le projet. Pour changer une signature : modifiez le
contrat, modifiez tous les consommateurs, puis lancez `npm run check:contract`.

**Le serveur est la seule source de vérité.** Le client ne décide jamais du
résultat d'une action. Aucune information qu'un joueur n'a pas le droit de
connaître ne doit lui parvenir, par aucun canal. Si votre changement touche à
la sérialisation, ajoutez un test qui le prouve.

**Une seule source de données.** Les propriétés des 60 étoiles vivent dans
`shared/src/data/tiles.ts`. Aucun composant ne recopie une correspondance
numéro → constellation → éclat.

**Style.** TypeScript strict, pas de `any`, pas de `TODO` laissé derrière soi.
Les commentaires expliquent *pourquoi*, pas *quoi*. Le français est la langue
du code et des commentaires ; l'interface est traduite en français et en
espagnol, les deux catalogues devant toujours porter exactement les mêmes clés.

**Messages de commit.** Préfixe conventionnel : `feat:`, `fix:`, `refactor:`,
`docs:`, `test:`, `ci:`, `chore:`. Sujet à l'impératif, en français.

## Traduire

Une langue = un fichier dans `client/src/i18n/`. Copiez `fr.ts`, traduisez les
valeurs, gardez les clés et les variables `{entre_accolades}` à l'identique —
un test unitaire vérifie la parité et la compilation échoue si une clé manque.

## Signaler un bug

Utilisez le gabarit d'issue. Précisez ce que vous attendiez, ce qui s'est
produit, et comment reproduire. Une faille de sécurité ne se signale **pas**
en issue publique : voir [SECURITY.md](SECURITY.md).

## Licence

En contribuant, vous acceptez que votre contribution soit publiée sous
**AGPL-3.0-or-later**, comme le reste du projet.
