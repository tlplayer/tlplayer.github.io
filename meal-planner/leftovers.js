/* Unallocated packages, recipe-sized reuse choices, and discarded stock. */
(function(root){
  'use strict';
  const F=CraveFresh,E=MealEngine,D=MealData,O=Ops,W=CraveWeekModel;
  function surplus(state){const result=F.analyze(state);return {...result,owned:result.batches.filter(b=>b.kind==='bought'&&b.unallocated>1e-6),projected:result.batches.filter(b=>b.kind==='planned'&&b.unallocated>1e-6)};}
  function discard(state,id,qty){
    const b=surplus(state).owned.find(b=>b.id===id);
    if(!b||!Number.isFinite(qty)||qty<=0||qty>b.unallocated+1e-8)throw Error('Discard an amount up to the unplanned quantity you actually own.');
    state.freshness.waste ||= {};state.freshness.waste[id]=(state.freshness.waste[id]||0)+qty;
  }
  function suggestions(state,batch,limit=2){
    const asOf=F.today();
    if(!batch.useBy||!batch.boughtOn||batch.boughtOn>asOf||batch.useBy<asOf||!['In storage','Use soon'].includes(batch.status))return [];
    const baseline=F.analyze(state),cost=E.sum(baseline.cart,'total'),results=[];
    for(const r of D.recipes){
      if(!r.parts.some(p=>p.id===batch.ingredient))continue;
      const slot=r.slots[0];let d=-1;
      for(let i=0;i<state.plan.length;i++)if(F.add(state.freshness.start,i)>=asOf&&!state.plan[i].some(m=>W.displaySlot(m)===slot)&&state.plan[i].length<12){d=i;break;}
      if(d<0)continue;
      const plan=state.plan.map(ms=>ms.slice());plan[d].push({recipe:r.id,slot,portion:1,locked:true,eaten:false});
      const next=F.analyze(state,plan),after=next.batches.find(b=>b.id===batch.id),used=batch.unallocated-(after?.unallocated??batch.unallocated);
      // Date-aware allocation must actually use this lot, rather than buying a replacement.
      if(used<=1e-6)continue;
      results.push({recipe:r.id,slot,day:d,used,cost:E.sum(next.cart,'total')-cost,kcal:E.nutrition(r).kcal,time:r.prep+r.cook});
    }
    return results.sort((a,b)=>a.cost-b.cost||b.used-a.used||a.time-b.time).slice(0,limit);
  }
  root.CraveLeftoverModel={surplus,discard,suggestions};
  let hooks;const $=id=>document.getElementById(id),esc=O.escape,quantity=b=>`${Number(b.unallocated.toFixed(2))} ${b.unit}`;
  function render(){
    if(!hooks)return;const s=hooks.getState(),v=surplus(s),waste=Object.entries(s.freshness.waste||{}).filter(([,q])=>q>0),urgent=v.owned.filter(b=>b.useBy&&b.useBy<=F.add(F.today(),2));
    const metric=(name,n,note)=>`<div class="metric"><span class="label">${name}</span><strong>${n}</strong><span class="sub">${note}</span></div>`;
    $('leftover-summary').innerHTML=metric('Owned, without a meal',v.owned.length,'Purchase batches with unallocated ingredients')+metric('Check first',urgent.length,'Use-by / review dates within two days or already past')+metric('Recorded waste',O.money(waste.reduce((n,[id,q])=>{const l=s.freshness.lots.find(l=>l.id===id),i=D.ingredients[l.ingredient];return n+q/i.pack*(s.prices[l.ingredient]??i.price);},0)),'Estimated ingredient value, already included in purchases');
    function cards(rows,owned){return rows.length?`<div class="leftover-grid">${rows.sort((a,b)=>(a.useBy||'9999').localeCompare(b.useBy||'9999')).map(b=>{
      const choices=owned?suggestions(s,b):[],alert=b.status.includes('Past')||b.status==='Dates conflict';
      return `<article class="leftover-card" data-leftover-lot="${esc(b.id)}"><h4>${esc(b.name)}</h4><strong class="surplus-qty">${quantity(b)}</strong><small>${owned?'Owned · not allocated to a meal':'Expected after planned meals · not yet bought'}</small><p class="${alert?'leftover-alert':''}">${esc(b.status)} · ${esc(b.storage)}<br>${b.useBy?`Use-by / review: <strong>${b.useBy}</strong>`:'Label / storage date needed'}</p><small>${esc(b.basis)}</small><p>${Number(b.assigned.toFixed(2))} ${b.unit} assigned to your meals. ${owned?`${Number(b.remainingNow.toFixed(2))} ${b.unit} total remaining, including upcoming meals.`:''}</p>${choices.length?'<p>Meal ideas using this batch · lowest extra checkout first:</p>'+choices.map(c=>`<button class="leftover-suggestion" data-use-leftover="${c.recipe}" data-use-day="${c.day}" data-use-slot="${c.slot}">+ ${esc(E.recipeMap[c.recipe].name)}<small>Day ${c.day+1} · uses ${Number(c.used.toFixed(2))} ${b.unit} · ~${O.money(c.cost)} extra groceries · ${Math.round(c.kcal)} kcal/person · ${c.time} min</small></button>`).join(''):owned?'<p>Review dates and storage before using. Browse the menu to choose a meal that fits your open blocks.</p>':''}<a href="#freshness" class="text-link">Review purchase & storage dates ↗</a>${owned?`<details><summary>Record discarded food</summary><label>Amount discarded (${esc(b.unit)})<input data-waste-qty type="number" min="0.01" max="${b.unallocated}" step="any" value="${Number(b.unallocated.toFixed(2))}"></label><button type="button" class="button subtle small" data-discard="${esc(b.id)}">Record waste</button><small>Only this unallocated amount. To discard food reserved for a meal, remove that meal first.</small></details>`:''}</article>`;
    }).join('')}</div>`:'<p class="leftover-empty">'+(owned?'No unplanned ingredients in recorded purchases. Add dated purchases below; unused amounts stay here when your plans change.':'No projected surplus yet. Whole-package shopping will appear as you add home meals.')+'</p>';}
    $('leftover-owned').innerHTML='<h3>Already bought · give it a use</h3>'+cards(v.owned,true);
    $('leftover-projected-title').textContent=`Expected surplus from future purchases · ${v.projected.length} batches`;
    $('leftover-projected').innerHTML=cards(v.projected,false);
    $('leftover-waste').innerHTML=waste.map(([id,q])=>{const l=s.freshness.lots.find(l=>l.id===id),i=D.ingredients[l.ingredient];return `<div class="waste-row"><span>${esc(i.name)} · ${Number(q.toFixed(2))} ${i.unit} discarded<br><small>Purchase ${l.boughtOn||'date not recorded'} · excluded from available stock</small></span><button data-undo-waste="${esc(id)}" class="button subtle small">Undo record</button></div>`;}).join('')||'<p>No food recorded as discarded.</p>';
  }
  function rows(state){return surplus(state).batches.filter(b=>b.kind!=='pantry').map(b=>({batch:b.id,ingredient:b.name,purchase_status:b.kind,unit:b.unit,purchased_or_planned_qty:b.packs*b.pack,allocated_to_meals_qty:b.assigned,unallocated_qty:b.unallocated,discarded_qty:b.wasted||0,remaining_including_upcoming_meals_qty:b.remainingNow,buy_on:b.boughtOn,prepare_on:b.useDates.join('; '),eat_on:b.eatDates.join('; '),use_by_or_review:b.useBy,storage:b.storage,status:b.status,date_basis:b.basis,source:b.source}));}
  function install(options){hooks=options;$('leftovers').addEventListener('click',ev=>{try{
    const use=ev.target.closest('[data-use-leftover]');if(use){if(hooks.add(use.dataset.useLeftover,{day:+use.dataset.useDay,slot:use.dataset.useSlot})){$('leftovers-status').textContent='Meal added. Surplus and shared-package shopping recalculated.';$('planner').scrollIntoView({behavior:'smooth'});}return;}
    const waste=ev.target.closest('[data-discard]');if(waste){const input=waste.closest('.leftover-card').querySelector('[data-waste-qty]');discard(hooks.getState(),waste.dataset.discard,Number(input.value));hooks.changed();$('leftovers-status').textContent='Waste recorded and removed from available stock. You can undo this in the waste record.';return;}
    const undo=ev.target.closest('[data-undo-waste]');if(undo){delete hooks.getState().freshness.waste[undo.dataset.undoWaste];hooks.changed();$('leftovers-status').textContent='Waste record undone; the amount is back in inventory.';}
  }catch(e){$('leftovers-status').textContent=e.message;}});
    $('export-leftovers').addEventListener('click',()=>{const data=rows(hooks.getState());O.download('craveplan-leftovers.csv',data.length?Object.keys(data[0]):['ingredient','unallocated_qty','discarded_qty','buy_on','prepare_on','use_by_or_review'],data);});
  }
  root.CraveLeftovers={install,render,rows};
})(globalThis);
