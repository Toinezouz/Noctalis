# Déploiement

NOCTALIS se déploie en **un seul service**. Le serveur Express sert à la fois
le client compilé, l'API et Socket.IO : même origine, aucun réglage CORS à
faire, aucun second service à payer ou à surveiller.

```
git push  →  GitHub Actions  →  Render
              types, style,       build, start,
              contrat, tests,     sonde /health
              build, E2E
```

## Ce que le dépôt fournit déjà

| Élément | Où | État |
| --- | --- | --- |
| Description du service | [`render.yaml`](../render.yaml) | prêt |
| Écoute sur `0.0.0.0` et `process.env.PORT` | `server/src/index.ts` | prêt |
| Sonde de santé `GET /health` | `server/src/createServer.ts` | prêt |
| Arrêt propre sur `SIGTERM` | `server/src/index.ts` | prêt |
| Client servi par le serveur | `createServer.ts` (`express.static` + repli SPA) | prêt |
| Vérifications avant déploiement | `.github/workflows/ci.yml` | prêt |

Aucun secret n'est nécessaire : le projet n'en utilise aucun.

## Mettre le service en ligne

1. Sur [render.com](https://render.com), connectez votre compte GitHub et
   autorisez l'accès au dépôt.
2. **New → Blueprint**, puis choisissez `Toinezouz/Noctalis`.
3. Render lit `render.yaml` et propose un Web Service nommé `noctalis` :
   - construction : `npm ci && npm run build`
   - démarrage : `npm start`
   - sonde : `/health`
   - déploiement automatique **seulement si les vérifications passent**
     (`autoDeployTrigger: checksPass`)
4. Validez. La première construction prend quelques minutes.

## Vérifier que tout fonctionne

```bash
# 1. Le service répond
curl https://<votre-service>.onrender.com/health
# attendu : {"status":"ok","rooms":0,"uptime":...,"env":"production"}

# 2. Le client est servi
curl -s https://<votre-service>.onrender.com/ | grep -o '<title>.*</title>'
# attendu : <title>NOCTALIS - Devine ta constellation avant lui</title>
```

Puis, dans un navigateur :

1. ouvrez l'adresse publique ;
2. créez une observation — un code à 5 caractères s'affiche ;
3. ouvrez une **seconde fenêtre** (ou un autre appareil), rejoignez avec le
   code ;
4. jouez deux ou trois tours : révélation, SITUER, JAUGER ;
5. ouvrez la carte du ciel, barrez quelques numéros ;
6. rechargez une des deux pages : la partie doit reprendre où elle en était ;
7. faites une annonce pour atteindre la fin de partie ;
8. vérifiez les liens du pied de page : code source, licence, À propos,
   soutien.

Si le point 3 fonctionne, Socket.IO passe correctement — c'est le seul point
qui pourrait poser problème derrière un hébergeur.

## Le plan gratuit de Render

Un service gratuit **s'endort après 15 minutes sans trafic**. Le réveil prend
30 à 60 secondes, et **les observations en cours sont perdues** : les salons
vivent en mémoire.

Ce n'est pas gênant pour une partie entre amis — on ouvre le lien, on attend
le réveil, on joue. Ça le devient si vous voulez un service toujours prêt :
il faut alors un plan payant, ou accepter le réveil.

## Limite assumée : la mémoire

`RoomManager` garde les observations en mémoire. Conséquences :

- un redémarrage, un déploiement ou une mise en veille perd les parties ;
- le service doit rester en **une seule instance** — avec deux machines, un
  joueur pourrait arriver sur celle qui ne connaît pas son salon.

C'est un choix, pas un oubli : une base de données serait un poids inutile
pour des parties de quelques dizaines de minutes. Si le besoin apparaît,
l'interface `RoomManager` est le seul point à remplacer.

## Héberger ailleurs

Le projet n'a besoin que de Node 20, d'un port et d'un processus persistant.
Toute plateforme capable de faire tourner `npm ci && npm run build` puis
`npm start` convient — à condition de **supporter les WebSockets** et de ne
pas exécuter le service en mode sans état.

Pour une partie ponctuelle entre amis, sans rien héberger :

```bash
npm run share
```

ouvre un tunnel éphémère vers votre machine et affiche un lien à partager.
