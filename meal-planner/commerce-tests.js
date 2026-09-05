/* Load in the planner browser and run runCommerceTests(). */
function runCommerceTests(){
  const results=[],test=(name,fn)=>{try{if(!fn())throw Error('Assertion failed');results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}},C=CraveCommerce,original=window.CRAVEPLAN_COMMERCE_CONFIG;
  test('Every curated item has a decision and delivery options',()=>MealData.menu.every(m=>C.item(m.recipe)&&C.orderLinks(m.recipe).includes('DoorDash')&&C.orderLinks(m.recipe).includes('Uber Eats')));
  test('Every named chain has a direct ordering entry',()=>MealData.menu.filter(m=>m.recipe!=='pizza').every(m=>C.item(m.recipe).order?.url.startsWith('https://')));
  test('Only verified calories are prefilled; configurable bowls remain unknown',()=>C.item('big-mac').kcal===580&&C.item('crispy-chicken').kcal===420&&C.item('nuggets').kcal===250&&C.item('chipotle-bowl').kcal===undefined);
  test('Missing prices and wait times do not create savings claims',()=>{const a=C.compare({cost:4,kcal:600,time:30},{cost:null,kcal:null,wait:null}).join(' ');return a.includes('Enter a local price')&&a.includes('unknown')&&!a.includes('less per person');});
  test('Price, calorie and time comparisons can favor different choices',()=>{const a=C.compare({cost:4,kcal:600,time:30},{cost:12,kcal:500,wait:10});return a[0].includes('Make costs $8.00 less')&&a[1].includes('Buy has ~100 fewer')&&a[2].includes('Buy is ~20 minutes sooner');});
  try{
    window.CRAVEPLAN_COMMERCE_CONFIG={links:{chipotle:{url:'https://example.com/approved',paid:true},walmart:{url:'https://example.com/search?q={query}',paid:true}}};
    test('Paid order links disclose commission beside the link',()=>{const text=C.orderLinks('chipotle-bowl');return text.includes('rel="noopener noreferrer sponsored"')&&text.includes('We may earn a commission if you buy through this link.')&&text.includes('https://example.com/approved');});
    test('Store referral query is encoded as data',()=>C.resolve('walmart','https://www.walmart.com/','milk & eggs').url==='https://example.com/search?q=milk%20%26%20eggs');
    window.CRAVEPLAN_COMMERCE_CONFIG={links:{chipotle:{url:'javascript:alert(1)',paid:true}}};
    test('Unsafe partner URL falls back to original unpaid destination',()=>C.resolve('chipotle','https://www.chipotle.com/').url==='https://www.chipotle.com/'&&!C.resolve('chipotle','https://www.chipotle.com/').paid);
    window.CRAVEPLAN_COMMERCE_CONFIG={links:{chipotle:{url:'https://example.com/no-disclosure'}}};
    test('Partner overrides require explicit relationship metadata',()=>C.resolve('chipotle','https://www.chipotle.com/').url==='https://www.chipotle.com/');
  }finally{window.CRAVEPLAN_COMMERCE_CONFIG=original;}
  test('Events exclude health, price, search and identity fields',()=>{CraveEvents.track('recipe_view',{recipe:'big-mac',weight:82,calories:2200,price:12,email:'private@example.com',query:'private',url:location.href});const e=CraveEvents.read().at(-1);return Object.keys(e).every(k=>['event','timestamp','recipe','choice','provider','placement'].includes(k))&&e.recipe==='big-mac';});
  test('Unknown event names are ignored',()=>{const n=CraveEvents.read().length;CraveEvents.track('weight_change',{weight:82});return CraveEvents.read().length===n;});
  return results;
}
