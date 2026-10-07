export const SHOP = { name: 'Skyline Market', currency: 'PHP', locale: 'en-PH', maxQuantity: 99 };
export const products = Object.freeze([
  { id:'latte', name:'Iced cloud latte', category:'Coffee', description:'Espresso, milk & a little magic', price:14500, art:'☕', color:'#ead9c6', tag:'Bestseller' },
  { id:'matcha', name:'Matcha daydream', category:'Coffee', description:'Japanese matcha with creamy milk', price:16500, art:'🍵', color:'#dceacb', tag:'House favorite' },
  { id:'croissant', name:'Butter croissant', category:'Bakery', description:'Golden layers, baked fresh', price:9500, art:'🥐', color:'#ffe7c5', tag:'Freshly baked' },
  { id:'sandwich', name:'Garden club', category:'Kitchen', description:'Fresh greens & toasted goodness', price:18500, art:'🥪', color:'#dce8cc' },
  { id:'cookie', name:'Chocolate chunk', category:'Bakery', description:'Soft center, generous chocolate', price:7500, art:'🍪', color:'#e9d7ca' },
  { id:'juice', name:'Sunshine orange', category:'Refreshers', description:'A bright, citrusy pick-me-up', price:11000, art:'🍊', color:'#ffebbd' },
  { id:'salad', name:'Green bowl', category:'Kitchen', description:'Crisp greens, colorful crunch', price:19500, art:'🥗', color:'#d4e9d8' },
  { id:'donut', name:'Berry happy donut', category:'Bakery', description:'Fluffy dough, strawberry glaze', price:6500, art:'🍩', color:'#f5dce6' },
  { id:'water', name:'Still water', category:'Refreshers', description:'Cool, simple & refreshing • 500 ml', price:4500, art:'💧', color:'#d3eaf6' }
].map(Object.freeze));
