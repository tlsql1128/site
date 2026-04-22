/* 청년 보험 입문 가이드 — insurance */
(function () {
    "use strict";

    var TERMS = [
        { key: "real", level: "초급", mid: false, title: "실비보험(실손)", short: "병원비 일부를 보전하는 개념", body: "<p>실손(실비)은 의료비를 <strong>일부 보전</strong>하는 구조로 이해하면 쉬워요. 다만 모든 항목이 되는 건 아니어서 보장/제외 항목을 꼭 확인해야 합니다.</p>" },
        { key: "health", level: "초급", mid: false, title: "건강보험", short: "공적/민간 개념을 구분", body: "<p>공적 건강보험(국민건강보험)과 민간 보험은 역할이 달라요. ‘이미 공적으로 보장되는 범위’ 위에 무엇을 더할지 관점이 중요합니다.</p>" },
        { key: "driver", level: "중급", mid: true, title: "운전자보험", short: "운전 시 큰 비용을 대비", body: "<p>운전 중 사고는 ‘한 번에 큰 비용’이 될 수 있어요. 운전을 자주 한다면 필요한 보장만 골라서 확인하는 것이 좋아요.</p>" },
        { key: "premium", level: "초급", mid: false, title: "보험료", short: "월 고정비로 생각하기", body: "<p>보험료는 매달 나가는 <strong>고정비</strong>예요. 유지 가능성이 가장 중요하니, 월급 대비 과한지 먼저 체크해 보세요.</p>" },
        { key: "coverage", level: "초급", mid: false, title: "보장 범위", short: "무엇이 ‘되는지/안 되는지’", body: "<p>보장 범위는 ‘가능’ 항목뿐 아니라 <strong>제외</strong>도 함께 봐야 해요. 같은 이름의 상품도 조건이 다를 수 있습니다.</p>" },
        { key: "exclusion", level: "중급", mid: true, title: "면책 기간", short: "초기에 보장이 제한될 수 있어요", body: "<p>면책 기간은 가입 직후 일정 기간 보장이 제한되는 경우를 말해요. ‘바로 보장’되는지 꼭 확인하세요.</p>" },
        { key: "renew", level: "중급", mid: true, title: "갱신형 / 비갱신형", short: "보험료가 변할 수 있는 구조", body: "<p>갱신형은 기간마다 보험료가 바뀔 수 있어요. 비갱신형은 구조가 다를 수 있어요. 내 기간/예산에 맞게 이해하는 게 중요합니다.</p>" },
        { key: "rider", level: "중급", mid: true, title: "특약", short: "필요한 것만, 과하면 고정비 증가", body: "<p>특약은 보장을 추가하는 옵션이에요. 많을수록 좋아 보이지만, 월 보험료가 늘어나 ‘유지’가 어려워질 수 있어요.</p>" },
    ];

    function $(id) {
        return document.getElementById(id);
    }

    function openModal(term) {
        var modal = $("ins-modal");
        var title = $("ins-modal-title");
        var body = $("ins-modal-body");
        if (!modal || !title || !body) return;
        title.textContent = term.title;
        body.innerHTML = term.body;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        var modal = $("ins-modal");
        if (!modal) return;
        modal.classList.remove("is-open");
        document.body.style.overflow = "";
    }

    function renderTerms(list) {
        var wrap = $("ins-terms");
        if (!wrap) return;
        wrap.innerHTML = "";
        list.forEach(function (t) {
            var card = document.createElement("article");
            card.className = "ins-term";
            card.setAttribute("data-search", (t.title + " " + t.short).toLowerCase());
            card.innerHTML =
                '<span class="ins-badge' +
                (t.mid ? " ins-badge--mid" : "") +
                '">' +
                t.level +
                "</span>" +
                "<h3>" +
                t.title +
                "</h3>" +
                "<p>" +
                t.short +
                "</p>";
            card.addEventListener("click", function () {
                openModal(t);
            });
            wrap.appendChild(card);
        });
    }

    function setFeedback(text) {
        var el = $("ins-search-feedback");
        if (el) el.textContent = text || "";
    }

    function filter(q) {
        var raw = String(q || "").trim().toLowerCase();
        var cards = Array.prototype.slice.call(document.querySelectorAll(".ins-term"));
        var visible = 0;
        cards.forEach(function (c) {
            var hay = (c.getAttribute("data-search") || "").toLowerCase();
            var show = !raw || hay.indexOf(raw) !== -1;
            c.classList.toggle("is-hidden", !show);
            if (show) visible++;
        });
        if (!raw) {
            setFeedback("궁금한 보험 용어를 검색해 보세요.");
        } else if (!visible) {
            setFeedback("검색 결과가 없어요. 다른 키워드로 다시 검색해 보세요.");
        } else {
            setFeedback("검색 결과 " + visible + "개를 찾았어요.");
        }
    }

    function initChecklist() {
        var wrap = document.querySelector(".checklist");
        if (!wrap) return;
        var fill = $("ins-check-fill");
        var score = $("ins-check-score");
        function update() {
            var total = wrap.querySelectorAll('input[type="checkbox"]').length;
            var checked = wrap.querySelectorAll('input[type="checkbox"]:checked').length;
            var pct = total ? Math.round((checked / total) * 100) : 0;
            if (fill) fill.style.width = pct + "%";
            if (score) score.textContent = "체크 " + checked + "/" + total;
        }
        wrap.addEventListener("change", update);
        update();
    }

    function init() {
        renderTerms(TERMS);
        initChecklist();

        var closeBtn = $("ins-modal-close");
        var modal = $("ins-modal");
        if (closeBtn) closeBtn.addEventListener("click", closeModal);
        if (modal) {
            modal.addEventListener("click", function (e) {
                if (e.target === modal) closeModal();
            });
        }

        var s = $("ins-search");
        if (s) {
            s.addEventListener("input", function () {
                filter(s.value);
            });
        }
        filter("");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();

