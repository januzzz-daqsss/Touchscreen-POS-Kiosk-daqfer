import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,cashToCents} from '../src/store.js';
const ordered = () => {const s=createStore();s.start();s.setQuantity('latte',2);s.setQuantity('cookie',1);return s;};
const paying = method => {const s=ordered();s.review();s.checkout();s.selectPayment(method);return s;};
test('start, add, increase, decrease, and remove items',()=>{const s=createStore();assert.equal(s.state.screen,'welcome');s.start();s.setQuantity('latte',1);assert.equal(s.state.count,1);s.setQuantity('latte',3);assert.equal(s.state.count,3);s.setQuantity('latte',2);assert.equal(s.state.count,2);s.setQuantity('latte',0);assert.equal(s.state.items.length,0);});
test('reject empty checkout and invalid quantities/products',()=>{const s=createStore();s.start();assert.throws(()=>s.review(),/empty/);assert.throws(()=>s.checkout(),/empty/);for(const q of [-1,1.5,100,NaN])assert.throws(()=>s.setQuantity('latte',q),/quantity/);assert.throws(()=>s.setQuantity('missing',1),/unavailable/);});
test('all screens preserve centralized totals and back navigation',()=>{const s=ordered();const initial=s.state.items;assert.equal(s.state.total,36500);s.review();assert.equal(s.state.screen,'review');assert.deepEqual(s.state.items,initial);s.checkout();assert.equal(s.state.total,36500);s.selectPayment('cash');s.back();assert.equal(s.state.screen,'review');assert.equal(s.state.payment.method,null);s.back();assert.equal(s.state.screen,'order');assert.deepEqual(s.state.items,initial);s.back();assert.equal(s.state.screen,'welcome');s.start();assert.equal(s.state.total,36500);});
test('cash parsing rejects malformed and excessive values',()=>{for(const v of ['', ' ', '-1', 'NaN', 'Infinity','abc','1e3','1.234','0x10','1,000','10000000','.']) assert.throws(()=>cashToCents(v));assert.equal(cashToCents('365.01'),36501);assert.equal(cashToCents('1.2'),120);});
test('cash rejects insufficient amounts and gives exact change',()=>{const s=paying('cash');assert.throws(()=>s.beginPayment('364.99'),/Insufficient/);assert.equal(s.state.payment.status,'idle');const token=s.beginPayment('500');assert.equal(s.finishPayment(token),true);assert.equal(s.state.receipt.change,13500);assert.equal(s.state.receipt.tendered,50000);assert.equal(s.state.receipt.total,36500);});
test('exact cash has zero change',()=>{const s=paying('cash');s.finishPayment(s.beginPayment('365'));assert.equal(s.state.receipt.change,0);});
for(const method of ['cash','qr','card'])test(`${method}: receipt matches order, is immutable, and reset is complete`,()=>{const s=paying(method);const original=s.state.items;const token=s.beginPayment('400');s.finishPayment(token);const r=s.state.receipt;assert.deepEqual(r.items,original);assert.equal(r.total,36500);assert.equal(r.method,method);assert.ok(r.reference.startsWith('SKY-'));assert.ok(Number.isFinite(Date.parse(r.date)));assert.throws(()=>{r.items[0].price=1;},TypeError);s.reset();assert.deepEqual(s.state,{screen:'welcome',payment:{method:null,status:'idle',error:''},receipt:null,items:[],count:0,total:0});assert.equal(s.finishPayment(token),false);});
test('QR and card can decline and retry without creating a receipt',()=>{for(const method of ['qr','card']){const s=paying(method);assert.equal(s.finishPayment(s.beginPayment(),false),false);assert.equal(s.state.payment.status,'failed');assert.equal(s.state.receipt,null);s.finishPayment(s.beginPayment());assert.equal(s.state.screen,'receipt');}});
test('duplicate taps, stale callbacks, and invalid navigation are guarded',()=>{const s=paying('card');const token=s.beginPayment();assert.throws(()=>s.beginPayment(),/already/);s.back();s.selectPayment('qr');assert.equal(s.state.screen,'payment');assert.equal(s.state.payment.method,'card');assert.equal(s.finishPayment(token+1),false);assert.equal(s.finishPayment(token),true);const ref=s.state.receipt.reference;assert.equal(s.finishPayment(token),false);s.back();assert.equal(s.state.screen,'receipt');assert.equal(s.state.receipt.reference,ref);assert.throws(()=>s.setQuantity('latte',1),/Return/);});
test('transaction references differ across transactions',()=>{const s=paying('qr');s.finishPayment(s.beginPayment());const first=s.state.receipt.reference;s.reset();s.start();s.setQuantity('water',1);s.review();s.checkout();s.selectPayment('qr');s.finishPayment(s.beginPayment());assert.notEqual(s.state.receipt.reference,first);assert.equal(s.state.receipt.total,4500);});
test('missing product data is filtered and duplicate identifiers rejected',()=>{const s=createStore([null,{id:'broken',name:'Broken',price:-1}]);assert.equal(s.catalog.length,0);const p={id:'same',name:'Same',price:100,category:'Demo'};assert.throws(()=>createStore([p,p]),/Duplicate/);});
test('payment requires an order, correct screen and method',()=>{const s=ordered();assert.throws(()=>s.beginPayment(),/Choose/);s.review();s.checkout();assert.throws(()=>s.beginPayment(),/Choose/);assert.throws(()=>s.selectPayment('invalid'),/Choose/);});

