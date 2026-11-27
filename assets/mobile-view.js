(() => {
  'use strict';
  const root = document.documentElement;
  // Only this explicit URL option enables the alternate layout. No device detection.
  if (!root.classList.contains('mobile-view')) return;

  const main = document.querySelector('main');
  const home = main.querySelector('.hero');
  home.id = 'home';
  const sections = [...main.children].filter((element) => element.matches('section'));
  const originalLinks = [...document.querySelectorAll('#main-nav a[href^="#"]')];
  const destinations = [
    { id: 'home', label: '홈' },
    ...originalLinks.map((link) => ({ id: link.hash.slice(1), label: link.textContent.trim() }))
  ];
  const makeLink = ({ id, label }) => {
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = label;
    return link;
  };
  const menu = document.createElement('nav');
  menu.className = 'mobile-home-menu';
  menu.setAttribute('aria-label', '모바일 주요 메뉴');
  destinations.slice(1).forEach((destination) => menu.append(makeLink(destination)));
  home.querySelector('.hero-inner').append(menu);

  const pageNav = document.createElement('nav');
  pageNav.className = 'mobile-page-nav';
  pageNav.setAttribute('aria-label', '모바일 페이지 메뉴');
  const navTrack = document.createElement('div');
  navTrack.className = 'container mobile-page-nav-track';
  destinations.forEach((destination) => navTrack.append(makeLink(destination)));
  pageNav.append(navTrack);
  document.querySelector('.site-header').after(pageNav);

  const homeLink = makeLink({ id: 'home', label: '전체 메뉴' });
  homeLink.className = 'mobile-home-link';
  document.querySelector('.menu-toggle').before(homeLink);
  document.querySelectorAll('.brand, .footer-wordmark').forEach((link) => { link.href = '#home'; });

  const disclosure = (content, label, className) => {
    const details = document.createElement('details');
    details.className = className;
    const summary = document.createElement('summary');
    summary.append(document.createTextNode(label));
    const indicator = document.createElement('span');
    indicator.textContent = '+';
    indicator.setAttribute('aria-hidden', 'true');
    summary.append(indicator);
    content.before(details);
    details.append(summary, content);
    return details;
  };
  disclosure(home.querySelector('.hero-promise'), '최서훈 수학의 약속', 'mobile-promise');
  disclosure(home.querySelector('.teacher-credentials'), '학력·자격 보기', 'mobile-profile-details');

  const groups = [];
  const addOptions = (container, items, label, itemLabel) => {
    const controls = document.createElement('div');
    controls.className = 'mobile-options';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', label);
    const buttons = items.map((item, index) => {
      if (!item.id) item.id = `mobile-${container.classList[0]}-${index + 1}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = itemLabel(item);
      button.setAttribute('aria-controls', item.id);
      controls.append(button);
      return button;
    });
    const select = (selected) => {
      items.forEach((item, index) => { item.hidden = index !== selected; });
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
    };
    buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
    container.before(controls);
    select(0);
    groups.push({ items, select });
  };
  const classes = document.querySelector('.class-grid');
  addOptions(classes, [...classes.children], '학교별 수업 선택', (item) => item.querySelector('h3 strong').textContent);
  const roadmap = document.querySelector('.roadmap');
  addOptions(roadmap, [...roadmap.children], '커리큘럼 단계 선택', (item) => item.querySelector('.step-label').textContent);

  const centerItem = (track, item) => {
    const trackRect = track.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    track.scrollTo({ left: track.scrollLeft + itemRect.left - trackRect.left - (track.clientWidth - itemRect.width) / 2, behavior: 'auto' });
  };
  const careTabs = document.querySelector('.care-tabs');
  careTabs.setAttribute('aria-orientation', 'horizontal');
  careTabs.querySelectorAll('.care-tab').forEach((tab) => {
    tab.addEventListener('click', () => centerItem(careTabs, tab));
    tab.addEventListener('focus', () => centerItem(careTabs, tab));
  });

  const savedScroll = new Map();
  let active = null;
  let renderedHash = null;
  const destinationFor = (hash) => {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return home; }
    if (!id || id === 'main') return home;
    return document.getElementById(id)?.closest('main > section') || home;
  };
  const updateSwitches = () => {
    const url = new URL(location.href);
    url.searchParams.set('view', 'desktop');
    url.hash = active === home ? 'main' : active.id;
    document.querySelectorAll('[data-view-switch]').forEach((link) => {
      link.href = `${url.pathname}${url.search}${url.hash}`;
      link.textContent = 'PC에서 보기';
    });
  };
  const showSection = (section, { restore = false, focus = false } = {}) => {
    if (active) savedScroll.set(active.id, window.scrollY);
    active = section;
    renderedHash = location.hash;
    sections.forEach((item) => { item.hidden = item !== section; });
    root.dataset.mobileSection = section.id;
    pageNav.hidden = homeLink.hidden = section === home;
    navTrack.querySelectorAll('a').forEach((link) => {
      if (link.hash === `#${section.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const target = document.getElementById(location.hash.slice(1));
    if (target) groups.forEach(({ items, select }) => {
      const index = items.findIndex((item) => item === target || item.contains(target));
      if (index >= 0) select(index);
    });
    updateSwitches();
    requestAnimationFrame(() => {
      window.scrollTo({ top: restore ? savedScroll.get(section.id) || 0 : 0, behavior: 'instant' });
      if (section !== home) centerItem(navTrack, navTrack.querySelector('[aria-current="page"]'));
      if (focus) {
        const heading = section.querySelector('h1, h2');
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
  };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = destinationFor(link.hash);
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    showSection(section, { focus: true });
  });
  const restoreSection = () => {
    const section = destinationFor(location.hash);
    if (section === active && renderedHash === location.hash) return;
    showSection(section, { restore: true, focus: true });
  };
  window.addEventListener('popstate', restoreSection);
  window.addEventListener('hashchange', restoreSection);
  history.scrollRestoration = 'manual';
  root.classList.add('mobile-ready');
  showSection(destinationFor(location.hash));
})();
