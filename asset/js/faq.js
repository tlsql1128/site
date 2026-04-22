/**
 * FAQ 페이지 — 탭 필터 · 검색 · 아코디언
 */
(function ($) {
    'use strict';

    function normalize(s) {
        return String(s || '')
            .trim()
            .toLowerCase();
    }

    function applyFilter() {
        var cat = $('.faq-tab.is-active').data('cat') || 'all';
        var q = normalize($('#faq-search-input').val());
        var $items = $('.faq-item');
        var visible = 0;

        $items.each(function () {
            var $el = $(this);
            var itemCat = $el.data('category');
            var text = normalize($el.text());

            var catOk = cat === 'all' || itemCat === cat;
            var searchOk = !q || text.indexOf(q) !== -1;
            var show = catOk && searchOk;

            $el.toggleClass('is-hidden', !show);
            if (show) visible++;
        });

        $('#faq-empty').prop('hidden', visible > 0);
    }

    $(document).ready(function () {
        if (!$('#faq-list').length) return;

        $('.faq-panel').removeAttr('hidden');

        $('.faq-tab').on('click', function () {
            $('.faq-tab').removeClass('is-active').attr('aria-selected', 'false');
            $(this).addClass('is-active').attr('aria-selected', 'true');
            applyFilter();
        });

        $('#faq-search-input').on('input', function () {
            applyFilter();
        });

        $(document).on('click', '.faq-trigger', function () {
            var $btn = $(this);
            var $item = $btn.closest('.faq-item');
            var $panel = $btn.next('.faq-panel');
            var willOpen = !$item.hasClass('is-open');

            $('.faq-item').not($item).removeClass('is-open');
            $('.faq-item').not($item).find('.faq-trigger').attr('aria-expanded', 'false');
            $('.faq-item').not($item).find('.faq-panel').slideUp(200);

            if (willOpen) {
                $item.addClass('is-open');
                $btn.attr('aria-expanded', 'true');
                $panel.slideDown(220);
            } else {
                $item.removeClass('is-open');
                $btn.attr('aria-expanded', 'false');
                $panel.slideUp(200);
            }
        });

        applyFilter();
    });
})(jQuery);
