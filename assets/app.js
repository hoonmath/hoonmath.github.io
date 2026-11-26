(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-nav');
  const closeMenu = (restoreFocus = false) => {
    if (!menuButton || !navigation) return;
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuButton.focus();
  };
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation?.classList.toggle('is-open', open);
  });
  navigation?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', () => closeMenu());
  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const materials = [...document.querySelectorAll('.material')];
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      materials.forEach((item) => { item.hidden = category !== 'all' && item.dataset.category !== category; });
      const status = document.querySelector('#filter-status');
      if (status) status.textContent = `${button.textContent} 교재 ${materials.filter((item) => !item.hidden).length}종을 표시합니다.`;
    });
  });

  const featureCarousel = document.querySelector('.feature-carousel');
  if (featureCarousel) {
    const slides = [...featureCarousel.querySelectorAll('.feature-slide')];
    const selectors = [...featureCarousel.querySelectorAll('[data-feature]')];
    const playback = featureCarousel.querySelector('.feature-autoplay');
    const status = featureCarousel.querySelector('.feature-status');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let paused = reducedMotion.matches;
    let hovered = false;
    let focused = false;
    let inView = !('IntersectionObserver' in window);
    let timer;
    const showFeature = (nextIndex, announce = false) => {
      index = nextIndex;
      slides.forEach((slide, position) => {
        const active = position === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      selectors.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
      if (announce) status.textContent = `${index + 1} / ${slides.length} · ${slides[index].querySelector('h3').textContent}`;
    };
    const canPlay = () => !paused && !hovered && !focused && inView && !document.hidden;
    const scheduleFeature = () => {
      clearTimeout(timer);
      if (!canPlay()) return;
      timer = setTimeout(() => {
        if (canPlay()) showFeature((index + 1) % slides.length);
        scheduleFeature();
      }, 7000);
    };
    const updatePlayback = () => {
      playback.textContent = paused ? '자동재생' : '일시정지';
      playback.setAttribute('aria-pressed', String(paused));
      playback.setAttribute('aria-label', paused ? '수업 특징 자동재생 시작' : '수업 특징 자동재생 일시정지');
      scheduleFeature();
    };
    selectors.forEach((button, position) => button.addEventListener('click', () => {
      showFeature(position, true);
      scheduleFeature();
    }));
    playback.addEventListener('click', () => {
      paused = !paused;
      updatePlayback();
    });
    featureCarousel.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = true;
      scheduleFeature();
    });
    featureCarousel.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = false;
      scheduleFeature();
    });
    featureCarousel.addEventListener('focusin', () => { focused = true; scheduleFeature(); });
    featureCarousel.addEventListener('focusout', (event) => {
      if (featureCarousel.contains(event.relatedTarget)) return;
      focused = false;
      scheduleFeature();
    });
    document.addEventListener('visibilitychange', scheduleFeature);
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) paused = true;
      updatePlayback();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= .25;
        scheduleFeature();
      }, { threshold: [0, .25] }).observe(featureCarousel);
    }
    featureCarousel.querySelector('.feature-controls').hidden = false;
    featureCarousel.querySelector('.feature-track').setAttribute('aria-live', 'off');
    showFeature(0);
    updatePlayback();
  }

  const dialog = document.querySelector('#image-dialog');
  const image = document.querySelector('#lightbox-image');
  const caption = document.querySelector('#lightbox-caption');
  let currentAnchor = null;
  const visibleImages = () => [...document.querySelectorAll('[data-lightbox]')].filter((anchor) =>
    !anchor.closest('[hidden]') && (anchor.dataset.gallery || 'materials') === (currentAnchor?.dataset.gallery || 'materials')
  );
  const showImage = (anchor) => {
    currentAnchor = anchor;
    image.src = anchor.href;
    image.alt = anchor.dataset.caption;
    const images = visibleImages();
    caption.textContent = `${anchor.dataset.caption} (${images.indexOf(anchor) + 1} / ${images.length})`;
    const isCare = !!anchor.closest('#care');
    dialog.classList.toggle('lightbox-care', isCare);
    dialog.querySelector('[data-lightbox-heading]').textContent = isCare ? 'LEARNING CARE · 이용 화면' : 'CLASS MATERIALS · 교재 표지';
    dialog.querySelector('.lightbox-stage').scrollTop = 0;
    dialog.querySelectorAll('.lightbox-prev, .lightbox-next').forEach((button) => { button.hidden = images.length < 2; });
  };
  const moveImage = (direction) => {
    const images = visibleImages();
    if (!images.length) return;
    const index = images.indexOf(currentAnchor);
    showImage(images[(index + direction + images.length) % images.length]);
  };
  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-lightbox]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        event.preventDefault();
        showImage(anchor);
        dialog.showModal();
      });
    });
    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lightbox-prev').addEventListener('click', () => moveImage(-1));
    dialog.querySelector('.lightbox-next').addEventListener('click', () => moveImage(1));
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveImage(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveImage(1); }
    });
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => currentAnchor?.focus({ preventScroll: true }));
  }

  const careExplorer = document.querySelector('.care-explorer');
  if (careExplorer) {
    const tabs = [...careExplorer.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const previous = careExplorer.querySelector('.care-screen-prev');
    const next = careExplorer.querySelector('.care-screen-next');
    const status = careExplorer.querySelector('.care-screen-status');
    const screen = careExplorer.querySelector('.care-phone-screen');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let category = 0;
    let slide = 0;
    let renderVersion = 0;
    let transitions = [];
    let outgoingImage = null;
    const finishTransition = () => {
      transitions.forEach((animation) => animation.cancel());
      transitions = [];
      outgoingImage?.remove();
      outgoingImage = null;
    };
    const renderCare = async ({ animate = true, direction = 1 } = {}) => {
      const version = ++renderVersion;
      const selectedCategory = category;
      const selectedSlide = slide;
      const slides = [...panels[selectedCategory].querySelectorAll('.care-screen-image')];
      const incoming = slides[selectedSlide];
      const photo = incoming.querySelector('img');
      screen.setAttribute('aria-busy', 'true');
      photo.loading = 'eager';
      if (!photo.complete || !photo.naturalWidth) await photo.decode().catch(() => {});
      // Ignore an earlier image load when the visitor has already selected another screen.
      if (version !== renderVersion) return;
      const current = screen.querySelector('.care-panel:not([hidden]) .care-screen-image.is-active img');
      finishTransition();
      const useMotion = animate && !reducedMotion.matches && current && current !== photo;
      if (useMotion) {
        outgoingImage = current.cloneNode();
        outgoingImage.className = 'care-transition-image';
        outgoingImage.alt = '';
        outgoingImage.setAttribute('aria-hidden', 'true');
        screen.append(outgoingImage);
      }
      tabs.forEach((tab, index) => {
        const selected = index === selectedCategory;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[index].hidden = !selected;
      });
      slides.forEach((image, index) => image.classList.toggle('is-active', index === selectedSlide));
      previous.hidden = next.hidden = slides.length < 2;
      status.textContent = `${tabs[selectedCategory].firstElementChild.textContent} · ${selectedSlide + 1} / ${slides.length}`;
      screen.setAttribute('aria-busy', 'false');
      // Prepare the other photos in this category before the next press.
      slides.forEach((item) => { item.querySelector('img').loading = 'eager'; });
      if (useMotion) {
        transitions = [
          outgoingImage.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: `translateX(${-direction * 4}px)` }
          ], { duration: 360, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' }),
          incoming.animate([
            { opacity: 0, transform: `translateX(${direction * 8}px)` },
            { opacity: 1, transform: 'translateX(0)' }
          ], { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' })
        ];
        Promise.all(transitions.map((animation) => animation.finished)).then(() => {
          if (version === renderVersion) finishTransition();
        }).catch(() => {});
      }
    };
    const selectCare = (index) => {
      const direction = index >= category ? 1 : -1;
      category = index;
      slide = 0;
      renderCare({ direction });
    };
    const moveCare = (direction) => {
      const count = panels[category].querySelectorAll('.care-screen-image').length;
      if (count < 2) return;
      slide = (slide + direction + count) % count;
      renderCare({ direction });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectCare(index));
      tab.addEventListener('keydown', (event) => {
        let target;
        if (event.key === 'ArrowDown') target = (index + 1) % tabs.length;
        else if (event.key === 'ArrowUp') target = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = tabs.length - 1;
        else return;
        event.preventDefault();
        selectCare(target);
        tabs[target].focus({ preventScroll: true });
      });
    });
    previous.addEventListener('click', () => moveCare(-1));
    next.addEventListener('click', () => moveCare(1));
    screen.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveCare(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveCare(1); }
    });
    // Keep the phone on the same image after browsing its enlarged gallery.
    dialog?.addEventListener('close', () => {
      const slides = [...panels[category].querySelectorAll('.care-screen-image')];
      const index = slides.indexOf(currentAnchor);
      if (index < 0) return;
      slide = index;
      const anchor = currentAnchor;
      renderCare({ animate: false }).then(() => anchor.focus({ preventScroll: true }));
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) finishTransition();
    });
    renderCare({ animate: false });
  }

  const bookDialog = document.querySelector('#book-dialog');
  const bookOpener = document.querySelector('[data-book-preview]');
  if (bookDialog && bookOpener && typeof bookDialog.showModal === 'function') {
    const pageNumbers = [6, 7, 14, 15];
    const pageUrl = (index) => `assets/previews/bon-common-math1/page-${pageNumbers[index]}.webp`;
    const compactBook = window.matchMedia('(max-width: 700px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewport = bookDialog.querySelector('.book-viewport');
    const spread = bookDialog.querySelector('.book-spread');
    const left = bookDialog.querySelector('#book-left');
    const right = bookDialog.querySelector('#book-right');
    const sheet = bookDialog.querySelector('.book-turning-sheet');
    const previous = bookDialog.querySelector('.book-prev');
    const next = bookDialog.querySelector('.book-next');
    const zoom = bookDialog.querySelector('.book-zoom');
    const ranges = [...bookDialog.querySelectorAll('[data-book-spread]')];
    const loadedPages = new Map();
    let pageIndex = 0;
    let turning = false;
    let generation = 0;
    let activeAnimation = null;
    const loadPage = (index) => {
      if (!loadedPages.has(index)) {
        const preload = new Image();
        preload.src = pageUrl(index);
        loadedPages.set(index, preload.decode().catch(() => {}));
      }
      return loadedPages.get(index);
    };
    const step = () => compactBook.matches ? 1 : 2;
    const updateControls = () => {
      const focused = document.activeElement;
      previous.disabled = turning || pageIndex === 0;
      next.disabled = turning || pageIndex + step() >= pageNumbers.length;
      zoom.disabled = turning;
      ranges.forEach((button) => {
        button.disabled = turning;
        button.setAttribute('aria-pressed', String(Number(button.dataset.bookSpread) === Math.floor(pageIndex / 2) * 2));
      });
      if (bookDialog.open && focused instanceof HTMLButtonElement && focused.disabled && bookDialog.contains(focused)) viewport.focus({ preventScroll: true });
    };
    const setPage = (element, index) => {
      element.src = pageUrl(index);
      element.alt = `본 공통수학1 내지 PDF ${pageNumbers[index]}쪽`;
    };
    const renderBook = (index) => {
      pageIndex = compactBook.matches ? index : Math.floor(index / 2) * 2;
      setPage(left, pageIndex);
      right.parentElement.hidden = compactBook.matches;
      if (!compactBook.matches) setPage(right, pageIndex + 1);
      const location = compactBook.matches
        ? `PDF ${pageNumbers[pageIndex]}쪽 · ${pageIndex + 1} / 4`
        : `PDF ${pageNumbers[pageIndex]}–${pageNumbers[pageIndex + 1]}쪽 · ${pageIndex / 2 + 1} / 2`;
      bookDialog.querySelector('.book-location').textContent = location;
      updateControls();
    };
    const turnTo = async (requested) => {
      const target = compactBook.matches ? requested : Math.floor(requested / 2) * 2;
      if (turning || target < 0 || target >= pageNumbers.length || target === pageIndex) return;
      const token = ++generation;
      turning = true;
      updateControls();
      try {
        await Promise.all([loadPage(target), loadPage(Math.min(target + 1, 3))]);
        if (token !== generation) return;
        viewport.scrollTo(0, 0);
        if (reducedMotion.matches || bookDialog.classList.contains('is-zoomed')) {
          renderBook(target);
        } else if (compactBook.matches) {
          const forward = target > pageIndex;
          renderBook(target);
          activeAnimation = spread.animate([
            { transform: `perspective(1000px) rotateY(${forward ? 14 : -14}deg)`, opacity: .55 },
            { transform: 'perspective(1000px) rotateY(0deg)', opacity: 1 }
          ], { duration: 300, easing: 'ease-out' });
          await activeAnimation.finished.catch(() => {});
        } else {
          const forward = target > pageIndex;
          sheet.dataset.direction = forward ? 'next' : 'previous';
          sheet.querySelector('.book-sheet-front img').src = pageUrl(forward ? pageIndex + 1 : pageIndex);
          sheet.querySelector('.book-sheet-back img').src = pageUrl(forward ? target : target + 1);
          if (forward) setPage(right, target + 1);
          else setPage(left, target);
          sheet.hidden = false;
          activeAnimation = sheet.animate([
            { transform: 'rotateY(0deg)' },
            { transform: `rotateY(${forward ? -180 : 180}deg)` }
          ], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
          await activeAnimation.finished.catch(() => {});
          if (token === generation) renderBook(target);
        }
      } finally {
        if (token === generation) {
          sheet.hidden = true;
          activeAnimation?.cancel();
          activeAnimation = null;
          turning = false;
          updateControls();
        }
      }
    };
    bookOpener.addEventListener('click', (event) => {
      event.preventDefault();
      generation++;
      activeAnimation?.cancel();
      turning = false;
      sheet.hidden = true;
      bookDialog.classList.remove('is-zoomed');
      zoom.setAttribute('aria-pressed', 'false');
      zoom.textContent = '크게 보기';
      renderBook(0);
      bookDialog.showModal();
      viewport.scrollTo(0, 0);
      pageNumbers.forEach((_, index) => loadPage(index));
    });
    previous.addEventListener('click', () => turnTo(pageIndex - step()));
    next.addEventListener('click', () => turnTo(pageIndex + step()));
    ranges.forEach((button) => button.addEventListener('click', () => turnTo(Number(button.dataset.bookSpread))));
    zoom.addEventListener('click', () => {
      const enlarged = bookDialog.classList.toggle('is-zoomed');
      zoom.setAttribute('aria-pressed', String(enlarged));
      zoom.textContent = enlarged ? '전체 보기' : '크게 보기';
      viewport.scrollTo(0, 0);
    });
    bookDialog.querySelector('.book-close').addEventListener('click', () => bookDialog.close());
    bookDialog.addEventListener('keydown', (event) => {
      if (bookDialog.classList.contains('is-zoomed')) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); turnTo(pageIndex - step()); }
      if (event.key === 'ArrowRight') { event.preventDefault(); turnTo(pageIndex + step()); }
    });
    let touchStart = null;
    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' && !bookDialog.classList.contains('is-zoomed')) touchStart = { x: event.clientX, y: event.clientY };
    });
    viewport.addEventListener('pointerup', (event) => {
      if (!touchStart) return;
      const dx = event.clientX - touchStart.x;
      const dy = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) turnTo(pageIndex + (dx < 0 ? step() : -step()));
    });
    viewport.addEventListener('pointercancel', () => { touchStart = null; });
    bookDialog.addEventListener('click', (event) => {
      const rect = bookDialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) bookDialog.close();
    });
    bookDialog.addEventListener('close', () => {
      generation++;
      activeAnimation?.cancel();
      turning = false;
      sheet.hidden = true;
      touchStart = null;
      bookOpener.focus({ preventScroll: true });
    });
    compactBook.addEventListener('change', () => {
      generation++;
      activeAnimation?.cancel();
      turning = false;
      sheet.hidden = true;
      if (bookDialog.open) renderBook(pageIndex);
    });
  }

  if ('IntersectionObserver' in window && navigation) {
    const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px' });
    sectionLinks.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) observer.observe(section);
    });
  }
})();
