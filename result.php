<?php
$score = $_GET['score'];
$correct = $_GET['correct'];
$total = $_GET['total'];
?>

<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <title>Kết quả</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>

<body class="container py-5 text-center">
    <h2 class="mb-4">🎉 Kết quả bài làm</h2>
    <p>Bạn trả lời đúng <strong><?= $correct ?></strong> / <strong><?= $total ?></strong> câu</p>
    <h3>Điểm số: <span class="text-success"><?= $score ?></span></h3>
    <a href="quiz_list.php" class="btn btn-secondary mt-4">🔙 Quay về danh sách Quiz</a>
</body>

</html>