/* Shared restaurant-style food sections, filters and cards. */
(function(root){
  'use strict';
  const D=MealData,E=MealEngine,O=Ops;
  const normalize=value=>String(value).normalize('NFKD').replace(/[’']/g,'').toLowerCase().trim();
  const restaurants=[...new Set(D.menu.map(m=>m.restaurant))].sort();
  const categories=[
    {id:'breakfast',name:'Breakfast',icon:'🍳',description:'Your morning regulars, ready for one day or the whole week.',recipes:['overnight-oats','yogurt-bowl','egg-toast','tofu-scramble','egg-skillet','chia-bowl','mcmuffin']},
    {id:'burgers',name:'Burgers & sandwiches',icon:'🍔',description:'Stacked, toasted and made your way.',recipes:['big-mac','crispy-chicken','teriyaki-sub','chickpea-pita']},
    {id:'wraps',name:'Wraps & quesadillas',icon:'🌮',description:'Crispy folds, melty fillings and familiar favorites.',recipes:['crunchwrap','veggie-crunch','quesadilla']},
    {id:'bowls',name:'Bowls & plates',icon:'🍚',description:'A little of everything in one satisfying meal.',recipes:['chicken-rice','bean-rice','salmon-plate','tofu-greens','chipotle-bowl','orange-chicken']},
    {id:'pizza-pasta',name:'Pizza & pasta',icon:'🍕',description:'Comfort-food classics for a night in.',recipes:['med-pasta','pizza','chicken-alfredo']},
    {id:'salads',name:'Salads',icon:'🥗',description:'Fresh, crunchy meals with plenty of variety.',recipes:['chicken-salad','tuna-salad','egg-salad']},
    {id:'chicken',name:'Chicken bites',icon:'🍗',description:'Nuggets and crispers for your next craving.',recipes:['nuggets','chicken-crispers']},
    {id:'snacks',name:'Snacks & sides',icon:'🍟',description:'Something on the side, or a bite between meals.',recipes:['yogurt-snack','banana-snack','almond-snack','avocado-snack','cheese-snack','tofu-snack','fries']}
  ];
  const categoryFor=id=>categories.find(c=>c.recipes.includes(id));
  function select({query='',restaurant='',collection='copycat',settings=null,match=false,slot='',category=''}={}){
    const entries=[...D.menu];
    if(collection==='all')D.recipes.filter(r=>!D.menu.some(m=>m.recipe===r.id)).forEach(r=>entries.push({recipe:r.id,item:r.name,restaurant:'Everyday kitchen',source:''}));
    const terms=normalize(query).split(/\s+/).filter(Boolean);
    return entries.filter(m=>{const r=E.recipeMap[m.recipe],text=normalize(`${m.item} ${m.restaurant} ${r.name} ${categoryFor(r.id)?.name||''} ${r.parts.map(p=>D.ingredients[p.id].name).join(' ')}`);return (!category||categoryFor(r.id)?.id===category)&&(!slot||r.slots.includes(slot))&&(!restaurant||m.restaurant===restaurant)&&terms.every(t=>text.includes(t))&&(!match||E.allowed(r,settings));});
  }
  function navigation(selected='',{copycat=false,controls='recipes'}={}){
    const available=categories.filter(c=>!copycat||D.menu.some(m=>c.recipes.includes(m.recipe)));
    return [{id:'',name:'Full menu',icon:'🍽️'},...available].map(c=>`<button type="button" data-food-category="${c.id}" aria-pressed="${selected===c.id}" aria-controls="${controls}"><span aria-hidden="true">${c.icon}</span>${O.escape(c.name)}</button>`).join('');
  }
  function render(entries,{prices={},equivalent=null,link=false}={}){
    if(!entries.length)return '<div class="empty">No dishes match these filters. Try another category or clear the filters.</div>';
    return categories.map(category=>{
      const items=entries.filter(m=>category.recipes.includes(m.recipe));if(!items.length)return '';
      return `<section class="food-section" aria-labelledby="food-section-${category.id}"><header class="food-section-heading"><div><p class="eyebrow">${O.escape(category.description)}</p><h3 id="food-section-${category.id}"><span aria-hidden="true">${category.icon}</span> ${O.escape(category.name)}</h3></div><span class="section-count">${items.length} ${items.length===1?'dish':'dishes'}</span></header><div class="food-grid" role="list" aria-label="${O.escape(category.name)}">${items.map(m=>{
        const r=E.recipeMap[m.recipe],n=E.nutrition(r,1,prices),action=link?`<a class="button subtle menu-action" href="../?recipe=${encodeURIComponent(r.id)}" aria-label="Choose days for ${O.escape(m.item)}">Choose days →</a>`:`<button type="button" class="button subtle menu-action" data-recipe="${r.id}" aria-label="Choose days for ${O.escape(m.item)}">Choose days →</button>`;
        return `<article class="menu-card" role="listitem"><div class="menu-card-art" data-food-style="${category.id}"><span aria-hidden="true">${r.emoji}</span><span class="menu-time">${r.prep+r.cook} min at home</span></div><div class="menu-card-body"><span class="menu-brand">${O.escape(m.restaurant)}</span><h4>${O.escape(m.item)}</h4>${m.item!==r.name?`<p class="menu-description">Home version: ${O.escape(r.name)}</p>`:''}<div class="menu-card-facts"><span><strong>~${O.money(n.cost)}</strong> / serving</span><span><strong>~${Math.round(n.kcal)}</strong> kcal</span></div><small class="menu-estimate">Home recipe estimates · ingredients used</small>${equivalent?`<p class="menu-workout">${O.escape(equivalent(n.kcal))}</p>`:''}<div class="menu-card-bottom">${action}${m.source?`<a class="menu-source" href="${O.escape(m.source)}" target="_blank" rel="noopener noreferrer">Restaurant reference ↗</a>`:''}</div></div></article>`;
      }).join('')}</div></section>`;
    }).join('');
  }
  root.CraveMenu={restaurants,categories,categoryFor,navigation,select,render};
})(globalThis);
