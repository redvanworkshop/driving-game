<?php
header('Content-type: application/json; charset=utf-8');

require('config.php');

try {
  $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mobile = $_REQUEST['mobile'];
    if (empty($mobile)) {
      $mobile = 0;
    }
    $statement = $db->query("SELECT `s`.`user`, DATE_FORMAT(`s`.`date`, '%c/%d/%y') as `date`, FORMAT(`sub`.`high_score`, 0) as `high_score` FROM `scoreboard` s JOIN (SELECT MAX(`score`) as `high_score`, `user` FROM `scoreboard` WHERE `mobile` = $mobile GROUP BY `user`) sub ON (`sub`.`user` = `s`.`user` AND `sub`.`high_score` = `s`.`score`) ORDER BY `sub`.`high_score` DESC;");
    $statement->execute();
    $results = $statement->fetchAll(PDO::FETCH_ASSOC);

    exit(json_encode($results));
  } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $hash = $_REQUEST['hash'];
    $user = $_REQUEST['user'];
    $score = $_REQUEST['score'];
    $mobile = $_REQUEST['mobile'];

    $token = md5(TOKEN);
    $checkHash = md5($token . '' . $user . '' . $score);

    if (empty($mobile)) {
      $mobile = 0;
    }

    if ($checkHash === $hash) {
      $statement = $db->prepare("INSERT INTO `scoreboard` (`user`, `score`, `mobile`) VALUES (?, ?, ?)");
      $statement->execute([$user, $score, $mobile]);

      exit(json_encode(array('success' => true)));
    } else {
      exit(json_encode(array('success' => false, 'error' => 'Invalid POST Detected')));
    }
  }
} catch(PDOException $e) {
  exit(json_encode(array('error' => 'Connection failed: ' . $e->getMessage())));
}
