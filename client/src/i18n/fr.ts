/**
 * Textes francais de l'interface. Ce fichier est la reference : toute autre
 * langue doit fournir exactement les memes cles (verifie a la compilation et
 * par un test unitaire).
 *
 * Les valeurs peuvent contenir des variables entre accolades : {name}, {tile}.
 */
export const fr = {
  // --- Generique -----------------------------------------------------------
  'app.title': 'GOT FIVE! — Le jeu de logique et de déduction',
  'common.cancel': 'Annuler',
  'common.back': 'Retour',
  'common.close': 'Fermer',
  'common.understood': "J'ai compris",
  'common.you': '(toi)',
  'common.online': 'en ligne',
  'common.offline': 'déconnecté',
  'common.loading': 'Un instant…',
  'common.point': 'point',
  'common.points': 'points',

  // --- Couleurs ------------------------------------------------------------
  'color.green': 'vert',
  'color.pink': 'rose',
  'color.blue': 'bleu',
  'color.red': 'rouge',
  'color.orange': 'orange',

  // --- Encoches de CLASSER -------------------------------------------------
  'slot.0': 'Avant la 1re',
  'slot.1': 'Entre la 1re et la 2e',
  'slot.2': 'Entre la 2e et la 3e',
  'slot.3': 'Entre la 3e et la 4e',
  'slot.4': 'Entre la 4e et la 5e',
  'slot.5': 'Après la 5e',

  // --- Accueil -------------------------------------------------------------
  'home.tagline': 'Le jeu de logique et de déduction',
  'home.pitch':
    'Version 2 joueurs en ligne : tes 5 tuiles sont cachées pour toi, mais pas pour ton adversaire. Déduis-les avant lui !',
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
  'header.gotFive': 'GOT FIVE!',
  'header.sheet': 'Fiche',
  'header.soundOn': 'Couper le son',
  'header.soundOff': 'Activer le son',
  'header.help': 'Comment jouer',
  'header.quit': 'Quitter la partie',
  'header.online': 'En ligne',
  'header.reconnecting': 'Reconnexion…',
  'header.language': 'Changer de langue',

  // --- Indicateur de tour --------------------------------------------------
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
  'turn.mustClassify': '{name} attend que tu classes la tuile.',
  'turn.mustCompare': '{name} attend ta réponse OUI / NON.',
  'turn.hintAsked': 'Indice demandé',
  'turn.of': 'Tour de {name}',
  'turn.waitingClassify': '{name} doit classer la tuile…',
  'turn.waitingCompare': '{name} doit répondre OUI ou NON…',
  'turn.eliminated': 'Tu es éliminé',
  'turn.eliminatedDetail': '{name} termine la partie. Tu peux encore répondre à ses indices.',
  'turn.yours': 'À TON TOUR !',
  'turn.yoursReveal': 'Étape 1 sur 2 : révèle une tuile en choisissant une couleur.',
  'turn.yoursHint': 'Étape 2 sur 2 : choisis une tuile publique, puis CLASSER ou COMPARER.',
  'turn.othersReveal': '{name} choisit une couleur…',
  'turn.othersHint': "{name} prépare sa demande d'indice…",

  // --- Panneau d'action ----------------------------------------------------
  'action.gameOver': 'La partie est terminée.',
  'action.eliminated':
    'Ta tentative GOT FIVE! est consommée. Tu continues à répondre aux indices de {name}.',
  'action.waitingReveal': '{name} choisit une couleur à révéler…',
  'action.waitingHint': "{name} choisit une tuile et un type d'indice…",
  'action.waitingAnswer': '{name} doit répondre…',
  'action.step1': 'Étape 1 / 2',
  'action.step1Title': 'Révèle une tuile',
  'action.step1Hint': 'Choisis une couleur : le serveur tire au hasard une tuile encore disponible.',
  'action.step2': 'Étape 2 / 2',
  'action.step2Title': 'Demande un indice',
  'action.step2Hint':
    "Clique sur une tuile révélée (n'importe laquelle), puis choisis CLASSER ou COMPARER.",
  'action.step2Selected': 'Tuile {tile} sélectionnée : choisis CLASSER ou COMPARER.',
  'action.revealColor': 'Révéler une tuile {color} ({count} restantes)',
  'action.waitingClassifyShort': 'doit classer la tuile',
  'action.waitingAnswerShort': 'doit répondre',

  // --- Zone publique -------------------------------------------------------
  'pool.title': 'Tuiles révélées',
  'pool.reserve': 'Réserve : {count} tuiles restantes',
  'pool.reserveColor': '{count} tuile(s) {color} en réserve',
  'pool.selectable': 'choisir cette tuile pour un indice',

  // --- Supports et tuiles --------------------------------------------------
  'tile.label': 'Tuile {number}, {color}, {points}',
  'tile.tilted': 'réponse NON',
  'tile.back': 'Ma tuile {position} sur 5, {color}, numéro inconnu',
  'tile.positionOf': 'position {position} de {name}',
  'tile.comparePosition': 'comparer avec cette position',
  'rack.small': 'petit',
  'rack.big': 'grand',
  'rack.slotEmpty': '{slot} tuile de {name} : aucune tuile classée',
  'rack.slotFilled': '{slot} tuile de {name} : {count} tuile(s) : {tiles}',
  'rack.compareGroup': 'Comparaisons sur la position {position} de {name}',
  'rack.compareYes': 'comparée à la position {position} : OUI, mêmes points',
  'rack.compareNo': 'comparée à la position {position} : NON, points différents',
  'rack.opponentZone': 'Zone de {name}',
  'rack.myZone': 'Ma zone',
  'rack.waitingOpponent': "En attente d'un adversaire…",

  // --- Panneau lateral -----------------------------------------------------
  'side.players': 'Joueurs',
  'side.history': 'Historique',
  'side.openSheet': 'Ouvrir ma fiche de déduction',
  'side.gameInfo': 'Informations de partie',
  'status.eliminated': 'Éliminé',
  'status.gotFiveUsed': 'GOT FIVE! joué',
  'status.publicZone': 'Zone publique',

  // --- Historique ----------------------------------------------------------
  'log.title': 'Historique de la partie',
  'log.empty': "Rien pour l'instant.",
  'log.game-started': 'La partie commence ! {count} tuiles sont posées au centre.',
  'log.starting-player': 'Tirage au sort : {name} commence.',
  'log.turn-start': 'Tour {turn} : au tour de {name}.',
  'log.tile-revealed': '{name} a révélé la tuile {tile}.',
  'log.classify-requested': '{name} demande à {opponent} de CLASSER la tuile {tile}.',
  'log.compare-requested':
    '{name} demande à {opponent} de COMPARER la tuile {tile} avec sa position {position}.',
  'log.classify-answered': '{name} a classé la tuile {tile} : {slot} tuile de {owner}.',
  'log.compare-answered.yes':
    '{name} répond OUI : la tuile {tile} a le même nombre de points que la position {position}.',
  'log.compare-answered.no':
    "{name} répond NON : la tuile {tile} n'a pas le même nombre de points que la position {position}.",
  'log.guess-correct': '{name} tente GOT FIVE! avec {numbers} : exact !',
  'log.guess-wrong': '{name} tente GOT FIVE! avec {numbers} : raté.',
  'log.player-eliminated': '{name} est éliminé : {opponent} est le seul joueur encore en lice.',
  'log.player-left': '{name} a quitté la partie.',
  'log.player-connected': '{name} est reconnecté.',
  'log.player-disconnected': '{name} est déconnecté.',
  'log.game-over-winner': 'GOT FIVE! {name} remporte la partie !',
  'log.game-over-draw': 'Les deux joueurs ont échoué : personne ne gagne.',
  'log.game-over-reserve-empty': 'La réserve est vide : la partie se termine sans vainqueur.',

  // --- Dialogue d'indice ---------------------------------------------------
  'hint.title': 'Demander un indice sur la tuile {tile}',
  'hint.classify': 'CLASSER',
  'hint.classifyText':
    '{name} range cette tuile parmi tes 5 tuiles secrètes : avant la 1re, entre deux tuiles, ou après la 5e.',
  'hint.compare': 'COMPARER',
  'hint.compareText':
    '{name} dit OUI ou NON : cette tuile a-t-elle le même nombre de points que l’une de tes positions ?',
  'hint.choosePosition':
    'Choisis la position à comparer. Seul le nombre de points compte, jamais la couleur.',
  'hint.confirmCompare': 'Demander la comparaison',

  // --- Dialogue CLASSER (reponse) -----------------------------------------
  'classify.title': '{name} te demande de CLASSER la tuile {tile}',
  'classify.instruction':
    'Place la tuile {tile} au bon endroit parmi les tuiles de {name}, que tu es seul à voir.',
  'classify.choose': 'Choisis une position',
  'classify.confirm': 'Valider : {slot}',
  'classify.pickerLabel': 'Choisis la position de la tuile',
  'classify.slotAria': '{slot} : placer la tuile {tile} ici',

  // --- Dialogue COMPARER (reponse) ----------------------------------------
  'compare.title': '{name} te demande de COMPARER',
  'compare.publicTile': 'Tuile publique',
  'compare.positionOf': 'Position {position} de {name}',
  'compare.question': 'Mêmes points ? La réponse exacte est {answer}. Confirme pour la transmettre.',
  'compare.answer': 'Répondre {answer}',
  'compare.yes': 'OUI',
  'compare.no': 'NON',

  // --- Dialogue GOT FIVE! --------------------------------------------------
  'guess.title': 'GOT FIVE! — ta tentative finale',
  'guess.warning':
    'Une seule tentative par joueur. Si les 5 numéros sont exacts, tu gagnes immédiatement. Une seule erreur et tu es éliminé.',
  'guess.inputAria': 'Numéro {index} sur 5',
  'guess.submit': 'Je tente !',
  'guess.confirm': 'Confirmes-tu ces {count} numéros entre 1 et {max} ?',
  'guess.errorCount': 'Il faut exactement {count} numéros.',
  'guess.errorRange': 'Chaque numéro doit être un entier entre 1 et {max}.',
  'guess.errorOrder': 'Les numéros doivent être en ordre croissant, sans doublon.',
  'guess.errorColors': 'Ta proposition doit contenir une tuile de chaque couleur.',

  // --- Fiche de deduction --------------------------------------------------
  'sheet.title': 'Ma fiche de déduction',
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
    'Clique sur un numéro pour le barrer, reclique pour le restaurer. Les tuiles déjà révélées au centre portent un petit repère :',
  'sheet.legendEnd': 'à toi de décider quoi éliminer.',
  'sheet.crossedCount': '{count} / {total} barrés',
  'sheet.useForGotFive': 'Utiliser pour GOT FIVE!',
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
  'toast.revealed': '{name} a révélé la tuile {tile}.',
  'toast.yourAnswer': 'À toi de répondre !',
  'toast.wrongClassify':
    'Attention : ton classement était faux, le serveur a placé la tuile au bon endroit.',
  'toast.compareResult': 'Réponse : {answer} (tuile {tile} / position {position}).',
  'toast.yourTurn': 'À ton tour !',
  'toast.turnOf': 'Tour de {name}.',
  'toast.guessFailedMine': 'Raté ! Ta tentative GOT FIVE! est consommée.',
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
  'error.INVALID_COLOR': 'Couleur invalide.',
  'error.COLOR_EXHAUSTED': "Il ne reste plus aucune tuile de cette couleur dans la réserve.",
  'error.TILE_NOT_PUBLIC': "Cette tuile n'est pas dans la zone publique.",
  'error.INVALID_POSITION': 'Position invalide.',
  'error.INVALID_SLOT': 'Emplacement invalide.',
  'error.NOT_RESPONDER': "Ce n'est pas à toi de répondre.",
  'error.GUESS_ALREADY_USED': 'Tu as déjà utilisé ta tentative GOT FIVE!.',
  'error.INVALID_GUESS': 'Proposition invalide.',
  'error.PLAYER_ELIMINATED': 'Tu as déjà utilisé ta tentative GOT FIVE!.',
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
  'howto.title': 'Comment jouer à GOT FIVE!',
  'howto.1.title': '1. Tes 5 tuiles sont cachées… pour toi',
  'howto.1.text':
    'Tu vois leur couleur et leur position, jamais leur numéro. Ton adversaire, lui, les voit entièrement.',
  'howto.2.title': '2. Une tuile de chaque couleur, du plus petit au plus grand',
  'howto.2.text':
    'Les 60 tuiles vont de 1 à 60. Le numéro détermine la couleur et le nombre de points (1, 2 ou 3 points, affichés sous le numéro).',
  'howto.3.title': '3. Au début, 5 tuiles sont révélées au centre',
  'howto.3.text': 'Une de chaque couleur. Elles restent visibles jusqu’à la fin de la partie.',
  'howto.4.title': '4. À ton tour : révèle une tuile',
  'howto.4.text':
    'Tu choisis une couleur, le serveur tire au hasard une tuile encore disponible : elle rejoint la zone publique.',
  'howto.5.title': '5. Puis demande un indice',
  'howto.5.text': 'Choisis n’importe quelle tuile publique, puis :',
  'howto.5.note':
    'La tuile choisie quitte alors le centre : elle rejoint ton support et ne peut plus servir à un autre indice.',
  'howto.5.classify':
    'CLASSER : ton adversaire range cette tuile parmi tes 5 tuiles secrètes (6 positions possibles : avant la 1re, entre deux tuiles, ou après la 5e).',
  'howto.5.compare':
    'COMPARER : tu désignes une de tes positions, il répond OUI ou NON selon que la tuile a le même nombre de points que ta tuile secrète. La couleur n’entre pas en compte. Une réponse NON incline la tuile.',
  'howto.6.title': '6. Note tes déductions',
  'howto.6.text':
    'Ta fiche 1–60 est privée : barre les numéros impossibles d’un clic, inscris tes 5 hypothèses en haut. Rien n’est barré automatiquement : le raisonnement t’appartient.',
  'howto.7.title': '7. Annonce GOT FIVE!',
  'howto.7.text':
    'Dès que tu penses connaître tes 5 numéros, tente ta chance — à ton tour ou pendant celui de l’adversaire. Une seule tentative par joueur : juste, tu gagnes ; faux, tu es éliminé.',

  // --- Tutoriel ------------------------------------------------------------
  'onboarding.title': 'En 20 secondes',
  'onboarding.skip': 'Passer',
  'onboarding.next': 'Suivant',
  'onboarding.play': 'Jouer !',
  'onboarding.step': 'Étape {current} sur {total}',
  'onboarding.1.title': 'Tes tuiles, en bas',
  'onboarding.1.text':
    'Tu vois leur couleur et leur position, jamais leur numéro : c’est tout l’enjeu.',
  'onboarding.2.title': 'Les tuiles adverses, en haut',
  'onboarding.2.text':
    'Tu vois leurs numéros : ton adversaire, lui, est aveugle sur les siennes.',
  'onboarding.3.title': 'La zone publique, au centre',
  'onboarding.3.text':
    'Les tuiles révélées attendent là ; celle qui sert à un indice rejoint ensuite un support.',
  'onboarding.4.title': 'CLASSER',
  'onboarding.4.text':
    'Ton adversaire range une tuile publique parmi tes 5 tuiles : 6 positions possibles.',
  'onboarding.5.title': 'COMPARER',
  'onboarding.5.text':
    'OUI ou NON : la tuile a-t-elle le même nombre de points qu’une de tes positions ?',
  'onboarding.6.title': 'Ta fiche de déduction',
  'onboarding.6.text':
    'Barre les numéros impossibles, note tes hypothèses. Elle est totalement privée.',
  'onboarding.7.title': 'GOT FIVE!',
  'onboarding.7.text': 'Une seule tentative : annonce tes 5 numéros quand tu es sûr de toi.',
} as const;

/** Toutes les cles disponibles, deduites du francais. */
export type MessageKey = keyof typeof fr;

/** Dictionnaire complet d'une langue. */
export type Messages = Record<MessageKey, string>;