test('receipt records exact product prices, quantities, line amounts and payment details', () => {
  for (const method of ['cash', 'qr', 'card']) {
    const s = paying(method);
    assert.equal(s.finishPayment(s.beginPayment('500')), true);
    const r = s.state.receipt;
    assert.deepEqual(r.items.map(({id, name, quantity, price, subtotal}) => ({id, name, quantity, price, subtotal})), [
      {id:'latte', name:'Iced cloud latte', quantity:2, price:14500, subtotal:29000},
      {id:'cookie', name:'Chocolate chunk', quantity:1, price:7500, subtotal:7500}
    ]);
    assert.equal(r.count, 3);
    assert.equal(r.total, 36500);
    assert.equal(r.tendered, method === 'cash' ? 50000 : 36500);
    assert.equal(r.change, method === 'cash' ? 13500 : 0);
    assert.match(r.reference, /^SKY-[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/);
  }
});

test('reset clears declined payment errors and invalidates an in-flight payment', () => {
  for (const declined of [false, true]) {
    const s = paying('card');
    const oldToken = s.beginPayment();
    if (declined) s.finishPayment(oldToken, false);
    s.reset();
    assert.deepEqual(s.state, {screen:'welcome', payment:{method:null,status:'idle',error:''}, receipt:null, items:[],count:0,total:0});
    s.start();
    s.setQuantity('water', 1);
    s.review();
    s.checkout();
    s.selectPayment('qr');
    const newToken = s.beginPayment();
    assert.equal(s.finishPayment(oldToken), false);
    assert.equal(s.state.receipt, null);
    assert.equal(s.state.payment.status, 'processing');
    assert.equal(s.finishPayment(newToken), true);
    assert.equal(s.state.receipt.method, 'qr');
    assert.equal(s.state.receipt.total, 4500);
  }
});

test('a new transaction contains only its own items and leaves the prior receipt snapshot intact', () => {
  const s = paying('cash');
  s.finishPayment(s.beginPayment('500'));
  const previous = s.state.receipt;
  s.reset();
  s.start();
  assert.equal(s.state.screen, 'order');
  assert.equal(s.state.receipt, null);
  assert.equal(s.state.payment.method, null);
  assert.equal(s.state.count, 0);
  s.setQuantity('water', 1);
  s.review();
  s.checkout();
  s.selectPayment('card');
  s.finishPayment(s.beginPayment());
  const current = s.state.receipt;
  assert.deepEqual(current.items.map(p => p.id), ['water']);
  assert.equal(current.total, 4500);
  assert.equal(current.tendered, 4500);
  assert.equal(current.change, 0);
  assert.notEqual(current.reference, previous.reference);
  assert.equal(previous.total, 36500);
  assert.equal(previous.tendered, 50000);
  assert.equal(previous.change, 13500);
  assert.deepEqual(previous.items.map(p => p.id), ['latte', 'cookie']);
});
