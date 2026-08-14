const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const state = {
  screen: 'start',      // 'start' | 'playing' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  paddle: {
    x: 320,             // esquina superior izquierda, origen top-left
    y: 560,
    width: 162,          // dimensión nativa del sprite paddle
    height: 14,
    speed: 8,            // px/frame al mover con teclado
  },
  ball: {
    x: 393,
    y: 546,
    width: 16,            // dimensión nativa del sprite ball
    height: 16,
    dx: 0,
    dy: 0,
    speed: 5,             // magnitud de velocidad en px/frame mientras está en juego
    attached: true,       // true = pegada a la paleta, esperando lanzamiento
  },
  blocks: [
    // { x, y, width: 32, height: 16, color: 'red', alive: true }
  ],
};

function drawStartScreen() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '20px sans-serif';
  ctx.fillText( 'Presiona ESPACIO o clic para empezar', canvas.width / 2, canvas.height / 2 );
}

loadSpritesheet( () => {
  drawStartScreen();
} );
