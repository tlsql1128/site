/**
 * 청년 정부지원금 찾기 — 추천 로직 & UI
 */
(function () {
    "use strict";

    var ageInput = document.getElementById("support-age");
    var submitBtn = document.getElementById("btn-support-run");
    var errorEl = document.getElementById("support-error");
    var resultsEl = document.getElementById("support-results");
    var tipsEl = document.getElementById("support-tips-content");
    var gaugePctEl = document.getElementById("support-gauge-pct");
    var gaugeFill = document.getElementById("support-gauge-fill");
    var gaugeCountEl = document.getElementById("support-gauge-count");
    var gaugeBar = document.getElementById("support-gauge-bar");

    var PROGRAMS = {
        doyak: {
            name: "청년도약계좌",
            examples: "연 우대금리·정부 매칭 적립 등 (공고 기준)",
        },
        rent: {
            name: "청년월세지원",
            examples: "월 일정 금액 지원 (지역·소득 기준)",
        },
        jeonse: {
            name: "청년전세대출",
            examples: "저금리 전세자금 대출 (한도·보증 기준)",
        },
        job: {
            name: "취업지원금",
            examples: "구직활동비·취업성공수당 등 (제도별 상이)",
        },
    };

    /** 정책별 상세 (확장 시 동일 키로 항목 추가) */
    var PROGRAM_DETAILS = {
        doyak: {
            intro:
                "청년의 자산 형성을 지원하기 위한 중장기 금융상품입니다. 일정 소득 기준을 충족하는 청년이 가입 가능하며, 월 납입액에 따라 정부 기여금 및 비과세 혜택이 적용될 수 있습니다. 꾸준한 저축 습관을 만들고 목돈 마련을 준비하는 사용자에게 적합합니다.",
            target: "일정 연령 및 소득 기준을 충족하는 청년",
            benefits: "정부 기여금, 비과세 혜택 가능(공고·약관 기준)",
            checklist: "직장인·사회초년생 등 자산 형성 목표가 있는지, 납입 한도·기간을 미리 확인할 것",
            note: "실제 가입 조건·금리는 가입 금융기관 및 당시 공고를 확인하세요.",
        },
        rent: {
            intro:
                "월세 부담이 있는 청년을 대상으로 일정 기간 월세 일부를 지원하는 제도입니다. 지역 및 소득 요건에 따라 지원 가능 여부가 달라질 수 있습니다. 현재 월세 거주 중이거나 독립을 준비하는 청년에게 유리합니다.",
            target: "월세 거주 청년, 소득·자산 조건 충족자(지역별 상이)",
            benefits: "월세 일부 지원(금액·기간은 공고 기준)",
            checklist: "거주지 주소·임대차 계약서, 소득·자산 증빙, 지자체 신청 기간 마감일 확인",
            note: "지자체별 명칭·요건·신청 기간이 다를 수 있습니다.",
        },
        jeonse: {
            intro:
                "전세보증금 마련이 필요한 청년을 위한 대출 지원 제도입니다. 일반 전세대출보다 우대 금리 또는 청년 전용 조건이 적용될 수 있습니다. 초기 목돈이 부족한 청년에게 실질적으로 도움이 될 수 있습니다.",
            target: "전세 계약 예정 또는 전세 거주 청년(소득·주택 기준 확인)",
            benefits: "전세보증금 대출, 우대금리 가능(상품별 상이)",
            checklist: "LTV·DSR·보증기관 조건, 전세계약 일정과 대출 실행 시점 맞추기",
            note: "대출 한도·보증·금리는 금융기관 심사 결과에 따릅니다.",
        },
        job: {
            intro:
                "취업 준비 중인 청년에게 구직활동을 지원하는 제도입니다. 활동 계획, 참여 조건, 소득 기준 등에 따라 지급 여부가 달라질 수 있습니다. 취준생이나 일정 기간 구직 중인 사용자에게 유용합니다.",
            target: "취업 준비 청년(프로그램별 연령·소득 요건 상이)",
            benefits: "구직활동 관련 지원금 또는 프로그램 참여 지원",
            checklist: "참여 의무·출석·이력서·구직활동 보고 요건 등 프로그램별 규정 확인",
            note: "국민취업지원제도 등 프로그램별 신청 요건이 다릅니다.",
        },
    };

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function buildDetailHtml(key) {
        var d = PROGRAM_DETAILS[key];
        if (!d) return "";
        return (
            '<div class="support-prog__detail-intro">' +
            escapeHtml(d.intro) +
            "</div>" +
            '<dl class="support-prog__detail-dl">' +
            '<div class="support-prog__detail-row">' +
            "<dt>지원 대상</dt>" +
            "<dd>" +
            escapeHtml(d.target) +
            "</dd></div>" +
            '<div class="support-prog__detail-row">' +
            "<dt>주요 혜택</dt>" +
            "<dd>" +
            escapeHtml(d.benefits) +
            "</dd></div>" +
            '<div class="support-prog__detail-row">' +
            "<dt>신청 시 체크포인트</dt>" +
            "<dd>" +
            escapeHtml(d.checklist) +
            "</dd></div>" +
            '<div class="support-prog__detail-row">' +
            "<dt>참고 안내</dt>" +
            "<dd>" +
            escapeHtml(d.note) +
            "</dd></div>" +
            "</dl>"
        );
    }

    function getIncome() {
        var el = document.querySelector(".support-chip--income.is-active");
        return el ? el.getAttribute("data-income") : "100-200";
    }

    function getStatus() {
        var el = document.querySelector(".support-chip--status.is-active");
        return el ? el.getAttribute("data-status") : "employee";
    }

    function getHousing() {
        var el = document.querySelector(".support-chip--housing.is-active");
        return el ? el.getAttribute("data-housing") : null;
    }

    document.querySelectorAll(".support-chip--income").forEach(function (chip) {
        chip.addEventListener("click", function () {
            document.querySelectorAll(".support-chip--income").forEach(function (c) {
                c.classList.remove("is-active");
            });
            chip.classList.add("is-active");
        });
    });

    document.querySelectorAll(".support-chip--status").forEach(function (chip) {
        chip.addEventListener("click", function () {
            document.querySelectorAll(".support-chip--status").forEach(function (c) {
                c.classList.remove("is-active");
            });
            chip.classList.add("is-active");
        });
    });

    document.querySelectorAll(".support-chip--housing").forEach(function (chip) {
        chip.addEventListener("click", function () {
            if (chip.classList.contains("is-active")) {
                chip.classList.remove("is-active");
            } else {
                document.querySelectorAll(".support-chip--housing").forEach(function (c) {
                    c.classList.remove("is-active");
                });
                chip.classList.add("is-active");
            }
        });
    });

    function badgeClass(level) {
        if (level === "high") return "support-badge support-badge--high";
        if (level === "mid") return "support-badge support-badge--mid";
        if (level === "check") return "support-badge support-badge--check";
        return "support-badge support-badge--low";
    }

    function badgeText(level) {
        if (level === "high") return "매우 추천";
        if (level === "mid") return "추천";
        if (level === "check") return "조건 확인";
        return "검토 필요";
    }

    function scoreProgram(age, income, status, housing) {
        var scores = { doyak: 40, rent: 40, jeonse: 40, job: 40 };

        if (age >= 19 && age <= 34) {
            scores.doyak += 25;
            scores.rent += 15;
            scores.jeonse += 15;
        } else if (age >= 35 && age <= 39) {
            scores.doyak += 10;
        }

        if (status === "employee") {
            scores.doyak += 20;
            if (income !== "none" && income !== "lt100") scores.doyak += 15;
        }
        if (status === "seeker") {
            scores.job += 35;
            scores.rent += 10;
        }
        if (status === "biz" || status === "freelance") {
            scores.jeonse += 10;
            scores.job += 5;
        }

        if (housing === "wolse") {
            scores.rent += 30;
        }
        if (housing === "jeonse") {
            scores.jeonse += 25;
        }
        if (housing === "alone") {
            scores.rent += 12;
            scores.jeonse += 12;
        }
        if (housing === "parent") {
            scores.rent += 5;
        }

        if (income === "none") {
            scores.job += 15;
            scores.rent += 10;
        }
        if (income === "lt100" || income === "100-200") {
            scores.rent += 15;
            scores.jeonse += 10;
        }
        if (income === "200-300" || income === "gt300") {
            scores.doyak += 15;
        }

        return scores;
    }

    function levelFromScore(s) {
        if (s >= 78) return "high";
        if (s >= 58) return "mid";
        if (s >= 42) return "check";
        return "low";
    }

    function descForProgram(key, level, status, housing) {
        var map = {
            doyak: {
                high: "월 저축 습관과 자산 형성에 특히 추천됩니다.",
                mid: "소득이 있는 청년의 장기 저축·매칭 혜택을 활용해보세요.",
                check: "소득·나이 기준을 공고에서 확인해 주세요.",
                low: "조건에 따라 신청 가능성이 달라질 수 있어요.",
            },
            rent: {
                high: "월세 거주 청년에게 유리한 제도입니다.",
                mid: "주거비 부담 완화에 도움이 될 수 있어요.",
                check: "지역별 소득·자산 기준을 꼭 확인하세요.",
                low: "거주 형태·소득에 따라 달라질 수 있어요.",
            },
            jeonse: {
                high: "보증금 마련·전세 안정에 활용해 보세요.",
                mid: "자취·전세 전환 시 검토해 볼 만합니다.",
                check: "대출 한도·보증 조건을 금융기관에서 확인하세요.",
                low: "상황에 따라 우선순위가 달라질 수 있어요.",
            },
            job: {
                high: "취업 준비 단계에서 우선 검토할 만합니다.",
                mid: "구직활동 지원 제도와 함께 알아보세요.",
                check: "취업 준비 상태에 따라 신청 가능성이 달라집니다.",
                low: "직장인·소득자는 제한될 수 있어요.",
            },
        };
        var d = map[key];
        var lv = level;
        if (key === "job" && status !== "seeker") lv = "check";
        if (key === "rent" && housing === "wolse" && level !== "high") lv = "mid";
        return d[lv] || d.mid;
    }

    function buildTips(age, income, status, housing) {
        var tips = [];

        if (status === "seeker" && income === "none") {
            tips.push("지출 고정비부터 줄이는 것이 중요해요.");
            tips.push("청년 구직활동 지원금도 함께 확인해보세요.");
            tips.push("소액이라도 자동저축 습관을 만들어보세요.");
        } else if (status === "employee" && (income === "200-300" || income === "gt300")) {
            tips.push("청년도약계좌와 적금 병행이 좋아요.");
            tips.push("비상금 통장을 따로 운영해보세요.");
            tips.push("월급일 자동 저축 설정을 추천합니다.");
        } else if (housing === "wolse") {
            tips.push("월세지원 제도와 주거급여도 함께 확인해보세요.");
            tips.push("관리비 포함 월 주거비를 점검해보세요.");
        } else if (status === "biz") {
            tips.push("소득 증빙 자료를 미리 정리해두세요.");
            tips.push("세금·보험료 관리가 중요합니다.");
        } else {
            tips.push("가계부를 한 달만이라도 기록해보면 패턴이 보여요.");
            tips.push("청년 우대 금융상품은 금리·한도 조건을 비교해보세요.");
            tips.push("지자체 청년 지원 공고를 정기적으로 확인하면 좋아요.");
        }

        if (age <= 24 && tips.length < 4) {
            tips.push("사회초년생은 생활비·비상금 비율을 먼저 잡아보세요.");
        }

        return tips.slice(0, 5);
    }

    function renderTips(tips) {
        if (!tipsEl) return;
        tipsEl.innerHTML = "";
        if (!tips.length) {
            tipsEl.innerHTML =
                '<p class="support-tips__placeholder">조건을 입력하고 맞춤 혜택을 찾아보세요.</p>';
            return;
        }
        var ul = document.createElement("ul");
        ul.className = "support-tips__list";
        tips.forEach(function (t) {
            var li = document.createElement("li");
            li.textContent = t;
            ul.appendChild(li);
        });
        tipsEl.appendChild(ul);
    }

    function renderResults(scores, age, income, status, housing) {
        if (!resultsEl) return;

        var order = ["doyak", "rent", "jeonse", "job"].sort(function (a, b) {
            return scores[b] - scores[a];
        });

        var html = "";
        order.forEach(function (key) {
            var p = PROGRAMS[key];
            var s = scores[key];
            var lv = levelFromScore(s);
            var desc = descForProgram(key, lv, status, housing);
            var detailId = "support-detail-" + key;
            html +=
                '<article class="support-prog support-reveal" data-prog="' +
                key +
                '">' +
                '<div class="support-prog__head">' +
                '<h3 class="support-prog__name">' +
                escapeHtml(p.name) +
                "</h3>" +
                '<span class="' +
                badgeClass(lv) +
                '">' +
                badgeText(lv) +
                "</span>" +
                "</div>" +
                '<p class="support-prog__desc">' +
                escapeHtml(desc) +
                "</p>" +
                '<p class="support-prog__ex"><strong>예상 혜택 예시</strong> · ' +
                escapeHtml(p.examples) +
                "</p>" +
                '<div class="support-prog__actions">' +
                '<button type="button" class="support-prog__btn support-prog__btn--toggle" data-prog-key="' +
                key +
                '" data-action="toggle-detail" aria-expanded="false" aria-controls="' +
                detailId +
                '">자세히 보기</button>' +
                '<span class="support-prog__btn support-prog__btn--ghost support-prog__btn--disabled" aria-disabled="true" title="공식 공고 페이지 연결 예정">신청 안내</span>' +
                "</div>" +
                '<p class="support-prog__apply-hint">실제 신청·접수는 정부24, 복지로, 지자체 공고 등 공식 채널에서 확인해 주세요.</p>' +
                '<div class="support-prog__detail-anim" id="' +
                detailId +
                '" aria-hidden="true">' +
                '<div class="support-prog__detail-inner">' +
                buildDetailHtml(key) +
                "</div></div>" +
                "</article>";
        });

        resultsEl.innerHTML = html;

        var goodCount = order.filter(function (k) {
            var lv = levelFromScore(scores[k]);
            return lv === "high" || lv === "mid";
        }).length;

        var pct = Math.min(
            98,
            Math.round(28 + goodCount * 16 + (scores.doyak + scores.rent + scores.jeonse + scores.job) / 16)
        );
        animateGauge(pct, goodCount);

        document.querySelectorAll(".support-prog[data-prog]").forEach(function (el, i) {
            setTimeout(function () {
                el.classList.add("is-visible");
            }, 80 * i);
        });

        renderTips(buildTips(age, income, status, housing));
    }

    function animateGauge(target, goodCount) {
        var start = 0;
        var dur = 900;
        var t0 = null;
        function tick(ts) {
            if (!t0) t0 = ts;
            var p = Math.min(1, (ts - t0) / dur);
            var val = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
            if (gaugePctEl) gaugePctEl.textContent = String(val);
            if (gaugeFill) gaugeFill.style.width = val + "%";
            if (gaugeBar) gaugeBar.setAttribute("aria-valuenow", String(val));
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        if (gaugeCountEl) gaugeCountEl.textContent = String(goodCount);
    }

    function validate() {
        var age = parseInt(ageInput.value, 10);
        if (isNaN(age) || age < 15 || age > 45) {
            errorEl.textContent = "나이는 15세 이상 45세 이하로 입력해 주세요.";
            return false;
        }
        errorEl.textContent = "";
        return true;
    }

    function run() {
        if (!validate()) return;
        var age = parseInt(ageInput.value, 10);
        var income = getIncome();
        var status = getStatus();
        var housing = getHousing();

        var scores = scoreProgram(age, income, status, housing);
        renderResults(scores, age, income, status, housing);

        var gauge = document.getElementById("support-gauge");
        if (gauge) gauge.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (submitBtn) submitBtn.addEventListener("click", run);

    if (resultsEl) {
        resultsEl.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-action=\"toggle-detail\"]");
            if (!btn || !resultsEl.contains(btn)) return;
            e.preventDefault();
            var article = btn.closest(".support-prog");
            var panel = article && article.querySelector(".support-prog__detail-anim");
            if (!article || !panel) return;

            var open = !article.classList.contains("is-detail-open");
            article.classList.toggle("is-detail-open", open);
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            btn.textContent = open ? "자세히 닫기" : "자세히 보기";
            panel.setAttribute("aria-hidden", open ? "false" : "true");
        });
    }

    var io = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) en.target.classList.add("is-visible");
            });
        },
        { threshold: 0.12 }
    );
    document.querySelectorAll(".support-extra .support-reveal").forEach(function (el) {
        io.observe(el);
    });
})();
