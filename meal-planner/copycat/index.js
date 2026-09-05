/* global CraveMenu, Ops */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  $('menu-restaurant').innerHTML='<option value="">All restaurants</option>'+CraveMenu.restaurants.map(name=>`<option value="${Ops.escape(name)}">${Ops.escape(name)}</option>`).join('');
  function render(){
    const entries=CraveMenu.select({query:$('menu-search').value,restaurant:$('menu-restaurant').value});
    $('copycat-menu').innerHTML=CraveMenu.render(entries,{link:true});
    $('menu-count').textContent=`${entries.length} ${entries.length===1?'menu item':'menu items'} · Calories, prices and times below describe the home recipe.`;
  }
  $('menu-search').addEventListener('input',render);
  $('menu-restaurant').addEventListener('change',render);
  render();
})();
