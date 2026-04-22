/**
 * 메인(index) 전용 — HERO 통합 검색
 */
(function ($) {
    'use strict';

    var SEARCH_ITEMS = [
        {
            id: 'savings',
            label: '청년 미래적금 계산기',
            url: 'subpage/youth-savings.html',
            keywords: ['미래적금', '청년미래', '미래', '적금', '청년적금']
        },
        {
            id: 'rent',
            label: '청년 전월세 계산기',
            url: 'subpage/rent.html',
            keywords: ['전월세', '월세', '전세', '전세자금', '주거']
        },
        {
            id: 'loan',
            label: '청년 대출 계산기',
            url: 'subpage/loan.html',
            keywords: ['대출', '원리금', '상환', '대출금']
        },
        {
            id: 'salary',
            label: '연봉 실수령액 계산기',
            url: 'subpage/salary.html',
            keywords: ['연봉', '실수령액', '실수령', '급여', '세후']
        },
        {
            id: 'faq',
            label: '자주 묻는 질문',
            url: 'subpage/faq.html',
            keywords: ['faq', '질문', '자주', '묻는', '도움', '고객센터', '이용안내']
        },
        {
            id: 'support',
            label: '청년 정부지원금 찾기',
            url: 'subpage/support.html',
            keywords: ['정부지원금', '지원금', '정부지원', '청년지원', '복지']
        },
        {
            id: 'calendar',
            label: '정부지원금 캘린더',
            url: 'subpage/calendar.html',
            keywords: ['캘린더', '일정', '접수', '마감', '지원일정']
        },
        {
            id: 'guide',
            label: '청년 재테크 입문 가이드',
            url: 'subpage/guide.html',
            keywords: ['재테크', '적금', '예금', 'etf', 'cma', '입문', '가이드']
        },
        {
            id: 'credit',
            label: '청년 신용점수 관리',
            url: 'subpage/credit.html',
            keywords: ['신용점수', '신용', '연체', '대출', 'kcb', 'nice']
        },
        {
            id: 'goal-100m',
            label: '1억 만들기 계산기',
            url: 'subpage/goal-100m.html',
            keywords: ['1억', '목돈', '목표', '플래닝', '저축', '목표금액']
        },
        {
            id: 'planner',
            label: '월급 관리 플래너',
            url: 'subpage/planner.html',
            keywords: ['월급', '예산', '플래너', '분배', '고정비', '생활비']
        },
        {
            id: 'insurance',
            label: '청년 보험 입문 가이드',
            url: 'subpage/insurance.html',
            keywords: ['보험', '실비', '실손', '특약', '갱신형', '보장']
        },
        {
            id: 'usedcar',
            label: '중고차 구매 예산 계산기',
            url: 'subpage/usedcar.html',
            keywords: ['중고차', '차량', '할부', '취등록세', '보험료', '유지비']
        },
        {
            id: 'living-cost',
            label: '자취 생활비 계산기',
            url: 'subpage/living-cost.html',
            keywords: ['자취', '생활비', '월세', '관리비', '식비', '지출']
        }
    ];

    function normalize(s) {
        return String(s || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '');
    }

    function scoreItem(queryNorm, item) {
        if (!queryNorm) return 0;
        var hay = item.label.toLowerCase().replace(/\s+/g, '');
        var max = 0;
        if (hay.indexOf(queryNorm) !== -1) max = Math.max(max, 80);
        item.keywords.forEach(function (kw) {
            var kn = kw.toLowerCase().replace(/\s+/g, '');
            if (queryNorm === kn) max = Math.max(max, 100);
            else if (kn.indexOf(queryNorm) !== -1 || queryNorm.indexOf(kn) !== -1) {
                max = Math.max(max, 70);
            }
        });
        return max;
    }

    function resolveSearch(raw) {
        var q = normalize(raw);
        if (!q) return { type: 'empty' };

        var best = null;
        var bestScore = 0;
        SEARCH_ITEMS.forEach(function (item) {
            var s = scoreItem(q, item);
            if (s > bestScore) {
                bestScore = s;
                best = item;
            }
        });

        if (bestScore >= 50 && best) {
            if (best.comingSoon || !best.url) {
                return { type: 'soon', item: best };
            }
            return { type: 'go', url: best.url, item: best };
        }

        for (var i = 0; i < SEARCH_ITEMS.length; i++) {
            var it = SEARCH_ITEMS[i];
            for (var j = 0; j < it.keywords.length; j++) {
                var kw = normalize(it.keywords[j]);
                if (kw && (q.indexOf(kw) !== -1 || kw.indexOf(q) !== -1)) {
                    if (it.comingSoon || !it.url) {
                        return { type: 'soon', item: it };
                    }
                    return { type: 'go', url: it.url, item: it };
                }
            }
        }

        return { type: 'none' };
    }

    function filterSuggestions(raw) {
        var q = normalize(raw);
        if (!q) return SEARCH_ITEMS.slice(0, 5);
        var ranked = SEARCH_ITEMS.map(function (item) {
            return { item: item, s: scoreItem(q, item) };
        }).sort(function (a, b) {
            return b.s - a.s;
        });
        var matched = ranked.filter(function (x) {
            return x.s > 0;
        });
        var pick = (matched.length ? matched : ranked).slice(0, 6);
        return pick.map(function (x) {
            return x.item;
        });
    }

    function renderSuggest($list, items, onPick) {
        $list.empty();
        items.forEach(function (item, idx) {
            var $li = $('<li/>', {
                role: 'option',
                id: 'hero-suggest-opt-' + idx,
                class: 'hero-search__suggest-item',
                text: item.label + (item.comingSoon ? ' (준비 중)' : '')
            });
            $li.attr('data-id', item.id);
            $li.on('mousedown', function (e) {
                e.preventDefault();
                onPick(item);
            });
            $list.append($li);
        });
    }

    function init() {
        var $input = $('#hero-search-input');
        var $form = $('#hero-search-form');
        var $suggest = $('#hero-search-suggest');
        var $feedback = $('#hero-search-feedback');
        var $wrap = $('.hero-search');

        if (!$input.length || !$form.length) return;

        function setFeedback(msg, isError) {
            $feedback.text(msg || '');
            $feedback.toggleClass('hero-search__feedback--error', !!isError);
        }

        function closeSuggest() {
            $suggest.attr('hidden', true).empty();
            $input.attr('aria-expanded', 'false');
        }

        function openSuggest(items) {
            renderSuggest(
                $suggest,
                items,
                function (item) {
                    $input.val(item.label.replace(/\s\(준비 중\)$/, ''));
                    if (item.comingSoon || !item.url) {
                        setFeedback(
                            '「' + item.label + '」 서비스는 곧 제공 예정입니다. 다른 키워드로 검색해 보세요.',
                            true
                        );
                    } else {
                        window.location.href = item.url;
                    }
                    closeSuggest();
                }
            );
            $suggest.removeAttr('hidden');
            $input.attr('aria-expanded', 'true');
        }

        function runSearch() {
            var raw = $input.val();
            var result = resolveSearch(raw);
            closeSuggest();

            if (result.type === 'empty') {
                setFeedback('검색어를 입력해 주세요.', true);
                $input.focus();
                return;
            }
            if (result.type === 'go') {
                setFeedback('', false);
                window.location.href = result.url;
                return;
            }
            if (result.type === 'soon') {
                setFeedback(
                    '해당 기능 페이지는 준비 중입니다. 계산기·연봉 등 다른 키워드로 검색해 보세요.',
                    true
                );
                return;
            }
            setFeedback('검색 결과가 없습니다. 다른 키워드로 검색해 보세요.', true);
        }

        $input.on('input', function () {
            setFeedback('', false);
            var v = $(this).val();
            if (normalize(v).length < 1) {
                closeSuggest();
                return;
            }
            openSuggest(filterSuggestions(v));
        });

        $input.on('focus', function () {
            var v = $(this).val();
            if (normalize(v).length >= 1) {
                openSuggest(filterSuggestions(v));
            }
        });

        $input.on('keydown', function (e) {
            if (e.key === 'Escape') {
                closeSuggest();
            }
        });

        $form.on('submit', function (e) {
            e.preventDefault();
            runSearch();
        });

        $(document).on('click', function (e) {
            if (!$wrap.length) return;
            if (!$(e.target).closest('.hero-search').length) {
                closeSuggest();
            }
        });

        $('.hero-chip').on('click', function () {
            var $t = $(this);
            if ($t.data('soon')) {
                $input.val($t.data('query') || '정부지원금');
                setFeedback(
                    '해당 기능 페이지는 준비 중입니다. 다른 키워드로 검색해 보세요.',
                    true
                );
                closeSuggest();
                return;
            }
            var href = $t.data('href');
            if (href) {
                window.location.href = href;
                return;
            }
            var q = $t.data('query');
            if (q) {
                $input.val(q).trigger('input').focus();
            }
        });
    }

    $(document).ready(init);
})(jQuery);
