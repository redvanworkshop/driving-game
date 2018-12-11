(function(){
  var $ = {
    audio: {
      loop: null,
      highScore: null,
      gameOver: null,
      paused: false
    },
    canvas: null,
    ctx: null,
    canvas2: null,
    ctx2: null,
    colors: {
      sky: "#D4F5FE",
      mountains: "#83CACE",
      ground: "#8FC04C",
      groundDark: "#73B043",
      road: "#606a7c",
      roadLine: "#FFF",
      hud: "#FFF"
    },
    restart: {
      x: 30,
      y: 390,
      w: 90,
      h: 30
    },
    score: {
      total: 0,
      high: localStorage.getItem('high-score') || 0,
      x: 510,
      y: 395,
      w: 240,
      h: 55
    },
    settings: {
      fps: 60,
      skySize: 120,
      ground: {
        size: 350,
        min: 2,
        max: 120
      },
      road: {
        min: 76,
        max: 700,
      }
    },
    state: {
      isMobile: false,
      bgpos: 0,
      breaking: true,
      crashed: false,
      offset: 0,
      startDark: true,
      playedGameOver: false,
      playedHighScore: false,
      playingMusic: false,
      curve: 0,
      currentCurve: 0,
      turn: 1,
      speed: 0,
      xpos: 0,
      section: 50,
      van: {
        maxSpeed: 50,
        friction: 0.4,
        acc: 0.65,
        deAcc: 0.5
      },
      keypress: {
        up: false,
        left: false,
        right: false,
        down: false
      }
    },
    storage: {
      bg: null
    }
  };

  $.canvas = document.getElementById('driving-game');
  $.ctx = $.canvas.getContext('2d');

  $.canvas2 = document.createElement('canvas');
  $.canvas2.width = $.canvas.width;
  $.canvas2.height = $.canvas.height;
  $.ctx2 = $.canvas2.getContext('2d');

  window.addEventListener('deviceorientation', handleOrientation, false);
  window.addEventListener('keydown', keyDown, false);
  window.addEventListener('keyup', keyUp, false);
  window.addEventListener('touchend', touchEnd, false);
  window.addEventListener('touchstart', touchStart, false);
  window.addEventListener('focus', audioStart);
  window.addEventListener('blur', audioStop);

  window.onload = function () {
    setupAudio();
    drawBg();
    draw();
  };

  function audioStart () {
    if($.audio.paused) {
      $.audio.paused = false;
      $.audio.loop.play()
    }
  }

  function audioStop () {
    if($.audio.loop.playing()) {
      $.audio.paused = true;
      $.audio.loop.pause()
    }
  }

  function buildVan() {
    var vanWidth = 160,
      vanHeight = 60,
      vanX = ($.canvas.width / 2) - (vanWidth / 2),
      vanY = 320;

    roundedRect($.ctx, "rgba(0, 0, 0, 0.15)", vanX - 1 + $.state.turn, vanY + (vanHeight - 60), vanWidth + 10, vanHeight, 9);

    drawVan($.ctx, (vanX - 1 + $.state.turn));
  }

  function calcMovement() {
    if ($.state.crashed) {
      return
    }

    var move = $.state.speed * 0.01,
      newCurve = 0;

    if ($.state.keypress.up) {
      $.state.speed += $.state.van.acc - ($.state.speed * 0.015);
    } else if ($.state.speed > 0) {
      $.state.speed -= $.state.van.friction;
    }

    if ($.state.keypress.down && $.state.speed > 0) {
      $.state.speed -= 1;
    }

    // Left and right
    $.state.xpos -= ($.state.currentCurve * $.state.speed) * 0.005;

    if ($.state.speed) {
      if ($.state.keypress.left) {
        $.state.xpos += (Math.abs($.state.turn) + 7 + ($.state.speed > $.state.van.maxSpeed / 4 ? ($.state.van.maxSpeed - ($.state.speed / 2)) : $.state.speed)) * 0.2;
        $.state.turn -= 1;
      }

      if ($.state.keypress.right) {
        $.state.xpos -= (Math.abs($.state.turn) + 7 + ($.state.speed > $.state.van.maxSpeed / 4 ? ($.state.van.maxSpeed - ($.state.speed / 2)) : $.state.speed)) * 0.2;
        $.state.turn += 1;
      }

      if ($.state.turn !== 0 && !$.state.keypress.left && !$.state.keypress.right) {
        $.state.turn += $.state.turn > 0 ? -0.25 : 0.25;
      }
    }

    $.state.turn = clamp($.state.turn, -5, 5);
    $.state.speed = clamp($.state.speed, 0, $.state.van.maxSpeed);

    // section
    $.state.section -= $.state.speed;

    if ($.state.section < 0) {
      $.state.section = randomRange(1000, 9000);

      newCurve = randomRange(-100, 100);

      if (Math.abs($.state.curve - newCurve) < 20) {
        newCurve = randomRange(-100, 100);
      }

      $.state.curve = newCurve;
    }

    if ($.state.currentCurve < $.state.curve && move < Math.abs($.state.currentCurve - $.state.curve)) {
      $.state.currentCurve += move;
    } else if ($.state.currentCurve > $.state.curve && move < Math.abs($.state.currentCurve - $.state.curve)) {
      $.state.currentCurve -= move;
    }

    var score = ($.score.total > 0) ? $.score.total : 1;
    var difficulty = Math.floor(400 * (100 - ($.score.total / 1000)) * 0.01);

    if (difficulty < 80) {
      difficulty = 80
    }

    if (Math.abs($.state.xpos) > difficulty) {
      crashed();
    }

    $.state.xpos = clamp($.state.xpos, -650, 650);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function crashed () {
    $.state.breaking = true;
    $.state.crashed = true;
    $.state.speed = 0;

    setTimeout(showUserForm, 1000);
  }

  function draw() {
    setTimeout(function() {
      calcMovement();

      $.state.bgpos += ($.state.currentCurve * 0.02) * ($.state.speed * 0.2);
      $.state.bgpos = $.state.bgpos % $.canvas.width;

      $.score.total += Math.abs(($.state.currentCurve * 0.02) * ($.state.speed * 0.2));

      $.ctx.putImageData($.storage.bg, $.state.bgpos, 5);
      $.ctx.putImageData($.storage.bg, $.state.bgpos > 0 ? $.state.bgpos - $.canvas.width : $.state.bgpos + $.canvas.width, 5);

      $.state.offset += $.state.speed * 0.05;

      if ($.state.offset > $.settings.ground.min) {
        $.state.offset = $.settings.ground.min - $.state.offset;
        $.state.startDark = !$.state.startDark;
      }

      var score = ($.score.total > 0) ? $.score.total : 1;
      var max = Math.floor($.settings.road.max * (100 - ($.score.total / 1000)) * 0.01);
      var min = Math.floor($.settings.road.min * (100 - ($.score.total / 1000)) * 0.01);

      if (max < $.settings.road.max * 0.25) {
        max = $.settings.road.max * 0.25
      }
      if (min < $.settings.road.min * 0.25) {
        min = $.settings.road.min * 0.25
      }

      drawGround($.ctx, $.state.offset, $.colors.ground, $.colors.groundDark, $.canvas.width);
      drawRoad(min + 6, max + 36, 10, $.colors.roadLine);
      drawGround($.ctx2, $.state.offset, $.colors.roadLine, $.colors.road, $.canvas.width);
      drawRoad(min, max, 10, $.colors.road);

      // draw stripes on the road if the road is wide enough
      if (score < 45000) {
        drawRoad(3, 24, 0, $.ctx.createPattern($.canvas2, 'repeat'));
      }

      buildVan();
      drawHUD($.ctx, 630, 340, $.colors.hud);

      drawScore($.ctx);
      drawHighScore($.ctx);
      drawGameOver($.ctx);
      showInstructions($.ctx);

      requestAnimationFrame(draw);
    }, 1000 / $.settings.fps);
  }

  function drawBg() {
    $.ctx.fillStyle = $.colors.sky;
    $.ctx.fillRect(0, 0, $.canvas.width, $.settings.skySize);
    drawMountain(0, 60, 200);
    drawMountain(280, 40, 200);
    drawMountain(400, 80, 200);
    drawMountain(550, 60, 200);

    $.storage.bg = $.ctx.getImageData(0, 0, $.canvas.width, $.canvas.height);
  }

  function drawGround(ctx, offset, lightColor, darkColor, width) {
    var pos = ($.settings.skySize - $.settings.ground.min) + offset,
      stepSize = 1,
      drawDark = $.state.startDark,
      firstRow = true;
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, $.settings.skySize, width, $.settings.ground.size);

    ctx.fillStyle = darkColor;
    while (pos <= $.canvas.height) {
      stepSize = norm(pos, $.settings.skySize, $.canvas.height) * $.settings.ground.max;
      if (stepSize < $.settings.ground.min) {
        stepSize = $.settings.ground.min;
      }

      if (drawDark) {
        if (firstRow) {
          ctx.fillRect(0, $.settings.skySize, width, stepSize - (offset > $.settings.ground.min ? $.settings.ground.min : $.settings.ground.min - offset));
        } else {
          ctx.fillRect(0, pos < $.settings.skySize ? $.settings.skySize : pos, width, stepSize);
        }
      }

      firstRow = false;
      pos += stepSize;
      drawDark = !drawDark;
    }
  }

  function drawHighScore(ctx) {
    var score = Math.floor($.score.total);
    var highScore = Math.floor($.score.high);
    var showScore = ($.state.crashed && score > highScore) ? score : highScore;

    if (!$.state.playedHighScore && score > highScore && highScore > 0) {
      $.state.playedHighScore = true;
      $.audio.highScore.play();
    }

    if ($.state.speed > 0 || $.score.total > 0) {
      ctx.beginPath();
      ctx.fillStyle = ($.state.crashed && score > highScore) ? '#FFF' : 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 12px "Press Start 2P"';
      ctx.fillText('HIGH:', 542.5, 438);

      ctx.beginPath();
      ctx.fillStyle = ($.state.crashed && score > highScore) ? '#FFF' : 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 12px "Press Start 2P"';
      ctx.fillText(showScore.toLocaleString(), 610, 438);
    }
  }

  function drawHUD(ctx, centerX, centerY, color) {
    var radius = 50,
      tigs = [0, 90, 135, 180, 225, 270, 315],
      angle = 90;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.lineWidth = 7;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    for (var i = 0; i < tigs.length; i++) {
      drawTig(ctx, centerX, centerY, radius, tigs[i], 7);
    }

    // draw pointer
    angle = map($.state.speed, 0, $.state.van.maxSpeed, 90, 360);
    drawPointer(ctx, color, 50, centerX, centerY, angle);
  }

  function drawMountain(pos, height, width) {
    $.ctx.fillStyle = $.colors.mountains;
    $.ctx.strokeStyle = $.colors.mountains;
    $.ctx.lineJoin = "round";
    $.ctx.lineWidth = 20;
    $.ctx.beginPath();
    $.ctx.moveTo(pos, $.settings.skySize);
    $.ctx.lineTo(pos + (width / 2), $.settings.skySize - height);
    $.ctx.lineTo(pos + width, $.settings.skySize);
    $.ctx.closePath();
    $.ctx.stroke();
    $.ctx.fill();
  }

  function drawPointer(ctx, color, radius, centerX, centerY, angle) {
    var point = getCirclePoint(centerX, centerY, radius - 20, angle),
      point2 = getCirclePoint(centerX, centerY, 2, angle + 90),
      point3 = getCirclePoint(centerX, centerY, 2, angle - 90);

    ctx.beginPath();
    ctx.strokeStyle = "#FF9166";
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.moveTo(point2.x, point2.y);
    ctx.lineTo(point.x, point.y);
    ctx.lineTo(point3.x, point3.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 9, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawGameOver(ctx) {
    if ($.state.crashed) {
      if (!$.state.playedGameOver) {
        $.state.playedGameOver = true;
        $.audio.gameOver.play();
        $.audio.loop.fade(1, 0.25, 500);
      }

      ctx.beginPath();
      ctx.fillStyle = 'black';
      ctx.font = 'bold 60px "Press Start 2P"';
      ctx.fillText('GAME OVER', 110, 200);
    }
  }

  function drawRoad(min, max, squishFactor, color) {
    var basePos = $.canvas.width + $.state.xpos;

    $.ctx.fillStyle = color;
    $.ctx.beginPath();
    $.ctx.moveTo(((basePos + min) / 2) - ($.state.currentCurve * 3), $.settings.skySize);
    $.ctx.quadraticCurveTo((((basePos / 2) + min)) + ($.state.currentCurve / 3) + squishFactor, $.settings.skySize + 52, (basePos + max) / 2, $.canvas.height);
    $.ctx.lineTo((basePos - max) / 2, $.canvas.height);
    $.ctx.quadraticCurveTo((((basePos / 2) - min)) + ($.state.currentCurve / 3) - squishFactor, $.settings.skySize + 52, ((basePos - min) / 2) - ($.state.currentCurve * 3), $.settings.skySize);
    $.ctx.closePath();
    $.ctx.fill();
  }

  function drawScore(ctx) {
    var score = Math.floor($.score.total);

    if ($.state.speed > 0 || $.score.total > 0) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect($.score.x, $.score.y, $.score.w, $.score.h);

      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 14px "Press Start 2P"';
      ctx.fillText('SCORE:', 520, 420);

      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px "Press Start 2P"';
      ctx.fillText(score.toLocaleString(), 610, 421);
    }
  }

  function drawSky() {
    $.ctx.fillStyle = $.colors.sky;
    $.ctx.fillRect(0, 0, $.canvas.width, $.settings.skySize);
  }

  function drawTig(ctx, x, y, radius, angle, size) {
    var startPoint = getCirclePoint(x, y, radius - 4, angle),
      endPoint = getCirclePoint(x, y, radius - size, angle)

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  }

  function drawVan(ctx, offset) {
    var breaks = ($.state.breaking || $.state.speed === 0) ? '#FF0000' : '#FF6600';

    var tires = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100.22 21.23"><g data-name="Layer 2"><g data-name="Layer 1"><path d="M88.49 1.74h-2A1.43 1.43 0 0 1 85 .3V0H15.29v.3a1.43 1.43 0 0 1-1.44 1.44h-2a1.42 1.42 0 0 1-1.17-.6V8.3h2.12V2.84h1.28v1.22h1.71V5.6h3.65V2.5h-.69V1.21h2.83a8.47 8.47 0 0 0 7.68 4.89h42.33a8.47 8.47 0 0 0 7.68-4.89h2.08V2.5h-.69v3.1h3.65V4.06H86V2.84h1.3V8.3h2.26v-7a1.46 1.46 0 0 1-1.07.44z" fill="#454141"/><path d="M10.39 0H0v16.22a4.33 4.33 0 0 0 1.66 3.45 1.75 1.75 0 0 0 1.69 1.56h4A1.75 1.75 0 0 0 9 19.66a4.35 4.35 0 0 0 1.65-3.45V1.14a1.4 1.4 0 0 1-.26-.84zM89.93 0v.3a1.44 1.44 0 0 1-.37 1v15a4.33 4.33 0 0 0 1.65 3.45 1.76 1.76 0 0 0 1.69 1.56h4a1.75 1.75 0 0 0 1.7-1.57 4.38 4.38 0 0 0 1.65-3.45V0H89.93z" fill="#222426"/></g></g></svg>';

    var mirrors = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 116 12.47"><g data-name="Layer 2"><g data-name="Layer 1"><path fill="#58595b" d="M104.248 11.482l5.041-5.042.707.707-5.041 5.042zM5.52 7.43l.707-.708 5.041 5.043-.707.707z"/><circle cx="4.08" cy="4.08" r="4.08" fill="#c7cecf"/><circle cx="111.92" cy="4.08" r="4.08" fill="#c7cecf"/></g></g></svg>';

    var van = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 117.84 108.23"><defs><linearGradient id="a" x1="5.53" y1="26.47" x2="22.83" y2="26.47" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#bbc6cd"/><stop offset="1" stop-color="#9faeb7"/></linearGradient><linearGradient id="b" x1="30.44" y1="26.51" x2="87.4" y2="26.51" xlink:href="#a"/><linearGradient id="c" x1="94.64" y1="26.51" x2="111.95" y2="26.51" xlink:href="#a"/></defs><g data-name="Layer 2"><g data-name="Layer 1"><g data-name="Van Body"><path d="M113.57 45.47l-1.31-5.87a.65.65 0 0 1-.38.13H97.17a3.12 3.12 0 0 1-3.12-3.12v-20.2a3.12 3.12 0 0 1 3.12-3.12H106C101.94 5 90.33 0 59 0h-.37C27.2 0 15.59 5 11.5 13.29h8.86a3.12 3.12 0 0 1 3.12 3.12v20.2a3.12 3.12 0 0 1-3.12 3.12H5.65a.69.69 0 0 1-.35-.11L4 45.47zM29.15 16.41a3.12 3.12 0 0 1 3.12-3.12h53.3a3.12 3.12 0 0 1 3.12 3.12v20.2a3.12 3.12 0 0 1-3.12 3.12h-53.3a3.12 3.12 0 0 1-3.12-3.12z" fill="#f7f3ed"/><path d="M7.38 88.81H19.1a2.45 2.45 0 0 1 4.9 0v8.41h69.74v-8.38a2.45 2.45 0 0 1 4.9 0h11.86a6.1 6.1 0 0 1 4.31 1.78c.49-4.59.9-10.27 1-16.93h1.34a1.49 1.49 0 0 0-1.32-1.42v-1.35h1.22a1.47 1.47 0 0 0-1.22-1.4v-1.37H117a1.47 1.47 0 0 0-1.15-1.39v-1.38h1.09a1.48 1.48 0 0 0-1.15-1.38c0-.46 0-.93-.05-1.39h1.08a1.49 1.49 0 0 0-1.13-1.39l-.06-1.38h1.11a1.48 1.48 0 0 0-1.18-1.4l-.09-1.44h1.18a1.46 1.46 0 0 0-1.29-1.41l-.12-1.36h1.33a1.49 1.49 0 0 0-1.47-1.43c0-.46-.11-.9-.16-1.34h1.55a1.48 1.48 0 0 0-1.49-1.39h-.3a19 19 0 0 0-1.41-5.2H4.33a19.34 19.34 0 0 0-1.41 5.2 1.49 1.49 0 0 0-1.43 1.43h1.22c-.06.44-.12.89-.17 1.36a1.49 1.49 0 0 0-1.27 1.41h1.12c0 .46-.08.92-.12 1.4A1.48 1.48 0 0 0 1.19 57h1c0 .47-.07 1-.09 1.43a1.48 1.48 0 0 0-1 1.34H2l-.06 1.45A1.47 1.47 0 0 0 1 62.58h.88v1.45a1.5 1.5 0 0 0-.92 1.32h.89v1.44a1.5 1.5 0 0 0-.95 1.33h.94v1.42a1.48 1.48 0 0 0-1 1.35h1v1.39a1.49 1.49 0 0 0-1.17 1.38h1.14c.11 6.78.54 12.53 1 17.16a6.11 6.11 0 0 1 4.57-2.01z" fill="#ec2027"/><path d="M20.36 13.93h-9a6.75 6.75 0 0 0-.67 1.89C10.47 17 5.53 39.09 5.53 39.09h14.83a2.48 2.48 0 0 0 2.47-2.48v-20.2a2.48 2.48 0 0 0-2.47-2.48z" fill="none"/><path fill="#b3b5b8" d="M4.53 41.29h108.41v2.07H4.53z"/><path d="M13.27 11.65c-.52 0-1-.4-1-.74 0-.33.15-.48.47-.48h92.46c.32 0 .47.15.47.48 0 .34-.54.74-1.05.74z" fill="#c7cecf"/><path d="M114 97.31z" fill="none"/><path d="M110.5 91.46H98.64v5.79h14.58a4.37 4.37 0 0 1 .72.06v-2.42a3.45 3.45 0 0 0-3.44-3.43zM3.93 94.89v2.41a5.09 5.09 0 0 1 .69 0H19.1v-5.84H7.38a3.44 3.44 0 0 0-3.45 3.43z" fill="#ec2027"/><path d="M110.5 91.46H98.64v5.79h14.58a4.37 4.37 0 0 1 .72.06v-2.42a3.45 3.45 0 0 0-3.44-3.43zM7.38 91.46a3.44 3.44 0 0 0-3.45 3.43v2.41a5.09 5.09 0 0 1 .69 0h4.09v-5.84z" fill="none"/><path d="M7.38 91.46a3.44 3.44 0 0 0-3.45 3.43v2.41a5.09 5.09 0 0 1 .69 0H19.1v-5.84H7.38zM110.5 91.46h-1.57v5.79h4.29a4.37 4.37 0 0 1 .72.06v-2.42a3.45 3.45 0 0 0-3.44-3.43z" fill="none"/><path d="M70.7 73.79H47.14a3.72 3.72 0 0 0-3.66 3.07l-2.31 13h35.5l-2.31-13a3.72 3.72 0 0 0-3.66-3.07z" fill="#bc2027"/><path d="M99.15 76.35A4.33 4.33 0 0 0 95 80.83v3.74a4.16 4.16 0 1 0 8.29 0v-3.74a4.33 4.33 0 0 0-4.14-4.48z" fill="#414042"/><path d="M95.81 84.57a3.51 3.51 0 0 0 3.33 3.66 3.51 3.51 0 0 0 3.34-3.66v-3.19h-6.67z" fill="' + breaks + '"/><path d="M99.14 77.17a3.51 3.51 0 0 0-3.33 3.66v.55h6.67v-.55a3.51 3.51 0 0 0-3.34-3.66z" fill="#FFCC00"/><path d="M18.62 76.35a4.33 4.33 0 0 0-4.15 4.48v3.74a4.33 4.33 0 0 0 4.15 4.48 4.33 4.33 0 0 0 4.15-4.48v-3.74a4.33 4.33 0 0 0-4.15-4.48z" fill="#414042"/><path d="M15.28 84.57a3.51 3.51 0 0 0 3.34 3.66A3.51 3.51 0 0 0 22 84.57v-3.19h-6.72z" fill="' + breaks + '"/><path d="M18.62 77.17a3.51 3.51 0 0 0-3.34 3.66v.55H22v-.55a3.51 3.51 0 0 0-3.38-3.66z" fill="#FFCC00"/><path fill="#f7f3ed" d="M48.52 75.75h20.8v12.2h-20.8z"/><path d="M92 63.9H25.88a.26.26 0 0 1-.25-.26V11.91a.26.26 0 1 1 .51 0v51.47H91.7V11.91a.26.26 0 1 1 .51 0v51.73a.26.26 0 0 1-.21.26z" fill="#332f2f" opacity=".1"/><path d="M59.57 94.74a.75.75 0 1 1-.75-.75.75.75 0 0 1 .75.75z" fill="#414042"/><path d="M51.54 79.26a6.83 6.83 0 0 1 1.27-.11 2.11 2.11 0 0 1 1.49.42 1.29 1.29 0 0 1 .41 1 1.35 1.35 0 0 1-1 1.31 1.27 1.27 0 0 1 .75 1 7.93 7.93 0 0 0 .4 1.41h-.66a6.4 6.4 0 0 1-.34-1.22c-.15-.71-.43-1-1-1h-.66v2.22h-.66zm.66 2.34h.68c.71 0 1.16-.39 1.16-1s-.48-1-1.18-1a2.84 2.84 0 0 0-.66.06zM57.36 84.33l-1.68-5.14h.72l.8 2.53c.22.7.41 1.32.55 1.93.15-.6.36-1.25.59-1.92l.87-2.54h.71l-1.84 5.14zM61.91 84.33l-1.3-5.14h.7l.61 2.6c.15.64.29 1.28.38 1.78.09-.51.25-1.12.42-1.78l.69-2.6h.69l.63 2.61c.14.61.28 1.22.36 1.76.11-.56.25-1.13.42-1.77l.67-2.6h.68l-1.45 5.14h-.7l-.65-2.67a15.87 15.87 0 0 1-.31-1.66 16.11 16.11 0 0 1-.39 1.68l-.74 2.67z" fill="#58595b"/><path d="M91.94 97.46a.25.25 0 0 1-.26-.26V67.81H26.12V97.2a.26.26 0 1 1-.51 0V67.55a.26.26 0 0 1 .26-.26h66.07a.26.26 0 0 1 .25.26V97.2a.25.25 0 0 1-.25.26z" fill="#332f2f" opacity=".1"/><g fill="#c7cecf"><path d="M34.53 66.17h4.46v2.72h-4.46zM78.85 66.17h4.46v2.72h-4.46zM58.5 61.27l-3-.36c-.24 0-.42-.32-.42-.66 0-.35.18-.64.42-.67l3-.36h.84l3 .36c.24 0 .42.32.42.67 0 .34-.18.63-.42.66l-3 .36z"/></g><path data-name="Rear Bumper" d="M116.6 98.73v-3.84a6 6 0 0 0-1.79-4.3 6.1 6.1 0 0 0-4.31-1.78H98.64a2.26 2.26 0 0 0-.11-.69 2.45 2.45 0 0 0-4.79.72v8.41H24v-8.41a2.45 2.45 0 0 0-4.83-.56 2.33 2.33 0 0 0-.07.53H7.38a6.11 6.11 0 0 0-4.53 2 6 6 0 0 0-1.58 4.07v3.8a4.62 4.62 0 0 0 3.35 7.8H19.1v.3a1.4 1.4 0 0 0 .27.84 1.42 1.42 0 0 0 1.17.6h2a1.43 1.43 0 0 0 1.46-1.43v-.3h69.74v.3a1.43 1.43 0 0 0 1.44 1.44h2a1.46 1.46 0 0 0 1.07-.47 1.42 1.42 0 0 0 .37-1v-.3h14.58a4.61 4.61 0 0 0 3.38-7.76zm-97.5-1.48H4.62a5.09 5.09 0 0 0-.69 0v-2.36a3.44 3.44 0 0 1 3.45-3.43H19.1zm94.85 0v.11a4.37 4.37 0 0 0-.72-.06H98.64v-5.84h11.86a3.45 3.45 0 0 1 3.5 3.43z" fill="#f7f3ed"/><path d="M20.36 13.89h-9a6.75 6.75 0 0 0-.67 1.89c-.24 1.16-5.18 23.27-5.18 23.27h14.85a2.48 2.48 0 0 0 2.47-2.48v-20.2a2.48 2.48 0 0 0-2.47-2.48z" opacity=".5" fill="url(#a)"/><rect x="30.44" y="14.58" width="56.96" height="23.86" rx="1.83" opacity=".5" fill="url(#b)"/><path d="M106.76 15.82a6.75 6.75 0 0 0-.67-1.89h-9a2.48 2.48 0 0 0-2.48 2.48v20.2a2.48 2.48 0 0 0 2.48 2.48H112s-5-22.09-5.24-23.27z" opacity=".5" fill="url(#c)"/><g data-name="Window Frames" fill="#333"><path d="M112 38.46H97.17a1.83 1.83 0 0 1-1.83-1.83V16.41a1.83 1.83 0 0 1 1.83-1.83h9a.64.64 0 0 0 .27-.07.41.41 0 0 0 .11-.07.63.63 0 0 0 .26-.51.64.64 0 0 0-.64-.64h-9a3.12 3.12 0 0 0-3.12 3.12v20.2a3.12 3.12 0 0 0 3.12 3.12h14.71a.64.64 0 0 0 .12-1.27zM20.36 13.29h-9a.64.64 0 0 0-.64.64.63.63 0 0 0 .26.51.41.41 0 0 0 .11.07.64.64 0 0 0 .27.07h9a1.83 1.83 0 0 1 1.83 1.83v20.2a1.83 1.83 0 0 1-1.83 1.83H5.56a.64.64 0 0 0-.56.63.66.66 0 0 0 .3.53.69.69 0 0 0 .35.11h14.71a3.12 3.12 0 0 0 3.12-3.12V16.41a3.12 3.12 0 0 0-3.12-3.12zM85.57 13.25h-53.3a3.12 3.12 0 0 0-3.12 3.12v20.2a3.12 3.12 0 0 0 3.12 3.12h53.3a3.12 3.12 0 0 0 3.12-3.12v-20.2a3.12 3.12 0 0 0-3.12-3.12zm1.83 23.32a1.83 1.83 0 0 1-1.83 1.83h-53.3a1.83 1.83 0 0 1-1.83-1.83v-20.2a1.83 1.83 0 0 1 1.83-1.83h53.3a1.83 1.83 0 0 1 1.83 1.83z"/></g></g></g></g></svg>';


    var bumps = [-1, 0, 1];
    var bumpy = bumps[Math.floor(Math.random() * bumps.length)];

    if ($.state.speed === 0) {
      bumpy = 0;
    }

    ctx.drawSvg(tires, 1225 + offset, 1520, 20, 4.26);
    ctx.drawSvg(mirrors, 790 + offset, 590 + bumpy, 30, 3.25); // 116 x 12.5
    ctx.drawSvg(van, 595, 400 + bumpy, 46, 43);

  }

  function getCirclePoint(x, y, radius, angle) {
    var radian = (angle / 180) * Math.PI;

    return {
      x: x + radius * Math.cos(radian),
      y: y + radius * Math.sin(radian)
    }
  }

  function getParams() {
    var scripts = document.getElementsByTagName('script');

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src.indexOf('/site.js') > -1) {
        var pa = scripts[i].src.split('?').pop().split('&');

        var p = {};
        for (var j = 0; j < pa.length; j++) {
          var kv = pa[j].split("=");
          p[kv[0]] = kv[1];
        }

        return p;
      }
    }

    return {};
  }

  function handleOrientation(e) {
    $.state.isMobile = true;

    var x = e.beta;
    var orientation = window.orientation;
    var offset = 10;

    if (x > 90) {
      x = 90
    };
    if (x < -90) {
      x = -90
    };

    x += 90;

    if (x < 90 - offset && orientation === -90) {
      $.state.keypress.right = true;
      $.state.keypress.left = false;
    } else if (x > 90 + offset && orientation === -90) {
      $.state.keypress.right = false;
      $.state.keypress.left = true;
    } else if (x < 90 - offset && orientation === 90) {
      $.state.keypress.right = false;
      $.state.keypress.left = true;
    } else if (x > 90 + offset && orientation === 90) {
      $.state.keypress.right = true;
      $.state.keypress.left = false;
    } else {
      $.state.keypress.right = false;
      $.state.keypress.left = false;
    }
  }

  function keyDown(e) {
    if (e.target.type !== 'text') {
      move(e, true);
    }
  }

  function keyUp(e) {
    if (e.target.type !== 'text') {
      move(e, false);
    }
  }

  function lerp(norm, min, max) {
    return (max - min) * norm + min;
  }

  function lettersOnly (e) {
    var key = e.which || e.keyCode;
    return ((key >= 65 && key <= 90) || key == 8  || key == 9 || key == 16 || key == 37 || key == 39 || key == 46);
  }

  function map(value, sourceMin, sourceMax, destMin, destMax) {
    return lerp(norm(value, sourceMin, sourceMax), destMin, destMax);
  }

  function move(e, isKeyDown) {
    if ($.state.crashed && e.keyCode === 32) {
      e.preventDefault();
      window.location.reload();
      return
    }

    if ($.state.crashed) {
      e.preventDefault();
      return
    }

    if (e.keyCode >= 37 && e.keyCode <= 40) {
      e.preventDefault();
    }

    if (e.keyCode === 37 || e.keyCode === 65) {
      $.state.keypress.left = isKeyDown;
    }

    if (e.keyCode === 38 || e.keyCode === 87) {
      $.state.keypress.up = isKeyDown;
      $.state.breaking = false;
    }

    if (e.keyCode === 39 || e.keyCode === 68) {
      $.state.keypress.right = isKeyDown;
    }

    if (e.keyCode === 40 || e.keyCode === 83) {
      $.state.keypress.down = isKeyDown;
      $.state.breaking = true;
    }
  }

  function norm(value, min, max) {
    return (value - min) / (max - min);
  }

  function setupAudio() {
    $.audio.loop = new Howl({
      src: ['audio/loop.mp3', 'audio/loop.ogg'],
      loop: true
    });

    $.audio.highScore = new Howl({
      src: ['audio/high-score.mp3', 'audio/high-score.ogg'],
      loop: false
    });

    $.audio.gameOver = new Howl({
      src: ['audio/game-over.mp3', 'audio/game-over.ogg'],
      loop: false
    });
  }

  function showInstructions(ctx) {
    if ($.state.speed === 0 && $.score.total === 0) {
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px "Press Start 2P"';

      if ('ontouchstart' in document.documentElement) {
        ctx.fillText('TOUCH = GAS | TILT = STEER', 125, 420);
      } else {
        ctx.fillText('A S D W  |  ← ↓ → ↑', 185, 420);
      }
    } else if (!$.state.playingMusic) {
      $.state.playingMusic = true;
      $.audio.loop.play();
    }
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function roundedRect(ctx, color, x, y, width, height, radius, turn, turneffect) {
    var skew = turn === true ? $.state.turn * turneffect : 0;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y - skew);

    // top right
    ctx.lineTo(x + width - radius, y + skew);
    ctx.arcTo(x + width, y + skew, x + width, y + radius + skew, radius);
    ctx.lineTo(x + width, y + radius + skew);

    // down right
    ctx.lineTo(x + width, (y + height + skew) - radius);
    ctx.arcTo(x + width, y + height + skew, (x + width) - radius, y + height + skew, radius);
    ctx.lineTo((x + width) - radius, y + height + skew);

    // down left
    ctx.lineTo(x + radius, y + height - skew);
    ctx.arcTo(x, y + height - skew, x, (y + height - skew) - radius, radius);
    ctx.lineTo(x, (y + height - skew) - radius);

    // top left
    ctx.lineTo(x, y + radius - skew);
    ctx.arcTo(x, y - skew, x + radius, y - skew, radius);
    ctx.lineTo(x + radius, y - skew);
    ctx.fill();
  }

  function saveUserScore () {
    var $letter1 = document.getElementById('letter1');
    var $letter2 = document.getElementById('letter2');
    var $letter3 = document.getElementById('letter3');

    var user = $letter1.value + $letter2.value + $letter3.value;

    if ($letter1.value.length === 1) {
      $letter1.classList.add('active')
      $letter1.classList.remove('error')
    } else {
      $letter1.classList.remove('active')
      $letter1.classList.add('error')
    }

    if ($letter2.value.length === 1) {
      $letter2.classList.add('active')
      $letter2.classList.remove('error')
    } else {
      $letter2.classList.remove('active')
      $letter2.classList.add('error')
    }

    if ($letter3.value.length === 1) {
      $letter3.classList.add('active')
      $letter3.classList.remove('error')
    } else {
      $letter3.classList.remove('active')
      $letter3.classList.add('error')
    }

    if (user.length === 3) {
      var currentScore = Math.floor($.score.total);
      var highScore = $.score.high;

      if (parseInt(currentScore, 10) > parseInt(highScore, 10)) {
        $.score.high = highScore;
        localStorage.setItem('high-score', currentScore);
        localStorage.setItem('username', user.toUpperCase());

        var params = getParams();
        var timestamp = params.t;
        var hash = params.h;
        var isMobile = ($.state.isMobile) ? 1 : 0;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'scores.php?hash=' + hash + '&timestamp=' + timestamp + '&user=' + user.toUpperCase() + '&score=' + currentScore + '&mobile=' + isMobile);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
          setTimeout(showLeaderBoard, 1000);
        };

        xhr.send();
      } else {
        showLeaderBoard();
      }
    }
  }

  function showLeaderBoard () {
    var ac = new Date().getTime();
    var isMobile = ($.state.isMobile) ? 1 : 0;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'scores.php?ac=' + ac + '&mobile=' + isMobile);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var res = JSON.parse(xhr.responseText);
        var html = '';
        var user = localStorage.getItem('username') || '';

        for (var i = 0; i < res.length; i++) {
          var isActive = (user.toUpperCase() === res[i].user.toUpperCase()) ? 'active' : '';
          html = html.concat('<li class="' + isActive + '"><span class="user">' + res[i].user.toUpperCase() + '</span><span class="score">' + res[i].high_score + '</span><span class="date">' + res[i].date + '</span></li>');
        }

        document.getElementById('scores').innerHTML = html;
        document.getElementById('leaderboard-form').style.display = 'none';
        document.getElementById('leaderboard-scores').style.display = 'block';
        document.getElementById('leaderboard').style.display = 'flex';
      } else {
        console.error(xhr.status);
      }
    };

    xhr.send();
  }

  function showUserForm () {
    var currentScore = parseInt(Math.floor($.score.total), 10);
    var highScore = parseInt($.score.high, 10);
    var user = localStorage.getItem('username');

    if (user && user.length === 3) {
      document.getElementById('letter1').value = user.charAt(0);
      document.getElementById('letter2').value = user.charAt(1);
      document.getElementById('letter3').value = user.charAt(2);
    }

    if (currentScore > highScore && currentScore !== 0) {
      document.getElementById('current-score').innerHTML = currentScore.toLocaleString()
      document.getElementById('leaderboard-form').style.display = 'block';
      document.getElementById('leaderboard-scores').style.display = 'none';
      document.getElementById('leaderboard').style.display = 'flex';
    } else {
      setTimeout(showLeaderBoard, 1000);
    }
  }

  function touchEnd(e) {
    $.state.isMobile = true;

    if (e.target.type !== 'text') {
      if ($.state.crashed) {
        e.preventDefault();
        return
      }

      $.state.keypress.up = false;
      $.state.breaking = true;
    }
  }

  function touchStart(e) {
    $.state.isMobile = true;

    if (e.target.type !== 'text') {
      if ($.state.crashed) {
        e.preventDefault();
        return
      }

      $.state.keypress.up = true;
      $.state.breaking = false;
    }
  }

  window.RVW_GAME = {
    lettersOnly: lettersOnly,
    saveUserScore: saveUserScore
  }
})();
