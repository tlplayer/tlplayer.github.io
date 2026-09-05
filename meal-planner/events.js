/* Conversion intent only. No weight, targets, quotes, query strings or identity. */
(function(root){
  'use strict';
  const names=new Set(['recipe_view','add_to_plan','add_to_shopping_list','click_restaurant','click_delivery']);
  const events=[];
  function track(name,details={}){
    if(!names.has(name))return;
    const event={event:name,timestamp:new Date().toISOString()};
    if(MealData.menu.some(m=>m.recipe===details.recipe))event.recipe=details.recipe;
    else if(MealEngine.recipeMap[details.recipe])event.recipe=details.recipe;
    if(['make','buy'].includes(details.choice))event.choice=details.choice;
    if(['restaurant','doordash','ubereats'].includes(details.provider))event.provider=details.provider;
    if(['decision','planner','shopping'].includes(details.placement))event.placement=details.placement;
    events.push(event);if(events.length>1000)events.shift();
    root.dispatchEvent(new CustomEvent('craveplan:event',{detail:{...event}}));
  }
  root.CraveEvents={track,read:()=>events.map(e=>({...e})),clear:()=>{events.length=0;}};
})(window);
