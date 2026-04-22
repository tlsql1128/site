/**
 * 정부지원금 캘린더 — 샘플 일정 (실제 공고와 다를 수 있음)
 */
(function () {
    "use strict";

    var monthLabel = document.getElementById("cal-month-label");
    var gridEl = document.getElementById("cal-grid");
    var weekdaysEl = document.getElementById("cal-weekdays");
    var prevBtn = document.getElementById("cal-prev");
    var nextBtn = document.getElementById("cal-next");
    var detailEl = document.getElementById("cal-detail-body");
    var regionSel = document.getElementById("cal-filter-region");
    var catSel = document.getElementById("cal-filter-cat");
    var top3El = document.getElementById("cal-top3");

    var state = {
        y: new Date().getFullYear(),
        m: new Date().getMonth() + 1,
        selected: null,
    };

    /** type: start | deadline | ongoing | local — 샘플(이번 달 기준 일자) */
    function buildEvents(y, m) {
        return [
            {
                y: y,
                m: m,
                d: 3,
                title: "청년월세지원 접수 시작",
                type: "start",
                region: "national",
                cat: "housing",
                period: "지자체 공고 기준",
                target: "월세 거주·소득 요건 충족 청년",
                benefit: "월세 일부 지원",
                note: "실제 일정은 거주 지자체 공고를 확인하세요.",
                officialUrl: "https://www.bokjiro.go.kr/ssis-teu/index.do",
                sourceLabel: "복지로",
            },
            {
                y: y,
                m: m,
                d: 10,
                title: "국민취업지원제도 신청 마감",
                type: "deadline",
                region: "national",
                cat: "job",
                period: "접수기간 종료 예시",
                target: "취업 준비 청년",
                benefit: "구직활동 지원",
                note: "회차별 상이합니다.",
                officialUrl: "https://www.work24.go.kr/",
                sourceLabel: "고용24",
            },
            {
                y: y,
                m: m,
                d: 15,
                title: "청년도약계좌 신규 모집",
                type: "ongoing",
                region: "national",
                cat: "save",
                period: "상시(금융기관)",
                target: "소득 요건 충족 청년",
                benefit: "우대금리·정부 기여",
                note: "가입 금융기관별 조건 확인.",
                officialUrl: "https://www.gov.kr/portal/main",
                sourceLabel: "정부24",
            },
            {
                y: y,
                m: m,
                d: 20,
                title: "지역 청년 교통비 지원",
                type: "local",
                region: "seoul",
                cat: "traffic",
                period: "해당 월·지자체 공고",
                target: "해당 지역 거주 청년",
                benefit: "교통비 일부 지원",
                note: "지자체 한정 사업입니다.",
                officialUrl: "",
                sourceLabel: "",
            },
        ];
    }

    var EVENTS = [];

    function matchesFilters(ev) {
        var r = regionSel ? regionSel.value : "all";
        var c = catSel ? catSel.value : "all";
        if (c !== "all" && ev.cat !== c) return false;
        if (r === "all") return true;
        if (ev.region === "national") return true;
        return ev.region === r;
    }

    function eventsForDay(y, m, d) {
        return EVENTS.filter(function (ev) {
            return ev.y === y && ev.m === m && ev.d === d && matchesFilters(ev);
        });
    }

    function renderTop3() {
        if (!top3El) return;
        var near = EVENTS.filter(function (ev) {
            return matchesFilters(ev) && ev.type === "deadline";
        }).slice(0, 3);
        if (!near.length) {
            top3El.innerHTML = "<li>표시할 마감 일정이 없습니다. 필터를 조정해 보세요.</li>";
            return;
        }
        top3El.innerHTML = near
            .map(function (ev) {
                return "<li><strong>" + ev.m + "/" + ev.d + "</strong> · " + ev.title + "</li>";
            })
            .join("");
    }

    function renderWeekdays() {
        if (!weekdaysEl) return;
        var w = ["일", "월", "화", "수", "목", "금", "토"];
        weekdaysEl.innerHTML = w.map(function (d) {
            return "<div>" + d + "</div>";
        }).join("");
    }

    function renderGrid() {
        if (!gridEl || !monthLabel) return;
        monthLabel.textContent = state.y + "년 " + state.m + "월";

        var first = new Date(state.y, state.m - 1, 1).getDay();
        var dim = new Date(state.y, state.m, 0).getDate();
        var prevDim = new Date(state.y, state.m - 1, 0).getDate();

        var html = "";
        var i;
        var today = new Date();
        var isToday = function (d) {
            return today.getFullYear() === state.y && today.getMonth() + 1 === state.m && today.getDate() === d;
        };

        for (i = 0; i < first; i++) {
            var pd = prevDim - first + i + 1;
            html += '<div class="cal-cell cal-cell--muted"><span class="cal-cell__num">' + pd + "</span></div>";
        }
        for (var d = 1; d <= dim; d++) {
            var evs = eventsForDay(state.y, state.m, d);
            var sel = state.selected && state.selected.y === state.y && state.selected.m === state.m && state.selected.d === d;
            var cls = "cal-cell";
            if (isToday(d)) cls += " cal-cell--today";
            if (sel) cls += " cal-cell--selected";
            var dots = "";
            evs.forEach(function (ev) {
                var dc = "cal-dot--start";
                if (ev.type === "deadline") dc = "cal-dot--deadline";
                else if (ev.type === "ongoing") dc = "cal-dot--ongoing";
                else if (ev.type === "local") dc = "cal-dot--local";
                dots += '<span class="cal-dot ' + dc + '" title="' + ev.title + '"></span>';
            });
            html +=
                '<div class="' +
                cls +
                '" data-day="' +
                d +
                '" tabindex="0" role="gridcell">' +
                '<span class="cal-cell__num">' +
                d +
                "</span>" +
                (dots ? '<div class="cal-cell__dots">' + dots + "</div>" : "") +
                "</div>";
        }
        var total = first + dim;
        var rem = total % 7 === 0 ? 0 : 7 - (total % 7);
        for (i = 1; i <= rem; i++) {
            html += '<div class="cal-cell cal-cell--muted"><span class="cal-cell__num">' + i + "</span></div>";
        }
        gridEl.innerHTML = html;

        gridEl.querySelectorAll(".cal-cell[data-day]").forEach(function (cell) {
            cell.addEventListener("click", function () {
                var d = parseInt(cell.getAttribute("data-day"), 10);
                state.selected = { y: state.y, m: state.m, d: d };
                renderGrid();
                renderDetail();
            });
        });
    }

    function renderDetail() {
        if (!detailEl) return;
        if (!state.selected) {
            detailEl.innerHTML = '<p class="cal-detail__empty">날짜를 선택하면 상세 일정이 표시됩니다.</p>';
            return;
        }
        var evs = eventsForDay(state.selected.y, state.selected.m, state.selected.d);
        if (!evs.length) {
            detailEl.innerHTML =
                "<p class=\"cal-detail__empty\">" +
                state.selected.m +
                "월 " +
                state.selected.d +
                "일에 표시할 일정이 없습니다. (필터 또는 다른 날짜를 선택해 보세요)</p>";
            return;
        }
        var h =
            '<p class="cal-detail__title">' +
            state.selected.y +
            "년 " +
            state.selected.m +
            "월 " +
            state.selected.d +
            "일 일정</p>";
        evs.forEach(function (ev) {
            var btn = "";
            if (ev.officialUrl) {
                var label = ev.sourceLabel ? ev.sourceLabel + "에서 보기" : "정부 사이트에서 보기";
                btn =
                    '<a class="cal-event-card__btn" href="' +
                    ev.officialUrl +
                    '" target="_blank" rel="noopener noreferrer">' +
                    label +
                    "</a>";
            } else {
                btn = '<span class="cal-event-card__btn is-disabled">공식 공고 확인 예정</span>';
            }
            h +=
                '<article class="cal-event-card">' +
                '<p class="cal-event-card__name">' +
                ev.title +
                "</p>" +
                '<p class="cal-event-card__meta">신청 기간: ' +
                ev.period +
                "<br>대상: " +
                ev.target +
                "<br>혜택: " +
                ev.benefit +
                "</p>" +
                '<p class="cal-event-card__meta" style="margin:0;font-size:11px;color:#94a3b8;">' +
                ev.note +
                "</p>" +
                btn +
                "</article>";
        });
        detailEl.innerHTML = h;
    }

    function goMonth(delta) {
        state.m += delta;
        if (state.m > 12) {
            state.m = 1;
            state.y++;
        }
        if (state.m < 1) {
            state.m = 12;
            state.y--;
        }
        state.selected = null;
        EVENTS = buildEvents(state.y, state.m);
        renderGrid();
        renderDetail();
        renderTop3();
    }

    function init() {
        EVENTS = buildEvents(state.y, state.m);
        renderWeekdays();
        renderGrid();
        renderDetail();
        renderTop3();

        if (prevBtn) prevBtn.addEventListener("click", function () { goMonth(-1); });
        if (nextBtn) nextBtn.addEventListener("click", function () { goMonth(1); });
        if (regionSel) regionSel.addEventListener("change", function () { renderGrid(); renderTop3(); });
        if (catSel) catSel.addEventListener("change", function () { renderGrid(); renderTop3(); });

        var heroCta = document.querySelector('a[href="#section-cal-main"]');
        if (heroCta) {
            heroCta.addEventListener("click", function (e) {
                var t = document.getElementById("section-cal-main");
                if (t) {
                    e.preventDefault();
                    t.scrollIntoView({ behavior: "smooth" });
                }
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
