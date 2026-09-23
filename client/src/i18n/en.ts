/**
 * English interface texts. This catalogue is the reference: every other
 * language must provide exactly the same keys (checked at compile time and by
 * a unit test).
 *
 * Values may contain variables in braces: {name}, {tile}.
 *
 * House style, for every language:
 * - talk to people, not to "players": everyone at the table, whoever they are;
 * - no technical words (server, data, client...): only the game;
 * - short sentences, a warm tone, no jargon.
 */
export const en = {
  // --- General ------------------------------------------------------------
  'app.title': 'NOCTALIS — Find your constellation before anyone else',
  'common.cancel': 'Cancel',
  'common.back': 'Back',
  'common.close': 'Close',
  'common.understood': 'Got it',
  'common.you': '(you)',
  'common.online': 'online',
  'common.offline': 'offline',
  'common.loading': 'One moment…',
  'common.point': '{count} spark',
  'common.points': '{count} sparks',

  // --- Constellations -----------------------------------------------------
  'color.green': 'Lyra',
  'color.pink': 'Aurora',
  'color.blue': 'Cygnus',
  'color.red': 'Ember',
  'color.orange': 'Phoenix',

  // --- The six PLACE gaps -------------------------------------------------
  'slot.0': 'Before the 1st',
  'slot.1': 'Between the 1st and 2nd',
  'slot.2': 'Between the 2nd and 3rd',
  'slot.3': 'Between the 3rd and 4th',
  'slot.4': 'Between the 4th and 5th',
  'slot.5': 'After the 5th',

  // --- Home ---------------------------------------------------------------
  'home.tagline': 'Find your constellation before anyone else',
  'home.pitch':
    'Two to four stargazers under the same sky. You can see everyone’s stars — except your own. Ask the right questions, piece the clues together, and find your five stars first.',
  'home.players': '2 to 4 people · online · no sign-up',
  'home.create': 'Start a game',
  'home.join': 'Join a game',
  'home.help': 'How to play',
  'home.connected': 'All set',
  'home.connecting': 'Connecting…',
  'home.createTitle': 'Start a game',
  'home.joinTitle': 'Join a game',
  'home.nameLabel': 'Your name',
  'home.nameHint': '{min} to {max} characters',
  'home.codeLabel': 'Game code',
  'home.codeHint': '{length} characters, no spaces',
  'home.submitCreate': 'Open the table',
  'home.submitJoin': 'Take a seat',
  'home.language': 'Language',

  // --- Lobby --------------------------------------------------------------
  'lobby.share': 'Share this code with up to {max} people',
  'lobby.copy': 'Copy the code',
  'lobby.copied': 'Copied!',
  'lobby.freeSeat': 'Free seat',
  'lobby.neededSeat': 'Needed to start',
  'lobby.optionalSeat': 'Open to one more',
  'lobby.host': 'starts the game',
  'lobby.start': 'Start with {count} people',
  'lobby.waitingSecond': 'Waiting for someone to join…',
  'lobby.waitingHost': '{name} will start the game as soon as everyone is here.',
  'lobby.roomForMore': 'There is room for {count} more — or start right away.',
  'lobby.leave': 'Leave',

  // --- Game header --------------------------------------------------------
  'header.roomCode': 'Game code:',
  'header.announce': 'CONSTELLATION!',
  'header.sheet': 'Chart',
  'header.soundOn': 'Mute',
  'header.soundOff': 'Turn sound on',
  'header.help': 'How to play',
  'header.quit': 'Leave the game',
  'header.online': 'Online',
  'header.reconnecting': 'Reconnecting…',
  'header.language': 'Language',

  // --- Support, footer and about -----------------------------------------
  'support.link': 'Support the project',
  'support.text':
    'NOCTALIS is free and open source. If you enjoy it, you can support its development on GitHub. It is entirely optional: the whole game stays open to everyone, with no account, no ads and nothing to buy.',
  'footer.code': 'Source code',
  'footer.about': 'About',
  'about.title': 'About NOCTALIS',
  'about.description':
    'NOCTALIS is an online deduction game for two to four people. Everyone can see everyone else’s stars, never their own — and the first to name their five stars wins.',
  'about.openSource':
    'It is an independent, open project: the rules, the drawings and the code are original, and anyone can read them, improve them or build on them.',
  'about.codeLabel': 'Code',
  'about.licenseLabel': 'Licence',

  // --- Theme --------------------------------------------------------------
  'theme.label': 'Theme',
  'theme.auto': 'Automatic',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.current': 'Theme: {mode}. Click to change.',

  // --- Opening draw -------------------------------------------------------
  'roulette.question': 'Who goes first?',
  'roulette.drawing': 'The sky is spinning…',
  'roulette.landed': '{name} goes first!',
  'roulette.youStart': 'The stars chose you: you open the game.',
  'roulette.othersStart': '{name} opens the game. Your turn will come.',
  'roulette.skip': 'Skip',
  'roulette.go': 'Let’s go!',

  // --- Turn banner --------------------------------------------------------
  'turn.counter': 'Turn {turn}',
  'turn.gameOver': 'Game over',
  'turn.gameOverDetail': 'Have a look at the result below.',
  'turn.mustAnswer': 'Your answer!',
  'turn.mustClassify': '{name} is waiting for you to place a star.',
  'turn.mustCompare': '{name} is waiting for your YES or NO.',
  'turn.hintAsked': 'Question asked',
  'turn.of': '{name}’s turn',
  'turn.waitingClassify': '{name} is placing the star…',
  'turn.waitingCompare': '{name} is answering YES or NO…',
  'turn.eliminated': 'Out of the race',
  'turn.eliminatedDetail': 'Your call missed. You still answer the others’ questions — the game needs you.',
  'turn.yours': 'YOUR TURN!',
  'turn.yoursReveal': 'Step 1 of 2: reveal a star by choosing a constellation.',
  'turn.yoursHint': 'Step 2 of 2: pick a star in the open sky, then PLACE or GAUGE.',
  'turn.othersReveal': '{name} is choosing a constellation…',
  'turn.othersHint': '{name} is preparing a question…',

  // --- Action panel -------------------------------------------------------
  'action.gameOver': 'The game is over.',
  'action.eliminated': 'Your call missed. Keep an eye on the table: you will still be asked to answer.',
  'action.waitingReveal': '{name} is choosing a constellation to reveal…',
  'action.waitingHint': '{name} is choosing a star and a question…',
  'action.waitingAnswer': 'Waiting for {name}’s answer…',
  'action.waitingClassify': '{name} is placing the star…',
  'action.step1': 'Step 1 / 2',
  'action.step1Title': 'Reveal a star',
  'action.step1Hint': 'Choose a constellation: one of its hidden stars will appear, at random.',
  'action.step2': 'Step 2 / 2',
  'action.step2Title': 'Ask a question',
  'action.step2Hint': 'Tap any star in the open sky, then choose PLACE or GAUGE.',
  'action.step2Selected': 'Star {tile} selected: now choose PLACE or GAUGE.',
  'action.revealColor': 'Reveal a {color} star ({count} still hidden)',
  'action.leftCount': '{count} left',

  // --- Open sky -----------------------------------------------------------
  'pool.title': 'The open sky',
  'pool.reserve': '{count} stars still hidden',
  'pool.reserveColor': '{count} hidden star(s) in {color}',
  'pool.selectable': 'ask a question about this star',

  // --- Racks and stars ----------------------------------------------------
  'tile.label': 'Star {number}, {color}, {points}',
  'tile.tilted': 'answer NO',
  'tile.back': 'My star {position} of 5, {color}, number unknown',
  'tile.positionOf': 'position {position} of {name}',
  'tile.comparePosition': 'gauge against this position',
  'rack.small': 'smaller',
  'rack.big': 'larger',
  'rack.slotEmpty': '{slot} star of {name}: nothing placed here',
  'rack.slotFilled': '{slot} star of {name}: {count} star(s): {tiles}',
  'rack.compareGroup': 'Stars gauged against position {position} of {name}',
  'rack.compareYes': 'gauged against position {position}: YES, same sparks',
  'rack.compareNo': 'gauged against position {position}: NO, different sparks',
  'rack.othersZone': 'Everyone else’s stars',
  'rack.myZone': 'My stars',
  'rack.playing': 'playing',
  'rack.answering': 'answering',

  // --- Side panel ---------------------------------------------------------
  'side.players': 'At the table',
  'side.history': 'What happened',
  'side.openSheet': 'Open my star chart',
  'side.gameInfo': 'Game information',
  'status.eliminated': 'Out of the race',
  'status.announceUsed': 'Call made',
  'status.publicZone': 'The open sky',
  'status.left': 'Left',

  // --- History ------------------------------------------------------------
  'log.title': 'Game history',
  'log.empty': 'Nothing yet.',
  'log.game-started': 'The game begins! {count} stars shine in the open sky.',
  'log.starting-player': 'The draw picked {name} to start.',
  'log.turn-start': 'Turn {turn}: {name} plays.',
  'log.tile-revealed': '{name} revealed star {tile}.',
  'log.classify-requested': '{name} asks {responder} to PLACE star {tile}.',
  'log.compare-requested': '{name} asks {responder} to GAUGE star {tile} against position {position}.',
  'log.classify-answered': '{name} placed star {tile} among the stars of {owner}: {slot}.',
  'log.compare-answered.yes': '{name} answers YES: star {tile} has as many sparks as position {position}.',
  'log.compare-answered.no': '{name} answers NO: star {tile} does not have as many sparks as position {position}.',
  'log.responder-changed': '{previous} is away, so {name} answers instead.',
  'log.guess-correct': '{name} calls {numbers}: spot on!',
  'log.guess-wrong': '{name} calls {numbers}: not quite.',
  'log.player-eliminated': '{name} is out of the race. {remaining} still in.',
  'log.player-left': '{name} left the game.',
  'log.player-connected': '{name} is back.',
  'log.player-disconnected': '{name} went offline.',
  'log.game-over-winner': 'CONSTELLATION! {name} wins the game!',
  'log.game-over-draw': 'Every call missed: nobody wins this time.',
  'log.game-over-reserve-empty': 'The sky has no hidden star left: the game ends without a winner.',

  // --- Hint dialog --------------------------------------------------------
  'hint.title': 'A question about star {tile}',
  'hint.classify': 'PLACE',
  'hint.classifyText':
    '{name} puts this star in its spot among your five: before the first, between two of them, or after the last.',
  'hint.compare': 'GAUGE',
  'hint.compareText':
    '{name} tells you YES or NO: does this star have as many sparks as one of your stars?',
  'hint.choosePosition': 'Which of your stars? Only sparks count here, never the constellation.',
  'hint.confirmCompare': 'Ask',

  // --- PLACE (answer) -----------------------------------------------------
  'classify.title': '{name} asks you to PLACE star {tile}',
  'classify.instruction': 'You can see the stars of {name}. Where does star {tile} fit among them?',
  'classify.choose': 'Choose a spot',
  'classify.confirm': 'Confirm: {slot}',
  'classify.pickerLabel': 'Where the star fits',
  'classify.slotAria': '{slot}: put star {tile} here',

  // --- GAUGE (answer) -----------------------------------------------------
  'compare.title': '{name} asks you to GAUGE',
  'compare.publicTile': 'Star from the sky',
  'compare.positionOf': 'Star {position} of {name}',
  'compare.question': 'Same number of sparks? The answer is {answer}. Confirm to pass it on.',
  'compare.answer': 'Answer {answer}',
  'compare.yes': 'YES',
  'compare.no': 'NO',

  // --- CONSTELLATION! -----------------------------------------------------
  'guess.title': 'CONSTELLATION! — your call',
  'guess.warning':
    'You get one call per game. Name your five stars: if they are all right, you win on the spot. If a single one is wrong, you are out of the race — but you keep answering the others.',
  'guess.inputAria': 'Number {index} of 5',
  'guess.submit': 'Make my call',
  'guess.confirm': 'Sure about these {count} numbers? There is no going back.',
  'guess.errorCount': 'Exactly {count} numbers are needed.',
  'guess.errorRange': 'Each number goes from 1 to {max}.',
  'guess.errorOrder': 'Put them in ascending order, without repeating a number.',
  'guess.errorColors': 'Your five stars come one from each constellation.',

  // --- Star chart ---------------------------------------------------------
  'sheet.title': 'My star chart',
  'sheet.subtitle': 'Just for you: nobody else can see it.',
  'sheet.close': 'Back to the game',
  'sheet.gridLabel': 'Grid of the {count} numbers',
  'sheet.rowLabel': '{color} row',
  'sheet.cellLabel': 'Number {number}, {color}, {points}, {state}',
  'sheet.cellCrossed': 'crossed out',
  'sheet.cellAvailable': 'still possible',
  'sheet.cellRevealed': 'already revealed in the sky',
  'sheet.cellHeld': 'held by someone else',
  'sheet.guessAria': 'Guess {index} of {count}',
  'sheet.legend': 'Tap a number to cross it out, tap again to bring it back.',
  'sheet.legendRevealed': 'already revealed in the open sky',
  'sheet.legendHeld': 'visible on someone else’s row, so it cannot be yours',
  'sheet.legendEnd': 'Nothing is crossed out for you: the reasoning is yours.',
  'sheet.crossedCount': '{count} / {total} crossed out',
  'sheet.useForAnnounce': 'Use for my call',
  'sheet.reset': 'Clear my chart',
  'sheet.resetTitle': 'Clear the whole chart?',
  'sheet.resetText': 'Every crossed-out number comes back and your five guesses are cleared. The game itself is not affected.',
  'sheet.resetConfirm': 'Clear everything',
  'sheet.smaller': 'smaller',
  'sheet.bigger': 'larger',

  // --- End of game --------------------------------------------------------
  'over.winnerYou': 'You found your constellation, {name}!',
  'over.winnerOther': '{name} found their constellation!',
  'over.draw': 'Nobody wins this one. The sky kept its secrets.',
  'over.guessLineOk': '{name} called {numbers}: spot on.',
  'over.guessLineKo': '{name} called {numbers}: not quite.',
  'over.replay': 'Play again',
  'over.waitingReplay': 'Waiting for the others…',
  'over.replayCount': '{ready} of {total} ready for another round',
  'over.home': 'Back to the home screen',
  'over.everyoneLeft': 'Everyone else has left the table.',

  // --- Notifications ------------------------------------------------------
  'toast.revealed': '{name} revealed star {tile}.',
  'toast.yourAnswer': '{name} has a question for you!',
  'toast.wrongClassify': 'The star was put back in its true spot.',
  'toast.compareResult': 'Answer: {answer} (star {tile} and position {position}).',
  'toast.yourTurn': 'Your turn!',
  'toast.turnOf': '{name}’s turn.',
  'toast.guessFailedMine': 'Not quite! You are out of the race, but you still answer the others.',
  'toast.guessFailedOther': 'The call of {name} missed: out of the race.',
  'toast.joined': '{name} joined the table!',
  'toast.reconnected': '{name} is back.',
  'toast.playerOffline': '{name} went offline. The game will wait.',
  'banner.offline': 'Connection lost. Trying to reconnect…',
  'banner.playerOffline': '{name} is offline for now. The game is kept: everything resumes when they are back.',
  'banner.playersOffline': 'Offline for now: {name}. The game is kept until they are back.',

  // --- Errors -------------------------------------------------------------
  'error.PLAYER_NOT_FOUND': 'Your seat at this table could not be found.',
  'error.NOT_YOUR_TURN': 'It is not your turn yet.',
  'error.WRONG_PHASE': 'That is not possible right now.',
  'error.INVALID_COLOR': 'That constellation does not exist.',
  'error.COLOR_EXHAUSTED': 'This constellation has no hidden star left.',
  'error.TILE_NOT_PUBLIC': 'This star is no longer in the open sky.',
  'error.INVALID_POSITION': 'That position does not exist.',
  'error.INVALID_SLOT': 'That spot does not exist.',
  'error.NOT_RESPONDER': 'This question is for someone else.',
  'error.GUESS_ALREADY_USED': 'You already made your call.',
  'error.INVALID_GUESS': 'This call is not valid.',
  'error.PLAYER_ELIMINATED': 'You already made your call.',
  'error.GAME_OVER': 'The game is over.',
  'error.NOT_ENOUGH_PLAYERS': 'You need at least two people to play.',
  'error.ROOM_NOT_FOUND': 'No game matches this code. It may have expired.',
  'error.ROOM_FULL': 'This table is full: four people are already playing.',
  'error.ROOM_STARTED': 'This game has already begun. Ask for the code of the next one!',
  'error.ROOM_FINISHED': 'This game is over.',
  'error.NAME_TAKEN': 'Someone at this table already has that name.',
  'error.BAD_TOKEN': 'Your seat could not be found: join again with the game code.',
  'error.SERVER_BUSY': 'It is busy right now. Try again in a moment.',
  'error.INVALID_NAME': 'This name is not valid.',
  'error.INVALID_CODE': 'This code is not valid.',
  'error.network': 'No answer. Check your connection and try again.',

  // --- Rules --------------------------------------------------------------
  'howto.title': 'How to play NOCTALIS',
  'howto.intro':
    'Everyone gets five secret stars. The twist: you can see everybody’s stars except your own. Your goal is to work out your five stars, from the clues the others give you, and be the first to name them.',
  'howto.stars.title': 'Sixty stars, five constellations',
  'howto.stars.text':
    'The stars are numbered from 1 to 60. The number decides everything: its constellation (they take turns, 1 is Lyra, 2 is Aurora, and so on) and its sparks — one, two or three, shown under the number.',
  'howto.setup.title': 'Your five stars',
  'howto.setup.text':
    'You hold one star of each constellation, lined up from the smallest number to the largest. You can see their constellation and their place in the row, never their number. Everyone else can read them easily.',
  'howto.turn.title': 'Your turn, in two moves',
  'howto.turn.text':
    'First reveal a star: choose a constellation and one of its hidden stars appears in the open sky. Then pick any star from the open sky and ask a question about it. The next person at the table answers you — they can see your stars.',
  'howto.place.title': 'PLACE',
  'howto.place.text':
    'The star you picked goes into its spot among your five: before the first one, between two of them, or after the last. Now you know where it would sit in your row.',
  'howto.gauge.title': 'GAUGE',
  'howto.gauge.text':
    'Point at one of your stars: the answer is YES if the star you picked has the same number of sparks, NO otherwise. Only sparks count here, never the constellation.',
  'howto.used.text':
    'A star used for a question leaves the open sky and stays next to your row, as a reminder of what you learned.',
  'howto.chart.title': 'Your star chart',
  'howto.chart.text':
    'It is your private notebook: all sixty numbers, one row per constellation. Cross out what cannot be yours, note your guesses at the top. Stars already revealed, and stars you can see on other rows, are gently marked — but nothing is ever crossed out for you.',
  'howto.call.title': 'CONSTELLATION!',
  'howto.call.text':
    'As soon as you think you know your five stars, call them — on your turn or anyone else’s. You only get one call. All five right: you win straight away. One wrong: you are out of the race, but you keep answering the others’ questions.',
  'howto.table.title': 'Three or four at the table',
  'howto.table.text':
    'Turns go round the table, and the person sitting after you answers your questions. If they step away, the next one takes over. Someone who leaves the game simply leaves the rotation.',
  'howto.end.title': 'When does it end?',
  'howto.end.text':
    'As soon as someone calls their five stars right. If every call misses, or if the sky runs out of hidden stars, nobody wins — and you can always play another round.',

  // --- Tutorial -----------------------------------------------------------
  'onboarding.title': 'Welcome to the table',
  'onboarding.skip': 'Skip',
  'onboarding.next': 'Next',
  'onboarding.play': 'Let’s play!',
  'onboarding.step': 'Step {current} of {total}',
  'onboarding.1.title': 'These are your stars',
  'onboarding.1.text':
    'At the bottom of the screen. You can see their constellation and their order, but not their number: that is the whole mystery.',
  'onboarding.2.title': 'Everyone else’s stars',
  'onboarding.2.text':
    'At the top, face up. You can read their numbers — and they can read yours. Nobody knows their own.',
  'onboarding.3.title': 'The open sky',
  'onboarding.3.text':
    'In the middle. On your turn, reveal one more star here, then ask a question about any of them.',
  'onboarding.4.title': 'PLACE',
  'onboarding.4.text':
    'Where would this star fit among your five? The next person at the table shows you the exact spot.',
  'onboarding.5.title': 'GAUGE',
  'onboarding.5.text': 'Does this star have as many sparks as one of yours? YES or NO.',
  'onboarding.6.title': 'Your star chart',
  'onboarding.6.text': 'Cross out numbers, jot down your guesses. It is yours alone.',
  'onboarding.7.title': 'CONSTELLATION!',
  'onboarding.7.text': 'One call per game: name your five stars once you are sure. Good luck!',
} as const;

/** Every available key, taken from the English reference. */
export type MessageKey = keyof typeof en;

/** A complete language catalogue. */
export type Messages = Record<MessageKey, string>;
