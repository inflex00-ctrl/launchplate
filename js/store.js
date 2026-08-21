// Renders the catalogue and wires checkout. Payment links are injected at build
// time by ops/sync_stripe.py once the Stripe key is available; until then the
// button degrades to a clearly-labelled disabled state rather than a dead link.
(async function () {
  const res = await fetch('products/catalog.json');
  const { items, currency } = await res.json();
  const sym = currency === 'EUR' ? '€' : '$';

  document.getElementById('grid').innerHTML = items.map(p => `
    <article class="card" id="${p.sku.toLowerCase()}">
      <a class="shot" href="${p.demo}" target="_blank" rel="noopener">
        <img src="${p.shots[0]}" alt="${p.name} preview" loading="lazy">
        <span class="shot-cta">Open live demo &nearr;</span>
        ${p.badge ? `<span class="badge" style="color:${p.accent}">${p.badge}</span>` : ''}
      </a>
      <div class="card-b">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="feat">${p.feat.map(f => `<span>${f}</span>`).join('')}</div>
        <div class="meta">
          <div class="price"><s>${sym}${p.was}</s>${sym}${p.price}</div>
          <div class="acts">
            <a class="btn btn-g" href="${p.demo}" target="_blank" rel="noopener">Live demo</a>
            <a class="btn btn-p buy" data-sku="${p.sku}" href="#">Get the kit</a>
          </div>
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
