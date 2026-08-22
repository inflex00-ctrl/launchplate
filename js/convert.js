/* Conversion layer — honest triggers only. No fake scarcity, no invented counts. */
(function(){
  var d=document;

  /* 1. Sticky buy bar — appears once the hero scrolls away. Removes the
        "scroll back up to buy" friction that kills long product pages. */
  function stickyBar(){
    if(d.getElementById('lp-sticky')) return;
    var bar=d.createElement('div');
    bar.id='lp-sticky';
    bar.innerHTML=
      '<div class="lp-sticky-in">'+
        '<div class="lp-sticky-txt"><strong>Complete Bundle</strong>'+
        '<span>All kits + every future kit &middot; lifetime licence</span></div>'+
        '<div class="lp-sticky-act">'+
          '<span class="lp-sticky-price">&euro;99</span>'+
          '<a class="btn btn-p buy" data-sku="BUNDLE" href="#">Get everything &rarr;</a>'+
        '</div>'+
      '</div>';
    d.body.appendChild(bar);
    var hero=d.querySelector('header,.hero,h1');
    if(!hero||!('IntersectionObserver' in window)){bar.classList.add('on');return;}
    new IntersectionObserver(function(e){
      bar.classList.toggle('on',!e[0].isIntersecting);
    },{rootMargin:'-120px 0px 0px 0px'}).observe(hero);
  }

  /* 2. Scroll reveals — motion, but cheap and reduced-motion aware. */
  function reveals(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if(!('IntersectionObserver' in window)) return;
    /* Only now do we allow anything to be hidden — so a JS failure can never
       leave the page blank. Watchdog below stands the whole system down if
       nothing has revealed shortly after load. */
    d.documentElement.classList.add('js-reveal');
    var els=d.querySelectorAll('.card,.prop,.rule,section > .wrap > h2,.pb,article');
    var io=new IntersectionObserver(function(en){
      en.forEach(function(e,i){
        if(e.isIntersecting){
          e.target.style.transitionDelay=(Math.min(i,6)*60)+'ms';
          e.target.classList.add('lp-in'); io.unobserve(e.target);
        }
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:.08});
    els.forEach(function(el){el.classList.add('lp-rev');io.observe(el);});
    setTimeout(function(){
      if(!d.querySelector('.lp-rev.lp-in')) d.documentElement.classList.remove('js-reveal');
    },1200);
  }

  /* 3. Re-point any buy button injected after store.js ran. */
  function rewire(){
    fetch('products/links.json').then(function(r){return r.json()}).then(function(l){
      d.querySelectorAll('.buy[data-sku]').forEach(function(a){
        var u=l[a.dataset.sku]; if(u) a.href=u;
      });
    }).catch(function(){});
  }

  function init(){ stickyBar(); reveals(); rewire(); }
  if(d.readyState!=='loading') init(); else d.addEventListener('DOMContentLoaded',init);
})();
