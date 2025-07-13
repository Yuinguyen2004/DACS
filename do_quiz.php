<?php
include 'db.php';
$quiz_id = $_GET['quiz_id'];

$questions = [];
$sql = "SELECT q.id AS question_id, q.question_text, a.id AS answer_id, a.answer_text
        FROM questions q
        JOIN answers a ON q.id = a.question_id
        WHERE q.quiz_id = $quiz_id
        ORDER BY q.id, a.id";
$res = $conn->query($sql);
while ($row = $res->fetch_assoc()) {
    $q_id = $row['question_id'];
    if (!isset($questions[$q_id])) {
        $questions[$q_id] = ['question' => $row['question_text'], 'answers' => []];
    }
    $questions[$q_id]['answers'][] = ['id' => $row['answer_id'], 'text' => $row['answer_text']];
}
?>

<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Làm bài Quiz</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>

<body class="container py-5">
    <h2 class="mb-4">📝 Làm bài Quiz</h2>
    <form method="POST" action="submit_quiz.php">
        <?php foreach ($questions as $q_id => $q): ?>
            <div class="mb-4">
                <h5><?= $q['question'] ?></h5>
                <?php foreach ($q['answers'] as $a): ?>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="answers[<?= $q_id ?>]" value="<?= $a['id'] ?>" required>
                        <label class="form-check-label"><?= $a['text'] ?></label>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
        <input type="hidden" name="quiz_id" value="<?= $quiz_id ?>">
        <button class="btn btn-success" type="submit">Nộp bài</button>
    </form>
</body>

</html>