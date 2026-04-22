(function () {
    "use strict";

    function updateCheckScore() {
        var boxes = document.querySelectorAll(".credit-check input[type=\"checkbox\"]");
        var checked = 0;
        boxes.forEach(function (cb) {
            if (cb.checked) checked++;
        });
        var pct = Math.round((checked / boxes.length) * 100);
        var fill = document.getElementById("credit-habit-fill");
        var txt = document.getElementById("credit-habit-text");
        if (fill) fill.style.width = pct + "%";
        if (txt) txt.textContent = "습관 점수 " + pct + "점 · 체크 " + checked + "/" + boxes.length;
    }

    function runQuiz() {
        var a1 = document.querySelector('input[name="cq1"]:checked');
        var a2 = document.querySelector('input[name="cq2"]:checked');
        var a3 = document.querySelector('input[name="cq3"]:checked');
        var score = 0;
        if (a1 && a1.value === "b") score += 34;
        if (a2 && a2.value === "b") score += 33;
        if (a3 && a3.value === "b") score += 33;
        var out = document.getElementById("credit-quiz-result");
        if (out) {
            out.textContent = "자가진단 결과: 약 " + score + "점대 느낌(참고용) — 연체 없이 관리하면 좋은 방향이에요.";
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".credit-check input").forEach(function (cb) {
            cb.addEventListener("change", updateCheckScore);
        });
        updateCheckScore();
        var btn = document.getElementById("credit-quiz-btn");
        if (btn) btn.addEventListener("click", runQuiz);
    });
})();
