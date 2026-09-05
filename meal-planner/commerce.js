(function(root){
  'use strict';
  const restaurants={
    "McDonald's":{key:'mcdonalds',url:'https://www.mcdonalds.com/us/en-us/mobile-order-and-pay.html',label:'Order with McDonald’s app'},
    'Chick-fil-A':{key:'chickfila',url:'https://order.chick-fil-a.com/get-started'},
    'Taco Bell':{key:'tacobell',url:'https://www.tacobell.com/food'},
    'Chipotle':{key:'chipotle',url:'https://www.chipotle.com/'},
    'Panda Express':{key:'panda',url:'https://www.pandaexpress.com/'},
    'Olive Garden':{key:'olivegarden',url:'https://www.olivegarden.com/'},
    "Chili's":{key:'chilis',url:'https://www.chilis.com/'},
    'Subway':{key:'subway',url:'https://www.subway.com/en-us/'}
  };
  // Standard US items checked 2026-09-05. Home recipes have different ingredients
  // and portions. Unknown or customizable restaurant nutrition stays blank.
  const facts={
    'big-mac':{kcal:580,serving:'One standard Big Mac; no fries or drink.',source:'https://www.mcdonalds.com/us/en-us/product/big-mac.html'},
    'crispy-chicken':{kcal:420,serving:'One original sandwich; no sides or extra sauce.',source:'https://www.chick-fil-a.com/menu/entrees/chick-fil-a-chicken-sandwich'},
    'nuggets':{kcal:250,serving:'Eight nuggets; no sauce or sides. The home recipe includes honey mustard and a different chicken quantity.',source:'https://www.chick-fil-a.com/menu/entrees/8-ct-chick-fil-a-nuggets'},
    'chipotle-bowl':{serving:'Configure your bowl, then enter its calories. Toppings and rice portions change the total.',source:'https://www.chipotle.com/nutrition-calculator'},
    'orange-chicken':{serving:'Enter the calories for your entrée AND chosen rice or sides. The home recipe includes rice and broccoli.'},
    'chicken-alfredo':{serving:'Enter your selected entrée size. Include breadsticks, salad or other sides only if you plan to eat them.'},
    'chicken-crispers':{serving:'Enter your selected Crispers portion and sides. The home version includes cucumber and honey mustard, not a restaurant combo.'},
    'mcmuffin':{serving:'One selected breakfast sandwich. The home version uses two eggs and no meat.'},
    'teriyaki-sub':{serving:'Enter your selected sub size, bread, cheese and sauce. The home version uses a pita.'},
    'pizza':{serving:'Enter calories for the slices you plan to eat. The home version is a single pita pizza.'}
  };
  function item(id){const m=MealData.menu.find(m=>m.recipe===id);return m?{...m,...(facts[id]||{}),nutritionSource:facts[id]?.source||m.source,order:restaurants[m.restaurant]||null}:null;}
  function resolve(key,fallback,query=''){
    const config=root.CRAVEPLAN_COMMERCE_CONFIG?.links?.[key];
    let url=fallback,paid=false;
    if(config && typeof config.url==='string' && typeof config.paid==='boolean'){
      try{const candidate=new URL(config.url.replaceAll('{query}',encodeURIComponent(query)));if(candidate.protocol==='https:'&&!candidate.username&&!candidate.password){url=candidate.href;paid=config.paid;}}catch(_){}
    }
    return {url,paid};
  }
  function link(key,fallback,label,{recipe='',provider='',query='',className='button subtle'}={}){
    const l=resolve(key,fallback,query),e=Ops.escape;
    return `<span class="commerce-link"><a class="${e(className)}" href="${e(l.url)}" target="_blank" rel="noopener noreferrer${l.paid?' sponsored':''}"${provider?` data-commerce-provider="${e(provider)}" data-commerce-recipe="${e(recipe)}"`:''}>${e(label)} ↗</a>${l.paid?'<span class="commission-disclosure">We may earn a commission if you buy through this link.</span>':''}</span>`;
  }
  function orderLinks(id){const m=item(id);if(!m)return '';return (m.order?link(m.order.key,m.order.url,m.order.label||`Order from ${m.restaurant}`,{recipe:id,provider:'restaurant'}):'<p class="fine-print">Choose a local pizza restaurant on your preferred service.</p>')+link('doordash','https://www.doordash.com/','Find on DoorDash',{recipe:id,provider:'doordash'})+link('ubereats','https://www.ubereats.com/','Find on Uber Eats',{recipe:id,provider:'ubereats'});}
  function compare(home,buy){
    const result=[];
    if(buy.cost!==null){const d=buy.cost-home.cost;result.push(Math.abs(d)<.005?'Same estimated cost':`${d>0?'Make':'Buy'} costs ${Ops.money(Math.abs(d))} less per person`);}
    else result.push('Enter a local price to compare money');
    if(buy.kcal!==null){const d=buy.kcal-home.kcal;result.push(Math.abs(d)<.5?'Same estimated calories':`${d>0?'Make':'Buy'} has ~${Math.round(Math.abs(d))} fewer kcal for these portions`);}
    else result.push('Enter restaurant calories to compare energy');
    if(buy.wait!==null){const d=buy.wait-home.time;result.push(d===0?'Same estimated time to food':`${d>0?'Make':'Buy'} is ~${Math.abs(d)} minutes sooner`);}
    else result.push('Buy has 0 cooking minutes; pickup / delivery time is unknown');
    return result;
  }
  document.addEventListener('click',ev=>{
    const a=ev.target.closest('[data-commerce-provider]');if(!a)return;
    CraveEvents.track(a.dataset.commerceProvider==='restaurant'?'click_restaurant':'click_delivery',{recipe:a.dataset.commerceRecipe,provider:a.dataset.commerceProvider,choice:'buy',placement:'decision'});
  });
  document.addEventListener('auxclick',ev=>{if(ev.button===1){const a=ev.target.closest('[data-commerce-provider]');if(a)CraveEvents.track(a.dataset.commerceProvider==='restaurant'?'click_restaurant':'click_delivery',{recipe:a.dataset.commerceRecipe,provider:a.dataset.commerceProvider,choice:'buy',placement:'decision'});}});
  root.CraveCommerce={item,resolve,link,orderLinks,compare};
})(window);
