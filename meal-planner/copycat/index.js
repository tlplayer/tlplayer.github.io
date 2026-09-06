/* global CraveMenu, Ops */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  $('menu-restaurant').innerHTML='<option value="">All restaurants</option>'+CraveMenu.restaurants.map(name=>`<option value="${Ops.escape(name)}">${Ops.escape(name)}</option>`).join('');
  let category='';
  $('food-categories').innerHTML=CraveMenu.navigation('',{copycat:true,controls:'copycat-menu'});
  $('food-categories').addEventListener('click',ev=>{const b=ev.target.closest('[data-food-category]');if(b){category=b.dataset.foodCategory;render();}});
  $('clear-menu-filters').addEventListener('click',()=>{category='';$('menu-search').value='';$('menu-restaurant').value='';render();});
  function render(){
    document.querySelectorAll('[data-food-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.foodCategory===category)));
    const entries=CraveMenu.select({query:$('menu-search').value,restaurant:$('menu-restaurant').value,category});
    $('copycat-menu').innerHTML=CraveMenu.render(entries,{link:true});
    $('menu-count').textContent=`${entries.length} ${entries.length===1?'menu item':'menu items'} · Calories, prices and times below describe the home recipe.`;
  }
  $('menu-search').addEventListener('input',render);
  $('menu-restaurant').addEventListener('change',render);
  render();
})();
