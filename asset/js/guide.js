(function () {
    "use strict";

    var TERMS = {
        saving: {
            title: "적금이란?",
            level: "초급",
            levelMid: false,
            short: "정해진 기간 동안 꾸준히 납입하는 저축 상품입니다.",
            body: "<p>적금은 매월 일정 금액을 넣어 만기 시 목돈을 마련하는 대표적인 상품이에요. 금리·우대 조건은 금융기관마다 달라요.</p>",
        },
        deposit: {
            title: "예금이란?",
            level: "초급",
            levelMid: false,
            short: "한 번에 맡겨 만기까지 보관하는 저축입니다.",
            body: "<p>예금은 목돈을 한 번에 예치하고 기간을 정해 두는 방식이에요. 적금보다 금액이 클 때 자주 쓰입니다.</p>",
        },
        cma: {
            title: "CMA란?",
            level: "중급",
            levelMid: true,
            short: "증권사 수시 입출금 통장에 가까운 예금성 상품입니다.",
            body: "<p>CMA는 증권사에서 제공하는 것으로, 짧게 자금을 묶어 두었다가 투자로 옮기기 쉬워요. 수익률·조건은 상품별로 확인하세요.</p>",
        },
        etf: {
            title: "ETF란?",
            level: "중급",
            levelMid: true,
            short: "거래소에 상장되어 사고팔 수 있는 펀드입니다.",
            body: "<p>ETF는 지수·자산군을 추종하는 상장 펀드예요. 분산 투자에 쓰일 수 있지만 원금 손실 가능성도 있어요.</p>",
        },
        emergencyFund: {
            title: "비상금 통장",
            level: "초급",
            levelMid: false,
            short: "갑작스런 지출을 막아주는 안전장치입니다.",
            body: "<p>비상금은 갑자기 생기는 병원비·이사비·수리비처럼 예측하기 어려운 지출을 막아주는 ‘안전벨트’예요. 보통 생활비 1~3개월(또는 최소 100만 원)을 목표로 시작하면 부담이 적습니다.</p>",
        },
        budget: {
            title: "예산 관리",
            level: "초급",
            levelMid: false,
            short: "돈의 ‘용도’를 먼저 정해 지키는 습관입니다.",
            body: "<p>예산 관리는 돈을 아끼는 것보다, <strong>돈을 어디에 쓸지 먼저 정하는 것</strong>에 가까워요. 월급날 생활비/저축/비상금/고정비로 ‘배분’해 두면 지출이 훨씬 안정됩니다.</p>",
        },
        fixedCost: {
            title: "고정비",
            level: "초급",
            levelMid: false,
            short: "매달 거의 고정으로 나가는 비용이에요.",
            body: "<p>고정비는 월세·통신비·구독·보험처럼 매달 반복되는 비용이에요. 고정비를 한 번만 줄여도 매달 자동으로 ‘저축’ 효과가 납니다.</p>",
        },
        variableCost: {
            title: "변동비",
            level: "초급",
            levelMid: false,
            short: "생활 패턴에 따라 달라지는 비용이에요.",
            body: "<p>변동비는 식비·교통·쇼핑처럼 상황에 따라 달라지는 비용이에요. 변동비를 통제하기 어렵다면 ‘생활비 통장’으로 한도를 정해 두는 방법이 효과적입니다.</p>",
        },
        autoTransfer: {
            title: "자동이체",
            level: "초급",
            levelMid: false,
            short: "저축을 ‘결심’이 아닌 ‘시스템’으로 만들어요.",
            body: "<p>자동이체는 재테크의 기본기예요. 급여일 다음 날로 자동저축을 걸면 ‘남는 돈을 저축’이 아니라 ‘저축하고 남는 돈을 소비’로 구조가 바뀝니다.</p>",
        },
        interest: {
            title: "이자·원금·단리·복리",
            level: "중급",
            levelMid: true,
            short: "수익 계산의 기본 개념을 한 번에 정리해요.",
            body:
                "<ul>" +
                "<li><strong>원금</strong>: 처음 맡기거나 빌린 돈</li>" +
                "<li><strong>이자</strong>: 돈을 맡기거나 빌리는 대가(수익/비용)</li>" +
                "<li><strong>단리</strong>: 원금에만 이자가 붙는 방식</li>" +
                "<li><strong>복리</strong>: 원금+이자(누적)에 이자가 다시 붙는 방식</li>" +
                "</ul><p>시간이 길어질수록 복리의 힘이 커져요. 그래서 ‘빨리 시작하는 습관’이 중요합니다.</p>",
        },
        creditScore: {
            title: "신용점수",
            level: "중급",
            levelMid: true,
            short: "대출·카드 발급·금리에 영향을 줄 수 있어요.",
            body: "<p>신용점수는 연체 여부, 상환 이력, 카드 사용 패턴 등으로 산출될 수 있어요(NICE/KCB). 핵심은 <strong>연체 0</strong>과 <strong>무리한 단기 대출/한도 과사용을 피하는 것</strong>입니다.</p>",
        },
        splitAccounts: {
            title: "소비 통장 분리",
            level: "초급",
            levelMid: false,
            short: "생활비를 한 통장에 모아 과소비를 줄여요.",
            body: "<p>생활비만 넣어 쓰는 통장을 따로 만들면 ‘이번 달 남은 돈’이 눈에 보여요. 예산을 지키기 쉬워지고, 카드값도 예측 가능해집니다.</p>",
        },
        youthLeap: {
            title: "청년도약계좌",
            level: "중급",
            levelMid: true,
            short: "조건에 따라 정부 지원이 더해질 수 있어요.",
            body: "<p>청년도약계좌는 청년의 자산형성을 돕는 정책 금융상품이에요. 소득·연령 등 조건과 모집 시기는 변동될 수 있으니 최신 공고를 확인하세요.</p>",
        },
        jeonseLoan: {
            title: "전세대출",
            level: "중급",
            levelMid: true,
            short: "전세 보증금을 마련할 때 쓰는 대출이에요.",
            body: "<p>전세대출은 보증(예: 주택금융공사 보증)과 함께 진행되는 경우가 많아요. 금리·보증료·상환조건을 함께 비교하는 것이 중요합니다.</p>",
        },
        rentBurden: {
            title: "월세 부담률",
            level: "초급",
            levelMid: false,
            short: "월세가 소득에서 차지하는 비율을 말해요.",
            body: "<p>월세 부담률은 보통 <strong>(월세+관리비) / 월 소득</strong>으로 생각하면 쉬워요. 부담률이 높을수록 저축 여력이 줄어들 수 있어요.</p>",
        },
        loanRate: {
            title: "대출 금리",
            level: "초급",
            levelMid: false,
            short: "같은 금액도 금리에 따라 총 비용이 달라져요.",
            body: "<p>금리는 대출의 ‘가격’이에요. 0.5%p 차이도 기간이 길면 총 이자가 크게 달라질 수 있어요. 금리뿐 아니라 중도상환수수료도 함께 확인하세요.</p>",
        },
        repayType: {
            title: "상환 방식(원리금균등/원금균등)",
            level: "중급",
            levelMid: true,
            short: "월 납입·총 이자 구조가 달라지는 핵심 요소예요.",
            body: "<p><strong>원리금균등</strong>은 매달 갚는 금액이 비슷하고, <strong>원금균등</strong>은 초반 부담이 크지만 총 이자가 줄어드는 경향이 있어요. 내 현금흐름에 맞는 방식을 고르는 게 중요합니다.</p>",
        },
        diversification: {
            title: "분산 투자·리스크 관리",
            level: "중급",
            levelMid: true,
            short: "한 번에 크게보다, 오래 가는 방식이 중요해요.",
            body: "<p>분산 투자는 한 곳에 몰빵하지 않는 전략이에요. 내 상황에서 감당 가능한 위험(리스크)을 먼저 정하고, 장기적으로 꾸준히 가는 것이 핵심입니다.</p>",
        },
    };

    var tips = [
        "소액이라도 급여일 다음 날 자동이체를 걸어보세요.",
        "통장을 '생활비 / 저축 / 비상금'으로 나누면 통제가 쉬워요.",
        "금융 용어는 한 번에 외우지 말고, 궁금할 때마다 하나씩 알아가도 충분해요.",
    ];

    var quotes = [
        "작은 소비 습관 하나가 큰 자산 차이를 만듭니다.",
        "자동저축은 가장 쉬운 재테크의 시작입니다.",
        "복리는 시간이 길수록 힘이 커집니다.",
        "잘 모르면 ‘지금은 안 한다’가 최고의 리스크 관리예요.",
    ];

    function openModal(key) {
        var t = TERMS[key];
        if (!t) return;
        var modal = document.getElementById("guide-modal");
        var title = document.getElementById("guide-modal-title");
        var body = document.getElementById("guide-modal-body");
        if (!modal || !title || !body) return;
        title.textContent = t.title;
        body.innerHTML = t.body;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        var modal = document.getElementById("guide-modal");
        if (modal) {
            modal.classList.remove("is-open");
            document.body.style.overflow = "";
        }
    }

    function setSearchFeedback(text) {
        var el = document.getElementById("guide-search-feedback");
        if (!el) return;
        el.textContent = text || "";
    }

    function clearMatches() {
        document.querySelectorAll(".guide-term-card.is-match").forEach(function (c) {
            c.classList.remove("is-match");
        });
    }

    function filterCards(q) {
        var n = String(q || "").trim().toLowerCase();
        var cards = Array.prototype.slice.call(document.querySelectorAll(".guide-term-card"));
        var visible = 0;

        clearMatches();
        cards.forEach(function (card) {
            var hay = (card.getAttribute("data-search") || "").toLowerCase();
            var show = !n || hay.indexOf(n) !== -1;
            card.classList.toggle("is-hidden", !show);
            if (show) visible++;
            if (n && show) card.classList.add("is-match");
        });

        if (!n) {
            setSearchFeedback("궁금한 용어를 검색해 보세요. 카드가 필터링됩니다.");
            return;
        }
        if (!visible) {
            setSearchFeedback("검색 결과가 없어요. 다른 키워드로 다시 검색해 보세요.");
            return;
        }
        setSearchFeedback("검색 결과 " + visible + "개를 찾았어요.");
    }

    function randomTip() {
        var el = document.getElementById("guide-random-tip");
        if (!el) return;
        el.textContent = tips[Math.floor(Math.random() * tips.length)];
    }

    function randomQuote() {
        var el = document.getElementById("guide-quote");
        if (!el) return;
        el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".guide-term-card").forEach(function (card) {
            card.addEventListener("click", function () {
                openModal(card.getAttribute("data-term"));
            });
        });

        document.querySelectorAll(".guide-top-term").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var q = btn.getAttribute("data-q") || "";
                var search = document.getElementById("guide-search-input");
                if (search) {
                    search.value = q;
                    filterCards(q);
                    var t = document.getElementById("section-terms");
                    if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });

        var closeBtn = document.getElementById("guide-modal-close");
        var modal = document.getElementById("guide-modal");
        if (closeBtn) closeBtn.addEventListener("click", closeModal);
        if (modal) {
            modal.addEventListener("click", function (e) {
                if (e.target === modal) closeModal();
            });
        }
        var search = document.getElementById("guide-search-input");
        if (search) {
            search.addEventListener("input", function () {
                filterCards(search.value);
            });
        }
        filterCards("");
        randomTip();
        randomQuote();
    });
})();
