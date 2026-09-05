/* Restaurant discovery shared by the planner and the standalone menu. */
(function(root){
  'use strict';
  const D=MealData,E=MealEngine,O=Ops;
  const normalize=value=>String(value).normalize('NFKD').replace(/[’']/g,'').toLowerCase().trim();
  const restaurants=[...new Set(D.menu.map(m=>m.restaurant))].sort();
  function select({query='',restaurant='',collection='copycat',settings=null,match=false,slot=''}={}){
    const entries=[...D.menu];
    if(collection==='all')D.recipes.filter(r=>!D.menu.some(m=>m.recipe===r.id)).forEach(r=>entries.push({recipe:r.id,item:r.name,restaurant:'Everyday kitchen',source:''}));
    const terms=normalize(query).split(/\s+/).filter(Boolean);
    return entries.filter(m=>{const r=E.recipeMap[m.recipe],text=normalize(`${m.item} ${m.restaurant} ${r.name} ${r.parts.map(p=>D.ingredients[p.id].name).join(' ')}`);return (!slot||r.slots.includes(slot))&&(!restaurant||m.restaurant===restaurant)&&terms.every(t=>text.includes(t))&&(!match||E.allowed(r,settings));});
  }
  function render(entries,{prices={},equivalent=null,link=false}={}){
    return entries.map(m=>{const r=E.recipeMap[m.recipe],n=E.nutrition(r,1,prices),action=link?`<a class="button subtle small menu-action" href="../?recipe=${encodeURIComponent(r.id)}">Choose days →</a>`:`<button class="button subtle small menu-action" data-recipe="${r.id}">Choose days →</button>`;
      return `<article class="menu-row" role="listitem"><div class="menu-icon" aria-hidden="true">${r.emoji}</div><div class="menu-item"><span class="menu-brand">${O.escape(m.restaurant)}</span><h3>${O.escape(m.item)}</h3><p class="menu-description">Home version: ${O.escape(r.name)}</p>${m.source?`<a class="menu-source" href="${O.escape(m.source)}" target="_blank" rel="noopener noreferrer">Restaurant reference ↗</a>`:''}</div><div class="menu-numbers"><span><strong>~${Math.round(n.kcal)}</strong> kcal</span><span><strong>~${O.money(n.cost)}</strong> / serving</span><span><strong>${r.prep+r.cook}</strong> min</span><small>Home recipe estimates</small>${equivalent?`<p class="menu-workout">${O.escape(equivalent(n.kcal))}</p>`:''}</div>${action}</article>`;
    }).join('')||'<p class="empty" role="listitem">No menu items match. Try another restaurant, clear the search, or turn off the eating-style filter.</p>';
  }
  root.CraveMenu={restaurants,select,render};
})(globalThis);
