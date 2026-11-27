(() => {
  'use strict';
  const root = document.documentElement;
  const view = new URLSearchParams(location.search).get('view');
  if (view === 'mobile' || view === 'desktop') {
    // An explicit choice remains in effect while navigating the selected layout.
    if (view === 'desktop') document.querySelectorAll('.brand, .footer-wordmark').forEach((link) => { link.href = '?view=desktop#main'; });
    return;
  }
  const dialog = document.querySelector('#view-choice-dialog');
  if (!dialog) return;
  dialog.querySelectorAll('[data-view-choice]').forEach((link) => {
    const url = new URL(location.href);
    url.searchParams.set('view', link.dataset.viewChoice);
    link.href = `${url.pathname}${url.search}${url.hash}`;
  });
  const showChoice = () => {
    root.classList.add('view-choice-pending');
    if (dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      dialog.setAttribute('open', '');
      [...document.body.children].forEach((element) => { if (element !== dialog) element.inert = true; });
    }
  };
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  window.addEventListener('pageshow', showChoice);
  showChoice();
})();
