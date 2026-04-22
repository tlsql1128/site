/**
 * 연봉 실수령액 계산기 — 추정 로직 (참고용)
 */
(function ($) {
    'use strict';

    var INSURANCE_MONTHLY_CAP = 5530000;
    var PENSION_RATE = 0.045;
    var HEALTH_RATE = 0.03545;
    var EMPLOY_RATE = 0.009;

    /** 부양가족 수(1~4)에 따른 소득세 간이 효과율 — 세전 월급 대비 */
    var INCOME_TAX_FACTOR = {
        1: 0.052,
        2: 0.041,
        3: 0.033,
        4: 0.026
    };

    var state = { hasResult: false };

    function parseDigits(str) {
        if (str == null || str === '') return NaN;
        var n = String(str).replace(/[^\d]/g, '');
        return n === '' ? NaN : parseInt(n, 10);
    }

    function formatWon(n) {
        if (n == null || isNaN(n)) return '0';
        return Math.round(n).toLocaleString('ko-KR');
    }

    function clamp(n, min, max) {
        return Math.min(Math.max(n, min), max);
    }

    /**
     * @returns {{ monthlyGross: number, netMonthly: number, netAnnual: number, totalDedMonthly: number,
     *   rows: Array<{name:string, m:number, y:number}> }}
     */
    function calculatePayroll(annualGross, depCount, nonTaxMonthly) {
        var monthlyGross = annualGross / 12;
        var base = Math.min(monthlyGross, INSURANCE_MONTHLY_CAP);

        var pension = Math.round(base * PENSION_RATE);
        var health = Math.round(base * HEALTH_RATE);
        var ltc = Math.round(health * 0.1295);
        var employment = Math.round(base * EMPLOY_RATE);

        var insTotal = pension + health + ltc + employment;

        var nontax = clamp(nonTaxMonthly || 0, 0, monthlyGross);
        var depKey = clamp(depCount, 1, 4);
        var taxFactor = INCOME_TAX_FACTOR[depKey];
        var baseForTax = Math.max(0, monthlyGross - insTotal - nontax);
        var incomeTax = Math.round(baseForTax * taxFactor);

        var localTax = Math.round(incomeTax * 0.1);

        var totalDed = insTotal + incomeTax + localTax;
        var netMonthly = Math.round(monthlyGross - totalDed);
        if (netMonthly < 0) netMonthly = 0;

        var rows = [
            { name: '국민연금', m: pension, y: pension * 12 },
            { name: '건강보험', m: health, y: health * 12 },
            { name: '장기요양보험', m: ltc, y: ltc * 12 },
            { name: '고용보험', m: employment, y: employment * 12 },
            { name: '소득세', m: incomeTax, y: incomeTax * 12 },
            { name: '지방소득세', m: localTax, y: localTax * 12 }
        ];

        return {
            monthlyGross: monthlyGross,
            netMonthly: netMonthly,
            netAnnual: netMonthly * 12,
            totalDedMonthly: totalDed,
            insTotal: insTotal,
            incomeTax: incomeTax,
            localTax: localTax,
            rows: rows
        };
    }

    function countUpText($el, target, duration) {
        var start = parseDigits($el.text()) || 0;
        if (start === target) {
            $el.text(formatWon(target));
            return;
        }
        var startTime;
        function step(ts) {
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            var cur = Math.round(start + (target - start) * eased);
            $el.text(formatWon(cur));
            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                $el.text(formatWon(target));
            }
        }
        requestAnimationFrame(step);
    }

    function validate(annual, nontax) {
        if (!annual || annual <= 0) {
            return '세전 연봉을 올바르게 입력해 주세요. (0보다 큰 숫자)';
        }
        if (annual < 1000000) {
            return '연봉은 최소 1,000,000원 이상으로 입력해 주세요.';
        }
        if (annual > 9999999999) {
            return '입력 가능한 연봉 범위를 초과했습니다.';
        }
        if (nontax < 0) {
            return '비과세액은 0 이상으로 입력해 주세요.';
        }
        if (nontax > annual / 12) {
            return '비과세액이 월 세전 급여를 초과할 수 없습니다.';
        }
        return '';
    }

    function renderTable(rows) {
        var $body = $('#salary-table-body');
        $body.empty();
        rows.forEach(function (r) {
            $body.append(
                '<tr><td>' +
                    r.name +
                    '</td><td>' +
                    formatWon(r.m) +
                    ' 원</td><td>' +
                    formatWon(r.y) +
                    ' 원</td></tr>'
            );
        });
    }

    function updateDonut(net, ded, gross) {
        var pct = gross > 0 ? (net / gross) * 100 : 0;
        pct = Math.max(0, Math.min(100, pct));
        $('#salary-donut-ring').css('--net-pct', String(pct.toFixed(2)));
        $('#salary-donut-pct').text(pct.toFixed(1) + '%');
        $('#legend-net').text(formatWon(net) + '원');
        $('#legend-ded').text(formatWon(ded) + '원');
        $('#legend-gross').text(formatWon(Math.round(gross)) + '원');
    }

    function runCalculate() {
        var annual = parseDigits($('#salary-annual-input').val());
        var nontax = parseDigits($('#salary-nontax-input').val());
        if (isNaN(nontax)) nontax = 0;

        var err = validate(annual, nontax);
        $('#salary-error').text(err);
        if (err) {
            state.hasResult = false;
            return;
        }

        var deps = parseInt($('.salary-dep-tab.is-active').data('deps'), 10) || 2;
        var result = calculatePayroll(annual, deps, nontax);

        countUpText($('#result-net-monthly'), result.netMonthly, 550);
        $('#result-gross-monthly').text(formatWon(Math.round(result.monthlyGross)));
        $('#result-deduct-monthly').text(formatWon(result.totalDedMonthly));
        $('#result-net-annual').text(formatWon(result.netAnnual));

        var man = Math.round(result.netMonthly / 10000);
        var summary =
            '현재 입력 기준으로 매달 약 ' +
            man +
            '만 원을 실수령하게 됩니다. 부양가족 수와 비과세 금액에 따라 실제 수령액은 달라질 수 있습니다.';
        $('#result-summary').text(summary);

        renderTable(result.rows);
        updateDonut(result.netMonthly, result.totalDedMonthly, result.monthlyGross);
        state.hasResult = true;
    }

    function initReveal() {
        if (!('IntersectionObserver' in window)) {
            $('.salary-reveal').addClass('is-visible');
            return;
        }
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        $(e.target).addClass('is-visible');
                        io.unobserve(e.target);
                    }
                });
            },
            { root: null, threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        $('.salary-reveal').each(function () {
            io.observe(this);
        });
    }

    function bindCommaInput($input) {
        $input.on('input', function () {
            var raw = parseDigits($(this).val());
            if (isNaN(raw)) {
                $(this).val('');
                return;
            }
            $(this).val(formatWon(raw));
        });
        $input.on('blur', function () {
            var raw = parseDigits($(this).val());
            if (!isNaN(raw)) {
                $(this).val(formatWon(raw));
            }
        });
    }

    $(document).ready(function () {
        if (!document.getElementById('btn-salary-calc')) {
            return;
        }

        bindCommaInput($('#salary-annual-input'));
        bindCommaInput($('#salary-nontax-input'));
        $('#salary-nontax-input').val('0');

        $('.salary-dep-tab').on('click', function () {
            $('.salary-dep-tab').removeClass('is-active').attr('aria-pressed', 'false');
            $(this).addClass('is-active').attr('aria-pressed', 'true');
            if (state.hasResult) {
                runCalculate();
            }
        });

        $('#btn-salary-calc').on('click', runCalculate);

        initReveal();
    });
})(jQuery);
