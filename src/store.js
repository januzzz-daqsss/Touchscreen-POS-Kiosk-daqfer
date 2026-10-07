import { products, SHOP } from './catalog.js';
export const money = cents => new Intl.NumberFormat(SHOP.locale, {style:'currency', currency:SHOP.currency}).format(cents / 100);
export function cashToCents(value) {
  const input = String(value).trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(input)) throw new Error('Enter a valid cash amount with up to two decimal places.');
  const [whole, fraction = ''] = input.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function createStore(catalog = products) {
  const valid = catalog.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.category === 'string' && Number.isSafeInteger(p.price) && p.price > 0);
  if (new Set(valid.map(p => p.id)).size !== valid.length) throw new Error('Duplicate product identifiers in catalog.');
  const inventory = new Map(valid.map(p => [p.id, p]));
  let cart = new Map();
  let screen = 'welcome';
  let payment = {method:null, status:'idle', error:''};
  let receipt = null;
  let attempt = 0;
  const summary = () => {
    const items = [...cart].map(([id, quantity]) => ({...inventory.get(id), quantity, subtotal:inventory.get(id).price * quantity}));
    return {items, count:items.reduce((n,p) => n+p.quantity,0), total:items.reduce((n,p) => n+p.subtotal,0)};
  };
  const requireOrder = () => { if (!cart.size) throw new Error('Your bag is empty. Add something delicious before continuing.'); };
  return {
    get state() { return {screen, payment:{...payment}, receipt, ...summary()}; },
    get catalog() { return [...inventory.values()]; },
    start() { if (screen !== 'welcome') return; screen = 'order'; },
    setQuantity(id, quantity) {
      if (screen !== 'order') throw new Error('Return to your order to change items.');
      if (!inventory.has(id)) throw new Error('This product is unavailable. Please choose another item.');
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > SHOP.maxQuantity) throw new Error(`Choose a quantity from 0 to ${SHOP.maxQuantity}.`);
      if (quantity === 0) cart.delete(id); else cart.set(id,quantity);
    },
    review() { requireOrder(); if (screen === 'order') screen = 'review'; },
    checkout() { requireOrder(); if (screen === 'review') { screen = 'payment'; payment = {method:null,status:'idle',error:''}; } },
    back() {
      if (payment.status === 'processing' || screen === 'receipt') return;
      if (screen === 'payment') { attempt++; payment = {method:null,status:'idle',error:''}; screen = 'review'; }
      else if (screen === 'review') screen = 'order';
      else if (screen === 'order') screen = 'welcome';
    },
    selectPayment(method) {
      if (screen !== 'payment' || payment.status === 'processing') return;
      if (!['cash','qr','card'].includes(method)) throw new Error('Choose Cash, QR, or Card.');
      payment = {method,status:'idle',error:''};
    },
    beginPayment(cash) {
      requireOrder();
      if (screen !== 'payment' || !payment.method) throw new Error('Choose a payment method first.');
      if (payment.status === 'processing') throw new Error('Payment is already processing. Please wait.');
      const total = summary().total;
      const tendered = payment.method === 'cash' ? cashToCents(cash) : total;
      if (tendered < total) throw new Error(`Insufficient cash. Add ${money(total-tendered)} to continue.`);
      payment = {...payment,status:'processing',error:'',tendered};
      return ++attempt;
    },
    finishPayment(token, succeeds = true) {
      if (token !== attempt || screen !== 'payment' || payment.status !== 'processing') return false;
      if (!succeeds) { payment = {...payment,status:'failed',error:'Demo payment declined. Retry the payment or choose another method.'}; return false; }
      const order = summary();
      receipt = Object.freeze({ ...order, items:Object.freeze(order.items.map(p=>Object.freeze({...p}))), reference:`SKY-${crypto.randomUUID().toUpperCase()}`, date:new Date().toISOString(), method:payment.method, tendered:payment.tendered, change:payment.tendered-order.total });
      payment = {...payment,status:'success'}; screen = 'receipt'; return true;
    },
    reset() { attempt++; cart = new Map(); screen = 'welcome'; payment = {method:null,status:'idle',error:''}; receipt = null; }
  };
}
