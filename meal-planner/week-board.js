/* Week placement is separate from recipe nutrition and dated package allocation. */
(function(root){
  'use strict';
  const E=MealEngine,F=CraveFresh,O=Ops,icons={breakfast:'🍳',lunch:'🥪',dinner:'🍽️',snack:'🍎'};
  const displaySlot=m=>m.slot==='extra'?'snack':m.slot;
  function destination(plan,slot,start=0){
    for(let step=0;step<plan.length;step++){const d=(start+step)%plan.length;if(plan[d].length<12&&!plan[d].some(m=>displaySlot(m)===slot))return d;}
    throw Error(`Every ${slot} block is filled. Drag a menu item into a block to add another, or remove a meal first.`);
  }
  function validMeal(m){
    if(!E.recipeMap[m.recipe]||!E.slots.includes(m.slot)||!Number.isFinite(m.portion)||m.portion<.25||m.portion>4||!Number.isInteger(m.portion*4))throw Error('Choose a valid meal and 0.25–4 portions in quarter servings.');
    if(m.buy)E.validBuy(m.buy);
  }
  // Preparation dates belong to the meal: remap them when array positions change.
  function commit(state,change){
    const dates=new Map();state.plan.forEach((ms,d)=>ms.forEach((m,i)=>{const date=state.freshness.prep[F.key(d,i,m)];if(date)dates.set(m,date);}));
    const plan=state.plan.map(ms=>ms.slice());change(plan);
    const prep={};plan.forEach((ms,d)=>ms.forEach((m,i)=>{if(dates.has(m))prep[F.key(d,i,m)]=dates.get(m);}));
    state.plan=plan;state.freshness.prep=prep;
  }
  function add(state,meal,d){
    validMeal(meal);if(!Number.isInteger(d)||!state.plan[d]||state.plan[d].length>=12)throw Error('That day is full or outside this week.');
    commit(state,p=>p[d].push({...meal,buy:meal.buy?{...meal.buy}:undefined,eaten:false,locked:true}));return d;
  }
  function move(state,from,index,to,slot){
    const meal=state.plan[from]?.[index];if(!meal||!state.plan[to]||!E.slots.includes(slot))throw Error('Choose an existing meal and destination.');
    if(meal.eaten)throw Error('Undo eaten before moving this meal.');
    if(from!==to&&state.plan[to].length>=12)throw Error('That day already has 12 meals.');
    commit(state,p=>{p[from].splice(index,1);p[to].push(meal);});meal.slot=slot;
  }
  function remove(state,d,i){
    if(!state.plan[d]?.[i])throw Error('This meal is no longer on the board.');
    if(state.plan[d][i].eaten)throw Error('Undo eaten before removing this meal, so consumed ingredients stay accounted for.');
    commit(state,p=>p[d].splice(i,1));
  }
  root.CraveWeekModel={destination,add,move,remove,commit,displaySlot};
  let hooks,moving=null,pointerDrag=null;
  const $=id=>document.getElementById(id),esc=O.escape;
  function announce(text,error=false){$('board-status').textContent=text;$('board-status').classList.toggle('error',error);$('menu-selection').textContent=text;$('menu-week-count').textContent=`View week · ${hooks.getState().plan.flat().length} meals ↓`;}
  function attempt(fn){try{fn();return true;}catch(e){announce(e.message,true);return false;}}
  function addRecipe(id,options={}){
    let result=false;attempt(()=>{const s=hooks.getState(),r=E.recipeMap[id];if(!r)throw Error('Unknown recipe.');const slot=options.slot|| (r.slots.includes(hooks.slot())?hooks.slot():r.slots[0]),d=Number.isInteger(options.day)?options.day:destination(s.plan,slot,hooks.start());
      add(s,{recipe:id,slot,portion:options.portion??1,...(options.buy?{buy:options.buy}:{})},d);moving=null;hooks.changed();announce(`${r.name} added to Day ${d+1} · ${slot}. Ingredients are shared across your week.`);CraveEvents.track('add_to_plan',{recipe:id,choice:options.buy?'buy':'make',placement:'menu'});result=true;
    });return result;
  }
  function render(){
    if(!hooks)return;const s=hooks.getState();$('menu-week-count').textContent=`View week · ${s.plan.flat().length} meals ↓`;if(moving&&s.plan[moving.day]?.[moving.index]!==moving.meal)moving=null;$('cancel-move').hidden=!moving;
    $('week-board').classList.toggle('is-moving',!!moving);
    $('week-board').innerHTML=s.plan.map((ms,d)=>`<section class="board-day" aria-labelledby="board-day-${d}"><header><h3 id="board-day-${d}">Day ${d+1}</h3><time datetime="${F.add(s.freshness.start,d)}">${esc(new Date(F.add(s.freshness.start,d)+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}))}</time><small>${Math.round(E.dayTotals(ms,s.prices).kcal)} kcal chosen</small></header><div class="day-blocks">${E.slots.map(slot=>{
      const meals=ms.map((m,i)=>({m,i})).filter(({m})=>displaySlot(m)===slot);
      return `<section class="meal-block ${slot==='snack'?'optional':''}" data-drop-day="${d}" data-drop-slot="${slot}" aria-label="Day ${d+1} ${slot}"><div class="block-label"><span aria-hidden="true">${icons[slot]}</span><strong>${slot}</strong>${slot==='snack'?'<small>optional</small>':''}</div>${moving?`<button class="move-here" data-destination="${d}" data-slot="${slot}">Move here</button>`:''}${meals.map(({m,i})=>{
        const r=E.recipeMap[m.recipe],n=E.mealNutrition(m,s.prices),equivalent=hooks.equivalent(n.kcal);
        return `<article class="board-meal ${m.eaten?'is-eaten':''}" draggable="${!m.eaten}" data-meal-day="${d}" data-meal-index="${i}"><span class="board-drag-handle" draggable="false" aria-hidden="true" title="Drag meal">⠿</span><button class="meal-remove" data-board-action="remove" ${m.eaten?'disabled title="Undo eaten before removing"':''} aria-label="Remove ${esc(r.name)} from Day ${d+1}">×</button><button class="board-recipe" data-board-action="details">${esc(m.buy?CraveCommerce.item(m.recipe)?.item||r.name:r.name)}</button><small>${m.buy?'Restaurant · ':''}~${Math.round(n.kcal)} kcal · ${m.buy?'0':r.prep+r.cook} min</small><div class="board-meal-actions"><button data-board-action="move" ${m.eaten?'disabled':''} aria-label="Move ${esc(r.name)} from Day ${d+1}">Move</button><button data-board-action="repeat" title="Repeat in next open block" aria-label="Repeat ${esc(r.name)} in next open ${slot} block">↻</button><button data-board-action="eaten" title="${m.eaten?'Undo eaten':'Mark eaten'}" aria-label="${m.eaten?'Undo eaten':'Mark eaten'}: ${esc(r.name)}" aria-pressed="${!!m.eaten}">${m.eaten?'✓':'○'}</button></div><details class="board-more"><summary>Servings & activity</summary><label class="board-portions">Servings<input data-board-portion type="number" min="0.25" max="4" step="0.25" value="${m.portion}" aria-label="Servings per person, ${esc(r.name)}, Day ${d+1}" ${m.eaten?'disabled':''}></label>${equivalent?`<button class="board-equivalent" data-board-action="activity">${esc(equivalent)}</button>`:''}</details></article>`;
      }).join('')}${!meals.length&&!moving?`<button class="block-add" data-browse-day="${d}" data-slot="${slot}"><span aria-hidden="true">＋</span>Browse ${slot}</button>`:''}</section>`;
    }).join('')}</div></section>`).join('');
  }
  function install(options){
    hooks=options;const board=$('week-board');
    board.addEventListener('click',ev=>attempt(()=>{
      const dest=ev.target.closest('[data-destination]');if(dest&&moving){move(hooks.getState(),moving.day,moving.index,Number(dest.dataset.destination),dest.dataset.slot);moving=null;hooks.changed();announce('Meal moved. Shopping and preparation reminders updated.');return;}
      const browse=ev.target.closest('[data-browse-day]');if(browse){hooks.browse(Number(browse.dataset.browseDay),browse.dataset.slot);return;}
      const action=ev.target.closest('[data-board-action]'),card=action?.closest('[data-meal-day]');if(!card)return;
      const d=Number(card.dataset.mealDay),i=Number(card.dataset.mealIndex),s=hooks.getState(),m=s.plan[d][i];
      switch(action.dataset.boardAction){
        case 'move':moving={day:d,index:i,meal:m};render();announce('Select Move here in any meal block. Escape cancels.');board.querySelector('.move-here')?.focus({preventScroll:true});return;
        case 'repeat':{const slot=displaySlot(m),target=destination(s.plan,slot,(d+1)%s.plan.length);addRecipe(m.recipe,{...m,slot,day:target});return;}
        case 'remove':remove(s,d,i);moving=null;hooks.changed();announce('Meal removed. Bought ingredients remain in leftovers and inventory.');return;
        case 'eaten':m.eaten=!m.eaten;moving=null;hooks.changed();announce(m.eaten?'Marked eaten; ingredients counted as used.':'Eaten mark undone.');return;
        case 'details':hooks.details(m.recipe,m.slot,m);return;
        case 'activity':hooks.activity(m);return;
      }
    }));
    board.addEventListener('change',ev=>{if(!ev.target.matches('[data-board-portion]'))return;attempt(()=>{const card=ev.target.closest('[data-meal-day]'),m=hooks.getState().plan[Number(card.dataset.mealDay)][Number(card.dataset.mealIndex)],p=Number(ev.target.value);try{validMeal({...m,slot:displaySlot(m),portion:p});}catch(e){ev.target.value=m.portion;throw e;}m.portion=p;hooks.changed();});});
    // Pointer capture makes the explicit handle work with a mouse, pen or touch.
    board.addEventListener('pointerdown',ev=>{
      const handle=ev.target.closest('.board-drag-handle'),card=handle?.closest('[data-meal-day]');if(!card||ev.button!==0)return;
      const d=+card.dataset.mealDay,i=+card.dataset.mealIndex;if(hooks.getState().plan[d][i].eaten)return;
      ev.preventDefault();pointerDrag={day:d,index:i,id:ev.pointerId,x:ev.clientX,y:ev.clientY,active:false,handle};handle.setPointerCapture(ev.pointerId);
    });
    function clearDropHighlights(){board.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));board.querySelectorAll('.is-dragging').forEach(el=>el.classList.remove('is-dragging'));}
    board.addEventListener('pointermove',ev=>{
      if(!pointerDrag||ev.pointerId!==pointerDrag.id)return;
      if(!pointerDrag.active&&Math.hypot(ev.clientX-pointerDrag.x,ev.clientY-pointerDrag.y)<6)return;
      ev.preventDefault();pointerDrag.active=true;clearDropHighlights();pointerDrag.handle.closest('.board-meal').classList.add('is-dragging');
      document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-drop-day]')?.classList.add('drag-over');
      if(ev.clientY<60)window.scrollBy(0,-14);else if(ev.clientY>window.innerHeight-60)window.scrollBy(0,14);
    });
    board.addEventListener('pointerup',ev=>{
      if(!pointerDrag||ev.pointerId!==pointerDrag.id)return;
      const drag=pointerDrag,target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-drop-day]');pointerDrag=null;clearDropHighlights();
      if(drag.handle.hasPointerCapture(ev.pointerId))drag.handle.releasePointerCapture(ev.pointerId);
      if(!drag.active)return;ev.preventDefault();
      if(target)attempt(()=>{move(hooks.getState(),drag.day,drag.index,+target.dataset.dropDay,target.dataset.dropSlot);moving=null;hooks.changed();announce(`Meal moved to Day ${+target.dataset.dropDay+1} · ${target.dataset.dropSlot}. Existing meals are kept.`);});
      else announce('Drop in a meal block to move it. Your meal stayed in place.');
    });
    board.addEventListener('pointercancel',()=>{pointerDrag=null;clearDropHighlights();});
    board.addEventListener('lostpointercapture',()=>{if(pointerDrag){pointerDrag=null;clearDropHighlights();}});
    document.addEventListener('dragstart',ev=>{if(pointerDrag){ev.preventDefault();return;}const card=ev.target.closest('[data-meal-day]'),menu=ev.target.closest('[data-menu-recipe]');if(!card&&!menu)return;if(ev.target.closest('input')||(card&&hooks.getState().plan[+card.dataset.mealDay][+card.dataset.mealIndex].eaten)){ev.preventDefault();return;}const payload=card?{day:+card.dataset.mealDay,index:+card.dataset.mealIndex}:{recipe:menu.dataset.menuRecipe};ev.dataTransfer.setData('application/x-crave-meal',JSON.stringify(payload));ev.dataTransfer.effectAllowed=card?'move':'copy';});
    board.addEventListener('dragover',ev=>{const block=ev.target.closest('[data-drop-day]');if(block&&Array.from(ev.dataTransfer.types).includes('application/x-crave-meal')){ev.preventDefault();ev.dataTransfer.dropEffect=ev.dataTransfer.effectAllowed==='copy'?'copy':'move';block.classList.add('drag-over');}});
    document.addEventListener('dragend',clearDropHighlights);
    board.addEventListener('dragleave',ev=>ev.target.closest('[data-drop-day]')?.classList.remove('drag-over'));
    board.addEventListener('drop',ev=>{const block=ev.target.closest('[data-drop-day]');if(!block)return;ev.preventDefault();block.classList.remove('drag-over');attempt(()=>{const payload=JSON.parse(ev.dataTransfer.getData('application/x-crave-meal')),d=+block.dataset.dropDay,slot=block.dataset.dropSlot;if(payload.recipe){addRecipe(payload.recipe,{day:d,slot});return;}move(hooks.getState(),payload.day,payload.index,d,slot);moving=null;hooks.changed();announce(`Meal moved to Day ${d+1} · ${slot}. Existing meals are kept.`);});});
    $('cancel-move').addEventListener('click',()=>{moving=null;render();announce('Move cancelled.');});
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&moving){moving=null;render();announce('Move cancelled.');}});
  }
  root.CraveWeek={install,render,addRecipe};
})(globalThis);
