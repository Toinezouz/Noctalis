# Politique de sécurité

## Signaler une vulnérabilité

**N'ouvrez pas d'issue publique pour une faille de sécurité.** Une issue est
visible de tous, y compris de qui voudrait exploiter le problème avant qu'il
ne soit corrigé.

Deux canaux privés :

1. **GitHub Security Advisories** — onglet *Security* du dépôt, puis
   *Report a vulnerability*. C'est le canal préféré : il crée un espace de
   discussion privé et permet de publier un avis une fois le correctif
   déployé.
2. **Courriel** — **a.clav63@gmail.com**, avec « NOCTALIS sécurité » en objet.

## Ce qui aide

- une description du problème et de son impact ;
- les étapes pour le reproduire ;
- la version ou le commit concerné ;
- si possible, une proposition de correctif.

## Engagement

| | |
| --- | --- |
| Accusé de réception | sous 72 heures |
| Première évaluation | sous 7 jours |
| Correctif | dès que possible, selon la gravité |

Le projet est maintenu bénévolement : ces délais sont un engagement de bonne
foi, pas un contrat de service.

Vous serez crédité dans l'avis de sécurité, sauf si vous préférez rester
anonyme. Le projet n'offre aucune récompense financière.

## Périmètre

Le cœur de NOCTALIS est une **propriété de confidentialité** : un joueur ne
doit jamais pouvoir obtenir ses propres numéros d'étoiles, par aucun moyen.

Nous traitons donc comme des vulnérabilités, en priorité :

- toute fuite des étoiles secrètes d'un joueur vers ce joueur — dans le DOM,
  le stockage local, une trame WebSocket, une réponse HTTP ou les journaux ;
- toute possibilité de jouer à la place d'un autre, ou hors de son tour ;
- toute réponse à un indice qui ne serait pas recalculée par le serveur ;
- toute prise de contrôle d'une observation par un tiers ;
- tout déni de service atteignable par un client ordinaire.

Hors périmètre : les problèmes qui exigent un accès physique à la machine
d'un joueur, et les partages volontaires d'informations entre joueurs.

## Versions suivies

Seule la branche `main` et le déploiement en cours sont suivis.
