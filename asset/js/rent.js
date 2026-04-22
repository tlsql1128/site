/**
 * 청년 전월세 계산기 — rent.html
 * 참고용 시뮬레이션 (실제 계약·대출과 다를 수 있음)
 */
(function ($) {
    'use strict';

    var OPP_ANNUAL = 0.025;
    var TYPICAL_JEONSE = {
        seoul: 200000000,
        gyeonggi: 140000000,
        incheon: 120000000,
        metro: 100000000,
        other: 80000000
    };

    function parseDigits(str) {
        var n = parseInt(String(str).replace(/\D/g, ''), 10);
        return isNaN(n) ? 0 : n;
    }

    function formatWon(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function jeonseFeasibilityText(budget, region) {
        var m = budget / 10000000;
        switch (region) {
            case 'seoul':
                if (m < 80) return '서울 평균 전세 수준으로는 보증금이 다소 부족해 보일 수 있습니다.';
                if (m < 100) return '서울 일부 지역·소형 평수 위주로 전세 협의가 가능할 수 있습니다.';
                return '서울 일부 매물에서 전세 협의가 가능해 보이는 예산입니다.';
            case 'gyeonggi':
                if (m < 60) return '경기권에서는 소형·외곽 위주 전세 검토가 필요할 수 있습니다.';
                return '경기권 소형~중형 전세 검토가 가능한 예산입니다.';
            case 'incheon':
                if (m < 55) return '인천 지역 소형 평수 위주로 전세 검토가 필요할 수 있습니다.';
                return '인천권 일대 전세 검토가 가능한 예산입니다.';
            case 'metro':
                if (m < 55) return '지방 광역시에서도 소형 위주 검토가 필요할 수 있습니다.';
                return '지방 광역시 일대 전세 검토가 가능한 예산입니다.';
            default:
                if (m < 50) return '지방은 상대적으로 여유가 있으나, 매물에 따라 다릅니다.';
                return '지방 지역에서는 전세 선택지가 비교적 넓어 보입니다.';
        }
    }

    function loanPrincipal(budget, region, loanType) {
        if (loanType === 'none') return 0;
        var typical = TYPICAL_JEONSE[region] || TYPICAL_JEONSE.other;
        return Math.max(0, typical - budget);
    }

    function jeonseTotalCost(budget, region, loanType, loanRate, years) {
        var opp = budget * OPP_ANNUAL * years;
        var lp = loanPrincipal(budget, region, loanType);
        var li = lp * (loanRate / 100) * years;
        return Math.round(opp + li);
    }

    function rentTotalMonthly(rent, maint) {
        return rent + maint;
    }

    function rentTotalPeriod(monthly, years) {
        return Math.round(monthly * 12 * years);
    }

    function updateBudgetSliderPct() {
        var el = document.getElementById('budget-slider');
        if (!el) return;
        var min = parseFloat(el.min);
        var max = parseFloat(el.max);
        var val = parseFloat(el.value);
        var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
        el.style.setProperty('--rent-pct', pct + '%');
    }

    function syncBudgetFromSlider() {
        var v = $('#budget-slider').val();
        $('#budget-input').val(formatWon(parseInt(v, 10)));
        updateBudgetSliderPct();
    }

    function syncSliderFromInput() {
        var raw = parseDigits($('#budget-input').val());
        var min = parseInt($('#budget-slider').attr('min'), 10);
        var max = parseInt($('#budget-slider').attr('max'), 10);
        var step = parseInt($('#budget-slider').attr('step'), 10) || 1000000;
        if (raw < min) raw = min;
        if (raw > max) raw = max;
        raw = Math.round(raw / step) * step;
        $('#budget-slider').val(raw);
        $('#budget-input').val(formatWon(raw));
        updateBudgetSliderPct();
    }

    function setLoanRateEnabled() {
        var t = $('#loan-type').val();
        var on = t !== 'none';
        $('#loan-rate-input').prop('disabled', !on);
        $('#loan-rate-wrap').toggleClass('disabled', !on);
    }

    function countUp($el, target, duration) {
        var start = 0;
        var startTime = null;
        function step(ts) {
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            var cur = Math.round(start + (target - start) * eased);
            $el.text(formatWon(cur));
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function updateBars(rent4, jeonse4, loanOnly4) {
        var max = Math.max(rent4, jeonse4, loanOnly4, 1);
        var hRent = (rent4 / max) * 100;
        var hJeonse = (jeonse4 / max) * 100;
        var hLoan = (loanOnly4 / max) * 100;
        $('#bar-rent').css('--h', hRent + '%');
        $('#bar-jeonse').css('--h', hJeonse + '%');
        $('#bar-loan').css('--h', hLoan + '%');
        $('#bar-rent-label').text(Math.round(rent4 / 10000));
        $('#bar-jeonse-label').text(Math.round(jeonse4 / 10000));
        $('#bar-loan-label').text(Math.round(loanOnly4 / 10000));
    }

    function runCalculate() {
        $('#rent-error').text('');
        var budget = parseDigits($('#budget-input').val());
        var minB = parseInt($('#budget-slider').attr('min'), 10);
        var maxB = parseInt($('#budget-slider').attr('max'), 10);
        if (budget < minB || budget > maxB) {
            $('#rent-error').text('보증금 예산은 1천만 원 ~ 1억 원 범위로 입력해 주세요.');
            return;
        }

        var region = $('input[name="region"]:checked').val();
        var income = parseDigits($('#income-input').val());
        var rent = parseDigits($('#monthly-rent-input').val());
        var maint = parseDigits($('#maint-input').val());
        var loanType = $('#loan-type').val();
        var loanRate = parseFloat($('#loan-rate-input').val()) || 0;

        if (income <= 0) {
            $('#rent-error').text('월 소득을 올바르게 입력해 주세요.');
            return;
        }
        if (rent < 0 || maint < 0) {
            $('#rent-error').text('월세·관리비는 0 이상으로 입력해 주세요.');
            return;
        }
        if (loanType !== 'none' && (loanRate < 0 || loanRate > 20)) {
            $('#rent-error').text('대출 금리를 0~20% 범위로 입력해 주세요.');
            return;
        }

        var monthlyTotal = rentTotalMonthly(rent, maint);
        var lp = loanPrincipal(budget, region, loanType);
        var loanInterestY = lp * (loanRate / 100);

        var t1 = rentTotalPeriod(monthlyTotal, 1);
        var t2 = rentTotalPeriod(monthlyTotal, 2);
        var t4 = rentTotalPeriod(monthlyTotal, 4);

        var j1 = jeonseTotalCost(budget, region, loanType, loanRate, 1);
        var j2 = jeonseTotalCost(budget, region, loanType, loanRate, 2);
        var j4 = jeonseTotalCost(budget, region, loanType, loanRate, 4);

        var loanOnly4 = Math.round(loanInterestY * 4);

        $('#result-jeonse-level').text(jeonseFeasibilityText(budget, region));

        countUp($('#result-monthly-total'), monthlyTotal, 600);
        countUp($('#total-rent-1y'), t1, 500);
        countUp($('#total-rent-2y'), t2, 550);
        countUp($('#total-rent-4y'), t4, 600);
        countUp($('#total-jeonse-1y'), j1, 500);
        countUp($('#total-jeonse-2y'), j2, 550);
        countUp($('#total-jeonse-4y'), j4, 600);

        var rec = '';
        var diff = Math.abs(t4 - j4);
        if (budget < 30000000 && region === 'seoul') {
            rec = '초기 자금이 부족하여 월세가 현실적인 선택일 수 있습니다. 월 주거비 부담 비율을 꼭 확인하세요.';
        } else if (t4 < j4) {
            rec =
                '현재 조건에서는 4년 기준 월세 총비용이 전세 관련 예상 비용보다 낮게 추정됩니다. (참고, 약 ' +
                formatWon(diff) +
                '원 차이)';
        } else if (j4 < t4) {
            rec =
                '현재 조건에서는 전세가 유리해 보입니다. 4년 기준 약 ' +
                formatWon(diff) +
                '원 절감 가능성이 있습니다(기회비용·이자 포함 추정).';
        } else {
            rec = '4년 기준 총비용이 유사합니다. 유동성·이사 계획을 함께 고려해 보세요.';
        }

        var burdenRatio = income > 0 ? ((monthlyTotal / income) * 100).toFixed(1) : '—';
        rec += ' 월 주거비는 소득 대비 약 ' + burdenRatio + '% 수준입니다.';

        $('#result-recommend-text').text(rec);

        updateBars(t4, j4, loanOnly4);
    }

    function initReveal() {
        if (!('IntersectionObserver' in window)) {
            $('.rent-reveal').addClass('is-visible');
            return;
        }
        var obs = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('is-visible');
                        obs.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        document.querySelectorAll('.rent-reveal').forEach(function (el) {
            obs.observe(el);
        });
    }

    $(document).ready(function () {
        if (!document.getElementById('btn-calculate')) {
            return;
        }

        var bv = parseInt($('#budget-slider').val(), 10);
        $('#budget-input').val(formatWon(bv));
        updateBudgetSliderPct();
        setLoanRateEnabled();

        $('#budget-slider').on('input', syncBudgetFromSlider);
        $('#budget-input').on('blur', syncSliderFromInput);
        $('#budget-input').on('input', function () {
            $(this).val($(this).val().replace(/\D/g, ''));
        });

        $('.rent-preset').on('click', function () {
            var w = $(this).data('won');
            $('#monthly-rent-input').val(formatWon(w));
            $('.rent-preset').removeClass('is-active');
            $(this).addClass('is-active');
        });

        $('#loan-type').on('change', setLoanRateEnabled);

        $('#btn-calculate').on('click', runCalculate);

        $('input[name="region"]').on('change', function () {
            $('label.rent-chip').removeClass('is-checked');
            $('input[name="region"]:checked').closest('label.rent-chip').addClass('is-checked');
        });
        $('input[name="region"]:checked').closest('label.rent-chip').addClass('is-checked');

        $('input[name="stay-years"]').on('change', function () {
            $('label.rent-period-btn').removeClass('is-checked');
            $('input[name="stay-years"]:checked').closest('label.rent-period-btn').addClass('is-checked');
        });
        $('input[name="stay-years"]:checked').closest('label.rent-period-btn').addClass('is-checked');

        initReveal();

        if (window.location.hash === '#section-calculator') {
            setTimeout(function () {
                var el = document.querySelector('#section-calculator');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 400);
        }
    });
})(jQuery);
