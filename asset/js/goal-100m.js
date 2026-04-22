/* 1억 만들기 계산기 — goal-100m */
(function () {
    "use strict";

    function clamp(n, a, b) {
        return Math.min(b, Math.max(a, n));
    }

    function parseMoney(raw) {
        var s = String(raw || "").replace(/[^\d]/g, "");
        if (!s) return 0;
        return parseInt(s, 10) || 0;
    }

    function formatMoney(n) {
        var v = Math.round(Number(n || 0));
        return v.toLocaleString("ko-KR");
    }

    function formatDurationMonths(m) {
        var mm = Math.max(0, Math.round(m));
        var years = Math.floor(mm / 12);
        var months = mm % 12;
        if (years <= 0) return "약 " + months + "개월";
        if (months === 0) return "약 " + years + "년";
        return "약 " + years + "년 " + months + "개월";
    }

    function futureValueMonth(P0, PMT, annualRate, months) {
        var r = (annualRate / 100) / 12;
        if (months <= 0) return P0;
        if (r === 0) return P0 + PMT * months;
        var fv0 = P0 * Math.pow(1 + r, months);
        var fva = PMT * ((Math.pow(1 + r, months) - 1) / r);
        return fv0 + fva;
    }

    function requiredMonthlyForTarget(P0, target, annualRate, months) {
        var r = (annualRate / 100) / 12;
        if (months <= 0) return Infinity;
        if (r === 0) {
            return (target - P0) / months;
        }
        var grow = Math.pow(1 + r, months);
        var denom = (grow - 1) / r;
        return (target - P0 * grow) / denom;
    }

    function monthsToReachTarget(P0, target, PMT, annualRate) {
        var r = (annualRate / 100) / 12;
        if (P0 >= target) return 0;
        if (PMT <= 0 && r <= 0) return Infinity;

        // r==0: linear
        if (r === 0) {
            if (PMT <= 0) return Infinity;
            return Math.ceil((target - P0) / PMT);
        }

        // find by monotonic binary search
        var lo = 0;
        var hi = 12 * 60; // up to 60y
        while (futureValueMonth(P0, PMT, annualRate, hi) < target && hi < 12 * 100) {
            hi *= 2;
        }
        hi = clamp(hi, 1, 12 * 100);
        for (var i = 0; i < 40; i++) {
            var mid = Math.floor((lo + hi) / 2);
            var v = futureValueMonth(P0, PMT, annualRate, mid);
            if (v >= target) hi = mid;
            else lo = mid + 1;
        }
        return hi;
    }

    function animateNumber(el, to, prefix, suffix) {
        if (!el) return;
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var from = 0;
        var start = performance.now();
        var dur = reduce ? 0 : 520;
        function tick(t) {
            var p = dur === 0 ? 1 : Math.min(1, (t - start) / dur);
            var v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
            el.textContent = (prefix || "") + v.toLocaleString("ko-KR") + (suffix || "");
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function setError(msg) {
        var el = document.getElementById("goal-error");
        if (el) el.textContent = msg || "";
    }

    function setMode(mode) {
        var tabs = document.querySelectorAll(".tool-tab");
        tabs.forEach(function (t) {
            var m = t.getAttribute("data-mode");
            var on = m === mode;
            t.classList.toggle("is-active", on);
            t.setAttribute("aria-selected", on ? "true" : "false");
        });
        var fieldMonthly = document.getElementById("field-monthly");
        var fieldYears = document.getElementById("field-years");
        if (fieldMonthly) fieldMonthly.style.display = mode === "byTime" ? "" : "none";
        if (fieldYears) fieldYears.style.display = mode === "byMonthly" ? "" : "none";
        document.body.setAttribute("data-goal-mode", mode);
    }

    function initMoneyInputs() {
        document.querySelectorAll("input.money").forEach(function (inp) {
            function formatNow() {
                var v = parseMoney(inp.value);
                inp.value = String(v);
            }
            inp.addEventListener("blur", formatNow);
        });
    }

    function updateExamples() {
        document.querySelectorAll(".example").forEach(function (btn) {
            btn.addEventListener("click", function () {
                document.querySelectorAll(".example").forEach(function (b) {
                    b.classList.toggle("is-active", b === btn);
                });
                var v = parseMoney(btn.getAttribute("data-target"));
                var t = document.getElementById("goal-target");
                if (t) t.value = String(v);
                calc();
                var sec = document.getElementById("section-tool");
                if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    function bindYearPills() {
        var input = document.getElementById("goal-years");
        document.querySelectorAll(".pill[data-years]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                document.querySelectorAll(".pill[data-years]").forEach(function (b) {
                    b.classList.toggle("is-active", b === btn);
                });
                if (input) input.value = btn.getAttribute("data-years") || "5";
            });
        });
        if (input) {
            input.addEventListener("input", function () {
                document.querySelectorAll(".pill[data-years]").forEach(function (b) {
                    b.classList.remove("is-active");
                });
            });
        }
    }

    var mode = "byMonthly";

    function calc() {
        setError("");
        var target = parseMoney(document.getElementById("goal-target") && document.getElementById("goal-target").value);
        var current = parseMoney(document.getElementById("goal-current") && document.getElementById("goal-current").value);
        var monthly = parseMoney(document.getElementById("goal-monthly") && document.getElementById("goal-monthly").value);
        var rate = Number(document.getElementById("goal-rate") && document.getElementById("goal-rate").value);
        var years = Number(document.getElementById("goal-years") && document.getElementById("goal-years").value);

        if (!isFinite(rate) || rate < 0) rate = 0;
        if (!isFinite(years) || years <= 0) years = 5;

        target = Math.max(1, target);
        current = clamp(current, 0, target);
        monthly = Math.max(0, monthly);

        var months, needMonthly, endTotal;
        if (mode === "byMonthly") {
            months = Math.round(years * 12);
            needMonthly = requiredMonthlyForTarget(current, target, rate, months);
            if (!isFinite(needMonthly)) {
                setError("목표 기간을 확인해 주세요.");
                return;
            }
            needMonthly = Math.max(0, Math.ceil(needMonthly / 1000) * 1000);
            endTotal = futureValueMonth(current, needMonthly, rate, months);
        } else {
            if (monthly <= 0) {
                setError("월 저축 금액을 입력해 주세요.");
                return;
            }
            months = monthsToReachTarget(current, target, monthly, rate);
            if (!isFinite(months) || months > 12 * 100) {
                setError("현재 입력 조건으로는 목표 달성이 매우 오래 걸릴 수 있어요. 금액/수익률을 조정해 보세요.");
                months = 12 * 100;
            }
            needMonthly = monthly;
            endTotal = futureValueMonth(current, monthly, rate, months);
        }

        var principal = current + needMonthly * months;
        var progress = target ? (current / target) * 100 : 0;
        progress = clamp(progress, 0, 100);

        setText("kpi-time", mode === "byMonthly" ? (years + "년 기준") : formatDurationMonths(months));
        setText("kpi-monthly", "월 " + formatMoney(needMonthly) + "원");
        setText("kpi-principal", formatMoney(principal) + "원");
        setText("kpi-total", formatMoney(endTotal) + "원");

        var pctEl = document.getElementById("goal-progress-pct");
        var barEl = document.getElementById("goal-progress-bar");
        if (pctEl) pctEl.textContent = Math.round(progress) + "%";
        if (barEl) barEl.style.width = Math.round(progress) + "%";

        function atYear(y) {
            return futureValueMonth(current, needMonthly, rate, Math.round(y * 12));
        }
        setText("t-1y", formatMoney(atYear(1)) + "원");
        setText("t-3y", formatMoney(atYear(3)) + "원");
        setText("t-5y", formatMoney(atYear(5)) + "원");
        setText("t-goal", formatMoney(target) + "원");

        var summary = document.getElementById("goal-summary");
        if (summary) {
            if (mode === "byMonthly") {
                summary.innerHTML =
                    "현재 조건(기간 " +
                    years +
                    "년)으로는 <strong>월 " +
                    formatMoney(needMonthly) +
                    "원</strong> 정도가 필요해요. " +
                    "월 저축액을 조금만 늘리면 목표 시점을 더 앞당길 수 있어요.";
            } else {
                summary.innerHTML =
                    "현재 조건으로는 <strong>" +
                    formatDurationMonths(months) +
                    "</strong> 후 목표에 도달할 가능성이 있어요. " +
                    "저축액을 늘리거나 고정비를 줄이면 속도가 빨라집니다.";
            }
        }
    }

    function init() {
        initMoneyInputs();
        bindYearPills();
        updateExamples();

        document.querySelectorAll(".tool-tab").forEach(function (t) {
            t.addEventListener("click", function () {
                mode = t.getAttribute("data-mode") || "byMonthly";
                setMode(mode);
            });
        });

        setMode(mode);

        var btn = document.getElementById("btn-goal-calc");
        if (btn) btn.addEventListener("click", calc);

        // live recalculation (light)
        ["goal-target", "goal-current", "goal-monthly", "goal-rate", "goal-years"].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("change", calc);
        });

        calc();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();

