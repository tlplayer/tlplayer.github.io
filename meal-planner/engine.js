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
  function build(settings,previous=[],prices={},targets=[]) {
    const s=validateSettings(settings),used=new Set(),counts={},plan=[];
    const pools=Object.fromEntries(slots.map(slot=>[slot,D.recipes.filter(r=>r.slots.includes(slot)&&allowed(r,s))]));
    for(const slot of slots)if(!pools[slot].length)throw Error(`No ${slot} recipes match this combination. Try another eating style or turn off the dairy-free filter.`);
    for(let day=0;day<s.days;day++) {
      const locked=(previous[day]||[]).filter(m=>m.locked).map(m=>({...m}));
      if(locked.some(m=>!recipeMap[m.recipe]||(!m.buy&&!allowed(recipeMap[m.recipe],s))))throw Error(`Day ${day+1} has a pinned meal outside this eating style. Unpin or replace it before rebuilding.`);
      const open=slots.filter(slot=>!locked.some(m=>m.slot===slot));
      const calorieTarget=targets[day]??s.calories;
      const lockedN=dayTotals(locked,prices),remaining=Math.max(0,calorieTarget-lockedN.kcal);
      let beam=[{meals:locked,n:lockedN,score:0}];
      const weights={breakfast:.25,lunch:.30,dinner:.33,snack:.12};
      const weightSum=open.reduce((n,slot)=>n+weights[slot],0);
      for(let stage=0;stage<open.length;stage++) {
        const slot=open[stage],candidates=[];
        for(const state of beam)for(const r of pools[slot])for(const portion of [.75,1,1.25,1.5,2]) {
          const m={recipe:r.id,portion,slot,locked:false},meals=[...state.meals,m],n=dayTotals(meals,prices);
          const progress=open.slice(0,stage+1).reduce((v,k)=>v+weights[k],0)/weightSum;
          const target=lockedN.kcal+remaining*progress;
          const repeats=meals.filter(x=>x.recipe===r.id).length-1;
          const newIngredients=new Set(meals.flatMap(x=>x.buy?[]:recipeMap[x.recipe].parts.map(p=>p.id)).filter(id=>!used.has(id))).size;
          const overCost=Math.max(0,n.cost*s.people-s.budget/s.days*progress);
          const overTime=Math.max(0,n.time-s.cookTime*progress);
          let score=Math.abs(n.kcal-target)/calorieTarget*140+overCost*1.4+overTime*(s.quick?.8:.25)+repeats*14+(counts[r.id]||0)*2.5;
          score+=newIngredients*(s.reuse?.7:.05);
          if(s.protein)score+=Math.max(0,s.protein*progress-n.protein)*.18;
          if(s.diet==='keto')score+=Math.max(0,n.netCarbs-50*progress)*2;
          if(s.diet==='low-carb')score+=Math.max(0,n.carbs-130*progress)*.6;
          candidates.push({meals,n,score});
        }
        candidates.sort((a,b)=>a.score-b.score);
        beam=candidates.slice(0,16);
      }
      const meals=beam[0].meals.sort((a,b)=>slots.indexOf(a.slot)-slots.indexOf(b.slot));
      plan.push(meals);meals.forEach(m=>{counts[m.recipe]=(counts[m.recipe]||0)+1;if(!m.buy)recipeMap[m.recipe].parts.forEach(p=>used.add(p.id));});
    }
    return plan;
  }
  function shopping(plan,people,pantry={},prices={},extras=[]) {
    const needed={};[...plan.flat().filter(m=>!m.buy),...extras].forEach(m=>recipeMap[m.recipe].parts.forEach(p=>needed[p.id]=(needed[p.id]||0)+p.qty*m.portion*people));
    return Object.entries(needed).map(([id,qty])=>{
      const i=D.ingredients[id],packs=pantry[id]?0:Math.ceil(qty/i.pack-1e-10),price=Object.hasOwn(prices,id)?prices[id]:i.price;
      return {...i,qty,packs,price,have:Boolean(pantry[id]),leftover:pantry[id]?0:packs*i.pack-qty,total:Math.round(packs*price*100)/100};
    }).sort((a,b)=>a.aisle.localeCompare(b.aisle)||a.name.localeCompare(b.name));
  }
  function activity(met,kg,minutes,mealKcal,basis='gross') {
    if(!Number.isFinite(met)||met<=0||!Number.isFinite(kg)||kg<=0||!Number.isFinite(minutes)||minutes<0||!Number.isFinite(mealKcal)||mealKcal<=0)throw Error('Activity inputs must be finite; MET, weight and meal calories must be positive.');
    if(!['gross','net'].includes(basis))throw Error('Choose gross or net activity energy.');
    const grossRate=met*3.5*kg/200,netRate=Math.max(0,met-1)*3.5*kg/200,rate=basis==='net'?netRate:grossRate;
    return {gross:grossRate*minutes,net:netRate*minutes,rate,energy:rate*minutes,percent:rate*minutes/mealKcal*100,equivalent:rate?mealKcal/rate:null};
  }
  function credits(workouts,day,strategy) {return workouts.filter(w=>w.day===day).reduce((n,w)=>n+Math.max(0,w.met-1)*3.5*w.kg/200*w.minutes*strategy,0);}
  function warnings(plan,s,pantry={},prices={},workouts=[],strategy=0,extras=[]) {
    const result=[],restaurant=plan.flat().filter(m=>m.buy).reduce((n,m)=>n+m.buy.cost*m.portion*s.people,0),grocery=sum(shopping(plan,s.people,pantry,prices,extras),'total')+restaurant;
    if(restaurant||plan.flat().some(m=>m.buy))result.push('Restaurant calories and prices use your selected entries. Protein, carbs, fat and fiber totals include home meals only; restaurant macros are unknown, so macro goals cannot be assessed for days with restaurant meals. Restaurant choices are not screened for your eating style or allergens.');
    if(grocery>s.budget+.01)result.push(`${restaurant?'Estimated groceries plus restaurant meals are':'Estimated grocery checkout is'} $${(grocery-s.budget).toFixed(2)} above your $${s.budget.toFixed(2)} budget. Package rounding is included; change meals, prices, or pantry items to reduce it.`);
    plan.forEach((day,i)=>{const n=dayTotals(day),hasBuy=day.some(m=>m.buy),target=s.calories+credits(workouts,i,strategy);
      if(Math.abs(n.kcal-target)>target*.08)result.push(`Day ${i+1}: ${Math.round(n.kcal)} kcal is ${Math.round(Math.abs(n.kcal-target))} ${n.kcal>target?'above':'below'} your selected target.`);
      if(n.time>s.cookTime)result.push(`Day ${i+1}: about ${n.time} minutes cooking, above your ${s.cookTime}-minute preference.`);
      if(!hasBuy&&s.protein&&n.protein<s.protein*.9)result.push(`Day ${i+1}: about ${Math.round(n.protein)} g protein, below your ${s.protein} g preference.`);
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
      if(!m.buy&&!allowed(recipeMap[m.recipe],settings))throw Error('Saved meal does not match its eating style.');
      if(m.buy&&!D.menu.some(item=>item.recipe===m.recipe))throw Error('Unknown restaurant item.');
      return {recipe:m.recipe,slot:m.slot,portion:m.portion,locked:Boolean(m.locked),...(m.buy?{buy:validBuy(m.buy)}:{})};
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
    const shoppingExtras=extras.map(m=>{if(!m||!Object.hasOwn(recipeMap,m.recipe)||!Number.isFinite(m.portion)||m.portion<.25||m.portion>4)throw Error('Invalid extra grocery recipe.');return {recipe:m.recipe,portion:m.portion};});
    const strategy=Number(raw.strategy);if(![0,.5,1].includes(strategy))throw Error('Invalid activity target strategy.');
    return {version:1,settings,plan,pantry,prices,quotes,checked,workouts,strategy,shoppingExtras};
  }
  root.MealEngine={mealNutrition,validBuy,recipeMap,slots,nutrition,nutritionMap,allowed,validateSettings,dayTotals,build,shopping,activity,credits,warnings,validateSession,sum};
})(globalThis);
