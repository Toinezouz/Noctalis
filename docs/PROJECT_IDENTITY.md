# Identité du projet — NOCTALIS

## Nom

**NOCTALIS**

Mot inventé, de *nox / noctis* (la nuit). Une seule forme en français, en
espagnol et en anglais : pas de traduction à maintenir, pas de déclinaison.
Aucun lien, phonétique ou sémantique, avec le jeu dont ce projet réutilise
l'architecture technique.

## Slogan

- **fr** — « Devine ta constellation avant lui. »
- **es** — « Adivina tu constelación antes que él. »

## Pitch

Deux astronomes observent le même ciel. Chacun voit parfaitement la
constellation de l'autre, jamais la sienne. En posant des questions sur les
étoiles du relevé commun, il faut reconstituer ses cinq étoiles avant son
rival — et annoncer **CONSTELLATION !**

## Univers

Un relevé astronomique nocturne. Étoiles gravées, lignes de constellation,
carte du ciel annotée à la main. L'identité visuelle s'appuie sur le thème
sombre comme état naturel du jeu, le thème clair jouant le rôle d'une planche
d'atlas imprimée.

## Vocabulaire

Ce tableau est la référence unique. Aucun autre terme ne doit apparaître dans
l'interface ou la documentation.

| Concept | Terme retenu (fr) | Terme retenu (es) |
| --- | --- | --- |
| Élément numéroté 1–60 | **étoile** | estrella |
| Famille de couleur (5) | **constellation** | constelación |
| Valeur 1 à 3 | **éclat** | brillo |
| Zone commune | **relevé** | registro |
| Réserve | **ciel** | cielo |
| Support du joueur | **voûte** | bóveda |
| Indice « classer » | **SITUER** | SITUAR |
| Indice « comparer » | **JAUGER** | MEDIR |
| Annonce finale | **CONSTELLATION !** | ¡CONSTELACIÓN! |
| Fiche de déduction | **carte du ciel** | carta celeste |
| Partie | **observation** | observación |
| Code de partie | **code d'observation** | código de observación |

Les cinq constellations, par ordre interne (`green`, `pink`, `blue`, `red`,
`orange` — identifiants techniques inchangés) :

| Identifiant | Nom (fr) | Nom (es) |
| --- | --- | --- |
| `green` | Lyre | Lira |
| `pink` | Aurore | Aurora |
| `blue` | Cygne | Cisne |
| `red` | Braise | Brasa |
| `orange` | Phénix | Fénix |

Les identifiants techniques restent en anglais et inchangés : ils désignent
des teintes, pas la marque, et les figer évite une migration inutile du
moteur, des tests et du CSS.

## Logo

Un disque de nuit portant cinq étoiles reliées par les traits d'une
constellation — dessiné en SVG, sans dépendance, décliné en favicon et en
marque de l'en-tête. Aucune police propriétaire, aucun tracé importé.

## Palette

Reprend la structure de jetons existante, avec des teintes propres.

| Rôle | Clair | Sombre |
| --- | --- | --- |
| Fond de page | `#f3efe6` parchemin | `#0b1022` nuit profonde |
| Surface | `#fbf8f2` | `#141b33` |
| Encre | `#1a1f3c` | `#eef1ff` |
| Accent | `#3f57c9` bleu nuit | `#8aa2ff` |
| Accent secondaire | `#c2456f` aurore | `#ff7ba6` |
| Signal | `#e0a82e` or stellaire | `#ffc94a` |

Les cinq couleurs d'étoiles restent identiques dans les deux thèmes, comme
dans l'architecture d'origine : la carte du ciel doit correspondre au relevé.

## Personnages

Remplacés par des **figures stellaires** : cinq glyphes gravés (étoile à
quatre branches, à six branches, étoile double, amas, nébuleuse), choisis de
façon déterministe à partir du numéro. Dessinés en SVG dans le projet.

## Positionnement

NOCTALIS est un **projet open source indépendant**. Il n'est affilié à aucun
éditeur, ne reprend aucun contenu protégé, et ne se présente comme la version
officielle d'aucun jeu existant. Il réutilise l'architecture technique d'un
projet personnel antérieur du même auteur, avec son accord, ce que la présente
documentation expose ouvertement.
