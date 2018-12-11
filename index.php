<?php require('config.php'); ?>
<!doctype html>
<html lang="en">
  <head>
    <!-- Required Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <meta http-equiv="x-dns-prefetch-control" content="on">

    <!-- Mobile Specific Meta Tags -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-title" content="RVW Game">
    <meta name="application-name" content="RVW Game">

    <meta name="description" content="Old School Driving Game featuring the Red Van. The Farther you drive, the Harder it gets.">
    <meta name="cache-control" content="public">
    <meta name="company" content="Red Van Workshop">
    <meta name="googlebot" content="noindex,nofollow">
    <meta name="robots" content="noodp,noydir">
    <meta name="robots" content="noindex,nofollow">

    <!-- Twitter META Info -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@redvanworkshop">
    <meta property="twitter:title" content="Red Van Workshop">
    <meta property="twitter:description" content="Old School Driving Game featuring the Red Van. The Farther you drive, the Harder it gets.">
    <meta property="twitter:creator" content="@redvanworkshop">
    <meta property="twitter:image" content="https://peter.build/red-van/driving-game/img/card.jpg">
    <meta property="twitter:image:alt" content="Red Van Workshop">
    <meta property="twitter:domain" content="redvanworkshop.com">

    <!-- Open Graph protocol -->
    <meta property="og:locale" content="en_US">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Red Van Workshop">
    <meta property="og:url" content="https://redvanworkshop.com/">
    <meta property="og:image" content="https://peter.build/red-van/driving-game/img/card.jpg">
    <meta property="og:site_name" content="Red Van Workshop">
    <meta property="og:description" content="Old School Driving Game featuring the Red Van. The Farther you drive, the Harder it gets.">

    <!-- Dublin Core Metadata -->
    <meta name="dc:language" content="en_US">
    <meta name="dc:title" content="Red Van Workshop">
    <meta name="dc:source" content="https://redvanworkshop.com/">

    <!-- Icons -->
    <link rel="icon" href="img/favicon.ico">
    <link rel="apple-touch-icon-precomposed" href="img/icon-57x57.png">
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="img/icon-72x72.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="img/icon-114x114.png">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="img/icon-144x144.png">

    <link rel="preload" href="audio/loop.mp3" as="audio" type="audio/mp3">
    <link rel="preload" href="audio/high-score.mp3" as="audio" type="audio/mp3">
    <link rel="preload" href="audio/game-over.mp3" as="audio" type="audio/mp3">

    <title>RVW Game</title>

    <link href="https://fonts.googleapis.com/css?family=Press+Start+2P" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css?cb=v1.0.2">
  </head>
  <body>
    <div class="use-landscape">
      TURN DEVICE TO LANDSCAPE ORIENTATION
    </div>

    <div id="leaderboard">
      <div class="wrapper form" id="leaderboard-form">
        <h1>Enter Initials</h1>
        <div class="scroll">
          <div class="your-score">
            High Score<br/>
            <span id="current-score"></span>
          </div>
          <input type="text" class="letter" id="letter1" name="letter1" minlength="1" maxlength="1" pattern="[A-Za-z]{1}" placeholder="R" onfocus="this.placeholder = '';"  onblur="this.placeholder = 'R';" onkeydown="return RVW_GAME.lettersOnly(event)" />
          <input type="text" class="letter" id="letter2" name="letter2" minlength="1" maxlength="1" pattern="[A-Za-z]{1}" placeholder="V" onfocus="this.placeholder = '';"  onblur="this.placeholder = 'V';" onkeydown="return RVW_GAME.lettersOnly(event)" />
          <input type="text" class="letter" id="letter3" name="letter3" minlength="1" maxlength="1" pattern="[A-Za-z]{1}" placeholder="W" onfocus="this.placeholder = '';"  onblur="this.placeholder = 'W';" onkeydown="return RVW_GAME.lettersOnly(event)" />
        </div>
        <div>
          <button onclick="RVW_GAME.saveUserScore()" ontouchend="RVW_GAME.saveUserScore();">SAVE</button>
        </div>
      </div>
      <div class="wrapper scores" id="leaderboard-scores">
        <h1>Leader Board</h1>
        <div class="scroll">
          <ul id="scores"></ul>
        </div>
        <div>
          <button onclick="window.location.reload();" ontouchend="window.location.reload();">RESTART</button>
        </div>
      </div>
    </div>

    <canvas height="450" width="750" id="driving-game" oncontextmenu="return false;"></canvas>

    <script src="js/canvg.js"></script>
    <script src="js/howler.min.js"></script>
    <script src="js/site.js?cb=v1.0.2&t=<?= TIMESTAMP ?>&h=<?= md5(TOKEN . TIMESTAMP) ?>"></script>
  </body>
</html>
