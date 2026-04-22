/* 중고차 구매 예산 계산기 — usedcar */
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

    function monthlyPayment(principal, annualRate, months) {
        var m = Math.max(1, months | 0);
        var r = (annualRate / 100) / 12;
        if (principal <= 0) return 0;
        if (r === 0) return principal / m;
        var pow = Math.pow(1 + r, m);
        return principal * (r * pow) / (pow - 1);
    }

    function setBadge(type, text) {
        var el = document.getElementById("car-badge");
        if (!el) return;
        el.classList.remove("badge--ok", "badge--warn", "badge--bad");
        if (type) el.classList.add("badge--" + type);
        el.textContent = text;
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
        var el = document.getElementById("car-error");
        if (el) el.textContent = msg || "";
    }

    var useInstall = true;

    function calc() {
        setError("");
        var price = parseMoney(document.getElementById("car-price").value);
        var cash = parseMoney(document.getElementById("car-cash").value);
        var months = parseInt(document.getElementById("car-months").value, 10) || 36;
        var rate = Number(document.getElementById("car-rate").value);
        if (!isFinite(rate) || rate < 0) rate = 0;
        var ins = parseMoney(document.getElementById("car-ins-month").value);
        var fuel = parseMoney(document.getElementById("car-fuel").value);
        var park = parseMoney(document.getElementById("car-parking").value);
        var maint = parseMoney(document.getElementById("car-maint").value);
        var income = parseMoney(document.getElementById("car-income").value);

        if (price <= 0) {
            setError("차량 가격을 입력해 주세요.");
            return;
        }
        cash = clamp(cash, 0, price);

        // upfront: 취등록세(가볍게 7% 추정) + 초기 등록/이전(고정 20만) + 차량가 일부(현금)
        var tax = Math.round(price * 0.07);
        var admin = 200000;
        var upfrontNeed = tax + admin + (useInstall ? cash : price);

        var financed = useInstall ? Math.max(0, price - cash) : 0;
        var installPay = useInstall ? monthlyPayment(financed, rate, months) : 0;

        var monthlyFixed = installPay + ins + fuel + park + maint;
        var yearly = monthlyFixed * 12 + tax; // rough

        // badge by income ratio if income provided
        if (income > 0) {
            var ratio = monthlyFixed / income;
            if (ratio <= 0.18) setBadge("ok", "적정 · 월급 대비 차량비 낮음");
            else if (ratio <= 0.28) setBadge("warn", "주의 · 월급 대비 차량비 다소 높음");
            else setBadge("bad", "부담 과다 · 월급 대비 차량비 높음");
        } else {
            setBadge("", "참고용 · 월급 입력 시 더 정확해요");
        }

        document.getElementById("car-upfront").textContent = formatMoney(upfrontNeed) + "원";
        document.getElementById("car-monthly").textContent = formatMoney(monthlyFixed) + "원";
        document.getElementById("car-year").textContent = formatMoney(yearly) + "원";
        document.getElementById("car-install").textContent = useInstall ? ("월 " + formatMoney(installPay) + "원") : "사용 안함";

        var bars = document.getElementById("car-bars");
        if (bars) {
            bars.innerHTML = "";
            var base = Math.max(1, monthlyFixed);
            bars.appendChild(bar("할부", Math.round(installPay), (installPay / base) * 100, "#6366f1"));
            bars.appendChild(bar("보험", ins, (ins / base) * 100, "#22d3ee"));
            bars.appendChild(bar("유류", fuel, (fuel / base) * 100, "#f59e0b"));
            bars.appendChild(bar("주차", park, (park / base) * 100, "#a855f7"));
            bars.appendChild(bar("정비", maint, (maint / base) * 100, "#94a3b8"));
        }

        var note = document.getElementById("car-note");
        if (note) {
            var msg = "현재 조건에서는 월 약 <strong>" + formatMoney(monthlyFixed) + "원</strong>의 차량 관련 지출이 예상됩니다. ";
            if (income > 0) {
                var pct = Math.round((monthlyFixed / income) * 100);
                msg += "월 실수령액 대비 약 <strong>" + pct + "%</strong> 수준이에요. ";
                msg += pct >= 30 ? "부담이 크다면 차종/할부/유지비를 다시 점검해보세요." : "유지비까지 포함해 무리 없는지 확인해 보세요.";
            } else {
                msg += "월 실수령액을 입력하면 부담 배지를 더 정확히 보여드려요.";
            }
            note.innerHTML = msg;
        }
    }

    function init() {
        document.querySelectorAll('.pill[data-install]').forEach(function (btn) {
            btn.addEventListener("click", function () {
                document.querySelectorAll('.pill[data-install]').forEach(function (b) {
                    b.classList.toggle("is-active", b === btn);
                });
                useInstall = (btn.getAttribute("data-install") !== "no");
                var wrap = document.getElementById("install-fields");
                if (wrap) wrap.style.display = useInstall ? "" : "none";
                calc();
            });
        });

        var run = document.getElementById("btn-car");
        if (run) run.addEventListener("click", calc);

        ["car-price", "car-cash", "car-months", "car-rate", "car-ins-month", "car-fuel", "car-parking", "car-maint", "car-income"].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("change", calc);
        });

        calc();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();

