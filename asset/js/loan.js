/**
 * 청년 대출 계산기 — 원리금균등 / 원금균등
 */
(function ($) {
    'use strict';

    var state = {
        scheduleRows: [],
        scheduleExpanded: false,
        lastPrincipal: 0,
        lastRate: 0,
        lastMonths: 0,
        hasResult: false
    };

    function parseDigits(str) {
        var n = parseInt(String(str).replace(/\D/g, ''), 10);
        return isNaN(n) ? 0 : n;
    }

    function formatWon(num) {
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function monthlyRate(annualPercent) {
        return annualPercent / 12 / 100;
    }

    function annuityMonthlyPayment(P, annualPercent, months) {
        var r = monthlyRate(annualPercent);
        if (months <= 0) return 0;
        if (r === 0) return P / months;
        return (P * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
    }

    function buildAnnuitySchedule(P, annualPercent, months) {
        var r = monthlyRate(annualPercent);
        var M = annuityMonthlyPayment(P, annualPercent, months);
        var balance = P;
        var rows = [];
        var totalInterestExact = 0;

        for (var m = 1; m <= months; m++) {
            var interest = balance * r;
            var principal;
            if (m === months) {
                principal = balance;
            } else {
                principal = M - interest;
            }
            var payment = principal + interest;
            balance -= principal;
            totalInterestExact += interest;

            rows.push({
                month: m,
                payment: payment,
                principal: principal,
                interest: interest,
                balance: Math.max(0, balance)
            });
        }

        var totalPay = rows.reduce(function (s, row) {
            return s + row.payment;
        }, 0);

        return {
            rows: rows,
            monthly: M,
            totalInterest: totalInterestExact,
            totalPayment: totalPay
        };
    }

    function buildPrincipalSchedule(P, annualPercent, months) {
        var r = monthlyRate(annualPercent);
        var principalEach = P / months;
        var balance = P;
        var rows = [];
        var totalInterestExact = 0;

        for (var m = 1; m <= months; m++) {
            var interest = balance * r;
            var principal = m === months ? balance : principalEach;
            var payment = principal + interest;
            balance -= principal;
            totalInterestExact += interest;

            rows.push({
                month: m,
                payment: payment,
                principal: principal,
                interest: interest,
                balance: Math.max(0, balance)
            });
        }

        var totalPay = rows.reduce(function (s, row) {
            return s + row.payment;
        }, 0);

        var firstPay = rows.length ? rows[0].payment : 0;
        var avgMonthly = months > 0 ? totalPay / months : 0;

        return {
            rows: rows,
            firstPayment: firstPay,
            avgMonthly: avgMonthly,
            totalInterest: totalInterestExact,
            totalPayment: totalPay
        };
    }

    function updateSliderPct() {
        var el = document.getElementById('loan-amount-slider');
        if (!el) return;
        var min = parseFloat(el.min);
        var max = parseFloat(el.max);
        var val = parseFloat(el.value);
        var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
        el.style.setProperty('--loan-pct', pct + '%');
    }

    function getFormValues() {
        var P = parseDigits($('#loan-amount-input').val());
        var rate = parseFloat($('#loan-rate-input').val());
        var years = parseInt($('.loan-year-tab.is-active').data('years'), 10) || 5;
        var months = years * 12;
        var method = $('.loan-method-tab.is-active').data('method') || 'annuity';
        return { P: P, rate: rate, months: months, method: method };
    }

    function validate(v) {
        if (v.P < 1000000 || v.P > 100000000) {
            return '대출금액은 100만 원 이상 1억 원 이하로 입력해 주세요.';
        }
        if (!v.rate || v.rate < 0 || v.rate > 30) {
            return '연 이자율을 0% ~ 30% 범위로 입력해 주세요.';
        }
        if (v.months <= 0) {
            return '상환 기간을 선택해 주세요.';
        }
        return '';
    }

    function countUpText($el, target, duration) {
        var start = 0;
        var startTime = null;
        var formatted = formatWon(target);
        function step(ts) {
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            var cur = Math.round(start + (target - start) * eased);
            $el.text(formatWon(cur));
            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                $el.text(formatted);
            }
        }
        requestAnimationFrame(step);
    }

    function renderSchedule(rows, limit) {
        var $body = $('#loan-schedule-body');
        $body.empty();
        var show = state.scheduleExpanded ? rows : rows.slice(0, limit);
        if (!show.length) {
            $body.append('<tr><td colspan="5" class="loan-table__empty">표시할 데이터가 없습니다.</td></tr>');
            return;
        }
        show.forEach(function (row) {
            $body.append(
                '<tr><td>' +
                    row.month +
                    '</td><td>' +
                    formatWon(Math.round(row.payment)) +
                    ' 원</td><td>' +
                    formatWon(Math.round(row.principal)) +
                    ' 원</td><td>' +
                    formatWon(Math.round(row.interest)) +
                    ' 원</td><td>' +
                    formatWon(Math.round(row.balance)) +
                    ' 원</td></tr>'
            );
        });
    }

    function runCalculate() {
        var v = getFormValues();
        var err = validate(v);
        $('#loan-error').text(err);
        if (err) {
            state.hasResult = false;
            return;
        }

        var ann = buildAnnuitySchedule(v.P, v.rate, v.months);
        var pr = buildPrincipalSchedule(v.P, v.rate, v.months);

        $('#cmp-ann-first').text(formatWon(Math.round(ann.monthly)) + ' 원');
        $('#cmp-ann-avg').text(formatWon(Math.round(ann.monthly)) + ' 원');
        $('#cmp-ann-int').text(formatWon(Math.round(ann.totalInterest)) + ' 원');
        $('#cmp-ann-tot').text(formatWon(Math.round(ann.totalPayment)) + ' 원');

        $('#cmp-prin-first').text(formatWon(Math.round(pr.firstPayment)) + ' 원');
        $('#cmp-prin-avg').text(formatWon(Math.round(pr.avgMonthly)) + ' 원');
        $('#cmp-prin-int').text(formatWon(Math.round(pr.totalInterest)) + ' 원');
        $('#cmp-prin-tot').text(formatWon(Math.round(pr.totalPayment)) + ' 원');

        var active = v.method;
        var schedule;
        var monthlyDisplay;
        var totalInt;
        var totalPay;

        if (active === 'annuity') {
            schedule = ann.rows;
            monthlyDisplay = ann.monthly;
            totalInt = ann.totalInterest;
            totalPay = ann.totalPayment;
            $('#result-method-label').text('원리금균등 기준');
        } else {
            schedule = pr.rows;
            monthlyDisplay = pr.firstPayment;
            totalInt = pr.totalInterest;
            totalPay = pr.totalPayment;
            $('#result-method-label').text('원금균등 기준 (첫 달 납입 기준 표시)');
        }

        countUpText($('#result-monthly'), Math.round(monthlyDisplay), 550);
        countUpText($('#result-interest'), Math.round(totalInt), 600);
        countUpText($('#result-total'), Math.round(totalPay), 650);

        var approxMan = Math.round(monthlyDisplay / 10000);
        var summary =
            '현재 조건에서는 매월 약 ' +
            formatWon(Math.round(monthlyDisplay)) +
            '원 수준의 상환이 필요합니다. 금리가 높아질수록 총 이자 부담이 커질 수 있습니다.';
        if (active === 'principal') {
            summary += ' 원금균등은 이후 월 상환이 줄어드는 구조입니다.';
        }
        if ($('#opt-grace').is(':checked')) {
            summary += ' (거치기간은 본 계산에 반영되지 않았습니다.)';
        }
        $('#result-summary').text(summary);

        state.scheduleRows = schedule;
        state.scheduleExpanded = false;
        state.hasResult = true;
        state.lastPrincipal = v.P;
        state.lastRate = v.rate;
        state.lastMonths = v.months;

        $('#btn-schedule-more').prop('hidden', schedule.length <= 12);
        $('.loan-table-wrap').removeClass('loan-table--scroll');

        renderSchedule(schedule, 12);
    }

    function syncSliderFromInput() {
        var raw = parseDigits($('#loan-amount-input').val());
        var min = parseInt($('#loan-amount-slider').attr('min'), 10);
        var max = parseInt($('#loan-amount-slider').attr('max'), 10);
        var step = parseInt($('#loan-amount-slider').attr('step'), 10) || 1000000;
        if (raw < min) raw = min;
        if (raw > max) raw = max;
        raw = Math.round(raw / step) * step;
        $('#loan-amount-slider').val(raw);
        $('#loan-amount-input').val(formatWon(raw));
        updateSliderPct();
    }

    function initReveal() {
        if (!('IntersectionObserver' in window)) {
            $('.loan-reveal').addClass('is-visible');
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
            { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
        );
        document.querySelectorAll('.loan-reveal').forEach(function (el) {
            obs.observe(el);
        });
    }

    $(document).ready(function () {
        if (!document.getElementById('btn-loan-calc')) {
            return;
        }

        var initVal = parseInt($('#loan-amount-slider').val(), 10);
        $('#loan-amount-input').val(formatWon(initVal));
        updateSliderPct();

        $('#loan-amount-slider').on('input', function () {
            $('#loan-amount-input').val(formatWon(parseInt($(this).val(), 10)));
            updateSliderPct();
        });

        $('#loan-amount-input').on('input', function () {
            $(this).val($(this).val().replace(/\D/g, ''));
        });
        $('#loan-amount-input').on('blur', syncSliderFromInput);

        $('.loan-rate-pill').on('click', function () {
            var r = $(this).data('rate');
            $('.loan-rate-pill').removeClass('is-active');
            $(this).addClass('is-active');
            $('#loan-rate-input').val(r);
        });

        $('#loan-rate-input').on('change input', function () {
            $('.loan-rate-pill').removeClass('is-active');
        });

        $('.loan-year-tab').on('click', function () {
            $('.loan-year-tab').removeClass('is-active').attr('aria-selected', 'false');
            $(this).addClass('is-active').attr('aria-selected', 'true');
            var y = $(this).data('years');
            $('#loan-months-display').text(y * 12);
        });

        $('.loan-method-tab').on('click', function () {
            $('.loan-method-tab').removeClass('is-active').attr('aria-selected', 'false');
            $(this).addClass('is-active').attr('aria-selected', 'true');
            if (state.hasResult) {
                runCalculate();
            }
        });

        $('#btn-loan-calc').on('click', runCalculate);

        $('#btn-schedule-more').on('click', function () {
            state.scheduleExpanded = true;
            $(this).prop('hidden', true);
            $('.loan-table-wrap').addClass('loan-table--scroll');
            renderSchedule(state.scheduleRows, state.scheduleRows.length);
        });

        initReveal();
    });
})(jQuery);
