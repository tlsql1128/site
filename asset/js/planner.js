/* 월급 관리 플래너 — planner */
(function () {
    "use strict";

    function parseMoney(raw) {
        var s = String(raw || "").replace(/[^\d]/g, "");
        if (!s) return 0;
        return parseInt(s, 10) || 0;
    }

    function formatMoney(n) {
        return Math.round(Number(n || 0)).toLocaleString("ko-KR");
    }

    function clamp(n, a, b) {
        return Math.min(b, Math.max(a, n));
    }

    function setError(msg) {
        var el = document.getElementById("planner-error");
        if (el) el.textContent = msg || "";
    }

    function setPillGroup(selector, activeBtn) {
        document.querySelectorAll(selector).forEach(function (b) {
            b.classList.toggle("is-active", b === activeBtn);
        });
    }

    function donutStyle(parts) {
        // parts: [{pct,color}]
        var start = 0;
        var segs = parts.map(function (p) {
            var end = start + p.pct;
            var s = p.color + " " + start.toFixed(1) + "% " + end.toFixed(1) + "%";
            start = end;
            return s;
        });
        return "conic-gradient(" + segs.join(",") + ")";
    }

    function makeBar(name, val, pct, color) {
        var div = document.createElement("div");
        div.className = "bar";
        div.innerHTML =
            '<div class="bar__top"><span class="bar__name">' +
            name +
            '</span><span class="bar__val">' +
            formatMoney(val) +
            '원</span></div><div class="bar__track"><span class="bar__fill" style="background:' +
            color +
            ';width:' +
            pct.toFixed(1) +
            '%"></span></div>';
        return div;
    }

    var styleMode = "balanced";

    function calc() {
        setError("");
        var income = parseMoney(document.getElementById("pl-income").value);
        if (income <= 0) {
            setError("월 실수령액을 입력해 주세요.");
            return;
        }

        var housing = document.getElementById("pl-housing").value;

        var phone = parseMoney(document.getElementById("pl-phone").value);
        var transport = parseMoney(document.getElementById("pl-transport").value);
        var sub = parseMoney(document.getElementById("pl-subscription").value);
        var ins = parseMoney(document.getElementById("pl-insurance").value);
        var etc = parseMoney(document.getElementById("pl-fixed-etc").value);
        var fixedBase = phone + transport + sub + ins + etc;

        var saveRate = Number(document.getElementById("pl-save-rate").value);
        if (!isFinite(saveRate)) saveRate = 20;
        saveRate = clamp(saveRate, 0, 60);

        // Housing baseline ratios
        var housingRate = 0.0;
        if (housing === "rent") housingRate = 0.24;
        else if (housing === "jeonse") housingRate = 0.12;
        else if (housing === "dorm") housingRate = 0.10;
        else housingRate = 0.06;

        // lifestyle adjustment
        var varRate = 0.0;
        if (styleMode === "save") varRate = 0.42;
        else if (styleMode === "relaxed") varRate = 0.52;
        else varRate = 0.47;

        var emergencyRate = styleMode === "save" ? 0.06 : styleMode === "relaxed" ? 0.04 : 0.05;

        var save = Math.round(income * (saveRate / 100));
        var housingBudget = Math.round(income * housingRate);
        var emergency = Math.round(income * emergencyRate);

        var fixed = fixedBase;
        var remain = income - (save + housingBudget + emergency + fixed);

        // 생활비/식비를 remain에서 비율로 분리
        var food = Math.max(0, Math.round(remain * 0.42));
        var living = Math.max(0, remain - food);

        // when negative, show warning and adjust
        var status = "ok";
        if (remain < 0) status = "bad";
        else if (remain < Math.round(income * 0.05)) status = "warn";

        var parts = [
            { key: "저축", val: save, pct: (save / income) * 100, color: "#6366f1" },
            { key: "주거비", val: housingBudget, pct: (housingBudget / income) * 100, color: "#a855f7" },
            { key: "고정비", val: fixed, pct: (fixed / income) * 100, color: "#22d3ee" },
            { key: "생활비·식비", val: Math.max(0, income - (save + housingBudget + fixed + emergency)), pct: ((income - (save + housingBudget + fixed + emergency)) / income) * 100, color: "#f59e0b" },
            { key: "비상금", val: emergency, pct: (emergency / income) * 100, color: "#94a3b8" },
        ].map(function (p) {
            p.pct = clamp(p.pct, 0, 100);
            return p;
        });

        var donut = document.getElementById("pl-donut");
        if (donut) donut.style.background = donutStyle(parts);

        var incomeOut = document.getElementById("pl-income-out");
        if (incomeOut) incomeOut.textContent = formatMoney(income) + "원";

        var bars = document.getElementById("pl-bars");
        if (bars) {
            bars.innerHTML = "";
            bars.appendChild(makeBar("저축", save, (save / income) * 100, "#6366f1"));
            bars.appendChild(makeBar("주거비(추천)", housingBudget, (housingBudget / income) * 100, "#a855f7"));
            bars.appendChild(makeBar("고정비(입력)", fixed, (fixed / income) * 100, "#22d3ee"));
            bars.appendChild(makeBar("식비(추정)", Math.max(0, food), Math.max(0, (food / income) * 100), "#fbbf24"));
            bars.appendChild(makeBar("생활비(추정)", Math.max(0, living), Math.max(0, (living / income) * 100), "#f59e0b"));
            bars.appendChild(makeBar("비상금(추천)", emergency, (emergency / income) * 100, "#94a3b8"));
        }

        var sum = document.getElementById("pl-summary");
        if (sum) {
            if (status === "bad") {
                sum.innerHTML =
                    "현재 입력 기준으로는 <strong>부족 금액 " +
                    formatMoney(Math.abs(remain)) +
                    "원</strong>이 발생해요. 고정비/저축 비율을 낮추거나 주거비를 재조정해 보세요.";
            } else {
                var label = status === "warn" ? "빠듯함" : "여유예산";
                sum.innerHTML =
                    "추천 배분 기준으로 <strong>" +
                    label +
                    " " +
                    formatMoney(Math.max(0, remain)) +
                    "원</strong>이 남아요. 남는 금액은 비상금/저축에 보태면 안정적입니다.";
            }
        }
    }

    function init() {
        // pills
        document.querySelectorAll('.pill[data-rate]').forEach(function (b) {
            b.addEventListener("click", function () {
                setPillGroup('.pill[data-rate]', b);
                var v = b.getAttribute("data-rate");
                var input = document.getElementById("pl-save-rate");
                if (!input) return;
                if (v === "custom") {
                    input.focus();
                    return;
                }
                input.value = String(v);
            });
        });

        document.querySelectorAll('.pill[data-style]').forEach(function (b) {
            b.addEventListener("click", function () {
                setPillGroup('.pill[data-style]', b);
                styleMode = b.getAttribute("data-style") || "balanced";
            });
        });

        var btn = document.getElementById("btn-planner");
        if (btn) btn.addEventListener("click", calc);

        ["pl-income", "pl-housing", "pl-phone", "pl-transport", "pl-subscription", "pl-insurance", "pl-fixed-etc", "pl-save-rate"].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("change", function () {
                // light auto-update
                calc();
            });
        });

        calc();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();

