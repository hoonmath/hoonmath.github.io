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
  window.matchMedia('(min-width: 801px)').addEventListener('change', () => closeMenu());
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

  const dialog = document.querySelector('#image-dialog');
  const image = document.querySelector('#lightbox-image');
  const caption = document.querySelector('#lightbox-caption');
  let currentAnchor = null;
  const visibleImages = () => [...document.querySelectorAll('[data-lightbox]')].filter((anchor) => !anchor.closest('[hidden]'));
  const showImage = (anchor) => {
    currentAnchor = anchor;
    image.src = anchor.href;
    image.alt = anchor.dataset.caption;
    const images = visibleImages();
    caption.textContent = `${anchor.dataset.caption} (${images.indexOf(anchor) + 1} / ${images.length})`;
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
