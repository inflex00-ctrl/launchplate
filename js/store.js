// Renders the catalogue and wires checkout. Payment links are injected at build
// time by ops/sync_stripe.py once the Stripe key is available; until then the
// button degrades to a clearly-labelled disabled state rather than a dead link.
(async function () {
  const res = await fetch('products/catalog.json');
  const { items, currency } = await res.json();
  const sym = currency === 'EUR' ? '€' : '$';

  const mock = (accent) => `
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
      <defs><linearGradient id="g${accent.slice(1)}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${accent}" stop-opacity=".22"/>
        <stop offset="1" stop-color="${accent}" stop-opacity=".03"/></linearGradient></defs>
      <rect width="320" height="200" fill="#0d0f14"/>
      <rect width="320" height="200" fill="url(#g${accent.slice(1)})"/>
      <rect x="18" y="16" width="46" height="7" rx="3.5" fill="${accent}" opacity=".85"/>
      <rect x="228" y="14" width="42" height="11" rx="5.5" fill="${accent}" opacity=".5"/>
      <rect x="276" y="14" width="26" height="11" rx="5.5" fill="#1e232c"/>
      <rect x="18" y="52" width="168" height="13" rx="4" fill="#e8eef6" opacity=".92"/>
      <rect x="18" y="73" width="124" height="13" rx="4" fill="${accent}" opacity=".75"/>
      <rect x="18" y="98" width="196" height="6" rx="3" fill="#8b95a5" opacity=".45"/>
      <rect x="18" y="110" width="150" height="6" rx="3" fill="#8b95a5" opacity=".32"/>
      <rect x="18" y="132" width="62" height="18" rx="6" fill="${accent}"/>
      <rect x="88" y="132" width="52" height="18" rx="6" fill="none" stroke="#2a3242"/>
      <rect x="196" y="52" width="106" height="98" rx="9" fill="#111419" stroke="#1e232c"/>
      <rect x="208" y="66" width="48" height="6" rx="3" fill="#8b95a5" opacity=".5"/>
      <rect x="208" y="80" width="72" height="6" rx="3" fill="#8b95a5" opacity=".3"/>
      <rect x="208" y="94" width="60" height="6" rx="3" fill="#8b95a5" opacity=".3"/>
      <rect x="208" y="118" width="82" height="16" rx="6" fill="${accent}" opacity=".28"/>
    </svg>`;

  document.getElementById('grid').innerHTML = items.map(p => `
    <article class="card">
      <div class="shot">${mock(p.accent)}${p.badge ? `<span class="badge" style="color:${p.accent}">${p.badge}</span>` : ''}</div>
      <div class="card-b">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="feat">${p.feat.map(f => `<span>${f}</span>`).join('')}</div>
        <div class="meta">
          <div class="price"><s>${sym}${p.was}</s>${sym}${p.price}</div>
          <a class="btn btn-p buy" data-sku="${p.sku}" href="#">Get the kit</a>
        </div>
      </div>
    </article>`).join('');

  // Checkout wiring — real Stripe payment links get injected into products/links.json
  let links = {};
  try { links = await (await fetch('products/links.json')).json(); } catch (e) {}
  document.querySelectorAll('.buy').forEach(a => {
    const url = links[a.dataset.sku];
    if (url) { a.href = url; return; }
    a.textContent = 'Checkout opening soon';
    a.style.opacity = '.55';
    a.style.pointerEvents = 'none';
  });
})();
