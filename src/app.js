import { createStore, money } from './store.js';
import { SHOP } from './catalog.js';
const store = createStore();
const root = document.querySelector('#app');
let category = 'All items', search = '', cash = '', error = '', toastTimer, paymentTimer;
const icons = {bag:'▢', arrow:'→', back:'←', check:'✓', cash:'₱', qr:'▦', card:'▰'};
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (action,label,cls='primary',extra='') => `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
function notify(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('visible'),2200); }
function header(state) {
  const active = ['order','review','payment','receipt'].indexOf(state.screen);
  return `<header><a class="brand" aria-label="Skyline Market"><span class="brand-mark">s<span>•</span></span><span>skyline<span class="brand-sub">MARKET & GOOD THINGS</span></span></a><nav aria-label="Checkout progress">${['Order','Review','Payment','Receipt'].map((step,i)=>`<div class="step ${i===active?'active':''} ${i<active?'done':''}" ${i===active?'aria-current="step"':''}><span>${i<active?'✓':i+1}</span>${step}</div>`).join('<i></i>')}</nav><div class="header-note"><span class="live-dot"></span> SELF-SERVICE KIOSK<span class="demo-label">Demo experience</span></div></header>`;
}
function welcome(state) {
  return `<main class="welcome screen"><div class="welcome-copy"><div class="eyebrow"><span class="live-dot"></span> YOUR LITTLE EVERYDAY ESCAPE</div><h1>Good things.<br>Just a <em>tap away.</em></h1><p>Fresh favorites. Great coffee. Your kind of break.<br>Make yourself at home — we’ll take it from here.</p>${button('start',`${state.count?'Continue your order':'Start Order'} <span>↗</span>`,'primary start')}<div class="welcome-hint">Touch to explore · Order at your own pace</div><div class="welcome-tags"><span>✦ Made fresh</span><span>♡ Made for you</span><span>✓ Easy checkout</span></div></div><div class="hero-art" aria-label="Coffee and bakery favorites"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="floating-tag">A little joy, on the go <span>✦</span></div><div class="hero-product"><span class="hero-emoji">☕</span><div class="cup-label">skyline<span>YOUR DAILY BRIGHT SPOT</span></div></div><div class="bakery-orb">🥐</div><div class="hero-caption"><span class="live-dot"></span> FRESH FINDS. FEEL-GOOD FAVORITES.</div><div class="price-tag">Your next favorite<br><strong>starts here.</strong></div></div></main><footer><span>GOOD FOOD. GOOD MOOD.</span><span id="clock"></span><span>All payments are simulated · PHP</span></footer>`;
}
function quantities(item) { return `<div class="quantity"><button data-action="minus" data-id="${item.id}" aria-label="Decrease ${escape(item.name)}">−</button><output aria-label="Quantity">${item.quantity}</output><button data-action="plus" data-id="${item.id}" aria-label="Increase ${escape(item.name)}" ${item.quantity>=SHOP.maxQuantity?'disabled':''}>+</button></div>`; }
function cart(state) {
  return `<aside class="cart"><div class="cart-heading"><div><span class="eyebrow">MADE YOUR WAY</span><h2>Your bag <span class="count">${state.count}</span></h2></div><span class="bag-icon">♧</span></div><div class="cart-items">${state.items.length?state.items.map(p=>`<article class="cart-item" data-cart-id="${p.id}"><div class="mini-art" style="background:${p.color}">${p.art}</div><div class="cart-item-info"><strong>${escape(p.name)}</strong><span>${money(p.price)} each</span><div class="item-controls">${quantities(p)}<button class="remove" data-action="remove" data-id="${p.id}" aria-label="Remove ${escape(p.name)}">Remove</button></div></div><strong class="line-price">${money(p.subtotal)}</strong></article>`).join(''):`<div class="empty"><span>♧</span><h3>A little empty here</h3><p>Tap a favorite to add it to your bag.<br>Something good is waiting.</p></div>`}</div><div class="cart-bottom"><div class="row"><span>Subtotal</span><strong>${money(state.total)}</strong></div><p class="muted">Prices as shown. No additional fees.</p><div class="row total"><span>Total</span><strong key="${state.total}">${money(state.total)}</strong></div><p class="error" role="alert">${escape(error)}</p>${button('review','Review Order <span>→</span>','primary wide')}<div class="safe-note">✓ Review everything before you pay</div></div></aside>`;
}
function catalog(state) {
  const filtered=store.catalog.filter(p=>(category==='All items'||p.category===category)&&p.name.toLowerCase().includes(search.toLowerCase()));
  return `<main class="order-layout screen"><section class="catalog"><div class="catalog-top"><div><div class="eyebrow">A FRESH START TO SOMETHING GOOD</div><h1>What sounds good?</h1><p>Pick your favorites. We’ll take care of the rest.</p></div><label class="search"><span>⌕</span><input id="search" type="search" placeholder="Find your favorite" aria-label="Search products" value="${escape(search)}"></label></div><div class="categories" aria-label="Product categories">${['All items',...new Set(store.catalog.map(p=>p.category))].map((c,i)=>button('category',`${['✦','☕','◒','♧','◉'][i]} ${c}`,`category ${c===category?'selected':''}`,`data-category="${c}" aria-pressed="${c===category}"`)).join('')}</div><div class="section-label"><strong>${escape(category)}</strong><span>${filtered.length} fresh finds</span></div><div class="product-grid">${filtered.map(p=>{const qty=state.items.find(i=>i.id===p.id)?.quantity||0;return `<button class="product ${qty?'in-bag':''}" data-action="add" data-id="${p.id}" aria-label="Add ${escape(p.name)}, ${money(p.price)}" ${qty>=SHOP.maxQuantity?'disabled':''}><div class="product-art" style="--art:${p.color}">${p.tag?`<span class="product-tag">${p.tag}</span>`:''}<span class="food">${p.art}</span>${qty?`<span class="product-qty">${qty} in bag</span>`:''}</div><div class="product-info"><span class="product-category">${p.category}</span><h3>${p.name}</h3><p>${p.description}</p><div class="row"><strong>${money(p.price)}</strong><span class="add-circle">+</span></div></div></button>`;}).join('')||'<div class="empty"><h3>No favorites found</h3><p>Try another search or category.</p></div>'}</div><div class="catalog-footer">${button('back','← Back to welcome','text-button')}<span>Thoughtfully picked. Happily enjoyed.</span></div></section>${cart(state)}</main>`;
}
function orderTable(order) { return `<div class="order-table"><div class="table-head"><span>YOUR FAVORITES</span><span>QTY</span><span>EACH</span><span>AMOUNT</span></div>${order.items.map(p=>`<div class="table-row"><span><span class="table-art">${p.art}</span><strong>${p.name}</strong></span><span>${p.quantity}</span><span>${money(p.price)}</span><strong>${money(p.subtotal)}</strong></div>`).join('')}<div class="row total"><span>Total</span><strong>${money(order.total)}</strong></div></div>`; }
function review(state) { return `<main class="centered screen"><div class="page-intro"><span class="eyebrow">LOOKING GOOD</span><h1>A moment to make it yours.</h1><p>Check your bag before heading to payment.</p></div><section class="panel review-panel"><div class="panel-heading"><h2>Your order</h2><span class="pill">${state.count} items</span></div>${orderTable(state)}<p class="muted">All amounts are in Philippine pesos. No additional fees.</p><div class="actions">${button('back','← Back to Order','secondary')}${button('checkout','Proceed to Payment →')}</div></section></main>`; }
function qrVisual() {
  let cells='';
  for(let y=0;y<21;y++) for(let x=0;x<21;x++){let finder=false, inside=false;for(const [ox,oy] of [[0,0],[14,0],[0,14]]){const a=x-ox,b=y-oy;if(a>=0&&a<7&&b>=0&&b<7){inside=true;finder=a===0||a===6||b===0||b===6||(a>=2&&a<=4&&b>=2&&b<=4);}}if(inside?finder:((x*7+y*11+x*y)%5<2))cells+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;}
  return `<svg class="qr" viewBox="-2 -2 25 25" role="img" aria-label="Demo QR placeholder, not a payable code"><rect x="-2" y="-2" width="25" height="25" fill="white"/><g fill="#0F172A">${cells}</g></svg>`;
}
function payment(state) {
  const {method,status}=state.payment, busy=status==='processing';
  let detail=`<div class="empty payment-empty"><span>↖</span><h2>Your checkout, your choice.</h2><p>Select a payment method to continue.</p></div>`;
  if (method==='cash') detail=`<div class="payment-detail"><div class="detail-icon">₱</div><h2>Pay with cash</h2><p>Enter the cash received using the keypad.</p><label class="cash-label" for="cash">Amount tendered (PHP)</label><input id="cash" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${escape(cash)}" ${busy?'disabled':''} aria-describedby="payment-error"><div class="quick-cash">${[state.total/100,500,1000].filter((v,i,a)=>a.indexOf(v)===i).map(v=>button('cash-preset',v===state.total/100?'Exact amount':money(v*100),'secondary',`data-value="${v}" ${busy?'disabled':''}`)).join('')}</div><div class="keypad">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>button('key',k,'key',`data-key="${k}" ${busy?'disabled':''}`)).join('')}</div></div>`;
  if(method==='qr') detail=`<div class="payment-detail"><h2>Scan. Tap. All set.</h2><p>Demo QR placeholder — no real payment is collected.</p>${qrVisual()}<span class="waiting"><span class="live-dot"></span> Waiting for simulated payment</span><p class="muted">Use the button below to simulate a payment response.</p></div>`;
  if(method==='card') detail=`<div class="payment-detail"><h2>A touch closer to good things.</h2><p>Simulated terminal — no card details required.</p><div class="credit-card"><div class="row"><strong>skyline</strong><span>◔</span></div><span class="chip">▥</span><strong>•••• &nbsp; •••• &nbsp; •••• &nbsp; DEMO</strong><div class="row"><span>DEMO CARD</span><span>SIMULATION</span></div></div><span class="waiting">Ready for a simulated card payment</span></div>`;
  return `<main class="centered screen"><div class="page-intro"><span class="eyebrow">THE LAST LITTLE STEP</span><h1>How would you like to pay?</h1><p>This is an examination demo. No money is transferred.</p></div><div class="payment-layout"><section class="payment-options"><div class="amount-panel"><span>Amount due</span><strong>${money(state.total)}</strong><span>${state.count} items · No additional fees</span></div>${[['cash','Cash','Enter the amount received'],['qr','QR','Simulate a QR payment'],['card','Card','Simulate a card terminal']].map(([id,name,desc])=>`<button class="payment-option ${method===id?'selected':''}" data-action="method" data-method="${id}" aria-pressed="${method===id}" ${busy?'disabled':''}><span class="method-icon">${icons[id]}</span><span><strong>${name}</strong><small>${desc}</small></span><span class="radio">${method===id?'✓':''}</span></button>`).join('')}${button('back','← Back to Review','secondary wide',busy?'disabled':'')}</section><section class="panel payment-panel" aria-busy="${busy}">${busy?`<div class="processing"><div class="spinner"></div><h2>Processing demo payment</h2><p>Please wait. This will only take a moment.</p><strong>${money(state.total)}</strong></div>`:detail}<div class="payment-bottom"><p class="error" id="payment-error" role="alert">${escape(error||state.payment.error)}</p>${method?button('pay',busy?'Processing…':method==='cash'?'Complete Cash Payment →':'Simulate Successful Payment →','primary wide',busy?'disabled':''):''}${method&&method!=='cash'?button('decline','Simulate declined payment','text-button wide',busy?'disabled':''):''}</div></section></div></main>`;
}
function receipt(state) { const r=state.receipt;return `<main class="centered screen receipt-screen"><div class="page-intro"><div class="success-check">✓</div><span class="eyebrow">ALL DONE. ALL GOOD.</span><h1>A little happiness, bagged.</h1><p>Thanks for stopping by Skyline Market.</p></div><section class="panel receipt-panel"><div class="receipt-header"><h2>skyline <span>market</span></h2><span class="pill success">✓ Demo payment successful</span><p>${new Date(r.date).toLocaleString(SHOP.locale)}</p><p class="reference">${r.reference}</p></div>${orderTable(r)}<div class="receipt-details"><div class="row"><span>Payment method</span><strong>${{cash:'Cash',qr:'QR (simulated)',card:'Card (simulated)'}[r.method]}</strong></div>${r.method==='cash'?`<div class="row"><span>Amount tendered</span><strong>${money(r.tendered)}</strong></div><div class="row"><span>Change</span><strong>${money(r.change)}</strong></div>`:''}</div><p class="receipt-footnote">DEMO RECEIPT · NOT A FISCAL DOCUMENT<br>Good food. Good mood. See you again.</p></section>${button('reset','New Transaction ↗','primary new-transaction')}</main>`; }
let renderedScreen;
function render(focusId) {
  const state=store.state;
  const sameScreen = renderedScreen === state.screen;
  const previousTotal = root.querySelector('.total strong')?.textContent;
  const previousItems = new Set([...root.querySelectorAll('[data-cart-id]')].map(el=>el.dataset.cartId));
  const scrollPositions = ['.catalog','.cart-items'].map(selector => [selector,root.querySelector(selector)?.scrollTop || 0]);
  const focused = document.activeElement?.closest('[data-action]');
  const focusData = focused ? {...focused.dataset} : null;
  root.innerHTML=header(state)+({welcome,order:catalog,review,payment,receipt}[state.screen])(state);
  if (sameScreen) {
    root.querySelector('.screen')?.classList.remove('screen');
    for (const row of root.querySelectorAll('[data-cart-id]')) {
      if (previousItems.has(row.dataset.cartId)) row.style.animation='none';
    }
    const total=root.querySelector('.total strong');
    if(total && total.textContent===previousTotal)total.style.animation='none';
    for (const [selector,top] of scrollPositions) { const el=root.querySelector(selector);if(el)el.scrollTop=top; }
    if (focusData && !focusId) {
      const equivalent=[...root.querySelectorAll('[data-action]')].find(el=>Object.entries(focusData).every(([key,value])=>el.dataset[key]===value));
      equivalent?.focus({preventScroll:true});
    }
  } else {
    window.scrollTo(0,0);
    const heading=root.querySelector('main h1');
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  }
  renderedScreen=state.screen;
  if(focusId){const input=document.getElementById(focusId);input?.focus();if(input&&input.type!=='search')input.setSelectionRange?.(input.value.length,input.value.length);}
  updateClock();
}
function updateClock(){const el=document.querySelector('#clock');if(el)el.textContent=new Date().toLocaleString(SHOP.locale,{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
root.addEventListener('input',event=>{if(event.target.id==='search'){search=event.target.value;render('search');}if(event.target.id==='cash'){cash=event.target.value;error='';event.target.removeAttribute('aria-invalid');document.querySelector('#payment-error').textContent='';}});
root.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');if(!target||target.disabled)return;
  const {action,id}=target.dataset;
  try {
    error='';const state=store.state;
    if(['add','plus','minus','remove'].includes(action)){
      const item=state.items.find(p=>p.id===id), qty=item?.quantity||0;
      if(action==='remove'||action==='minus'&&qty===1){store.setQuantity(id,0);notify('Item removed from your bag');render();return;}
      store.setQuantity(id,qty+(action==='minus'?-1:1));if(action==='add')notify(`${store.catalog.find(p=>p.id===id).name} added to your bag`);
    }
    if(action==='start')store.start();
    if(action==='back'){store.back();cash='';}
    if(action==='review')store.review();
    if(action==='checkout')store.checkout();
    if(action==='category')category=target.dataset.category;
    if(action==='method'){store.selectPayment(target.dataset.method);cash='';}
    if(action==='cash-preset')cash=target.dataset.value;
    if(action==='key'){
      const k=target.dataset.key;
      const next=k==='⌫'?cash.slice(0,-1):k==='.'&&!cash?'0.':cash+k;
      if(k!=='⌫'&&!/^\d{1,7}(\.\d{0,2})?$/.test(next))throw new Error('Use up to seven whole-number digits and two decimal places.');
      cash=next;
    }
    if(action==='reset'){clearTimeout(paymentTimer);clearTimeout(toastTimer);store.reset();cash='';category='All items';search='';document.querySelector('#toast').classList.remove('visible');}
    if(action==='pay'||action==='decline'){const token=store.beginPayment(cash);paymentTimer=setTimeout(()=>{store.finishPayment(token,action==='pay');render();},1400);}
    render();
  } catch(err){error=err.message;render();if(store.state.screen!=='payment')notify(error);else if(store.state.payment.method==='cash'){const input=document.querySelector('#cash');input?.setAttribute('aria-invalid','true');input?.focus({preventScroll:true});}}
});
render();setInterval(updateClock,30000);
