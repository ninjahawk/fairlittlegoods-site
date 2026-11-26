/* Item 4l (2026-11-26): Sort and Product-type controls on listing pages. The page works without this file: the bar
   stays hidden and the visitor gets the plain paginated grid. Data: /sort.json (written by build.py). */
(function () {
  var bar = document.querySelector('.sortbar'); if (!bar || !window.fetch) return;
  var sec = bar.parentNode, base = bar.getAttribute('data-list');
  var sortSel = bar.querySelector('select[name=sort]'), typeSel = bar.querySelector('select[name=type]');
  var gridEl = sec.querySelector('ul.grid'), pager = sec.querySelector('.pager'), st = bar.querySelector('.sort-status');
  var cnt = sec.querySelector('h1 .count'), orig = gridEl.innerHTML, data = null, rows = [], shown = 0;
  var more = document.createElement('button');
  more.type = 'button'; more.className = 'btn btn-ghost sort-more'; more.hidden = true;
  gridEl.parentNode.insertBefore(more, gridEl.nextSibling);
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function card(r) {
    var dots = r.d.length > 1 ? '<span class="dots" aria-label="' + r.d.length + ' colours">' + r.d.slice(0, 5).map(function (h) {
      return '<span style="background:' + esc(h) + '"></span>'; }).join('') + '</span>' : '';
    var set = r.s ? ' srcset="' + esc(r.s) + ' 600w, ' + esc(r.m) + ' 1200w" sizes="(min-width: 900px) 25vw, 50vw"' : '';
    return '<li class="card"><a href="/products/' + esc(r.i) + '/"><div class="card-img"><img src="' + esc(r.m) + '"' + set +
      ' alt="' + esc(r.a) + '" width="1200" height="1200" loading="lazy" decoding="async"></div><h3>' + esc(r.t) +
      '</h3><p class="price">' + esc(r.p) + dots + '</p></a></li>';
  }
  function next(focus) {
    var chunk = rows.slice(shown, shown + 48);
    gridEl.insertAdjacentHTML('beforeend', chunk.map(card).join(''));
    if (focus && chunk.length) gridEl.children[shown].querySelector('a').focus();  // keyboard users land on the first new card
    shown += chunk.length;
    var left = rows.length - shown;
    more.hidden = left <= 0; more.textContent = 'Show more (' + left + ' left)';
    st.textContent = rows.length + (rows.length === 1 ? ' product' : ' products') + (left > 0 ? ', showing ' + shown : '');
  }
  var origPath = location.pathname, listPath = '/' + base + '/';
  function url() {  // sorted or filtered = the whole list, so the URL is the list's first page; plain = the page we came from
    var s = sortSel.value, t = typeSel ? typeSel.value : '', q = [];
    if (s !== 'featured') q.push('sort=' + s); if (t) q.push('type=' + t);
    history.replaceState(null, '', (q.length ? listPath + '?' + q.join('&') : origPath) + location.hash);
  }
  function plain() { gridEl.innerHTML = orig; more.hidden = true; if (pager) pager.hidden = false; if (cnt) cnt.hidden = false; st.textContent = ''; }
  function apply(write) {
    var s = sortSel.value, t = typeSel ? typeSel.value : '';
    if (write) url();
    if (s === 'featured' && !t) { plain(); return; }
    if (!data) {
      st.textContent = 'Loading...';
      fetch('/sort.json').then(function (r) { return r.json(); }).then(function (d) { data = d; apply(false); },
        function () {  // no data: back to the plain page, so the controls never claim an order the grid doesn't have
          sortSel.value = 'featured'; if (typeSel) typeSel.value = ''; url(); plain();
          st.textContent = 'Sorting is not available right now. Refresh to try again.'; });
      return;
    }
    rows = (data.l[base] || []).map(function (id, k) { var r = data.p[id]; r.i = id; r.o = k; return r; })
      .filter(function (r) { return !t || r.k === t; });
    if (s !== 'featured') {
      var sign = s === 'price-asc' ? 1 : -1;
      rows.sort(function (a, b) { return (a.n - b.n) * sign || a.o - b.o; });
    }
    gridEl.innerHTML = ''; shown = 0; next(false);
    if (pager) pager.hidden = true; if (cnt) cnt.hidden = true;
  }
  more.addEventListener('click', function () { next(true); });
  sortSel.addEventListener('change', function () { apply(true); });
  if (typeSel) typeSel.addEventListener('change', function () { apply(true); });
  var q = new URLSearchParams(location.search), qs = q.get('sort'), qt = q.get('type');
  for (var i = 0; i < sortSel.options.length; i++) if (sortSel.options[i].value === qs) sortSel.value = qs;
  if (typeSel) for (var j = 0; j < typeSel.options.length; j++) if (typeSel.options[j].value === qt) typeSel.value = qt;
  bar.hidden = false;
  if (q.has('sort') || q.has('type')) url();  // drop unknown or stale ?sort= / ?type= values from the address bar
  if (sortSel.value !== 'featured' || (typeSel && typeSel.value)) apply(false);
})();
