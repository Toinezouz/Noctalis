# Audit de migration

Ce que la copie conserve, ce qu'elle remplace, et pourquoi.

## Tableau de décision

| Élément | Original | Copie | Action | Motif |
| --- | --- | --- | --- | --- |
| Moteur réseau (Socket.IO, handlers) | existant | copié | **conserver** | générique |
| Salons, codes, cycle de vie | existant | copié | **conserver** | générique |
| Reconnexion par jeton | existante | copiée | **conserver** | générique |
| Sérialisation public / privé | existante | copiée | **conserver** | propriété de sécurité à préserver |
| Garde-fou anti-fuite | existant | copié | **conserver** | idem |
| Limitation de débit, jetons | existants | copiés | **conserver** | générique |
| Moteur de règles | existant | copié | **conserver** | mécanique, non identitaire |
| Source de vérité des 60 éléments | existante | copiée | **conserver** | structure générique (5 familles × 3 valeurs) |
| Machine à états | existante | copiée | **conserver** | générique |
| Composants d'infrastructure (Modal, Button, Panel…) | existants | copiés | **conserver** | génériques |
| Fiche de déduction (structure) | existante | copiée | **adapter** | structure gardée, vocabulaire refait |
| Design system (jetons CSS) | existant | copié | **adapter** | structure gardée, palette refaite |
| Thèmes clair / sombre | existants | copiés | **adapter** | mécanisme gardé, teintes refaites |
| Tests unitaires et E2E | existants | copiés | **adapter** | assertions de texte à réécrire |
| Nom du projet | GOT FIVE! | copié | **remplacer** | identité |
| Portée des paquets `@gotfive/*` | existante | copiée | **remplacer** | identité |
| Logo, favicon | originaux | copiés | **remplacer** | identité |
| Personnages des tuiles | originaux | copiés | **remplacer** | identité |
| Tous les textes fr / es | originaux | copiés | **réécrire** | identité |
| Vocabulaire de jeu (CLASSER, COMPARER, annonce) | original | copié | **réécrire** | identité |
| Clés de stockage local | `gotfive:*` | copiées | **remplacer** | identité |
| `GameOverReason = 'got-five'` | existant | copié | **remplacer** | identité transmise sur le réseau |
| `data-testid` portant la marque | existants | copiés | **remplacer** | identité |
| README, `.env.example`, lanceur | originaux | copiés | **réécrire** | identité |
| `scripts/share.mjs` (tunnel) | existant | copié | **adapter** | outil générique, textes à refaire |
| Historique Git | existant | **non copié** | — | le nouveau dépôt part d'un historique vierge |
| Dépôt GitHub, Render, Cloudflare | existants | **non copiés** | — | le nouveau projet a les siens |

## Code générique conservé

Environ **80 % du code** est repris tel quel ou presque : tout `server/src`,
tout `shared/src/game`, tout `shared/src/validation`, et la majorité de
`client/src/components/ui`. C'est le savoir-faire dont le nouveau projet
hérite légitimement — il provient du travail de l'auteur sur son projet
personnel, pas d'un tiers.

## Contenu examiné au cas par cas

| Contenu | Verdict |
| --- | --- |
| Correspondance numéro → couleur → valeur | **structure générique**, réécrite avec un vocabulaire propre. Un cycle de 5 couleurs et 3 valeurs sur 60 éléments est une construction arithmétique, pas une expression protégeable. |
| Six encoches de classement | mécanique de jeu, conservée |
| Réponse OUI / NON sur l'égalité de valeur | mécanique de jeu, conservée |
| Tentative unique et élimination | mécanique de jeu, conservée |
| Textes de règles | **entièrement réécrits**, aucun emprunt |
| Noms des couleurs affichés | **remplacés** par les noms de constellations |
| Illustrations, gabarits, planches | aucun n'avait été repris : tout était déjà dessiné dans le projet |

Les **mécaniques** d'un jeu ne sont pas protégées par le droit d'auteur ; son
**expression** l'est. Ce projet conserve les premières et remplace
intégralement la seconde. Cette transformation technique ne constitue pas une
analyse juridique.

## Références supprimées

Recherche globale exigée avant publication, portant sur : ancien nom, ancienne
portée de paquets, anciennes clés de stockage, ancien favicon, anciens
`data-testid`, anciennes URL. Résultat consigné dans
`docs/COPY_VALIDATION.md`.
