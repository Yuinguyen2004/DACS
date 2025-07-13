<?php
include 'db.php';
session_start();

$quiz_id = $_POST['quiz_id'];
$answers = $_POST['answers'];
$correct = 0;
$total = count($answers);

foreach ($answers as $question_id => $answer_id) {
    $sql = "SELECT is_correct FROM answers WHERE id = $answer_id";
    $res = $conn->query($sql);
    if ($res && $res->fetch_assoc()['is_correct']) {
        $correct++;
    }
}

$score = round(($correct / $total) * 100);
$user_id = 1; // Tạm thời. Nếu có login thì dùng $_SESSION['user_id']

$conn->query("INSERT INTO results (user_id, quiz_id, score) VALUES ($user_id, $quiz_id, $score)");

header("Location: result.php?score=$score&correct=$correct&total=$total");
exit;
