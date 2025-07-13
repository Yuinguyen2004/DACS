<?php include 'db.php'; ?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Danh sách Quiz</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>

<body class="container py-5">

    <h2 class="mb-4">📋 Danh sách Quiz</h2>
    <ul class="list-group">
        <?php
        $result = $conn->query("SELECT * FROM quizzes");
        while ($row = $result->fetch_assoc()):
        ?>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <?= $row['title'] ?>
                <a href="do_quiz.php?quiz_id=<?= $row['id'] ?>" class="btn btn-primary btn-sm">Làm bài</a>
            </li>
        <?php endwhile; ?>
    </ul>

</body>

</html>