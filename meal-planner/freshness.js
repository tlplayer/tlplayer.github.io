/* Date-only planning and purchase batches. No date is a guarantee of food safety. */
(function(root){
  'use strict';
  const E=MealEngine,D=MealData;
  const sources={cold:'https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts',produce:'https://extension.umd.edu/resource/storing-garden-fruits-and-vegetables',cucumber:'https://extension.umaine.edu/food-health/2025/05/29/storing-and-washing-fresh-fruits-and-vegetables/',keeper:'https://www.foodsafety.gov/keep-food-safe/foodkeeper-app'};
  const profiles={
    chicken:{days:1,storage:'fridge',freeze:90,source:'cold',note:'Raw poultry: 1–2 refrigerated days; planner uses 1. Portion and freeze promptly for later meals.'},
    beef:{days:1,storage:'fridge',freeze:90,source:'cold',note:'Ground beef: 1–2 refrigerated days; planner uses 1.'},
    salmon:{days:1,storage:'fridge',freeze:60,source:'cold',note:'Fresh fatty fish: 1–3 refrigerated days; planner uses 1.'},
    egg:{days:21,storage:'fridge',source:'cold',note:'Raw eggs in shell: lower end of 3–5 refrigerated weeks. Do not freeze in shell.'},
    lettuce:{days:2,storage:'fridge',source:'produce',note:'Whole salad greens: lower end of 2–4 days. Check bag instructions for prepared greens.'},
    spinach:{days:2,storage:'fridge',source:'produce',note:'Whole salad greens: lower end of 2–4 days.'},
    broccoli:{days:3,storage:'fridge',source:'produce',note:'Whole broccoli: lower end of 3–6 days; packaged florets may differ.'},
    cauliflower:{days:null,storage:'fridge',source:'keeper',note:'Prepared cauliflower rice: enter the package date; whole-vegetable guidance is not assumed.'},
    pepper:{days:5,storage:'fridge',source:'produce',note:'Whole bell peppers: up to 5 days.'},
    cucumber:{days:7,storage:'fridge',source:'cucumber',note:'Whole cucumber: up to one refrigerated week.'},
    potato:{days:14,storage:'pantry',source:'produce',note:'Whole potatoes: lower end of 2–4 weeks in a cool, dry, dark, ventilated place.'},
    onion:{days:14,storage:'pantry',source:'produce',note:'Whole onions: lower end of 2–4 weeks in a cool, dry, ventilated place.'},
    berries:{days:null,storage:'freezer',source:'cold',note:'Already frozen berries. Enter the package quality date; keep continuously frozen.'}
  };
  const shelf=new Set(['rice','oats','pasta','oil','almonds','peanut','chia','honey','starch','flour','seasoning','tortilla','cornTortilla','bun','muffin','bread','pita','tomato','banana','avocado']);
  function profile(id){return profiles[id]||{days:null,storage:shelf.has(id)?'pantry':'fridge',source:'keeper',note:'No verified shelf-life value for this exact product. Enter its label date and follow storage / after-opening instructions. Cut produce requires refrigeration.'};}
  function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s&&s>='2000-01-01'&&s<='2100-12-31';}
  function add(s,n){if(!validDate(s))throw Error('Choose a valid calendar date.');return new Date(Date.parse(s+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function key(day,index,m){return `${day}:${index}:${m.recipe}`;}
  function clean(raw){
    raw=raw||{};const out={start:raw.start||today(),mode:raw.mode||'freeze',lots:[],overrides:{},prep:{}};
    if(!validDate(out.start)||!['freeze','split','one'].includes(out.mode))throw Error('Invalid freshness start date or shopping approach.');
    function fields(x){const o={};for(const name of ['boughtOn','openedOn','labelDate']){const v=x[name]||'';if(v&&!validDate(v))throw Error('Invalid purchase or use-by date.');o[name]=v;}if(x.storage){if(!['fridge','freezer','pantry','freeze-portions'].includes(x.storage))throw Error('Invalid storage location.');o.storage=x.storage;}return o;}
    if(!Array.isArray(raw.lots||[])||(raw.lots||[]).length>1000)throw Error('Too many purchase batches.');
    const ids=new Set();out.lots=(raw.lots||[]).map(x=>{if(!x||!Object.hasOwn(D.ingredients,x.ingredient)||!Number.isInteger(x.packs)||x.packs<1||x.packs>10000||typeof x.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(x.id)||ids.has(x.id))throw Error('Invalid purchase batch.');ids.add(x.id);return {id:x.id,ingredient:x.ingredient,packs:x.packs,...fields(x)};});
    if(Object.keys(raw.overrides||{}).length>1000||Object.keys(raw.prep||{}).length>1000)throw Error('Too many saved freshness entries.');
    for(const [k,x]of Object.entries(raw.overrides||{})){if(!/^[a-zA-Z0-9_-]{1,120}$/.test(k))throw Error('Invalid shopping batch key.');out.overrides[k]=fields(x);}
    for(const [k,v]of Object.entries(raw.prep||{})){if(!/^\d+:\d+:[a-z0-9-]+$/.test(k)||!validDate(v))throw Error('Invalid preparation date.');out.prep[k]=v;}
    return out;
  }
  function reconcile(state){
    state.freshness ||= clean();const f=state.freshness;
    for(const id of Object.keys(D.ingredients)){
      const count=state.purchased[id]||0,rows=f.lots.filter(l=>l.ingredient===id),recorded=rows.reduce((n,l)=>n+l.packs,0);
      if(count>recorded)f.lots.push({id:'legacy-'+id+'-'+Date.now(),ingredient:id,packs:count-recorded,boughtOn:'',openedOn:'',labelDate:'',storage:profile(id).storage});
      if(count<recorded){let excess=recorded-count;for(const row of [...rows].reverse()){const n=Math.min(row.packs,excess);row.packs-=n;excess-=n;}}
    }
    f.lots=f.lots.filter(l=>l.packs>0);
  }
  function deadline(row){
    const p=profile(row.ingredient),dates=[];let basis='Unknown — enter label / storage dates';
    const frozen=['freezer','freeze-portions'].includes(row.storage);
    if(row.boughtOn&&p.days!==null&&row.storage===p.storage){dates.push(add(row.boughtOn,p.days));basis='Conservative storage estimate';}
    if(row.boughtOn&&frozen&&p.freeze){dates.push(add(row.boughtOn,p.freeze));basis='Frozen quality review date, not safety expiration';}
    // Opening never resets a raw-food clock. An unverified after-opening window stays unknown.
    if(row.labelDate){dates.push(row.labelDate);basis=dates.length>1?basis+'; capped by entered label date':'User-entered label date; check after-opening instructions';}
    return {date:dates.length?dates.sort()[0]:'',basis};
  }
  function mealSchedule(state,plan=state.plan){
    const f=state.freshness||clean();return plan.flatMap((meals,day)=>meals.map((m,index)=>{
      const id=key(day,index,m),eat=add(f.start,day),cook=m.buy?'':f.prep[id]||(['overnight-oats','chia-bowl'].includes(m.recipe)?add(eat,-1):eat);
      const cooked=E.recipeMap[m.recipe].cook>0,useBy=cook?add(cook,cooked?3:2):'';
      return {id,day,index,meal:m,eat,cook,useBy,status:!cook?'Restaurant':cook>eat?'Cook date is after meal':eat>useBy?'Prepare later or arrange appropriate frozen storage':'Dates fit planning window',basis:cooked?'3-day refrigerated leftover planning limit; check recipe-specific guidance':'2-day prepared-food review reminder, not a validated shelf life'};
    }));
  }
  function analyze(state,plan=state.plan,asOf=today()){
    const f=state.freshness||clean(),uses={},meals=mealSchedule(state,plan),base=E.shopping(plan,state.settings.people,state.pantry,state.prices,state.shoppingExtras,state.purchased);
    meals.filter(m=>!m.meal.buy).forEach(m=>E.recipeMap[m.meal.recipe].parts.forEach(p=>{(uses[p.id]||=[]).push({date:m.cook,eat:m.eat,qty:p.qty*m.meal.portion*state.settings.people,eaten:m.meal.eaten,recipe:m.meal.recipe});}));
    state.shoppingExtras.forEach(m=>E.recipeMap[m.recipe].parts.forEach(p=>{(uses[p.id]||=[]).push({date:'',eat:'',qty:p.qty*m.portion*state.settings.people,eaten:false,recipe:m.recipe});}));
    const batches=[];
    for(const item of base){
      const p=profile(item.id),requests=(uses[item.id]||[]).sort((a,b)=>a.date.localeCompare(b.date));
      const stock=f.lots.filter(l=>l.ingredient===item.id).map(l=>({...l,kind:'bought',remaining:l.packs*item.pack,assignments:[]}));
      const known=stock.reduce((n,l)=>n+l.packs,0);if(item.bought>known)stock.push({id:'unknown-'+item.id,ingredient:item.id,packs:item.bought-known,boughtOn:'',openedOn:'',labelDate:'',storage:p.storage,kind:'bought',remaining:(item.bought-known)*item.pack,assignments:[]});
      if(item.have)stock.push({id:'pantry-'+item.id,ingredient:item.id,packs:0,boughtOn:'',openedOn:'',labelDate:'',storage:p.storage,kind:'pantry',remaining:item.qty,assignments:[]});
      for(let j=0;j<requests.length;j++){
        const use=requests[j];let need=use.qty;
        stock.sort((a,b)=>(deadline(a).date||'9999').localeCompare(deadline(b).date||'9999'));
        for(const lot of stock){const end=deadline(lot).date;if(lot.remaining<=0||(use.date&&lot.boughtOn&&lot.boughtOn>use.date)||(use.date&&end&&end<use.date))continue;const n=Math.min(need,lot.remaining);lot.remaining-=n;need-=n;lot.assignments.push({...use,qty:n});if(need<1e-8)break;}
        if(need<1e-8)continue;
        const storage=f.mode==='freeze'&&p.freeze?'freeze-portions':p.storage;
        const span=storage==='freeze-portions'?p.freeze:f.mode==='one'?10000:p.days;
        const end=use.date&&span!==null?add(use.date,Math.min(span,365)):'';
        const qty=need+requests.slice(j+1).filter(x=>!end||!x.date||x.date<=end).reduce((n,x)=>n+x.qty,0),packs=Math.ceil(qty/item.pack-1e-10);
        const id=`plan-${item.id}-${use.date||'undated'}-${storage}`;
        const lot={id,ingredient:item.id,packs,boughtOn:use.date,openedOn:use.date,labelDate:'',storage,kind:'planned',remaining:packs*item.pack,assignments:[],...f.overrides[id]};
        lot.remaining-=need;lot.assignments.push({...use,qty:need});stock.push(lot);
      }
      for(const lot of stock){
        const d=deadline(lot),assigned=lot.assignments.reduce((n,x)=>n+x.qty,0),consumed=lot.assignments.filter(x=>x.eaten).reduce((n,x)=>n+x.qty,0),left=Math.max(0,lot.packs*item.pack-consumed);
        const dates=[...new Set(lot.assignments.map(a=>a.date).filter(Boolean))].sort(),eats=[...new Set(lot.assignments.map(a=>a.eat).filter(Boolean))].sort();
        const conflict=dates.some(date=>(lot.boughtOn&&date<lot.boughtOn)||(d.date&&date>d.date));
        const unsupported=lot.storage!==p.storage&&!(['freezer','freeze-portions'].includes(lot.storage)&&p.freeze);
        let status=lot.kind==='planned'?'Planned purchase':'In storage';
        if(lot.kind==='bought'&&left<=1e-8)status='Used up';
        else if(conflict)status='Dates conflict';
        else if(!d.date||!lot.boughtOn||unsupported)status='Dates / storage need checking';
        else if(lot.kind==='planned'&&lot.boughtOn>asOf)status='Planned purchase';
        else if(d.date<asOf)status=['freezer','freeze-portions'].includes(lot.storage)?'Past frozen quality review':'Past use-by estimate';
        else if(d.date<=add(asOf,2))status='Use soon';
        const freeze=['freeze-portions','freezer'].includes(lot.storage),thaw=freeze&&p.freeze?dates.filter(date=>date!==lot.boughtOn).map(date=>add(date,-1)):[];
        batches.push({...lot,name:item.name,unit:item.unit,pack:item.pack,price:item.price,assigned,unallocated:Math.max(0,lot.remaining),remainingNow:left,useDates:dates,eatDates:eats,useBy:d.date,basis:d.basis,status,source:sources[p.source],note:p.note,freezeOn:freeze?lot.boughtOn:'',thawDates:thaw,cost:lot.kind==='planned'?packsCost(lot.packs,item.price):0,action:conflict?'Change purchase / preparation dates or verify appropriate frozen storage.':lot.remaining>0&&p.freeze?'Keep unallocated portions frozen promptly; label portions and thaw only what is needed.':lot.remaining>0&&p.days!==null?'Use surplus within the storage window, choose a smaller pack, or buy this food later.':!d.date?'Enter the package date and check after-opening instructions.':'Follow package instructions and the planned use dates.'});
      }
    }
    const cart=base.map(i=>{const rows=batches.filter(b=>b.ingredient===i.id),planned=rows.filter(b=>b.kind==='planned');return {...i,packs:planned.reduce((n,b)=>n+b.packs,0),total:planned.reduce((n,b)=>n+b.cost,0),leftover:rows.reduce((n,b)=>n+b.unallocated,0)};});
    return {batches,meals,cart};
  }
  const packsCost=(n,p)=>Math.round(n*p*100)/100;
  root.CraveFresh={profile,sources,validDate,add,today,key,clean,reconcile,deadline,mealSchedule,analyze};
})(globalThis);
