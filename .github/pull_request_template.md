## Ce que fait cette PR

## Pourquoi

<!-- Issue liée, ou le problème que ça résout. -->

## Vérifications

- [ ] `npm run typecheck` passe
- [ ] `npm run lint` passe
- [ ] `npm test` passe
- [ ] `npm run build` passe
- [ ] `npm run check:contract` passe
- [ ] `npm run test:e2e` passe (si l'interface est touchée)

## Documentation

- [ ] `docs/PROJECT_CONTRACT.md` mis à jour si une signature change
- [ ] README ou docs mis à jour si le comportement visible change
- [ ] Aucun `TODO` ni code mort laissé derrière

## Sécurité

- [ ] Aucun secret, jeton ou identifiant ajouté au dépôt
- [ ] Aucune information secrète supplémentaire n'est envoyée au client
- [ ] Les entrées venant du client restent validées côté serveur

## Impact visuel

<!-- Captures avant / après si l'interface change. Préciser clair ET sombre. -->

## Impact réseau

- [ ] Aucun changement du protocole Socket.IO
- [ ] Protocole modifié — les événements et charges utiles sont documentés dans le contrat
