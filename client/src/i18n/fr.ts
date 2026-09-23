import type { Messages } from './en.js';

/**
 * French interface texts. Same keys as the English reference.
 *
 * Inclusive writing without median dots: epicene words (« astronome »,
 * « adversaire », « personne »), turns of phrase that name nobody's gender
 * (« tout le monde », « la personne suivante »), never « joueur » alone.
 */
export const fr: Messages = {
  // --- Général -------------------------------------------------------------
  'app.title': 'NOCTALIS — Devine ta constellation avant les autres',
  'common.cancel': 'Annuler',
  'common.back': 'Retour',
  'common.close': 'Fermer',
  'common.understood': 'C’est parti',
  'common.you': '(toi)',
  'common.online': 'en ligne',
  'common.offline': 'hors ligne',
  'common.loading': 'Un instant…',
  'common.point': '{count} éclat',
  'common.points': '{count} éclats',

  // --- Constellations ------------------------------------------------------
  'color.green': 'Lyre',
  'color.pink': 'Aurore',
  'color.blue': 'Cygne',
  'color.red': 'Braise',
  'color.orange': 'Phénix',

  // --- Les six places de SITUER --------------------------------------------
  'slot.0': 'Avant la 1re',
  'slot.1': 'Entre la 1re et la 2e',
  'slot.2': 'Entre la 2e et la 3e',
  'slot.3': 'Entre la 3e et la 4e',
  'slot.4': 'Entre la 4e et la 5e',
  'slot.5': 'Après la 5e',

  // --- Accueil -------------------------------------------------------------
  'home.tagline': 'Devine ta constellation avant les autres',
  'home.pitch':
    'De deux à quatre astronomes sous le même ciel. Tu vois les étoiles de tout le monde… sauf les tiennes. Pose les bonnes questions, recoupe les indices, et trouve tes cinq étoiles avant tout le monde.',
  'home.players': '2 à 4 personnes · en ligne · sans inscription',
  'home.create': 'Lancer une partie',
  'home.join': 'Rejoindre une partie',
  'home.help': 'Comment jouer ?',
  'home.connected': 'Tout est prêt',
  'home.connecting': 'Connexion…',
  'home.createTitle': 'Lancer une partie',
  'home.joinTitle': 'Rejoindre une partie',
  'home.invited': 'Tu as reçu une invitation ! Choisis un pseudo et prends place.',
  'home.nameLabel': 'Ton pseudo',
  'home.nameHint': 'De {min} à {max} caractères',
  'home.codeLabel': 'Code de la partie',
  'home.codeHint': '{length} caractères, sans espace',
  'home.submitCreate': 'Ouvrir la table',
  'home.submitJoin': 'Prendre place',
  'home.language': 'Langue',

  // --- Salon ---------------------------------------------------------------
  'lobby.share': 'Envoie ce lien : jusqu’à {max} personnes peuvent te rejoindre',
  'lobby.copy': 'Copier le code',
  'lobby.copied': 'Copié !',
  'lobby.inviteLabel': 'Lien d’invitation',
  'lobby.copyLink': 'Copier le lien',
  'lobby.shareLink': 'Partager le lien',
  'lobby.linkCopied': 'Lien copié !',
  'lobby.copyFailed': 'La copie n’a pas marché : sélectionne le lien et copie-le à la main.',
  'lobby.orCode': 'ou donne-leur le code',
  'lobby.shareText': 'Viens jouer à NOCTALIS avec moi ! Code : {code}',
  'lobby.freeSeat': 'Place libre',
  'lobby.neededSeat': 'Il faut quelqu’un ici pour commencer',
  'lobby.optionalSeat': 'Place en plus, si l’envie vous prend',
  'lobby.host': 'lance la partie',
  'lobby.start': 'Commencer à {count}',
  'lobby.waitingSecond': 'On attend que quelqu’un nous rejoigne…',
  'lobby.waitingHost': '{name} lancera la partie quand tout le monde sera là.',
  'lobby.roomForMore': 'Encore {count} place(s) libre(s) — ou commencez tout de suite.',
  'lobby.leave': 'Quitter',

  // --- Bandeau de jeu ------------------------------------------------------
  'header.roomCode': 'Code de la partie :',
  'header.announce': 'CONSTELLATION !',
  'header.sheet': 'Carte',
  'header.soundOn': 'Couper le son',
  'header.soundOff': 'Activer le son',
  'header.help': 'Comment jouer',
  'header.quit': 'Quitter la partie',
  'header.online': 'En ligne',
  'header.reconnecting': 'Reconnexion…',
  'header.language': 'Langue',

  // --- Soutien, pied de page et À propos -----------------------------------
  'support.link': 'Soutenir le projet',
  'support.text':
    'NOCTALIS est libre et gratuit. Si le jeu te plaît, tu peux soutenir son développement sur GitHub. C’est entièrement facultatif : tout le jeu reste ouvert à tout le monde, sans compte, sans publicité et sans rien à acheter.',
  'footer.code': 'Code source',
  'footer.about': 'À propos',
  'about.title': 'À propos de NOCTALIS',
  'about.description':
    'NOCTALIS est un jeu de déduction en ligne, de deux à quatre personnes. Chacune voit les étoiles des autres, jamais les siennes — et la première à nommer ses cinq étoiles l’emporte.',
  'about.openSource':
    'C’est un projet indépendant et ouvert : les règles, les dessins et le code sont originaux, et tout le monde peut les lire, les améliorer ou s’en inspirer.',
  'about.codeLabel': 'Code',
  'about.licenseLabel': 'Licence',

  // --- Thème ---------------------------------------------------------------
  'theme.label': 'Thème',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'theme.current': 'Thème : {mode}. Cliquer pour changer.',

  // --- Tirage au sort ------------------------------------------------------
  'roulette.question': 'Qui commence ?',
  'roulette.drawing': 'Le ciel tourne…',
  'roulette.landed': '{name} commence !',
  'roulette.youStart': 'Les étoiles ont parlé : à toi d’ouvrir la partie.',
  'roulette.othersStart': '{name} ouvre la partie. Ton tour viendra vite.',
  'roulette.skip': 'Passer',
  'roulette.go': 'C’est parti !',

  // --- Bandeau de tour -----------------------------------------------------
  'turn.counter': 'Tour {turn}',
  'turn.gameOver': 'Partie terminée',
  'turn.gameOverDetail': 'Le résultat t’attend juste en dessous.',
  'turn.mustAnswer': 'À toi de répondre !',
  'turn.mustClassify': '{name} attend que tu situes une étoile.',
  'turn.mustCompare': '{name} attend ton OUI ou ton NON.',
  'turn.hintAsked': 'Question posée',
  'turn.of': 'Au tour de {name}',
  'turn.waitingClassify': '{name} situe l’étoile…',
  'turn.waitingCompare': '{name} répond par OUI ou par NON…',
  'turn.eliminated': 'Hors course',
  'turn.eliminatedDetail': 'Ton annonce était fausse. Tu réponds toujours aux questions des autres : la partie a besoin de toi.',
  'turn.yours': 'À TOI DE JOUER !',
  'turn.yoursReveal': 'Étape 1 sur 2 : révèle une étoile en choisissant une constellation.',
  'turn.yoursHint': 'Étape 2 sur 2 : choisis une étoile du ciel commun, puis SITUER ou JAUGER.',
  'turn.othersReveal': '{name} choisit une constellation…',
  'turn.othersHint': '{name} prépare sa question…',

  // --- Panneau d'action ----------------------------------------------------
  'action.gameOver': 'La partie est terminée.',
  'action.eliminated': 'Ton annonce était fausse. Garde un œil sur la table : on te posera encore des questions.',
  'action.waitingReveal': '{name} choisit une constellation à révéler…',
  'action.waitingHint': '{name} choisit une étoile et une question…',
  'action.waitingAnswer': 'On attend la réponse de {name}…',
  'action.waitingClassify': '{name} situe l’étoile…',
  'action.step1': 'Étape 1 / 2',
  'action.step1Title': 'Révèle une étoile',
  'action.step1Hint': 'Choisis une constellation : l’une de ses étoiles cachées apparaît, au hasard.',
  'action.step2': 'Étape 2 / 2',
  'action.step2Title': 'Pose une question',
  'action.step2Hint': 'Touche n’importe quelle étoile du ciel commun, puis choisis SITUER ou JAUGER.',
  'action.step2Selected': 'Étoile {tile} choisie : il reste à choisir SITUER ou JAUGER.',
  'action.revealColor': 'Révéler une étoile de la constellation {color} ({count} encore cachées)',
  'action.leftCount': 'encore {count}',

  // --- Ciel commun ---------------------------------------------------------
  'pool.title': 'Le ciel commun',
  'pool.reserve': '{count} étoiles encore cachées',
  'pool.reserveColor': '{count} étoile(s) encore cachée(s) dans la constellation {color}',
  'pool.selectable': 'poser une question sur cette étoile',

  // --- Rangées et étoiles --------------------------------------------------
  'tile.label': 'Étoile {number}, {color}, {points}',
  'tile.tilted': 'réponse NON',
  'tile.back': 'Mon étoile {position} sur 5, {color}, numéro inconnu',
  'tile.positionOf': 'position {position} de {name}',
  'tile.comparePosition': 'jauger avec cette étoile',
  'rack.small': 'plus petit',
  'rack.big': 'plus grand',
  'rack.slotEmpty': '{slot} étoile de {name} : rien de situé ici',
  'rack.slotFilled': '{slot} étoile de {name} : {count} étoile(s) : {tiles}',
  'rack.compareGroup': 'Étoiles jaugées avec la position {position} de {name}',
  'rack.compareYes': 'jaugée avec la position {position} : OUI, autant d’éclats',
  'rack.compareNo': 'jaugée avec la position {position} : NON, pas autant d’éclats',
  'rack.othersZone': 'Les étoiles des autres',
  'rack.myZone': 'Mes étoiles',
  'rack.playing': 'joue',
  'rack.answering': 'répond',

  // --- Panneau latéral -----------------------------------------------------
  'side.players': 'Autour de la table',
  'side.history': 'Le fil de la partie',
  'side.openSheet': 'Ouvrir ma carte du ciel',
  'side.gameInfo': 'Informations sur la partie',
  'status.eliminated': 'Hors course',
  'status.announceUsed': 'Annonce faite',
  'status.publicZone': 'Le ciel commun',
  'status.left': 'Partie quittée',

  // --- Historique ----------------------------------------------------------
  'log.title': 'Historique de la partie',
  'log.empty': 'Rien pour l’instant.',
  'log.game-started': 'La partie commence ! {count} étoiles brillent dans le ciel commun.',
  'log.starting-player': 'Le tirage au sort désigne {name} pour commencer.',
  'log.turn-start': 'Tour {turn} : au tour de {name}.',
  'log.tile-revealed': '{name} révèle l’étoile {tile}.',
  'log.classify-requested': '{name} demande à {responder} de SITUER l’étoile {tile}.',
  'log.compare-requested': '{name} demande à {responder} de JAUGER l’étoile {tile} avec sa position {position}.',
  'log.classify-answered': '{name} situe l’étoile {tile} parmi celles de {owner} : {slot}.',
  'log.compare-answered.yes': '{name} répond OUI : l’étoile {tile} a autant d’éclats que la position {position}.',
  'log.compare-answered.no': '{name} répond NON : l’étoile {tile} n’a pas autant d’éclats que la position {position}.',
  'log.responder-changed': '{previous} n’est plus en ligne : {name} répond à sa place.',
  'log.guess-correct': '{name} annonce {numbers} : dans le mille !',
  'log.guess-wrong': '{name} annonce {numbers} : ce n’est pas ça.',
  'log.player-eliminated': '{name} sort de la course. Encore {remaining} en lice.',
  'log.player-left': '{name} a quitté la partie.',
  'log.player-connected': '{name} est de retour.',
  'log.player-disconnected': '{name} n’est plus en ligne.',
  'log.game-over-winner': 'CONSTELLATION ! Victoire de {name} !',
  'log.game-over-draw': 'Toutes les annonces ont manqué leur cible : personne ne gagne cette fois.',
  'log.game-over-reserve-empty': 'Plus aucune étoile cachée dans le ciel : la partie s’achève sans victoire.',

  // --- Question sur une étoile ---------------------------------------------
  'hint.title': 'Une question sur l’étoile {tile}',
  'hint.classify': 'SITUER',
  'hint.classifyText':
    '{name} range cette étoile à sa place parmi tes cinq : avant la première, entre deux d’entre elles, ou après la dernière.',
  'hint.compare': 'JAUGER',
  'hint.compareText':
    '{name} te répond OUI ou NON : cette étoile a-t-elle autant d’éclats que l’une des tiennes ?',
  'hint.choosePosition': 'Laquelle de tes étoiles ? Ici, seuls les éclats comptent, jamais la constellation.',
  'hint.confirmCompare': 'Poser la question',

  // --- SITUER (réponse) ----------------------------------------------------
  'classify.title': '{name} te demande de SITUER l’étoile {tile}',
  'classify.instruction': 'Tu vois les étoiles de {name}. Où l’étoile {tile} se range-t-elle parmi elles ?',
  'classify.choose': 'Choisis une place',
  'classify.confirm': 'Valider : {slot}',
  'classify.pickerLabel': 'La place de l’étoile',
  'classify.slotAria': '{slot} : ranger l’étoile {tile} ici',

  // --- JAUGER (réponse) ----------------------------------------------------
  'compare.title': '{name} te demande de JAUGER',
  'compare.publicTile': 'Étoile du ciel',
  'compare.positionOf': 'Étoile {position} de {name}',
  'compare.question': 'Autant d’éclats ? La réponse est {answer}. Valide pour la transmettre.',
  'compare.answer': 'Répondre {answer}',
  'compare.yes': 'OUI',
  'compare.no': 'NON',

  // --- CONSTELLATION ! -----------------------------------------------------
  'guess.title': 'CONSTELLATION ! — ton annonce',
  'guess.warning':
    'Une seule annonce par partie. Donne tes cinq étoiles : si elles sont toutes justes, tu gagnes sur-le-champ. Si une seule est fausse, tu sors de la course — mais tu continues à répondre aux autres.',
  'guess.inputAria': 'Numéro {index} sur 5',
  'guess.submit': 'Faire mon annonce',
  'guess.confirm': 'Tu confirmes ces {count} numéros ? Il n’y aura pas de retour en arrière.',
  'guess.errorCount': 'Il faut exactement {count} numéros.',
  'guess.errorRange': 'Chaque numéro va de 1 à {max}.',
  'guess.errorOrder': 'Range-les du plus petit au plus grand, sans répéter un numéro.',
  'guess.errorColors': 'Tes cinq étoiles viennent chacune d’une constellation différente.',

  // --- Carte du ciel -------------------------------------------------------
  'sheet.title': 'Ma carte du ciel',
  'sheet.subtitle': 'Rien qu’à toi : personne d’autre ne la voit.',
  'sheet.close': 'Retour au jeu',
  'sheet.gridLabel': 'Grille des {count} numéros',
  'sheet.rowLabel': 'Ligne {color}',
  'sheet.cellLabel': 'Numéro {number}, {color}, {points}, {state}',
  'sheet.cellCrossed': 'barré',
  'sheet.cellAvailable': 'encore possible',
  'sheet.cellRevealed': 'déjà révélée dans le ciel',
  'sheet.cellHeld': 'dans la rangée de quelqu’un d’autre',
  'sheet.guessAria': 'Hypothèse {index} sur {count}',
  'sheet.legend': 'Touche un numéro pour le barrer, touche-le encore pour le faire revenir.',
  'sheet.legendRevealed': 'déjà révélée dans le ciel commun',
  'sheet.legendHeld': 'visible dans la rangée de quelqu’un d’autre : elle ne peut pas être à toi',
  'sheet.legendEnd': 'Rien n’est barré à ta place : le raisonnement t’appartient.',
  'sheet.crossedCount': '{count} / {total} barrés',
  'sheet.useForAnnounce': 'Reprendre pour mon annonce',
  'sheet.reset': 'Effacer ma carte',
  'sheet.resetTitle': 'Effacer toute la carte ?',
  'sheet.resetText': 'Les numéros barrés reviennent et tes cinq hypothèses sont effacées. La partie, elle, ne change pas.',
  'sheet.resetConfirm': 'Tout effacer',
  'sheet.smaller': 'plus petit',
  'sheet.bigger': 'plus grand',

  // --- Fin de partie -------------------------------------------------------
  'over.winnerYou': 'Bravo {name}, tu as trouvé ta constellation !',
  'over.winnerOther': 'Victoire de {name}, qui a trouvé sa constellation !',
  'over.draw': 'Personne ne l’emporte cette fois. Le ciel a gardé ses secrets.',
  'over.guessLineOk': 'Annonce de {name} : {numbers}, dans le mille.',
  'over.guessLineKo': 'Annonce de {name} : {numbers}, ce n’était pas ça.',
  'over.replay': 'Rejouer',
  'over.waitingReplay': 'On attend les autres…',
  'over.replayCount': 'Envie d’une nouvelle manche : {ready} sur {total}',
  'over.home': 'Retour à l’accueil',
  'over.everyoneLeft': 'Tout le monde a quitté la table.',

  // --- Notifications -------------------------------------------------------
  'toast.revealed': '{name} révèle l’étoile {tile}.',
  'toast.yourAnswer': '{name} a une question pour toi !',
  'toast.wrongClassify': 'L’étoile a été remise à sa vraie place.',
  'toast.compareResult': 'Réponse : {answer} (étoile {tile} et position {position}).',
  'toast.yourTurn': 'À toi de jouer !',
  'toast.turnOf': 'Au tour de {name}.',
  'toast.guessFailedMine': 'Raté ! Tu sors de la course, mais tu réponds toujours aux autres.',
  'toast.guessFailedOther': 'L’annonce de {name} était fausse : hors course.',
  'toast.joined': '{name} a rejoint la table !',
  'toast.reconnected': '{name} est de retour.',
  'toast.playerOffline': '{name} n’est plus en ligne. La partie l’attend.',
  'banner.offline': 'Connexion perdue. On tente de se reconnecter…',
  'banner.playerOffline': '{name} n’est plus en ligne pour le moment. La partie est gardée : tout reprend à son retour.',
  'banner.playersOffline': 'Hors ligne pour le moment : {name}. La partie est gardée jusqu’à leur retour.',

  // --- Erreurs -------------------------------------------------------------
  'error.PLAYER_NOT_FOUND': 'Ta place à cette table n’a pas été retrouvée.',
  'error.NOT_YOUR_TURN': 'Ce n’est pas encore ton tour.',
  'error.WRONG_PHASE': 'Ce n’est pas possible pour le moment.',
  'error.INVALID_COLOR': 'Cette constellation n’existe pas.',
  'error.COLOR_EXHAUSTED': 'Il ne reste plus aucune étoile cachée dans cette constellation.',
  'error.TILE_NOT_PUBLIC': 'Cette étoile n’est plus dans le ciel commun.',
  'error.INVALID_POSITION': 'Cette position n’existe pas.',
  'error.INVALID_SLOT': 'Cette place n’existe pas.',
  'error.NOT_RESPONDER': 'Cette question s’adresse à quelqu’un d’autre.',
  'error.GUESS_ALREADY_USED': 'Tu as déjà fait ton annonce.',
  'error.INVALID_GUESS': 'Cette annonce n’est pas valable.',
  'error.PLAYER_ELIMINATED': 'Tu as déjà fait ton annonce.',
  'error.GAME_OVER': 'La partie est terminée.',
  'error.NOT_ENOUGH_PLAYERS': 'Il faut au moins deux personnes pour jouer.',
  'error.ROOM_NOT_FOUND': 'Aucune partie ne correspond à ce code. Elle a peut-être expiré.',
  'error.ROOM_FULL': 'Cette table est complète : quatre personnes y jouent déjà.',
  'error.ROOM_STARTED': 'Cette partie a déjà commencé. Demande le code de la suivante !',
  'error.ROOM_FINISHED': 'Cette partie est terminée.',
  'error.NAME_TAKEN': 'Quelqu’un porte déjà ce pseudo à cette table.',
  'error.BAD_TOKEN': 'Ta place n’a pas été retrouvée : rejoins la partie avec son code.',
  'error.SERVER_BUSY': 'Il y a beaucoup de monde en ce moment. Réessaie dans un instant.',
  'error.INVALID_NAME': 'Ce pseudo n’est pas valable.',
  'error.INVALID_CODE': 'Ce code n’est pas valable.',
  'error.network': 'Pas de réponse. Vérifie ta connexion et réessaie.',

  // --- Règles --------------------------------------------------------------
  'howto.title': 'Comment jouer à NOCTALIS',
  'howto.intro':
    'Chaque personne reçoit cinq étoiles secrètes. Toute la malice est là : tu vois les étoiles des autres, mais jamais les tiennes. À toi de les deviner grâce aux indices que la table te donne, et de les nommer avant tout le monde.',
  'howto.stars.title': 'Soixante étoiles, cinq constellations',
  'howto.stars.text':
    'Les étoiles portent un numéro de 1 à 60. Ce numéro décide de tout : de sa constellation (elles se suivent, 1 pour la Lyre, 2 pour l’Aurore, et ainsi de suite) et de ses éclats — un, deux ou trois, dessinés sous le numéro.',
  'howto.setup.title': 'Tes cinq étoiles',
  'howto.setup.text':
    'Tu as une étoile de chaque constellation, rangées du plus petit numéro au plus grand. Tu vois leur constellation et leur place dans la rangée, jamais leur numéro. Le reste de la table, en revanche, les lit sans aucun mal.',
  'howto.turn.title': 'Ton tour, en deux gestes',
  'howto.turn.text':
    'D’abord, révèle une étoile : choisis une constellation, et l’une de ses étoiles cachées apparaît dans le ciel commun. Ensuite, choisis n’importe quelle étoile du ciel commun et pose une question à son sujet. La personne assise après toi te répond : elle voit tes étoiles.',
  'howto.place.title': 'SITUER',
  'howto.place.text':
    'L’étoile choisie vient se ranger à sa place parmi tes cinq : avant la première, entre deux d’entre elles, ou après la dernière. Tu sais désormais où elle se glisserait dans ta rangée.',
  'howto.gauge.title': 'JAUGER',
  'howto.gauge.text':
    'Désigne l’une de tes étoiles : la réponse est OUI si l’étoile choisie a le même nombre d’éclats, NON sinon. Ici, seuls les éclats comptent, jamais la constellation.',
  'howto.used.text':
    'Une étoile qui a servi à une question quitte le ciel commun et reste près de ta rangée, en souvenir de ce que tu as appris.',
  'howto.chart.title': 'Ta carte du ciel',
  'howto.chart.text':
    'C’est ton carnet secret : les soixante numéros, une ligne par constellation. Barre ce qui ne peut pas être à toi, note tes hypothèses en haut. Les étoiles déjà révélées, et celles que tu vois chez les autres, portent un petit repère — mais rien n’est jamais barré à ta place.',
  'howto.call.title': 'CONSTELLATION !',
  'howto.call.text':
    'Dès que tu penses connaître tes cinq étoiles, annonce-les — à ton tour ou pendant celui de quelqu’un d’autre. Tu n’as qu’une annonce. Cinq sur cinq : tu gagnes aussitôt. Une seule erreur : tu sors de la course, mais tu continues à répondre aux questions des autres.',
  'howto.table.title': 'À trois ou à quatre',
  'howto.table.text':
    'Les tours passent de main en main autour de la table, et c’est la personne suivante qui répond à tes questions. Si elle s’absente, la suivante prend le relais. Qui quitte la partie sort simplement du tour de table.',
  'howto.end.title': 'Quand la partie s’arrête-t-elle ?',
  'howto.end.text':
    'Dès qu’une annonce est juste. Si toutes les annonces tombent à côté, ou si le ciel n’a plus d’étoile cachée, personne ne gagne — et une nouvelle manche est toujours possible.',

  // --- Tutoriel ------------------------------------------------------------
  'onboarding.title': 'Bienvenue à la table',
  'onboarding.skip': 'Passer',
  'onboarding.next': 'Suivant',
  'onboarding.play': 'On joue !',
  'onboarding.step': 'Étape {current} sur {total}',
  'onboarding.1.title': 'Voici tes étoiles',
  'onboarding.1.text':
    'En bas de l’écran. Tu vois leur constellation et leur ordre, mais pas leur numéro : c’est tout le mystère.',
  'onboarding.2.title': 'Les étoiles des autres',
  'onboarding.2.text':
    'En haut, face visible. Tu lis leurs numéros — et tout le monde lit les tiens. Personne ne connaît les siens.',
  'onboarding.3.title': 'Le ciel commun',
  'onboarding.3.text':
    'Au centre. À ton tour, révèle une étoile de plus ici, puis pose une question sur l’une d’elles.',
  'onboarding.4.title': 'SITUER',
  'onboarding.4.text':
    'Où cette étoile se rangerait-elle parmi tes cinq ? La personne suivante te montre la place exacte.',
  'onboarding.5.title': 'JAUGER',
  'onboarding.5.text': 'Cette étoile a-t-elle autant d’éclats que l’une des tiennes ? OUI ou NON.',
  'onboarding.6.title': 'Ta carte du ciel',
  'onboarding.6.text': 'Barre des numéros, note tes hypothèses. Elle n’appartient qu’à toi.',
  'onboarding.7.title': 'CONSTELLATION !',
  'onboarding.7.text': 'Une seule annonce par partie : nomme tes cinq étoiles quand tu en as la certitude. Belle observation !',
};
