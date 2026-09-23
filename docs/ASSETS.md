# Inventaire des assets

Chaque ressource publiée avec NOCTALIS, son origine et sa licence. Une
ressource dont l'origine serait incertaine ne serait pas publiée.

## Images et illustrations

| Asset | Type | Origine | Licence | Emplacement |
| --- | --- | --- | --- | --- |
| Marque NOCTALIS | SVG inline | dessiné pour ce projet | AGPL-3.0-or-later | `client/src/components/ui/BrandMark.tsx` |
| Favicon | SVG | dessiné pour ce projet | AGPL-3.0-or-later | `client/public/favicon.svg` |
| Figures stellaires (5 variantes) | SVG inline | dessinées pour ce projet | AGPL-3.0-or-later | `client/src/components/game/StarGlyph.tsx` |
| Étoiles, voûtes, textures | CSS pur (dégradés, ombres) | écrites pour ce projet | AGPL-3.0-or-later | `client/src/styles/` |
| Roue du tirage au sort | SVG + CSS | écrite pour ce projet | AGPL-3.0-or-later | `client/src/features/game/StartRoulette.tsx` |
| Grain du fond, rayons | CSS (`radial-gradient`, `conic-gradient`) | écrits pour ce projet | AGPL-3.0-or-later | `client/src/styles/base.css`, `screens.css` |

**Aucune image bitmap.** Pas de PNG, pas de JPEG, pas de capture : tout le
visuel est vectoriel ou calculé par le navigateur.

## Polices

| Police | Origine | Licence | Fourniture |
| --- | --- | --- | --- |
| Fredoka Variable | `@fontsource-variable/fredoka` (npm) | SIL Open Font License 1.1 | empaquetée au build, servie depuis le même domaine |
| Nunito Variable | `@fontsource-variable/nunito` (npm) | SIL Open Font License 1.1 | idem |

La SIL OFL autorise l'usage, la modification et la redistribution, y compris
dans un projet sous AGPL. Les polices sont **auto-hébergées** : aucune requête
vers un service tiers, donc aucune fuite d'adresse IP des joueurs.

## Sons

Aucun fichier audio. Tous les sons sont **synthétisés à la volée** par la Web
Audio API (`client/src/lib/audio.ts`) : oscillateurs et enveloppes décrits en
quelques lignes. Rien à télécharger, rien à créditer, et le jeu reste
parfaitement jouable sans audio.

## Emoji

Quelques emoji apparaissent dans l'interface (☀️ 🌙 🌗 ♥ 📋). Ils sont rendus
par la police système du lecteur : aucun fichier n'est distribué avec le
projet.

## Ressources externes

**Aucune.** Ni CDN, ni image distante, ni police en ligne, ni script tiers, ni
outil de mesure d'audience. Le jeu ne charge que ce que son propre serveur
lui envoie.

## Vérifier

```bash
# Aucun fichier binaire dans les sources :
find client/src client/public shared/src server/src -type f \
  ! -name '*.ts' ! -name '*.tsx' ! -name '*.css' ! -name '*.svg'

# Aucune ressource distante référencée :
grep -rn "https\?://" client/src --include='*.ts' --include='*.tsx' --include='*.css' \
  | grep -v "github.com" | grep -v "w3.org"
```

La seconde commande ne doit remonter que les liens GitHub (code source,
licence, Sponsors) et l'espace de noms SVG du W3C.
