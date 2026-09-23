/**
 * Textos espanoles de l'interface. Les cles sont exactement celles du
 * francais (`Messages` l'impose a la compilation).
 */
import type { Messages } from './fr.js';

export const es: Messages = {
  // --- Generico ------------------------------------------------------------
  'app.title': 'NOCTALIS — Adivina tu constelación antes que él',
  'common.cancel': 'Cancelar',
  'common.back': 'Volver',
  'common.close': 'Cerrar',
  'common.understood': 'Entendido',
  'common.you': '(tú)',
  'common.online': 'en línea',
  'common.offline': 'desconectado',
  'common.loading': 'Un momento…',
  'common.point': 'brillo',
  'common.points': 'brillos',

  // --- Constelaciones -------------------------------------------------------------
  'color.green': 'Lira',
  'color.pink': 'Aurora',
  'color.blue': 'Cisne',
  'color.red': 'Brasa',
  'color.orange': 'Fénix',

  // --- Huecos de SITUAR ---------------------------------------------------
  'slot.0': 'Antes de la 1.ª',
  'slot.1': 'Entre la 1.ª y la 2.ª',
  'slot.2': 'Entre la 2.ª y la 3.ª',
  'slot.3': 'Entre la 3.ª y la 4.ª',
  'slot.4': 'Entre la 4.ª y la 5.ª',
  'slot.5': 'Después de la 5.ª',

  // --- Inicio --------------------------------------------------------------
  'home.tagline': 'Adivina tu constelación antes que él',
  'home.pitch':
    'Versión en línea para 2 jugadores: tus 5 estrellas están ocultas para ti, pero no para tu rival. ¡Dedúcelas antes que él!',
  'home.create': 'Crear una partida',
  'home.join': 'Unirse a una partida',
  'home.help': '¿Cómo se juega?',
  'home.connected': 'Conectado al servidor',
  'home.connecting': 'Conectando con el servidor…',
  'home.createTitle': 'Crear una partida',
  'home.joinTitle': 'Unirse a una partida',
  'home.nameLabel': 'Tu apodo',
  'home.nameHint': 'De {min} a {max} caracteres',
  'home.codeLabel': 'Código de la partida',
  'home.codeHint': '{length} caracteres, sin espacios',
  'home.submitCreate': 'Crear la partida',
  'home.submitJoin': 'Unirse',
  'home.language': 'Idioma',

  // --- Sala de espera ------------------------------------------------------
  'lobby.share': 'Comparte este código con tu rival',
  'lobby.copy': 'Copiar el código',
  'lobby.copied': '¡Copiado!',
  'lobby.waitingPlayer': 'Esperando…',
  'lobby.waitingHint': 'El segundo jugador debe introducir el código',
  'lobby.host': 'Anfitrión',
  'lobby.guest': 'Invitado',
  'lobby.start': 'Empezar la partida',
  'lobby.waitingSecond': 'Esperando al segundo jugador…',
  'lobby.waitingHost': 'El anfitrión va a empezar la partida…',
  'lobby.leave': 'Salir',

  // --- Barra de juego ------------------------------------------------------
  'header.roomCode': 'Código de la partida:',
  'header.announce': '¡CONSTELACIÓN!',
  'header.sheet': 'Carta',
  'header.soundOn': 'Silenciar',
  'header.soundOff': 'Activar el sonido',
  'header.help': 'Cómo se juega',
  'header.quit': 'Salir de la partida',
  'header.online': 'En línea',
  'header.reconnecting': 'Reconectando…',
  'header.language': 'Cambiar de idioma',

  // --- Indicador de turno --------------------------------------------------
  // --- Apoyo, pie de página y Acerca de -------------------------------------
  'support.link': 'Apoyar el proyecto',
  'support.text':
    'Este proyecto es libre y de código abierto. Si te gusta, puedes apoyar su desarrollo en GitHub. Es totalmente opcional: todo el juego sigue siendo accesible, sin cuenta, sin publicidad y sin funciones de pago.',
  'footer.code': 'Código fuente',
  'footer.about': 'Acerca de',
  'about.title': 'Acerca de NOCTALIS',
  'about.description':
    'NOCTALIS es un juego de deducción para dos: cada uno ve la constelación del otro, nunca la suya. El servidor es la única fuente de verdad: tus estrellas nunca salen de la máquina que las guarda.',
  'about.openSource':
    'Proyecto independiente, desarrollado en público. El código, las reglas y los recursos son originales y de libre consulta.',
  'about.codeLabel': 'Código',
  'about.licenseLabel': 'Licencia',

  // --- Tema ------------------------------------------------------------------
  'theme.label': 'Tema',
  'theme.auto': 'Automático',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  'theme.current': 'Tema: {mode}. Haz clic para cambiar.',

  // --- Ruleta de apertura --------------------------------------------------
  'roulette.question': '¿Quién empieza?',
  'roulette.drawing': 'La ruleta gira… decide la suerte.',
  'roulette.landed': '¡Empieza {name}!',
  'roulette.youStart': 'La suerte te elige: abres la partida.',
  'roulette.opponentStarts': '{name} abre la partida. Tú justo después.',
  'roulette.skip': 'Saltar la animación',
  'roulette.go': '¡Vamos!',

  'turn.counter': 'Turno {turn}',
  'turn.gameOver': 'Partida terminada',
  'turn.gameOverDetail': 'Mira el resultado más abajo.',
  'turn.mustAnswer': '¡Te toca responder!',
  'turn.mustClassify': '{name} espera a que ordenes la estrella.',
  'turn.mustCompare': '{name} espera tu respuesta SÍ / NO.',
  'turn.hintAsked': 'Pista solicitada',
  'turn.of': 'Turno de {name}',
  'turn.waitingClassify': '{name} debe situar la estrella…',
  'turn.waitingCompare': '{name} debe responder SÍ o NO…',
  'turn.eliminated': 'Estás eliminado',
  'turn.eliminatedDetail': '{name} termina la partida. Todavía puedes responder a sus pistas.',
  'turn.yours': '¡TE TOCA!',
  'turn.yoursReveal': 'Paso 1 de 2: revela una estrella eligiendo una constelación.',
  'turn.yoursHint': 'Paso 2 de 2: elige una estrella pública y luego SITUAR o MEDIR.',
  'turn.othersReveal': '{name} está eligiendo una constelación…',
  'turn.othersHint': '{name} está preparando su pista…',

  // --- Panel de acción -----------------------------------------------------
  'action.gameOver': 'La partida ha terminado.',
  'action.eliminated':
    'Ya has gastado tu intento de ¡CONSTELACIÓN!. Sigues respondiendo a las pistas de {name}.',
  'action.waitingReveal': '{name} está eligiendo una constelación para revelar…',
  'action.waitingHint': '{name} está eligiendo una estrella y un tipo de pista…',
  'action.waitingAnswer': '{name} debe responder…',
  'action.step1': 'Paso 1 / 2',
  'action.step1Title': 'Revela una estrella',
  'action.step1Hint': 'Elige una constelación: el servidor saca al azar una estrella todavía disponible.',
  'action.step2': 'Paso 2 / 2',
  'action.step2Title': 'Pide una pista',
  'action.step2Hint':
    'Haz clic en cualquier estrella revelada y elige después SITUAR o MEDIR.',
  'action.step2Selected': 'Estrella {tile} seleccionada: elige SITUAR o MEDIR.',
  'action.revealColor': 'Revelar una estrella {color} (quedan {count})',
  'action.waitingClassifyShort': 'debe situar la estrella',
  'action.waitingAnswerShort': 'debe responder',

  // --- Registro común --------------------------------------------------------
  'pool.title': 'Registro común',
  'pool.reserve': 'Cielo: quedan {count} estrellas por revelar',
  'pool.reserveColor': '{count} estrella(s) de la {color} aún en el cielo',
  'pool.selectable': 'elegir esta estrella para una pista',

  // --- Soportes y estrellas ---------------------------------------------------
  'tile.label': 'Estrella {number}, {color}, {points}',
  'tile.tilted': 'respuesta NO',
  'tile.back': 'Mi estrella {position} de 5, {color}, número desconocido',
  'tile.positionOf': 'posición {position} de {name}',
  'tile.comparePosition': 'medir con esta posición',
  'rack.small': 'pequeño',
  'rack.big': 'grande',
  'rack.slotEmpty': '{slot} estrella de {name}: ninguna estrella colocada',
  'rack.slotFilled': '{slot} estrella de {name}: {count} estrella(s): {tiles}',
  'rack.compareGroup': 'Comparaciones en la posición {position} de {name}',
  'rack.compareYes': 'medida con la posición {position}: SÍ, mismos brillos',
  'rack.compareNo': 'medida con la posición {position}: NO, brillos distintos',
  'rack.opponentZone': 'Zona de {name}',
  'rack.myZone': 'Mi zona',
  'rack.waitingOpponent': 'Esperando a un rival…',

  // --- Panel lateral -------------------------------------------------------
  'side.players': 'Jugadores',
  'side.history': 'Historial',
  'side.openSheet': 'Abrir mi carta celeste',
  'side.gameInfo': 'Información de la partida',
  'status.eliminated': 'Eliminado',
  'status.announceUsed': '¡CONSTELACIÓN! usado',
  'status.publicZone': 'Registro común',

  // --- Historial -----------------------------------------------------------
  'log.title': 'Historial de la partida',
  'log.empty': 'Nada por ahora.',
  'log.game-started': '¡Empieza la partida! Hay {count} estrellas en el centro.',
  'log.starting-player': 'Sorteo: empieza {name}.',
  'log.turn-start': 'Turno {turn}: le toca a {name}.',
  'log.tile-revealed': '{name} ha revelado la estrella {tile}.',
  'log.classify-requested': '{name} pide a {opponent} que ORDENE la estrella {tile}.',
  'log.compare-requested':
    '{name} pide a {opponent} que COMPARE la estrella {tile} con su posición {position}.',
  'log.classify-answered': '{name} ha colocado la estrella {tile}: {slot} estrella de {owner}.',
  'log.compare-answered.yes':
    '{name} responde SÍ: la estrella {tile} tiene los mismos brillos que la posición {position}.',
  'log.compare-answered.no':
    '{name} responde NO: la estrella {tile} no tiene los mismos brillos que la posición {position}.',
  'log.guess-correct': '{name} intenta ¡CONSTELACIÓN! con {numbers}: ¡exacto!',
  'log.guess-wrong': '{name} intenta ¡CONSTELACIÓN! con {numbers}: fallo.',
  'log.player-eliminated': '{name} queda eliminado: {opponent} es el único jugador que sigue.',
  'log.player-left': '{name} ha salido de la partida.',
  'log.player-connected': '{name} se ha reconectado.',
  'log.player-disconnected': '{name} se ha desconectado.',
  'log.game-over-winner': '¡CONSTELACIÓN! ¡{name} gana la partida!',
  'log.game-over-draw': 'Los dos jugadores han fallado: no gana nadie.',
  'log.game-over-reserve-empty': 'El cielo se ha agotado: la observación termina sin ganador.',

  // --- Diálogo de pista ----------------------------------------------------
  'hint.title': 'Pedir una pista sobre la estrella {tile}',
  'hint.classify': 'SITUAR',
  'hint.classifyText':
    '{name} coloca esta estrella entre tus 5 estrellas secretas: antes de la 1.ª, entre dos estrellas o después de la 5.ª.',
  'hint.compare': 'MEDIR',
  'hint.compareText':
    '{name} dice SÍ o NO: ¿esta estrella tiene los mismos brillos que una de tus posiciones?',
  'hint.choosePosition':
    'Elige la posición que quieres medir. Solo cuentan los brillos, nunca la constelación.',
  'hint.confirmCompare': 'Pedir la medición',

  // --- Diálogo SITUAR (respuesta) -----------------------------------------
  'classify.title': '{name} te pide SITUAR la estrella {tile}',
  'classify.instruction':
    'Coloca la estrella {tile} en el lugar correcto entre las estrellas de {name}, que solo tú ves.',
  'classify.choose': 'Elige una posición',
  'classify.confirm': 'Confirmar: {slot}',
  'classify.pickerLabel': 'Elige la posición de la estrella',
  'classify.slotAria': '{slot}: colocar aquí la estrella {tile}',

  // --- Diálogo MEDIR (respuesta) ----------------------------------------
  'compare.title': '{name} te pide MEDIR',
  'compare.publicTile': 'Estrella pública',
  'compare.positionOf': 'Posición {position} de {name}',
  'compare.question':
    '¿Mismos brillos? La respuesta exacta es {answer}. Confírmala para enviarla.',
  'compare.answer': 'Responder {answer}',
  'compare.yes': 'SÍ',
  'compare.no': 'NO',

  // --- Diálogo ¡CONSTELACIÓN! ---------------------------------------------------
  'guess.title': '¡CONSTELACIÓN! — tu intento final',
  'guess.warning':
    'Un solo intento por jugador. Si los 5 números son exactos, ganas de inmediato. Un solo error y quedas eliminado.',
  'guess.inputAria': 'Número {index} de 5',
  'guess.submit': '¡Lo intento!',
  'guess.confirm': '¿Confirmas estos {count} números entre 1 y {max}?',
  'guess.errorCount': 'Hacen falta exactamente {count} números.',
  'guess.errorRange': 'Cada número debe ser un entero entre 1 y {max}.',
  'guess.errorOrder': 'Los números deben ir en orden creciente, sin repeticiones.',
  'guess.errorColors': 'Tu propuesta debe incluir una estrella de cada constelación.',

  // --- Carta celeste ---------------------------------------------------
  'sheet.title': 'Mi carta celeste',
  'sheet.subtitle': 'Privada: ni el servidor ni tu rival la ven.',
  'sheet.close': 'Volver al juego',
  'sheet.gridLabel': 'Cuadrícula de los {count} números',
  'sheet.rowLabel': 'Fila {color}',
  'sheet.cellLabel': 'Número {number}, {color}, {points}, {state}',
  'sheet.cellCrossed': 'eliminado',
  'sheet.cellAvailable': 'no eliminado',
  'sheet.cellRevealed': 'ya revelada en el centro',
  'sheet.guessAria': 'Hipótesis número {index} de {count}',
  'sheet.legend':
    'Haz clic en un número para tacharlo y vuelve a hacer clic para restaurarlo. Las estrellas ya reveladas en el centro llevan una marca:',
  'sheet.legendEnd': 'tú decides qué eliminar.',
  'sheet.crossedCount': '{count} / {total} tachados',
  'sheet.useForAnnounce': 'Usar en mi anuncio',
  'sheet.reset': 'Borrar mis deducciones',
  'sheet.resetTitle': '¿Borrar toda la hoja?',
  'sheet.resetText':
    'Se restaurarán todos los números tachados y se borrarán las 5 hipótesis. La partida en curso no cambia.',
  'sheet.resetConfirm': 'Borrar todo',
  'sheet.smaller': 'más pequeño',
  'sheet.bigger': 'más grande',

  // --- Fin de la partida ---------------------------------------------------
  'over.winnerYou': 'Victoria de {name}: ¡enhorabuena, eres tú!',
  'over.winnerOther': '¡{name} ha ganado!',
  'over.draw': 'Nadie gana esta partida.',
  'over.guessLine': '{name} ha intentado {numbers}:',
  'over.guessOk': 'exacto',
  'over.guessKo': 'fallo',
  'over.replay': 'Jugar otra vez',
  'over.waitingReplay': 'Esperando a tu rival…',
  'over.home': 'Volver al inicio',
  'over.opponentWantsReplay': '¡Tu rival quiere jugar otra vez!',
  'over.opponentLeft': 'Tu rival ha salido de la partida.',

  // --- Notificaciones ------------------------------------------------------
  'toast.revealed': '{name} ha revelado la estrella {tile}.',
  'toast.yourAnswer': '¡Te toca responder!',
  'toast.wrongClassify':
    'Atención: tu colocación era incorrecta, el servidor ha puesto la estrella en su sitio.',
  'toast.compareResult': 'Respuesta: {answer} (estrella {tile} / posición {position}).',
  'toast.yourTurn': '¡Te toca!',
  'toast.turnOf': 'Turno de {name}.',
  'toast.guessFailedMine': '¡Fallo! Tu intento de ¡CONSTELACIÓN! se ha consumido.',
  'toast.guessFailedOther': '{name} se ha equivocado y queda eliminado.',
  'toast.joined': '¡{name} se ha unido a la partida!',
  'toast.reconnected': '{name} ha vuelto.',
  'toast.opponentLeft': '{name} se ha desconectado. La partida te espera.',
  'banner.offline': 'Conexión perdida — reconectando automáticamente…',
  'banner.opponentOffline':
    '{name} se ha desconectado. La partida se conserva, puede volver en cualquier momento.',

  // --- Errores del servidor ------------------------------------------------
  'error.PLAYER_NOT_FOUND': 'Ya no estás en esta partida.',
  'error.NOT_YOUR_TURN': 'No es tu turno.',
  'error.WRONG_PHASE': 'Esta acción no es posible ahora mismo.',
  'error.INVALID_COLOR': 'Constelación no válido.',
  'error.COLOR_EXHAUSTED': 'Esa constelación ya no tiene ninguna estrella en el cielo.',
  'error.TILE_NOT_PUBLIC': 'Esa estrella no está en el registro común.',
  'error.INVALID_POSITION': 'Posición no válida.',
  'error.INVALID_SLOT': 'Hueco no válido.',
  'error.NOT_RESPONDER': 'No te toca responder a ti.',
  'error.GUESS_ALREADY_USED': 'Ya has usado tu intento de ¡CONSTELACIÓN!.',
  'error.INVALID_GUESS': 'Propuesta no válida.',
  'error.PLAYER_ELIMINATED': 'Ya has usado tu intento de ¡CONSTELACIÓN!.',
  'error.GAME_OVER': 'La partida ha terminado.',
  'error.NOT_ENOUGH_PLAYERS': 'Hacen falta dos jugadores.',
  'error.ROOM_NOT_FOUND': 'Esta partida no existe (o ha caducado).',
  'error.ROOM_FULL': 'Esta partida ya está completa.',
  'error.ROOM_FINISHED': 'Esta partida ya ha terminado.',
  'error.NAME_TAKEN': 'Ese apodo ya está en uso en esta partida.',
  'error.BAD_TOKEN': 'Sesión caducada: únete a la partida con el código.',
  'error.SERVER_BUSY': 'El servidor está saturado, inténtalo dentro de un momento.',
  'error.INVALID_NAME': 'Apodo no válido.',
  'error.INVALID_CODE': 'Código de partida no válido.',
  'error.network': 'El servidor no responde. Inténtalo de nuevo.',

  // --- Reglas --------------------------------------------------------------
  'howto.title': 'Cómo se juega a ¡CONSTELACIÓN!',
  'howto.1.title': '1. Tus 5 estrellas están ocultas… para ti',
  'howto.1.text':
    'Ves su constelación y su posición, nunca su número. Tu rival, en cambio, las ve enteras.',
  'howto.2.title': '2. Una estrella de cada constelación, de menor a mayor',
  'howto.2.text':
    'Las 60 estrellas van del 1 al 60. El número determina la constelación y la cantidad de brillos (1, 2 o 3 brillos, debajo del número).',
  'howto.3.title': '3. Al principio se revelan 5 estrellas en el centro',
  'howto.3.text': 'Una de cada constelación. Siguen visibles hasta el final de la partida.',
  'howto.4.title': '4. En tu turno: revela una estrella',
  'howto.4.text':
    'Eliges una constelación, el servidor saca al azar una estrella disponible y pasa a la registro común.',
  'howto.5.title': '5. Después pide una pista',
  'howto.5.text': 'Elige cualquier estrella pública y luego:',
  'howto.5.note':
    'La estrella elegida sale del registro: pasa a tu bóveda y ya no puede usarse para otra pista.',
  'howto.5.classify':
    'SITUAR: tu rival coloca esa estrella entre tus 5 estrellas secretas (6 posiciones posibles: antes de la 1.ª, entre dos estrellas o después de la 5.ª).',
  'howto.5.compare':
    'MEDIR: señalas una de tus posiciones y tu rival responde SÍ o NO según si la estrella tiene los mismos brillos que tu estrella secreta. La constelación no cuenta. Una respuesta NO inclina la estrella.',
  'howto.6.title': '6. Anota tus deducciones',
  'howto.6.text':
    'Tu hoja del 1 al 60 es privada: tacha los números imposibles con un clic y escribe arriba tus 5 hipótesis. Nada se tacha solo: el razonamiento es tuyo.',
  'howto.7.title': '7. Canta ¡CONSTELACIÓN!',
  'howto.7.text':
    'En cuanto creas conocer tus 5 números, inténtalo — en tu turno o en el de tu rival. Un solo intento por jugador: si aciertas, ganas; si fallas, quedas eliminado.',

  // --- Tutorial ------------------------------------------------------------
  'onboarding.title': 'En 20 segundos',
  'onboarding.skip': 'Saltar',
  'onboarding.next': 'Siguiente',
  'onboarding.play': '¡A jugar!',
  'onboarding.step': 'Paso {current} de {total}',
  'onboarding.1.title': 'Tus estrellas, abajo',
  'onboarding.1.text': 'Ves su constelación y su posición, nunca su número: ahí está el reto.',
  'onboarding.2.title': 'Las estrellas del rival, arriba',
  'onboarding.2.text': 'Ves sus números: tu rival, en cambio, no ve los suyos.',
  'onboarding.3.title': 'La registro común, en el centro',
  'onboarding.3.text':
    'Las estrellas reveladas esperan ahí; la que se usa para una pista pasa luego a una bóveda.',
  'onboarding.4.title': 'SITUAR',
  'onboarding.4.text':
    'Tu rival coloca una estrella pública entre tus 5 estrellas: 6 posiciones posibles.',
  'onboarding.5.title': 'MEDIR',
  'onboarding.5.text': 'SÍ o NO: ¿la estrella tiene los mismos brillos que una de tus posiciones?',
  'onboarding.6.title': 'Tu carta celeste',
  'onboarding.6.text':
    'Tacha los números imposibles y anota tus hipótesis. Es totalmente privada.',
  'onboarding.7.title': '¡CONSTELACIÓN!',
  'onboarding.7.text': 'Un solo intento: canta tus 5 números cuando estés seguro.',
};
