(function (root) {
  'use strict';
  const D=MealData, recipeMap=Object.fromEntries(D.recipes.map(r=>[r.id,r]));
  const slots=['breakfast','lunch','dinner','snack'];
  const sum=(rows,key)=>rows.reduce((n,r)=>n+(r[key]||0),0);
  function nutrition(recipe,portion=1,prices={}) {
    const result={kcal:0,protein:0,carbs:0,fat:0,fiber:0,cost:0};
    recipe.parts.forEach(p=>{const i=D.ingredients[p.id],factor=p.qty*portion/(i.unit==='g'?100:1);for(const k of ['kcal','protein','carbs','fat','fiber'])result[k]+=i[k]*factor;result.cost+=p.qty*portion/i.pack*(prices[p.id]??i.price);});
    result.netCarbs=Math.max(0,result.carbs-result.fiber);return result;
  }
  const nutritionMap=Object.fromEntries(D.recipes.map(r=>[r.id,nutrition(r)]));
  function allowed(recipe,settings) {
    if(settings.dairyFree && recipe.parts.some(p=>D.ingredients[p.id].allergens.includes('milk')))return false;
    const diet=settings.diet;
    if(diet==='balanced')return true;
    if(diet==='high-protein')return nutritionMap[recipe.id].protein*4/nutritionMap[recipe.id].kcal>=0.22;
    return recipe.diets.includes(diet);
  }
  function validateSettings(s) {
    const out={};
    for(const [k,min,max] of [['calories',1200,4000],['people',1,8],['days',1,7],['budget',10,2000],['cookTime',5,180],['protein',0,250]]) {
      if(s[k]===''||s[k]===null||!Number.isFinite(Number(s[k]))||Number(s[k])<min||Number(s[k])>max)throw Error(`${k} must be between ${min} and ${max}.`);
      out[k]=Number(s[k]);
    }
    if(!Number.isInteger(out.people)||!Number.isInteger(out.days))throw Error('People and days must be whole numbers.');
    out.diet=s.diet;
    if(!['balanced','high-protein','low-carb','mediterranean','vegetarian','vegan','keto'].includes(out.diet))throw Error('Choose a supported eating style.');
    for(const k of ['dairyFree','reuse','quick'])out[k]=Boolean(s[k]);
    return out;
  }
  function mealNutrition(m,prices={}) {
    if(!m.buy)return nutrition(recipeMap[m.recipe],m.portion,prices);
    return {kcal:m.buy.kcal*m.portion,cost:m.buy.cost*m.portion,protein:0,carbs:0,fat:0,fiber:0,netCarbs:0};
  }
  function validBuy(buy) {
    if(!buy||!Number.isFinite(buy.kcal)||buy.kcal<1||buy.kcal>5000||!Number.isFinite(buy.cost)||buy.cost<0||buy.cost>1000)throw Error('Restaurant meals need 1–5,000 kcal and a $0–$1,000 price per serving.');
    return {kcal:buy.kcal,cost:buy.cost};
  }
  function dayTotals(day,prices={}) {
    const result={kcal:0,protein:0,carbs:0,fat:0,fiber:0,cost:0,netCarbs:0,time:0};
    day.forEach(m=>{const r=recipeMap[m.recipe],n=mealNutrition(m,prices);for(const k of Object.keys(n))result[k]+=n[k];result.time+=m.buy?0:r.prep+r.cook;});return result;
  }
  function resizePlan(settings,previous=[]) {
    const s=validateSettings(settings);
    if(previous.slice(s.days).some(day=>day.length))throw Error('Those later days contain your choices. Remove their meals before shortening the week.');
    return Array.from({length:s.days},(_,i)=>(previous[i]||[]).map(m=>({...m,...(m.buy?{buy:{...m.buy}}:{})})));
  }
  function schedule(plan,meal,start,count) {
    if(!Object.hasOwn(recipeMap,meal.recipe)||!slots.concat('extra').includes(meal.slot)||!Number.isFinite(meal.portion)||meal.portion<.25||meal.portion>4||!Number.isInteger(meal.portion*4))throw Error('Choose a meal and 0.25–4 servings in quarter servings.');
    if(!Number.isInteger(start)||!Number.isInteger(count)||start<0||count<1||start+count>plan.length)throw Error('Choose days within your week.');
    if(meal.buy)validBuy(meal.buy);
    return plan.map((day,i)=>{
      if(i<start||i>=start+count)return day.map(m=>({...m}));
      const kept=meal.slot==='extra'?day:day.filter(m=>m.slot!==meal.slot);
      if(kept.length>=12)throw Error(`Day ${i+1} already has 12 meals. Remove a meal first.`);
      return [...kept,{recipe:meal.recipe,slot:meal.slot,portion:meal.portion,locked:true,eaten:false,...(meal.buy?{buy:{...meal.buy}}:{})}];
    });
  }
  function shopping(plan,people,pantry={},prices={},extras=[],purchased={}) {
    const needed={};[...plan.flat().filter(m=>!m.buy),...extras].forEach(m=>recipeMap[m.recipe].parts.forEach(p=>needed[p.id]=(needed[p.id]||0)+p.qty*m.portion*people));
    for(const [id,n] of Object.entries(purchased))if(n>0&&Object.hasOwn(D.ingredients,id))needed[id]??=0;
    return Object.entries(needed).map(([id,qty])=>{
      const i=D.ingredients[id],bought=purchased[id]||0,required=pantry[id]?0:Math.ceil(qty/i.pack-1e-10),packs=Math.max(0,required-bought),price=Object.hasOwn(prices,id)?prices[id]:i.price;
      return {...i,qty,packs,required,bought,price,have:Boolean(pantry[id]),leftover:pantry[id]?0:Math.max(0,(packs+bought)*i.pack-qty),total:Math.round(packs*price*100)/100};
    }).sort((a,b)=>a.aisle.localeCompare(b.aisle)||a.name.localeCompare(b.name));
  }
  function activity(met,kg,minutes,mealKcal,basis='gross') {
    if(!Number.isFinite(met)||met<=0||!Number.isFinite(kg)||kg<=0||!Number.isFinite(minutes)||minutes<0||!Number.isFinite(mealKcal)||mealKcal<=0)throw Error('Activity inputs must be finite; MET, weight and meal calories must be positive.');
    if(!['gross','net'].includes(basis))throw Error('Choose gross or net activity energy.');
    const grossRate=met*3.5*kg/200,netRate=Math.max(0,met-1)*3.5*kg/200,rate=basis==='net'?netRate:grossRate;
    return {gross:grossRate*minutes,net:netRate*minutes,rate,energy:rate*minutes,percent:rate*minutes/mealKcal*100,equivalent:rate?mealKcal/rate:null};
  }
  function credits(workouts,day,strategy) {return workouts.filter(w=>w.day===day).reduce((n,w)=>n+Math.max(0,w.met-1)*3.5*w.kg/200*w.minutes*strategy,0);}
  function warnings(plan,s,pantry={},prices={},workouts=[],strategy=0,extras=[],purchased={}) {
    const result=[],restaurant=plan.flat().filter(m=>m.buy).reduce((n,m)=>n+m.buy.cost*m.portion*s.people,0),grocery=sum(shopping(plan,s.people,pantry,prices,extras,purchased),'total')+Object.entries(purchased).reduce((n,[id,count])=>n+count*(prices[id]??D.ingredients[id].price),0)+restaurant;
    if(restaurant||plan.flat().some(m=>m.buy))result.push('Restaurant calories and prices use your selected entries. Protein, carbs, fat and fiber totals include home meals only; restaurant macros are unknown, so macro goals cannot be assessed for days with restaurant meals. Restaurant choices are not screened for your eating style or allergens.');
    if(grocery>s.budget+.01)result.push(`${restaurant?'Estimated groceries plus restaurant meals are':'Estimated grocery checkout is'} $${(grocery-s.budget).toFixed(2)} above your $${s.budget.toFixed(2)} budget. Package rounding is included; change meals, prices, or pantry items to reduce it.`);
    plan.forEach((day,i)=>{const n=dayTotals(day),hasBuy=day.some(m=>m.buy),target=s.calories+credits(workouts,i,strategy);
      if(n.kcal>target*1.08)result.push(`Day ${i+1}: ${Math.round(n.kcal)} kcal is ${Math.round(Math.abs(n.kcal-target))} ${n.kcal>target?'above':'below'} your selected target.`);
      if(n.time>s.cookTime)result.push(`Day ${i+1}: about ${n.time} minutes cooking, above your ${s.cookTime}-minute preference.`);
      if(!hasBuy&&s.diet==='keto'&&n.netCarbs>50)result.push(`Day ${i+1}: about ${Math.round(n.netCarbs)} g net carbohydrate exceeds this planner’s 50 g keto-style threshold.`);
      if(!hasBuy&&s.diet==='low-carb'&&n.carbs>130)result.push(`Day ${i+1}: about ${Math.round(n.carbs)} g carbohydrate exceeds this planner’s 130 g low-carb threshold.`);
    });return result;
  }
  function validateSession(raw) {
    if(!raw||raw.version!==1)throw Error('This is not a supported CravePlan file.');
    const settings=validateSettings(raw.settings||{});
    if(!Array.isArray(raw.plan)||raw.plan.length!==settings.days)throw Error('Plan length must match the selected days.');
    const plan=raw.plan.map(day=>{if(!Array.isArray(day)||day.length>12)throw Error('Each day supports up to 12 meals.');return day.map(m=>{
      if(!m||!Object.hasOwn(recipeMap,m.recipe)||!['breakfast','lunch','dinner','snack','extra'].includes(m.slot)||!Number.isFinite(m.portion)||m.portion<.25||m.portion>4)throw Error('Invalid recipe, slot, or portion in saved plan.');
      if(m.buy&&!D.menu.some(item=>item.recipe===m.recipe))throw Error('Unknown restaurant item.');
      return {recipe:m.recipe,slot:m.slot,portion:m.portion,locked:Boolean(m.locked),eaten:Boolean(m.eaten),...(m.buy?{buy:validBuy(m.buy)}:{})};
    });});
    const pantry={},prices={},quotes={walmart:{},kroger:{},target:{}},checked={};
    for(const id of Object.keys(D.ingredients)) {
      pantry[id]=Boolean(raw.pantry?.[id]);checked[id]=Boolean(raw.checked?.[id]);
      if(Object.hasOwn(raw.prices||{},id)){const p=raw.prices[id];if(!Number.isFinite(p)||p<0||p>1000)throw Error('Invalid package price.');prices[id]=p;}
      for(const store of Object.keys(quotes))if(Object.hasOwn(raw.quotes?.[store]||{},id)){const p=raw.quotes[store][id];if(!Number.isFinite(p)||p<0||p>1000)throw Error('Invalid store quote.');quotes[store][id]=p;}
    }
    if(!Array.isArray(raw.workouts)||raw.workouts.length>100)throw Error('Invalid workout list.');
    const workouts=raw.workouts.map(w=>{const a=D.activities.find(a=>a.id===w.activity);if(!a||!Number.isInteger(w.day)||w.day<0||w.day>=settings.days||!Number.isFinite(w.kg)||w.kg<30||w.kg>300||!Number.isFinite(w.minutes)||w.minutes<=0||w.minutes>300)throw Error('Invalid workout entry.');return{day:w.day,activity:a.id,met:a.met,kg:w.kg,minutes:w.minutes};});
    const extras=raw.shoppingExtras??[];if(!Array.isArray(extras)||extras.length>100)throw Error('Invalid extra groceries.');
    const shoppingExtras=extras.map(m=>{if(!m||!Object.hasOwn(recipeMap,m.recipe)||!Number.isFinite(m.portion)||m.portion<.25||m.portion>28)throw Error('Invalid extra grocery recipe.');return {recipe:m.recipe,portion:m.portion};});
    const purchased={};
    for(const id of Object.keys(D.ingredients))if(Object.hasOwn(raw.purchased||{},id)){const n=raw.purchased[id];if(!Number.isInteger(n)||n<0||n>10000)throw Error('Invalid purchased package count.');purchased[id]=n;}
    if(!raw.purchased)shopping(plan,settings.people,pantry,prices,shoppingExtras).forEach(i=>{if(checked[i.id])purchased[i.id]=i.packs;});
    const strategy=Number(raw.strategy);if(![0,.5,1].includes(strategy))throw Error('Invalid activity target strategy.');
    const freshness=root.CraveFresh?root.CraveFresh.clean(raw.freshness):undefined;
    if(freshness)for(const id of Object.keys(D.ingredients)){if(freshness.lots.filter(l=>l.ingredient===id).reduce((n,l)=>n+l.packs,0)>(purchased[id]||0))throw Error('Purchase batch counts exceed the saved package total.');}
    return {version:1,settings,plan,pantry,prices,quotes,checked,workouts,strategy,shoppingExtras,purchased,...(freshness?{freshness}:{})};
  }
  root.MealEngine={mealNutrition,validBuy,recipeMap,slots,nutrition,nutritionMap,allowed,validateSettings,dayTotals,resizePlan,schedule,shopping,activity,credits,warnings,validateSession,sum};
})(globalThis);
