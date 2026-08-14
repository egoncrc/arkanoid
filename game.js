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

const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_WIDTH = 76;
const BLOCK_HEIGHT = 28;
const BLOCK_GAP = 4;
const BLOCK_TOP_MARGIN = 40;
const BLOCK_COLORS = [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ];

function initBlocks() {
  const totalWidth = BLOCK_COLS * BLOCK_WIDTH + ( BLOCK_COLS - 1 ) * BLOCK_GAP;
  const leftMargin = ( canvas.width - totalWidth ) / 2;
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        x: leftMargin + col * ( BLOCK_WIDTH + BLOCK_GAP ),
        y: BLOCK_TOP_MARGIN + row * ( BLOCK_HEIGHT + BLOCK_GAP ),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: BLOCK_COLORS[ row ],
        alive: true,
      } );
    }
  }
  return blocks;
}

function drawStartScreen() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '20px sans-serif';
  ctx.fillText( 'Presiona ESPACIO o clic para empezar', canvas.width / 2, canvas.height / 2 );
}

function drawBlocks() {
  state.blocks.forEach( ( block ) => {
    if ( block.alive ) {
      drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
    }
  } );
}

function drawPaddle() {
  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height );
}

function drawBall() {
  drawSprite( ctx, 'ball', state.ball.x, state.ball.y, state.ball.width, state.ball.height );
}

function movePaddleTo( x ) {
  state.paddle.x = Math.max( 0, Math.min( canvas.width - state.paddle.width, x ) );
}

function startGame() {
  if ( state.screen !== 'start' ) return;
  state.blocks = initBlocks();
  state.screen = 'playing';
}

function launchBall() {
  const angle = Math.PI / 4; // 45 grados
  state.ball.dx = state.ball.speed * Math.cos( angle );
  state.ball.dy = -state.ball.speed * Math.sin( angle );
  state.ball.attached = false;
}

function handleLaunchInput() {
  if ( state.screen === 'start' ) {
    startGame();
  } else if ( state.screen === 'playing' && state.ball.attached ) {
    launchBall();
  }
}

const keys = { ArrowLeft: false, ArrowRight: false };

function updatePaddle() {
  if ( keys.ArrowLeft ) {
    movePaddleTo( state.paddle.x - state.paddle.speed );
  }
  if ( keys.ArrowRight ) {
    movePaddleTo( state.paddle.x + state.paddle.speed );
  }
}

function updateBall() {
  if ( state.ball.attached ) {
    state.ball.x = state.paddle.x + state.paddle.width / 2 - state.ball.width / 2;
  } else {
    state.ball.x += state.ball.dx;
    state.ball.y += state.ball.dy;
  }
}

function update() {
  if ( state.screen === 'playing' ) {
    updatePaddle();
    updateBall();
  }
}

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );
  if ( state.screen === 'start' ) {
    drawStartScreen();
  } else if ( state.screen === 'playing' ) {
    drawBlocks();
    drawPaddle();
    drawBall();
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

document.addEventListener( 'keydown', ( e ) => {
  if ( e.code === 'Space' ) {
    handleLaunchInput();
  }
  if ( e.code === 'ArrowLeft' || e.code === 'ArrowRight' ) {
    keys[ e.code ] = true;
  }
} );

document.addEventListener( 'keyup', ( e ) => {
  if ( e.code === 'ArrowLeft' || e.code === 'ArrowRight' ) {
    keys[ e.code ] = false;
  }
} );

canvas.addEventListener( 'click', () => {
  handleLaunchInput();
} );

canvas.addEventListener( 'mousemove', ( e ) => {
  if ( state.screen !== 'playing' ) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  movePaddleTo( mouseX - state.paddle.width / 2 );
} );

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );
