/**
 * Textes francais de l'interface. Ce fichier est la reference : toute autre
 * langue doit fournir exactement les memes cles (verifie a la compilation et
 * par un test unitaire).
 *
 * Les valeurs peuvent contenir des variables entre accolades : {name}, {tile}.
 */
export const fr = {
  // --- Generique -----------------------------------------------------------
  'app.title': 'NOCTALIS — Devine ta constellation avant lui',
  'common.cancel': 'Annuler',
  'common.back': 'Retour',
  'common.close': 'Fermer',
  'common.understood': "J'ai compris",
  'common.you': '(toi)',
  'common.online': 'en ligne',
  'common.offline': 'déconnecté',
  'common.loading': 'Un instant…',
  'common.point': 'éclat',
  'common.points': 'éclats',

  // --- Constellations ------------------------------------------------------------
  'color.green': 'Lyre',
  'color.pink': 'Aurore',
  'color.blue': 'Cygne',
  'color.red': 'Braise',
  'color.orange': 'Phénix',

  // --- Encoches de SITUER -------------------------------------------------
  'slot.0': 'Avant la 1re',
  'slot.1': 'Entre la 1re et la 2e',
  'slot.2': 'Entre la 2e et la 3e',
  'slot.3': 'Entre la 3e et la 4e',
  'slot.4': 'Entre la 4e et la 5e',
  'slot.5': 'Après la 5e',

  // --- Accueil -------------------------------------------------------------
  'home.tagline': 'Devine ta constellation avant lui',
  'home.pitch':
    'Deux observateurs, un même ciel. Tu vois parfaitement la constellation de ton rival, jamais la tienne. Reconstitue tes 5 étoiles avant lui.',
  'home.create': 'Créer une partie',
  'home.join': 'Rejoindre une partie',
  'home.help': 'Comment jouer ?',
  'home.connected': 'Connecté au serveur',
  'home.connecting': 'Connexion au serveur…',
  'home.createTitle': 'Créer une partie',
  'home.joinTitle': 'Rejoindre une partie',
  'home.nameLabel': 'Ton pseudo',
  'home.nameHint': '{min} à {max} caractères',
  'home.codeLabel': 'Code de la partie',
  'home.codeHint': '{length} caractères, sans espace',
  'home.submitCreate': 'Créer la partie',
  'home.submitJoin': 'Rejoindre',
  'home.language': 'Langue',

  // --- Lobby ---------------------------------------------------------------
  'lobby.share': 'Partage ce code avec ton adversaire',
  'lobby.copy': 'Copier le code',
  'lobby.copied': 'Copié !',
  'lobby.waitingPlayer': 'En attente…',
  'lobby.waitingHint': 'Le second joueur doit entrer le code',
  'lobby.host': 'Hôte',
  'lobby.guest': 'Invité',
  'lobby.start': 'Lancer la partie',
  'lobby.waitingSecond': 'En attente du deuxième joueur…',
  'lobby.waitingHost': "L'hôte va lancer la partie…",
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
  'header.language': 'Changer de langue',

  // --- Indicateur de tour --------------------------------------------------
  // --- Soutien, pied de page et A propos -----------------------------------
  'support.link': 'Soutenir le projet',
  'support.text':
    'Ce projet est libre et open source. Si vous l’appréciez, vous pouvez soutenir son développement sur GitHub. C’est entièrement facultatif : tout le jeu reste accessible, sans compte, sans publicité et sans fonctionnalité payante.',
  'footer.code': 'Code source',
  'footer.about': 'À propos',
  'about.title': 'À propos de NOCTALIS',
  'about.description':
    'NOCTALIS est un jeu de déduction à deux joueurs : chacun voit la constellation de l’autre, jamais la sienne. Le serveur est la seule source de vérité — vos étoiles ne quittent jamais la machine qui les garde.',
  'about.openSource':
    'Projet indépendant, développé en public. Le code, les règles et les assets sont originaux et librement consultables.',
  'about.codeLabel': 'Code',
  'about.licenseLabel': 'Licence',

  // --- Theme ---------------------------------------------------------------
  'theme.label': 'Thème',
  'theme.auto': 'Automatique',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'theme.current': 'Thème : {mode}. Cliquer pour changer.',

  // --- Roulette d'ouverture -----------------------------------------------
  'roulette.question': 'Qui commence ?',
  'roulette.drawing': 'La roue tourne… le sort en décide.',
  'roulette.landed': '{name} commence !',
  'roulette.youStart': 'Le sort te désigne : à toi d’ouvrir la partie.',
  'roulette.opponentStarts': '{name} ouvre la partie. À toi juste après.',
  'roulette.skip': 'Passer l’animation',
  'roulette.go': 'C’est parti !',

  'turn.counter': 'Tour {turn}',
  'turn.gameOver': 'Partie terminée',
  'turn.gameOverDetail': 'Regarde le résultat ci-dessous.',
  'turn.mustAnswer': 'À toi de répondre !',
  'turn.mustClassify': '{name} attend que tu situes l’étoile.',
  'turn.mustCompare': '{name} attend ta réponse OUI / NON.',
  'turn.hintAsked': 'Indice demandé',
  'turn.of': 'Tour de {name}',
  'turn.waitingClassify': '{name} doit situer l’étoile…',
  'turn.waitingCompare': '{name} doit répondre OUI ou NON…',
  'turn.eliminated': 'Tu es éliminé',
  'turn.eliminatedDetail': '{name} termine la partie. Tu peux encore répondre à ses indices.',
  'turn.yours': 'À TON TOUR !',
  'turn.yoursReveal': 'Étape 1 sur 2 : révèle une étoile en choisissant une constellation.',
  'turn.yoursHint': 'Étape 2 sur 2 : choisis une étoile publique, puis SITUER ou JAUGER.',
  'turn.othersReveal': '{name} choisit une constellation…',
  'turn.othersHint': "{name} prépare sa demande d'indice…",

  // --- Panneau d'action ----------------------------------------------------
  'action.gameOver': 'La partie est terminée.',
  'action.eliminated':
    'Ton annonce est consommée. Tu continues à répondre aux indices de {name}.',
  'action.waitingReveal': '{name} choisit une constellation à révéler…',
  'action.waitingHint': "{name} choisit une étoile et un type d'indice…",
  'action.waitingAnswer': '{name} doit répondre…',
  'action.step1': 'Étape 1 / 2',
  'action.step1Title': 'Révèle une étoile',
  'action.step1Hint': 'Choisis une constellation : le serveur tire au hasard une étoile encore disponible.',
  'action.step2': 'Étape 2 / 2',
  'action.step2Title': 'Demande un indice',
  'action.step2Hint':
    "Clique sur une étoile révélée (n'importe laquelle), puis choisis SITUER ou JAUGER.",
  'action.step2Selected': 'Étoile {tile} sélectionnée : choisis SITUER ou JAUGER.',
  'action.revealColor': 'Révéler une étoile {color} ({count} restantes)',
  'action.waitingClassifyShort': 'doit situer l’étoile',
  'action.waitingAnswerShort': 'doit répondre',

  // --- Relevé commun -------------------------------------------------------
  'pool.title': 'Relevé commun',
  'pool.reserve': 'Ciel : {count} étoiles encore invisibles',
  'pool.reserveColor': '{count} étoile(s) de la {color} encore au ciel',
  'pool.selectable': 'choisir cette étoile pour un indice',

  // --- Supports et étoiles --------------------------------------------------
  'tile.label': 'Étoile {number}, {color}, {points}',
  'tile.tilted': 'réponse NON',
  'tile.back': 'Mon étoile {position} sur 5, {color}, numéro inconnu',
  'tile.positionOf': 'position {position} de {name}',
  'tile.comparePosition': 'jauger avec cette position',
  'rack.small': 'petit',
  'rack.big': 'grand',
  'rack.slotEmpty': '{slot} étoile de {name} : aucune étoile située',
  'rack.slotFilled': '{slot} étoile de {name} : {count} étoile(s) : {tiles}',
  'rack.compareGroup': 'Mesures sur la position {position} de {name}',
  'rack.compareYes': 'jaugée à la position {position} : OUI, mêmes éclats',
  'rack.compareNo': 'jaugée à la position {position} : NON, éclats différents',
  'rack.opponentZone': 'Zone de {name}',
  'rack.myZone': 'Ma zone',
  'rack.waitingOpponent': "En attente d'un adversaire…",

  // --- Panneau lateral -----------------------------------------------------
  'side.players': 'Joueurs',
  'side.history': 'Historique',
  'side.openSheet': 'Ouvrir ma carte du ciel',
  'side.gameInfo': 'Informations de partie',
  'status.eliminated': 'Éliminé',
  'status.announceUsed': 'Annonce faite',
  'status.publicZone': 'Relevé commun',

  // --- Historique ----------------------------------------------------------
  'log.title': 'Historique de la partie',
  'log.empty': "Rien pour l'instant.",
  'log.game-started': 'La partie commence ! {count} étoiles sont posées au centre.',
  'log.starting-player': 'Tirage au sort : {name} commence.',
  'log.turn-start': 'Tour {turn} : au tour de {name}.',
  'log.tile-revealed': '{name} a révélé l’étoile {tile}.',
  'log.classify-requested': '{name} demande à {opponent} de SITUER l’étoile {tile}.',
  'log.compare-requested':
    '{name} demande à {opponent} de JAUGER l’étoile {tile} avec sa position {position}.',
  'log.classify-answered': '{name} a situé l’étoile {tile} : {slot} étoile de {owner}.',
  'log.compare-answered.yes':
    '{name} répond OUI : l’étoile {tile} a le même nombre d’éclats que la position {position}.',
  'log.compare-answered.no':
    "{name} répond NON : l’étoile {tile} n'a pas le même nombre d’éclats que la position {position}.",
  'log.guess-correct': '{name} annonce {numbers} : exact !',
  'log.guess-wrong': '{name} annonce {numbers} : raté.',
  'log.player-eliminated': '{name} est éliminé : {opponent} est le seul joueur encore en lice.',
  'log.player-left': '{name} a quitté la partie.',
  'log.player-connected': '{name} est reconnecté.',
  'log.player-disconnected': '{name} est déconnecté.',
  'log.game-over-winner': 'CONSTELLATION ! {name} remporte l’observation !',
  'log.game-over-draw': 'Les deux joueurs ont échoué : personne ne gagne.',
  'log.game-over-reserve-empty': 'Le ciel est épuisé : l’observation se termine sans vainqueur.',

  // --- Dialogue d'indice ---------------------------------------------------
  'hint.title': 'Demander un indice sur l’étoile {tile}',
  'hint.classify': 'SITUER',
  'hint.classifyText':
    '{name} range cette étoile parmi tes 5 étoiles secrètes : avant la 1re, entre deux étoiles, ou après la 5e.',
  'hint.compare': 'JAUGER',
  'hint.compareText':
    '{name} dit OUI ou NON : cette étoile a-t-elle le même nombre d’éclats que l’une de tes positions ?',
  'hint.choosePosition':
    'Choisis la position à jauger. Seul le nombre d’éclats compte, jamais la constellation.',
  'hint.confirmCompare': 'Demander la mesure',

  // --- Dialogue SITUER (reponse) -----------------------------------------
  'classify.title': '{name} te demande de SITUER l’étoile {tile}',
  'classify.instruction':
    'Place l’étoile {tile} au bon endroit parmi les étoiles de {name}, que tu es seul à voir.',
  'classify.choose': 'Choisis une position',
  'classify.confirm': 'Valider : {slot}',
  'classify.pickerLabel': 'Choisis la position de l’étoile',
  'classify.slotAria': '{slot} : placer l’étoile {tile} ici',

  // --- Dialogue JAUGER (reponse) ----------------------------------------
  'compare.title': '{name} te demande de JAUGER',
  'compare.publicTile': 'Étoile publique',
  'compare.positionOf': 'Position {position} de {name}',
  'compare.question': 'Mêmes éclats ? La réponse exacte est {answer}. Confirme pour la transmettre.',
  'compare.answer': 'Répondre {answer}',
  'compare.yes': 'OUI',
  'compare.no': 'NON',

  // --- Dialogue CONSTELLATION ! --------------------------------------------------
  'guess.title': 'CONSTELLATION ! — ton annonce finale',
  'guess.warning':
    'Une seule tentative par joueur. Si les 5 numéros sont exacts, tu gagnes immédiatement. Une seule erreur et tu es éliminé.',
  'guess.inputAria': 'Numéro {index} sur 5',
  'guess.submit': 'Je tente !',
  'guess.confirm': 'Confirmes-tu ces {count} numéros entre 1 et {max} ?',
  'guess.errorCount': 'Il faut exactement {count} numéros.',
  'guess.errorRange': 'Chaque numéro doit être un entier entre 1 et {max}.',
  'guess.errorOrder': 'Les numéros doivent être en ordre croissant, sans doublon.',
  'guess.errorColors': 'Ta proposition doit contenir une étoile de chaque constellation.',

  // --- Fiche de deduction --------------------------------------------------
  'sheet.title': 'Ma carte du ciel',
  'sheet.subtitle': 'Privée : ni le serveur ni ton adversaire ne la voient.',
  'sheet.close': 'Retour au jeu',
  'sheet.gridLabel': 'Grille des {count} numéros',
  'sheet.rowLabel': 'Ligne {color}',
  'sheet.cellLabel': 'Numéro {number}, {color}, {points}, {state}',
  'sheet.cellCrossed': 'éliminé',
  'sheet.cellAvailable': 'non éliminé',
  'sheet.cellRevealed': 'déjà révélée au centre',
  'sheet.guessAria': 'Hypothèse numéro {index} sur {count}',
  'sheet.legend':
    'Clique sur un numéro pour le barrer, reclique pour le restaurer. Les étoiles déjà révélées au centre portent un petit repère :',
  'sheet.legendEnd': 'à toi de décider quoi éliminer.',
  'sheet.crossedCount': '{count} / {total} barrés',
  'sheet.useForAnnounce': 'Reporter dans mon annonce',
  'sheet.reset': 'Effacer mes déductions',
  'sheet.resetTitle': 'Effacer toute la fiche ?',
  'sheet.resetText':
    "Tous les numéros barrés seront restaurés et les 5 hypothèses seront effacées. La partie en cours n'est pas modifiée.",
  'sheet.resetConfirm': 'Tout effacer',
  'sheet.smaller': 'plus petit',
  'sheet.bigger': 'plus grand',

  // --- Fin de partie -------------------------------------------------------
  'over.winnerYou': 'Victoire de {name} — bravo, c’est toi !',
  'over.winnerOther': '{name} a gagné !',
  'over.draw': 'Personne ne remporte cette partie.',
  'over.guessLine': '{name} a tenté {numbers} :',
  'over.guessOk': 'exact',
  'over.guessKo': 'raté',
  'over.replay': 'Rejouer',
  'over.waitingReplay': 'En attente de ton adversaire…',
  'over.home': "Retour à l'accueil",
  'over.opponentWantsReplay': 'Ton adversaire veut rejouer !',
  'over.opponentLeft': 'Ton adversaire a quitté la partie.',

  // --- Notifications -------------------------------------------------------
  'toast.revealed': '{name} a révélé l’étoile {tile}.',
  'toast.yourAnswer': 'À toi de répondre !',
  'toast.wrongClassify':
    'Attention : ton positionnement était faux, le serveur a placé l’étoile au bon endroit.',
  'toast.compareResult': 'Réponse : {answer} (étoile {tile} / position {position}).',
  'toast.yourTurn': 'À ton tour !',
  'toast.turnOf': 'Tour de {name}.',
  'toast.guessFailedMine': 'Raté ! Ton annonce est consommée.',
  'toast.guessFailedOther': '{name} s’est trompé et est éliminé.',
  'toast.joined': '{name} a rejoint la partie !',
  'toast.reconnected': '{name} est de retour.',
  'toast.opponentLeft': '{name} est déconnecté. La partie t’attend.',
  'banner.offline': 'Connexion perdue — tentative de reconnexion automatique…',
  'banner.opponentOffline':
    '{name} est déconnecté. La partie est conservée, il peut revenir à tout moment.',

  // --- Erreurs renvoyees par le serveur ------------------------------------
  'error.PLAYER_NOT_FOUND': "Tu n'es plus dans cette partie.",
  'error.NOT_YOUR_TURN': "Ce n'est pas ton tour.",
  'error.WRONG_PHASE': "Cette action n'est pas possible maintenant.",
  'error.INVALID_COLOR': 'Constellation invalide.',
  'error.COLOR_EXHAUSTED': "Cette constellation n’a plus aucune étoile au ciel.",
  'error.TILE_NOT_PUBLIC': "Cette étoile n'est pas dans la relevé commun.",
  'error.INVALID_POSITION': 'Position invalide.',
  'error.INVALID_SLOT': 'Emplacement invalide.',
  'error.NOT_RESPONDER': "Ce n'est pas à toi de répondre.",
  'error.GUESS_ALREADY_USED': 'Tu as déjà fait ton annonce.',
  'error.INVALID_GUESS': 'Proposition invalide.',
  'error.PLAYER_ELIMINATED': 'Tu as déjà fait ton annonce.',
  'error.GAME_OVER': 'La partie est terminée.',
  'error.NOT_ENOUGH_PLAYERS': 'Il faut être deux pour jouer.',
  'error.ROOM_NOT_FOUND': "Cette partie n'existe pas (ou a expiré).",
  'error.ROOM_FULL': 'Cette partie est déjà complète.',
  'error.ROOM_FINISHED': 'Cette partie est terminée.',
  'error.NAME_TAKEN': 'Ce pseudo est déjà pris dans cette partie.',
  'error.BAD_TOKEN': 'Session expirée : rejoins la partie avec le code.',
  'error.SERVER_BUSY': 'Le serveur est saturé, réessaie dans un instant.',
  'error.INVALID_NAME': 'Pseudo invalide.',
  'error.INVALID_CODE': 'Code de partie invalide.',
  'error.network': 'Le serveur ne répond pas. Réessaie.',

  // --- Regles --------------------------------------------------------------
  'howto.title': 'Comment jouer à NOCTALIS',
  'howto.1.title': '1. Tes 5 étoiles sont cachées… pour toi',
  'howto.1.text':
    'Tu vois leur constellation et leur position, jamais leur numéro. Ton adversaire, lui, les voit entièrement.',
  'howto.2.title': '2. Une étoile de chaque constellation, de la plus faible à la plus vive',
  'howto.2.text':
    'Le catalogue va de 1 à 60. Le numéro détermine à la fois la constellation et l’éclat (1, 2 ou 3, affiché sous le numéro).',
  'howto.3.title': '3. Au début, 5 étoiles sont révélées au centre',
  'howto.3.text': 'Une de chaque constellation. Elles restent visibles jusqu’à la fin de la partie.',
  'howto.4.title': '4. À ton tour : révèle une étoile',
  'howto.4.text':
    'Tu choisis une constellation, le serveur tire au hasard une étoile encore disponible : elle rejoint la relevé commun.',
  'howto.5.title': '5. Puis demande un indice',
  'howto.5.text': 'Choisis n’importe quelle étoile publique, puis :',
  'howto.5.note':
    'L’étoile choisie quitte alors le relevé : elle rejoint ta voûte et ne peut plus servir à un autre indice.',
  'howto.5.classify':
    'SITUER : ton adversaire range cette étoile parmi tes 5 étoiles secrètes (6 positions possibles : avant la 1re, entre deux étoiles, ou après la 5e).',
  'howto.5.compare':
    'JAUGER : tu désignes une de tes positions, il répond OUI ou NON selon que l’étoile a le même nombre d’éclats que ton étoile secrète. La constellation n’entre pas en compte. Une réponse NON incline l’étoile.',
  'howto.6.title': '6. Note tes déductions',
  'howto.6.text':
    'Ta fiche 1–60 est privée : barre les numéros impossibles d’un clic, inscris tes 5 hypothèses en haut. Rien n’est barré automatiquement : le raisonnement t’appartient.',
  'howto.7.title': '7. Annonce CONSTELLATION !',
  'howto.7.text':
    'Dès que tu penses connaître tes 5 étoiles, annonce-les — à ton tour ou pendant celui de ton rival. Une seule annonce par observateur : juste, tu gagnes ; fausse, tu es éliminé.',

  // --- Tutoriel ------------------------------------------------------------
  'onboarding.title': 'En 20 secondes',
  'onboarding.skip': 'Passer',
  'onboarding.next': 'Suivant',
  'onboarding.play': 'Jouer !',
  'onboarding.step': 'Étape {current} sur {total}',
  'onboarding.1.title': 'Tes étoiles, en bas',
  'onboarding.1.text':
    'Tu vois leur constellation et leur position, jamais leur numéro : c’est tout l’enjeu.',
  'onboarding.2.title': 'Les étoiles adverses, en haut',
  'onboarding.2.text':
    'Tu vois leurs numéros : ton adversaire, lui, est aveugle sur les siennes.',
  'onboarding.3.title': 'La relevé commun, au centre',
  'onboarding.3.text':
    'Les étoiles révélées attendent là ; celle qui sert à un indice rejoint ensuite une voûte.',
  'onboarding.4.title': 'SITUER',
  'onboarding.4.text':
    'Ton adversaire range une étoile publique parmi tes 5 étoiles : 6 positions possibles.',
  'onboarding.5.title': 'JAUGER',
  'onboarding.5.text':
    'OUI ou NON : l’étoile a-t-elle le même nombre d’éclats qu’une de tes positions ?',
  'onboarding.6.title': 'Ta carte du ciel',
  'onboarding.6.text':
    'Barre les numéros impossibles, note tes hypothèses. Elle est totalement privée.',
  'onboarding.7.title': 'CONSTELLATION !',
  'onboarding.7.text': 'Une seule annonce : donne tes 5 étoiles quand tu es sûr de toi.',
} as const;

/** Toutes les cles disponibles, deduites du francais. */
export type MessageKey = keyof typeof fr;

/** Dictionnaire complet d'une langue. */
export type Messages = Record<MessageKey, string>;
