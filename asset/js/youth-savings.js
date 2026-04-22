// youth-savings.js — 청년미래적금 만기 예상 수령액 계산
// 입력·슬라이더 동기화 및 검증 로직 유지 (UI는 fundfinpro.com 등 금융 계산기 레이아웃 참고)

$(document).ready(function() {
    if (!document.getElementById('monthly-amount')) {
        return;
    }

    // ============================================
    // 상수 설정 (유지보수 쉽게 분리)
    // ============================================
    const GOV_SUPPORT_GENERAL_RATE = 0.06; // 일반형 정부지원금 비율 (6%)
    const GOV_SUPPORT_GENERAL_MAX = 30000; // 일반형 월 최대 지원금
    const GOV_SUPPORT_PREFERENTIAL_RATE = 0.12; // 우대형 정부지원금 비율 (12%)
    const GOV_SUPPORT_PREFERENTIAL_MAX = 60000; // 우대형 월 최대 지원금
    const TERM_MONTHS = 36; // 가입 기간 (개월)

    // ============================================
    // 숫자 천단위 콤마 처리 함수
    // ============================================
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // ============================================
    // 슬라이더 진행 구간 (WebKit: ::-webkit-slider-runnable-track 에서 var 사용)
    // ============================================
    function updateSliderProgress() {
        var slider = document.getElementById('monthly-amount');
        if (!slider) return;
        var min = parseFloat(slider.min);
        var max = parseFloat(slider.max);
        var val = parseFloat(slider.value);
        var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
        slider.style.setProperty('--slider-progress', pct + '%');
    }

    function syncAmountFromSlider(val) {
        $('#monthly-amount-input').val(String(val));
        $('#amount-display').text(formatNumber(val));
        updateSliderProgress();
    }

    // ============================================
    // 슬라이더 이벤트
    // ============================================
    $('#monthly-amount').on('input', function() {
        const value = parseInt($(this).val(), 10);
        syncAmountFromSlider(value);
        calculateSavings();
    });

    // ============================================
    // 금액 직접 입력 (숫자만, 천원 단위 스냅은 blur 시)
    // ============================================
    function clampAndSnapAmount(n) {
        if (isNaN(n) || n < 1000) return 1000;
        if (n > 500000) return 500000;
        return Math.round(n / 1000) * 1000;
    }

    function sliderAmount() {
        return parseInt($('#monthly-amount').val(), 10);
    }

    $('#monthly-amount-input').on('input', function() {
        var raw = $(this).val().replace(/\D/g, '');
        $(this).val(raw);
        if (raw === '') {
            $('#amount-display').text(formatNumber(sliderAmount()));
            calculateSavings();
            return;
        }
        var num = parseInt(raw, 10);
        if (isNaN(num)) return;
        if (num > 500000) {
            num = 500000;
            $(this).val('500000');
        }
        if (num < 1000) {
            $('#amount-display').text(formatNumber(sliderAmount()));
            calculateSavings();
            return;
        }
        var snapped = Math.round(num / 1000) * 1000;
        $('#monthly-amount').val(snapped);
        $('#amount-display').text(formatNumber(snapped));
        updateSliderProgress();
        calculateSavings();
    });

    $('#monthly-amount-input').on('blur', function() {
        var raw = $(this).val().replace(/\D/g, '');
        if (raw === '') {
            $(this).val(String(sliderAmount()));
            $('#amount-display').text(formatNumber(sliderAmount()));
            calculateSavings();
            return;
        }
        var num = clampAndSnapAmount(parseInt(raw, 10));
        $(this).val(String(num));
        $('#monthly-amount').val(num);
        $('#amount-display').text(formatNumber(num));
        updateSliderProgress();
        calculateSavings();
    });

    // ============================================
    // 가입 유형 안내 문구
    // ============================================
    function updateGovInfoText() {
        var type = $('#account-type').val();
        var el = $('#gov-info-text');
        if (!el.length) return;
        if (type === 'preferential') {
            el.text('우대형: 월 납입액의 12%를 정부가 추가 적립합니다(월 최대 6만 원 한도).');
        } else {
            el.text('일반형: 월 납입액의 6%를 정부가 추가 적립합니다(월 최대 3만 원 한도).');
        }
    }

    // ============================================
    // 기타 입력값 변경 이벤트
    // ============================================
    $('#account-type, #interest-rate').on('change input', function() {
        if ($(this).is('#account-type')) {
            updateGovInfoText();
        }
        calculateSavings();
    });

    // ============================================
    // 입력값 검증 함수
    // ============================================
    function validateInputs() {
        var isValid = true;
        var amount = parseInt($('#monthly-amount').val(), 10);
        var rate = parseFloat($('#interest-rate').val());

        // 월 납입액 검증
        if (!amount || amount < 1000 || amount > 500000) {
            $('#amount-error').text('월 납입 금액은 1,000원 ~ 500,000원 사이로 입력해주세요.');
            isValid = false;
        } else {
            $('#amount-error').text('');
        }

        // 금리 검증
        if (!rate || rate < 0) {
            $('#rate-error').text('적용 금리는 0 이상의 숫자로 입력해주세요.');
            isValid = false;
        } else {
            $('#rate-error').text('');
        }

        return isValid;
    }

    // ============================================
    // 계산 함수
    // ============================================
    function calculateSavings() {
        if (!validateInputs()) {
            return;
        }

        var monthlyAmount = parseInt($('#monthly-amount').val(), 10);
        var accountType = $('#account-type').val();
        var interestRate = parseFloat($('#interest-rate').val()) / 100; // 퍼센트를 소수로 변환

        // 원금 합계 계산
        var principal = monthlyAmount * TERM_MONTHS;

        // 정부지원금 계산
        var monthlyGovSupport;
        if (accountType === 'general') {
            monthlyGovSupport = Math.min(monthlyAmount * GOV_SUPPORT_GENERAL_RATE, GOV_SUPPORT_GENERAL_MAX);
        } else {
            monthlyGovSupport = Math.min(monthlyAmount * GOV_SUPPORT_PREFERENTIAL_RATE, GOV_SUPPORT_PREFERENTIAL_MAX);
        }
        var totalGovSupport = monthlyGovSupport * TERM_MONTHS;

        // 이자 계산 (단순 이자: (원금 + 정부지원금) * 금리 * 기간/12)
        var interest = Math.round((principal + totalGovSupport) * interestRate * (TERM_MONTHS / 12));

        // 최종 수령액
        var finalAmount = principal + totalGovSupport + interest;

        // 결과 업데이트
        updateResults(principal, totalGovSupport, interest, finalAmount);
    }

    // ============================================
    // 결과 업데이트 함수
    // ============================================
    function updateResults(principal, govSupport, interest, finalAmount) {
        // 미리보기 영역 업데이트
        $('#principal-preview').text(formatNumber(principal));
        $('#gov-support-preview').text(formatNumber(govSupport));
        $('#interest-preview').text(formatNumber(interest));
        $('#final-amount-preview').text(formatNumber(finalAmount));
    }

    // ============================================
    // 초기화 함수
    // ============================================
    function resetCalculator() {
        $('#monthly-amount').val(500000);
        $('#monthly-amount-input').val('500000');
        $('#amount-display').text(formatNumber(500000));
        $('#account-type').val('general');
        $('#interest-rate').val('5');
        $('#amount-error').text('');
        $('#rate-error').text('');
        updateGovInfoText();
        updateSliderProgress();
        calculateSavings();
    }

    // ============================================
    // 페이지 로드 시 초기화
    // ============================================
    updateSliderProgress();
    $('#monthly-amount-input').val(String(parseInt($('#monthly-amount').val(), 10)));
    updateGovInfoText();
    calculateSavings();

    // ============================================
    // 전역 함수로 노출 (필요시)
    // ============================================
    window.resetCalculator = resetCalculator;

    // ============================================
    // 정보 섹션: 가입 기간 탭
    // ============================================
    $(document).on('click', '.ys-term-tab', function() {
        var term = String($(this).data('term'));
        $('.ys-term-tab').removeClass('is-active').attr('aria-selected', 'false');
        $(this).addClass('is-active').attr('aria-selected', 'true');
        $('.ys-term-panel').removeClass('is-active');
        $('.ys-term-panel[data-term="' + term + '"]').addClass('is-active');
    });
});
