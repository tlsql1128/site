// common.js - 공통 JavaScript 기능

$(document).ready(function() {
    // ============================================
    // 헤더와 푸터 공통 컴포넌트 로드
    // ============================================

    /**
     * 현재 문서가 /subpage/ 아래에 있으면 true (file:// 포함)
     */
    function isSubpagePath() {
        var path = window.location.pathname || '';
        if (path.indexOf('/subpage/') !== -1) return true;
        return /[\\/]subpage[\\/][^\\/]+\.html$/i.test(path);
    }

    /**
     * 공통 헤더/푸터는 루트 기준 링크(subpage/..., index.html)로 작성되어 있음.
     * 서브폴더에서 열면 상대경로가 깨지므로, 로드 직후 컨테이너 내부 링크만 보정한다.
     */
    function fixSiteLinks(container) {
        var sub = isSubpagePath();
        var $scope = container ? $(container) : $(document);
        $scope.find('a[href]').each(function () {
            var href = this.getAttribute('href');
            if (!href) return;
            var c = href.charAt(0);
            if (c === '#' || c === '?') return;
            if (/^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;
            if (href.indexOf('://') !== -1) return;
            if (href.indexOf('../') === 0) return;

            if (sub) {
                if (href === 'index.html' || href === './index.html') {
                    this.setAttribute('href', '../index.html');
                } else if (href.indexOf('subpage/') === 0) {
                    this.setAttribute('href', href.replace(/^subpage\//, ''));
                }
            }
        });

        // subpage에서 로고 등 asset 경로 보정(img/src)
        $scope.find('img[src]').each(function () {
            var src = this.getAttribute('src');
            if (!src) return;
            if (/^(https?:|data:|blob:)/i.test(src)) return;
            if (src.indexOf('://') !== -1) return;
            if (src.indexOf('../') === 0) return;
            if (!sub) return;
            if (src.indexOf('asset/') === 0) {
                this.setAttribute('src', '../' + src);
            }
        });
    }

    var isSubpage = isSubpagePath();
    var headerPath = isSubpage ? '../components/header.html' : 'components/header.html';
    var footerPath = isSubpage ? '../components/footer.html' : 'components/footer.html';

    // 헤더와 푸터가 없는 경우만 로드
    // (HTML에 #header, #footer 요소가 있어야 함)
    if ($('#header').length > 0) {
        $('#header').load(headerPath, function () {
            fixSiteLinks(this);
            setActiveMenu();
            attachHeaderEvents();
        });
    }

    if ($('#footer').length > 0) {
        $('#footer').load(footerPath, function () {
            fixSiteLinks(this);
        });
    }
    
    // 현재 페이지에 해당하는 메뉴 항목에 active 클래스 추가
    function setActiveMenu() {
        var currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        var pageMap = {
            '': 'index',
            'index': 'index',
            'youth-savings': 'youth-savings',
            'rent': 'rent',
            'loan': 'loan',
            'salary': 'salary',
            'goal-100m': 'goal-100m',
            'planner': 'planner',
            'insurance': 'insurance',
            'usedcar': 'usedcar',
            'living-cost': 'living-cost',
            'support': 'support',
            'calendar': 'calendar',
            'guide': 'guide',
            'credit': 'credit',
            'faq': 'faq'
        };

        currentPage = pageMap[currentPage] || 'index';

        $('.gnb a[data-page], .mobile-nav a[data-page]').removeClass('active');
        $('.gnb a[data-page="' + currentPage + '"], .mobile-nav a[data-page="' + currentPage + '"]').addClass('active');
        $('.gnb__item--dropdown').removeClass('is-child-active');
        $('.gnb__sub a.active').closest('.gnb__item--dropdown').addClass('is-child-active');

        $('.mobile-nav__group').removeClass('is-open').find('.mobile-nav__head').attr('aria-expanded', 'false');
        var $mActive = $('.mobile-nav__panel a.active').first();
        if ($mActive.length) {
            $mActive.closest('.mobile-nav__group').addClass('is-open').find('.mobile-nav__head').attr('aria-expanded', 'true');
        }
    }
    
    // 헤더 관련 이벤트 재설정 (동적 로드 후)
    function attachHeaderEvents() {
        $('.hamburger').off('click.nav').on('click.nav', function (e) {
            e.stopPropagation();
            var $btn = $(this);
            var $m = $('.mobile-menu');
            $m.stop(true, true).slideToggle(200, function () {
                var open = $m.is(':visible');
                $btn.toggleClass('open', open).attr('aria-expanded', open);
            });
        });

        $(document).off('click.navclose').on('click.navclose', function (event) {
            if (!$(event.target).closest('.header').length) {
                $('.mobile-menu').slideUp(180);
                $('.hamburger').removeClass('open').attr('aria-expanded', 'false');
            }
        });

        $(document).off('click.mnavacc').on('click.mnavacc', '.mobile-nav__head', function () {
            var $g = $(this).closest('.mobile-nav__group');
            var willOpen = !$g.hasClass('is-open');
            $('.mobile-nav__group').not($g).removeClass('is-open').find('.mobile-nav__head').attr('aria-expanded', 'false');
            $g.toggleClass('is-open', willOpen);
            $(this).attr('aria-expanded', willOpen);
        });

        $(document).off('click.mnavlink').on('click.mnavlink', '.mobile-nav a[href]', function () {
            $('.mobile-menu').slideUp(180);
            $('.hamburger').removeClass('open').attr('aria-expanded', 'false');
        });
    }

    // ============================================
    // 페이지 전환 효과 (fade-in / fade-out)
    // ============================================
    function enablePageTransition() {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        $('body').addClass('is-loaded');

        $(document).off('click.pagetrans').on('click.pagetrans', 'a[href]', function (e) {
            var a = this;
            var href = a.getAttribute('href');
            if (!href) return;
            if (href.charAt(0) === '#') return;
            if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
            if (a.getAttribute('target') === '_blank') return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            // 외부 링크는 제외
            var isAbs = /^(https?:)?\/\//i.test(href);
            if (isAbs) return;

            // 다운로드/새창 등 제외
            if (a.hasAttribute('download')) return;

            if (reduce) return;

            e.preventDefault();
            $('body').addClass('is-leaving');
            window.setTimeout(function () {
                window.location.href = href;
            }, 180);
        });
    }
    
    // 헤더가 HTML에 직접 포함된 경우(동적 로드 없음)
    if ($('#header').length === 0 && $('.header').length > 0) {
        fixSiteLinks('.header');
        setActiveMenu();
        attachHeaderEvents();
    }

    enablePageTransition();
    
    // ============================================
    // FAQ 아코디언 토글
    // ============================================
    $(document).on('click', '.accordion-header', function () {
        var $btn = $(this);
        var $item = $btn.closest('.accordion-item');
        var $content = $btn.next('.accordion-content');
        if (!$content.length) return;

        var isOpen = $item.hasClass('is-open');

        $('.accordion-item').not($item).removeClass('is-open');
        $('.accordion-item').not($item).find('.accordion-header').attr('aria-expanded', 'false');
        $('.accordion-item').not($item).find('.accordion-content').slideUp(280);

        if (isOpen) {
            $item.removeClass('is-open');
            $btn.attr('aria-expanded', 'false');
            $content.slideUp(280);
        } else {
            $item.addClass('is-open');
            $btn.attr('aria-expanded', 'true');
            $content.slideDown(300);
        }
    });

    // ============================================
    // 부드러운 스크롤 (같은 페이지 내 앵커만, href="#" 는 무시)
    // ============================================
    $(document).on('click', 'a[href^="#"]', function (event) {
        var href = this.getAttribute('href');
        if (!href || href.length < 2 || href === '#') return;
        var target = $(href);
        if (!target.length) return;
        event.preventDefault();
        var top = target.offset().top;
        $('html, body').stop().animate({ scrollTop: top }, 600);
    });

    // 가벼운 스크롤 등장(카드/스텝 등 .reveal, [data-reveal])
    if (window.IntersectionObserver) {
        var obs = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('is-inview');
                        obs.unobserve(e.target);
                    }
                });
            },
            { rootMargin: '0px 0px -5% 0px', threshold: 0.08 }
        );
        document.querySelectorAll('.reveal, [data-reveal]').forEach(function (el) {
            obs.observe(el);
        });
    } else {
        document.querySelectorAll('.reveal, [data-reveal]').forEach(function (el) {
            el.classList.add('is-inview');
        });
    }
});
