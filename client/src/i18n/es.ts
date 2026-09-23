import type { Messages } from './en.js';

/**
 * Spanish interface texts. Same keys as the English reference.
 *
 * Inclusive writing without « @ », « x » or « e »: neutral words
 * (« persona », « gente », « rival »), phrasing that does not give the reader
 * a gender (« te damos la bienvenida », « cuando tengas la certeza »).
 */
export const es: Messages = {
  // --- General -------------------------------------------------------------
  'app.title': 'NOCTALIS — Adivina tu constelación antes que nadie',
  'common.cancel': 'Cancelar',
  'common.back': 'Volver',
  'common.close': 'Cerrar',
  'common.understood': 'Entendido',
  'common.you': '(tú)',
  'common.online': 'en línea',
  'common.offline': 'sin conexión',
  'common.loading': 'Un momento…',
  'common.point': '{count} destello',
  'common.points': '{count} destellos',

  // --- Constelaciones ------------------------------------------------------
  'color.green': 'Lira',
  'color.pink': 'Aurora',
  'color.blue': 'Cisne',
  'color.red': 'Brasa',
  'color.orange': 'Fénix',

  // --- Los seis huecos de SITUAR -------------------------------------------
  'slot.0': 'Antes de la 1.ª',
  'slot.1': 'Entre la 1.ª y la 2.ª',
  'slot.2': 'Entre la 2.ª y la 3.ª',
  'slot.3': 'Entre la 3.ª y la 4.ª',
  'slot.4': 'Entre la 4.ª y la 5.ª',
  'slot.5': 'Después de la 5.ª',

  // --- Inicio --------------------------------------------------------------
  'home.tagline': 'Adivina tu constelación antes que nadie',
  'home.pitch':
    'De dos a cuatro personas bajo el mismo cielo. Ves las estrellas de todo el mundo… menos las tuyas. Haz las preguntas adecuadas, cruza las pistas y encuentra tus cinco estrellas antes que nadie.',
  'home.players': 'De 2 a 4 personas · en línea · sin registro',
  'home.create': 'Crear una partida',
  'home.join': 'Unirse a una partida',
  'home.help': '¿Cómo se juega?',
  'home.connected': 'Todo listo',
  'home.connecting': 'Conectando…',
  'home.createTitle': 'Crear una partida',
  'home.joinTitle': 'Unirse a una partida',
  'home.nameLabel': 'Tu nombre',
  'home.nameHint': 'De {min} a {max} caracteres',
  'home.codeLabel': 'Código de la partida',
  'home.codeHint': '{length} caracteres, sin espacios',
  'home.submitCreate': 'Abrir la mesa',
  'home.submitJoin': 'Sentarse a la mesa',
  'home.language': 'Idioma',

  // --- Sala ----------------------------------------------------------------
  'lobby.share': 'Comparte este código con hasta {max} personas',
  'lobby.copy': 'Copiar el código',
  'lobby.copied': '¡Copiado!',
  'lobby.freeSeat': 'Sitio libre',
  'lobby.neededSeat': 'Hace falta alguien aquí para empezar',
  'lobby.optionalSeat': 'Sitio extra, por si alguien más se anima',
  'lobby.host': 'inicia la partida',
  'lobby.start': 'Empezar con {count} personas',
  'lobby.waitingSecond': 'Esperando a que alguien se una…',
  'lobby.waitingHost': '{name} iniciará la partida cuando esté todo el mundo.',
  'lobby.roomForMore': 'Aún hay {count} sitio(s) libre(s), aunque se puede empezar ya.',
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
  'header.language': 'Idioma',

  // --- Apoyo, pie de página y Acerca de ------------------------------------
  'support.link': 'Apoyar el proyecto',
  'support.text':
    'NOCTALIS es libre y gratuito. Si te gusta, puedes apoyar su desarrollo en GitHub. Es totalmente opcional: el juego entero sigue abierto a todo el mundo, sin cuenta, sin publicidad y sin nada que comprar.',
  'footer.code': 'Código fuente',
  'footer.about': 'Acerca de',
  'about.title': 'Acerca de NOCTALIS',
  'about.description':
    'NOCTALIS es un juego de deducción en línea para dos a cuatro personas. Cada persona ve las estrellas del resto, nunca las suyas, y gana quien nombre primero sus cinco estrellas.',
  'about.openSource':
    'Es un proyecto independiente y abierto: las reglas, los dibujos y el código son originales, y cualquiera puede leerlos, mejorarlos o inspirarse en ellos.',
  'about.codeLabel': 'Código',
  'about.licenseLabel': 'Licencia',

  // --- Tema ----------------------------------------------------------------
  'theme.label': 'Tema',
  'theme.auto': 'Automático',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  'theme.current': 'Tema: {mode}. Pulsa para cambiar.',

  // --- Sorteo inicial ------------------------------------------------------
  'roulette.question': '¿Quién empieza?',
  'roulette.drawing': 'El cielo gira…',
  'roulette.landed': '¡Empieza {name}!',
  'roulette.youStart': 'Las estrellas han hablado: te toca abrir la partida.',
  'roulette.othersStart': '{name} abre la partida. Tu turno llegará pronto.',
  'roulette.skip': 'Saltar',
  'roulette.go': '¡Vamos!',

  // --- Banda de turno ------------------------------------------------------
  'turn.counter': 'Turno {turn}',
  'turn.gameOver': 'Partida terminada',
  'turn.gameOverDetail': 'El resultado te espera justo debajo.',
  'turn.mustAnswer': '¡Te toca responder!',
  'turn.mustClassify': '{name} espera que sitúes una estrella.',
  'turn.mustCompare': '{name} espera tu SÍ o tu NO.',
  'turn.hintAsked': 'Pregunta hecha',
  'turn.of': 'Turno de {name}',
  'turn.waitingClassify': '{name} está situando la estrella…',
  'turn.waitingCompare': '{name} responde SÍ o NO…',
  'turn.eliminated': 'Fuera de la carrera',
  'turn.eliminatedDetail': 'Tu anuncio no era correcto. Sigues respondiendo a las preguntas del resto: la partida te necesita.',
  'turn.yours': '¡TE TOCA!',
  'turn.yoursReveal': 'Paso 1 de 2: revela una estrella eligiendo una constelación.',
  'turn.yoursHint': 'Paso 2 de 2: elige una estrella del cielo común y luego SITUAR o MEDIR.',
  'turn.othersReveal': '{name} elige una constelación…',
  'turn.othersHint': '{name} prepara su pregunta…',

  // --- Panel de acción -----------------------------------------------------
  'action.gameOver': 'La partida ha terminado.',
  'action.eliminated': 'Tu anuncio no era correcto. No pierdas de vista la mesa: aún te harán preguntas.',
  'action.waitingReveal': '{name} elige una constelación para revelar…',
  'action.waitingHint': '{name} elige una estrella y una pregunta…',
  'action.waitingAnswer': 'Esperando la respuesta de {name}…',
  'action.waitingClassify': '{name} está situando la estrella…',
  'action.step1': 'Paso 1 / 2',
  'action.step1Title': 'Revela una estrella',
  'action.step1Hint': 'Elige una constelación: aparecerá al azar una de sus estrellas ocultas.',
  'action.step2': 'Paso 2 / 2',
  'action.step2Title': 'Haz una pregunta',
  'action.step2Hint': 'Toca cualquier estrella del cielo común y luego elige SITUAR o MEDIR.',
  'action.step2Selected': 'Estrella {tile} elegida: ahora elige SITUAR o MEDIR.',
  'action.revealColor': 'Revelar una estrella de {color} ({count} aún ocultas)',
  'action.leftCount': 'quedan {count}',

  // --- Cielo común ---------------------------------------------------------
  'pool.title': 'El cielo común',
  'pool.reserve': '{count} estrellas aún ocultas',
  'pool.reserveColor': '{count} estrella(s) aún oculta(s) en {color}',
  'pool.selectable': 'hacer una pregunta sobre esta estrella',

  // --- Filas y estrellas ---------------------------------------------------
  'tile.label': 'Estrella {number}, {color}, {points}',
  'tile.tilted': 'respuesta NO',
  'tile.back': 'Mi estrella {position} de 5, {color}, número desconocido',
  'tile.positionOf': 'posición {position} de {name}',
  'tile.comparePosition': 'medir con esta estrella',
  'rack.small': 'menor',
  'rack.big': 'mayor',
  'rack.slotEmpty': '{slot} estrella de {name}: nada situado aquí',
  'rack.slotFilled': '{slot} estrella de {name}: {count} estrella(s): {tiles}',
  'rack.compareGroup': 'Estrellas medidas con la posición {position} de {name}',
  'rack.compareYes': 'medida con la posición {position}: SÍ, los mismos destellos',
  'rack.compareNo': 'medida con la posición {position}: NO, destellos distintos',
  'rack.othersZone': 'Las estrellas del resto',
  'rack.myZone': 'Mis estrellas',
  'rack.playing': 'juega',
  'rack.answering': 'responde',

  // --- Panel lateral -------------------------------------------------------
  'side.players': 'En la mesa',
  'side.history': 'Lo que ha pasado',
  'side.openSheet': 'Abrir mi carta celeste',
  'side.gameInfo': 'Información de la partida',
  'status.eliminated': 'Fuera de la carrera',
  'status.announceUsed': 'Anuncio hecho',
  'status.publicZone': 'El cielo común',
  'status.left': 'Ha salido',

  // --- Historial -----------------------------------------------------------
  'log.title': 'Historial de la partida',
  'log.empty': 'Nada por ahora.',
  'log.game-started': '¡Empieza la partida! {count} estrellas brillan en el cielo común.',
  'log.starting-player': 'El sorteo elige a {name} para empezar.',
  'log.turn-start': 'Turno {turn}: juega {name}.',
  'log.tile-revealed': '{name} revela la estrella {tile}.',
  'log.classify-requested': '{name} pide a {responder} que SITÚE la estrella {tile}.',
  'log.compare-requested': '{name} pide a {responder} que MIDA la estrella {tile} con su posición {position}.',
  'log.classify-answered': '{name} sitúa la estrella {tile} entre las de {owner}: {slot}.',
  'log.compare-answered.yes': '{name} responde SÍ: la estrella {tile} tiene tantos destellos como la posición {position}.',
  'log.compare-answered.no': '{name} responde NO: la estrella {tile} no tiene tantos destellos como la posición {position}.',
  'log.responder-changed': '{previous} no está en línea: responde {name} en su lugar.',
  'log.guess-correct': '{name} anuncia {numbers}: ¡en el blanco!',
  'log.guess-wrong': '{name} anuncia {numbers}: no era eso.',
  'log.player-eliminated': '{name} queda fuera de la carrera. Siguen {remaining} en juego.',
  'log.player-left': '{name} ha salido de la partida.',
  'log.player-connected': '{name} ha vuelto.',
  'log.player-disconnected': '{name} ya no está en línea.',
  'log.game-over-winner': '¡CONSTELACIÓN! ¡Victoria para {name}!',
  'log.game-over-draw': 'Ningún anuncio ha dado en el blanco: esta vez no gana nadie.',
  'log.game-over-reserve-empty': 'No queda ninguna estrella oculta en el cielo: la partida termina sin victoria.',

  // --- Pregunta sobre una estrella -----------------------------------------
  'hint.title': 'Una pregunta sobre la estrella {tile}',
  'hint.classify': 'SITUAR',
  'hint.classifyText':
    '{name} coloca esta estrella en su sitio entre tus cinco: antes de la primera, entre dos de ellas o después de la última.',
  'hint.compare': 'MEDIR',
  'hint.compareText':
    '{name} te responde SÍ o NO: ¿tiene esta estrella tantos destellos como una de las tuyas?',
  'hint.choosePosition': '¿Cuál de tus estrellas? Aquí solo cuentan los destellos, nunca la constelación.',
  'hint.confirmCompare': 'Preguntar',

  // --- SITUAR (respuesta) --------------------------------------------------
  'classify.title': '{name} te pide que SITÚES la estrella {tile}',
  'classify.instruction': 'Ves las estrellas de {name}. ¿Dónde encaja la estrella {tile} entre ellas?',
  'classify.choose': 'Elige un sitio',
  'classify.confirm': 'Confirmar: {slot}',
  'classify.pickerLabel': 'El sitio de la estrella',
  'classify.slotAria': '{slot}: colocar la estrella {tile} aquí',

  // --- MEDIR (respuesta) ---------------------------------------------------
  'compare.title': '{name} te pide que MIDAS',
  'compare.publicTile': 'Estrella del cielo',
  'compare.positionOf': 'Estrella {position} de {name}',
  'compare.question': '¿Los mismos destellos? La respuesta es {answer}. Confirma para transmitirla.',
  'compare.answer': 'Responder {answer}',
  'compare.yes': 'SÍ',
  'compare.no': 'NO',

  // --- ¡CONSTELACIÓN! ------------------------------------------------------
  'guess.title': '¡CONSTELACIÓN! — tu anuncio',
  'guess.warning':
    'Un solo anuncio por partida. Di tus cinco estrellas: si todas son correctas, ganas en el acto. Si una sola falla, quedas fuera de la carrera, pero sigues respondiendo al resto.',
  'guess.inputAria': 'Número {index} de 5',
  'guess.submit': 'Hacer mi anuncio',
  'guess.confirm': '¿Confirmas estos {count} números? No habrá vuelta atrás.',
  'guess.errorCount': 'Hacen falta exactamente {count} números.',
  'guess.errorRange': 'Cada número va del 1 al {max}.',
  'guess.errorOrder': 'Ordénalos de menor a mayor, sin repetir ninguno.',
  'guess.errorColors': 'Tus cinco estrellas vienen cada una de una constelación distinta.',

  // --- Carta celeste -------------------------------------------------------
  'sheet.title': 'Mi carta celeste',
  'sheet.subtitle': 'Solo para ti: nadie más la ve.',
  'sheet.close': 'Volver al juego',
  'sheet.gridLabel': 'Cuadrícula de los {count} números',
  'sheet.rowLabel': 'Fila {color}',
  'sheet.cellLabel': 'Número {number}, {color}, {points}, {state}',
  'sheet.cellCrossed': 'tachado',
  'sheet.cellAvailable': 'aún posible',
  'sheet.cellRevealed': 'ya revelada en el cielo',
  'sheet.cellHeld': 'en la fila de otra persona',
  'sheet.guessAria': 'Hipótesis {index} de {count}',
  'sheet.legend': 'Toca un número para tacharlo y vuelve a tocarlo para recuperarlo.',
  'sheet.legendRevealed': 'ya revelada en el cielo común',
  'sheet.legendHeld': 'visible en la fila de otra persona: no puede ser tuya',
  'sheet.legendEnd': 'Nada se tacha por ti: el razonamiento es tuyo.',
  'sheet.crossedCount': '{count} / {total} tachados',
  'sheet.useForAnnounce': 'Usar para mi anuncio',
  'sheet.reset': 'Borrar mi carta',
  'sheet.resetTitle': '¿Borrar toda la carta?',
  'sheet.resetText': 'Los números tachados vuelven y tus cinco hipótesis se borran. La partida en sí no cambia.',
  'sheet.resetConfirm': 'Borrarlo todo',
  'sheet.smaller': 'menor',
  'sheet.bigger': 'mayor',

  // --- Fin de la partida ---------------------------------------------------
  'over.winnerYou': '¡Enhorabuena, {name}: has encontrado tu constelación!',
  'over.winnerOther': '¡Victoria para {name}, que ha encontrado su constelación!',
  'over.draw': 'Esta vez no gana nadie. El cielo ha guardado sus secretos.',
  'over.guessLineOk': 'Anuncio de {name}: {numbers}, en el blanco.',
  'over.guessLineKo': 'Anuncio de {name}: {numbers}, no era eso.',
  'over.replay': 'Jugar otra vez',
  'over.waitingReplay': 'Esperando al resto…',
  'over.replayCount': 'Con ganas de otra ronda: {ready} de {total}',
  'over.home': 'Volver al inicio',
  'over.everyoneLeft': 'Todo el mundo ha dejado la mesa.',

  // --- Avisos --------------------------------------------------------------
  'toast.revealed': '{name} revela la estrella {tile}.',
  'toast.yourAnswer': '¡{name} tiene una pregunta para ti!',
  'toast.wrongClassify': 'La estrella ha vuelto a su sitio real.',
  'toast.compareResult': 'Respuesta: {answer} (estrella {tile} y posición {position}).',
  'toast.yourTurn': '¡Te toca!',
  'toast.turnOf': 'Turno de {name}.',
  'toast.guessFailedMine': '¡Casi! Quedas fuera de la carrera, pero sigues respondiendo al resto.',
  'toast.guessFailedOther': 'El anuncio de {name} no era correcto: fuera de la carrera.',
  'toast.joined': '¡{name} se ha sentado a la mesa!',
  'toast.reconnected': '{name} ha vuelto.',
  'toast.playerOffline': '{name} ya no está en línea. La partida espera.',
  'banner.offline': 'Se ha perdido la conexión. Intentando reconectar…',
  'banner.playerOffline': '{name} no está en línea por ahora. La partida se guarda: todo sigue a su vuelta.',
  'banner.playersOffline': 'Sin conexión por ahora: {name}. La partida se guarda hasta su vuelta.',

  // --- Errores -------------------------------------------------------------
  'error.PLAYER_NOT_FOUND': 'No se ha encontrado tu sitio en esta mesa.',
  'error.NOT_YOUR_TURN': 'Todavía no es tu turno.',
  'error.WRONG_PHASE': 'Eso no es posible ahora mismo.',
  'error.INVALID_COLOR': 'Esa constelación no existe.',
  'error.COLOR_EXHAUSTED': 'No queda ninguna estrella oculta en esta constelación.',
  'error.TILE_NOT_PUBLIC': 'Esta estrella ya no está en el cielo común.',
  'error.INVALID_POSITION': 'Esa posición no existe.',
  'error.INVALID_SLOT': 'Ese sitio no existe.',
  'error.NOT_RESPONDER': 'Esta pregunta es para otra persona.',
  'error.GUESS_ALREADY_USED': 'Ya has hecho tu anuncio.',
  'error.INVALID_GUESS': 'Este anuncio no es válido.',
  'error.PLAYER_ELIMINATED': 'Ya has hecho tu anuncio.',
  'error.GAME_OVER': 'La partida ha terminado.',
  'error.NOT_ENOUGH_PLAYERS': 'Hacen falta al menos dos personas para jugar.',
  'error.ROOM_NOT_FOUND': 'Ninguna partida coincide con este código. Quizá haya caducado.',
  'error.ROOM_FULL': 'Esta mesa está completa: ya juegan cuatro personas.',
  'error.ROOM_STARTED': 'Esta partida ya ha empezado. ¡Pide el código de la siguiente!',
  'error.ROOM_FINISHED': 'Esta partida ha terminado.',
  'error.NAME_TAKEN': 'Alguien de esta mesa ya usa ese nombre.',
  'error.BAD_TOKEN': 'No se ha encontrado tu sitio: vuelve a unirte con el código.',
  'error.SERVER_BUSY': 'Hay mucha gente ahora mismo. Inténtalo de nuevo en un momento.',
  'error.INVALID_NAME': 'Este nombre no es válido.',
  'error.INVALID_CODE': 'Este código no es válido.',
  'error.network': 'Sin respuesta. Comprueba tu conexión e inténtalo de nuevo.',

  // --- Reglas --------------------------------------------------------------
  'howto.title': 'Cómo se juega a NOCTALIS',
  'howto.intro':
    'Cada persona recibe cinco estrellas secretas. Ahí está la gracia: ves las estrellas del resto, pero nunca las tuyas. Tu reto es descubrirlas con las pistas que te da la mesa y nombrarlas antes que nadie.',
  'howto.stars.title': 'Sesenta estrellas, cinco constelaciones',
  'howto.stars.text':
    'Las estrellas llevan un número del 1 al 60. Ese número lo decide todo: su constelación (se van turnando: 1 para Lira, 2 para Aurora, y así sucesivamente) y sus destellos, uno, dos o tres, dibujados bajo el número.',
  'howto.setup.title': 'Tus cinco estrellas',
  'howto.setup.text':
    'Tienes una estrella de cada constelación, ordenadas del número más pequeño al más grande. Ves su constelación y su lugar en la fila, nunca su número. El resto de la mesa, en cambio, las lee sin ningún problema.',
  'howto.turn.title': 'Tu turno, en dos gestos',
  'howto.turn.text':
    'Primero, revela una estrella: elige una constelación y aparecerá en el cielo común una de sus estrellas ocultas. Después, elige cualquier estrella del cielo común y haz una pregunta sobre ella. Te responde la persona sentada a continuación: ella ve tus estrellas.',
  'howto.place.title': 'SITUAR',
  'howto.place.text':
    'La estrella elegida se coloca en su sitio entre tus cinco: antes de la primera, entre dos de ellas o después de la última. Así sabes dónde encajaría en tu fila.',
  'howto.gauge.title': 'MEDIR',
  'howto.gauge.text':
    'Señala una de tus estrellas: la respuesta es SÍ si la estrella elegida tiene los mismos destellos, y NO si no. Aquí solo cuentan los destellos, nunca la constelación.',
  'howto.used.text':
    'Una estrella que ya ha servido para una pregunta deja el cielo común y se queda junto a tu fila, como recuerdo de lo que has aprendido.',
  'howto.chart.title': 'Tu carta celeste',
  'howto.chart.text':
    'Es tu cuaderno secreto: los sesenta números, una fila por constelación. Tacha lo que no puede ser tuyo y apunta tus hipótesis arriba. Las estrellas ya reveladas y las que ves en otras filas llevan una pequeña marca, pero nunca se tacha nada por ti.',
  'howto.call.title': '¡CONSTELACIÓN!',
  'howto.call.text':
    'En cuanto creas conocer tus cinco estrellas, anúncialas, en tu turno o en el de cualquier otra persona. Solo tienes un anuncio. Cinco de cinco: ganas al instante. Un solo fallo: quedas fuera de la carrera, pero sigues respondiendo a las preguntas del resto.',
  'howto.table.title': 'Con tres o cuatro personas',
  'howto.table.text':
    'Los turnos van pasando alrededor de la mesa, y quien se sienta a continuación responde a tus preguntas. Si se ausenta, toma el relevo la siguiente persona. Quien deja la partida simplemente sale de la ronda.',
  'howto.end.title': '¿Cuándo termina la partida?',
  'howto.end.text':
    'En cuanto alguien acierta su anuncio. Si todos los anuncios fallan, o si el cielo se queda sin estrellas ocultas, no gana nadie, y siempre se puede jugar otra ronda.',

  // --- Tutorial ------------------------------------------------------------
  'onboarding.title': 'Te damos la bienvenida',
  'onboarding.skip': 'Saltar',
  'onboarding.next': 'Siguiente',
  'onboarding.play': '¡A jugar!',
  'onboarding.step': 'Paso {current} de {total}',
  'onboarding.1.title': 'Estas son tus estrellas',
  'onboarding.1.text':
    'Abajo en la pantalla. Ves su constelación y su orden, pero no su número: ahí está todo el misterio.',
  'onboarding.2.title': 'Las estrellas del resto',
  'onboarding.2.text':
    'Arriba, boca arriba. Lees sus números, y el resto de la mesa lee los tuyos. Nadie conoce los propios.',
  'onboarding.3.title': 'El cielo común',
  'onboarding.3.text':
    'En el centro. En tu turno, revela aquí una estrella más y luego haz una pregunta sobre cualquiera de ellas.',
  'onboarding.4.title': 'SITUAR',
  'onboarding.4.text':
    '¿Dónde encajaría esta estrella entre tus cinco? La persona siguiente te muestra el sitio exacto.',
  'onboarding.5.title': 'MEDIR',
  'onboarding.5.text': '¿Tiene esta estrella tantos destellos como una de las tuyas? SÍ o NO.',
  'onboarding.6.title': 'Tu carta celeste',
  'onboarding.6.text': 'Tacha números, apunta tus hipótesis. Es solo tuya.',
  'onboarding.7.title': '¡CONSTELACIÓN!',
  'onboarding.7.text': 'Un solo anuncio por partida: nombra tus cinco estrellas cuando tengas la certeza. ¡Buena observación!',
};
