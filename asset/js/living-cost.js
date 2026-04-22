/* 자취 생활비 계산기 — living-cost */
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

    function bar(name, val, pct, color) {
        var div = document.createElement("div");
        div.className = "bar";
        div.innerHTML =
            '<div class="bar__top"><span class="bar__name">' +
            name +
            '</span><span class="bar__val">' +
            formatMoney(val) +
            '원</span></div><div class="bar__track"><span class="bar__fill" style="background:' +
            color +
            ";width:" +
            pct.toFixed(1) +
            '%"></span></div>';
        return div;
    }

    function setError(msg) {
        var el = document.getElementById("lc-error");
        if (el) el.textContent = msg || "";
    }

    function setBadge(type, text) {
        var el = document.getElementById("lc-badge");
        if (!el) return;
        el.classList.remove("badge--ok", "badge--warn", "badge--bad");
        if (type) el.classList.add("badge--" + type);
        el.textContent = text;
    }

    function regionMessage(region) {
        if (region === "seoul") return "서울은 주거비 비중이 높아지기 쉬워요. 관리비 포함 주거비를 먼저 ‘상한’으로 정해두는 것이 좋아요.";
        if (region === "gyeonggi" || region === "incheon") return "경기/인천은 주거비·교통비 균형을 보는 편이 좋아요. 통근 시간과 비용을 함께 점검해보세요.";
        if (region === "metro") return "지방 광역시는 주거비 부담이 상대적으로 낮을 수 있어요. 대신 교통·차량 유지비가 커질 수 있습니다.";
        return "지역마다 주거비/교통비 구조가 달라요. ‘주거비 비중’과 ‘남는 돈’을 기준으로 내 예산을 점검해보세요.";
    }

    function calc() {
        setError("");
        var region = document.getElementById("lc-region").value;
        var rent = parseMoney(document.getElementById("lc-rent").value);
        var mng = parseMoney(document.getElementById("lc-mng").value);
        var food = parseMoney(document.getElementById("lc-food").value);
        var transport = parseMoney(document.getElementById("lc-transport").value);
        var phone = parseMoney(document.getElementById("lc-phone").value);
        var items = parseMoney(document.getElementById("lc-items").value);
        var etc = parseMoney(document.getElementById("lc-etc").value);
        var income = parseMoney(document.getElementById("lc-income").value);

        if (income <= 0) {
            setError("월 실수령액을 입력해 주세요.");
            return;
        }

        var housing = rent + mng;
        var life = food + transport + phone + items + etc;
        var total = housing + life;
        var save = income - total;

        var housePct = income ? (housing / income) * 100 : 0;
        var lifePct = income ? (life / income) * 100 : 0;

        document.getElementById("lc-total").textContent = formatMoney(total) + "원";
        document.getElementById("lc-house-pct").textContent = Math.round(housePct) + "%";
        document.getElementById("lc-life-pct").textContent = Math.round(lifePct) + "%";
        document.getElementById("lc-save").textContent = (save >= 0 ? formatMoney(save) : "0") + "원";

        // badge
        if (save >= Math.round(income * 0.2)) setBadge("ok", "여유 있음 · 저축 여력 좋음");
        else if (save >= 0) setBadge("warn", "균형형 · 저축 여력 보통");
        else setBadge("bad", "빠듯함 · 지출 재점검 필요");

        var bars = document.getElementById("lc-bars");
        if (bars) {
            bars.innerHTML = "";
            var base = Math.max(1, total);
            bars.appendChild(bar("주거비(월세+관리)", housing, (housing / base) * 100, "#a855f7"));
            bars.appendChild(bar("식비", food, (food / base) * 100, "#f59e0b"));
            bars.appendChild(bar("교통", transport, (transport / base) * 100, "#22d3ee"));
            bars.appendChild(bar("통신", phone, (phone / base) * 100, "#6366f1"));
            bars.appendChild(bar("생활용품", items, (items / base) * 100, "#94a3b8"));
            bars.appendChild(bar("기타", etc, (etc / base) * 100, "#fbbf24"));
        }

        var note = document.getElementById("lc-note");
        if (note) {
            if (save < 0) {
                note.innerHTML =
                    "현재 입력 기준으로는 <strong>월 " +
                    formatMoney(Math.abs(save)) +
                    "원</strong>이 부족해요. 월세/식비/고정비부터 한 항목씩 낮춰 보세요.";
            } else {
                note.innerHTML =
                    "현재 입력 기준으로 월 생활비는 <strong>" +
                    formatMoney(total) +
                    "원</strong>이며, 저축 가능 금액은 <strong>" +
                    formatMoney(save) +
                    "원</strong>입니다.";
            }
        }

        var rg = document.getElementById("lc-region-guide");
        if (rg) rg.textContent = regionMessage(region);
    }

    function init() {
        var btn = document.getElementById("btn-lc");
        if (btn) btn.addEventListener("click", calc);
        ["lc-region", "lc-rent", "lc-mng", "lc-food", "lc-transport", "lc-phone", "lc-items", "lc-etc", "lc-income"].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("change", calc);
        });
        calc();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();

