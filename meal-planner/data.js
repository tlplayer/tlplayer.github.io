/* Original home recipes and illustrative ingredient estimates; not restaurant nutrition. */
(function (root) {
  'use strict';
  // Nutrients are per 100 g unless unit is each. Prices are editable sample USD package prices.
  const items = [
    ['chicken','Chicken breast, raw','g',120,22.5,0,2.6,0,900,7.5,'Meat & fish',[]],
    ['beef','Lean ground beef, raw','g',172,21,0,9,0,454,5.5,'Meat & fish',[]],
    ['tuna','Tuna, canned and drained','g',116,26,0,1,0,113,1.2,'Meat & fish',['fish']],
    ['salmon','Salmon, raw','g',208,20,0,13,0,454,9,'Meat & fish',['fish']],
    ['egg','Eggs','each',72,6.3,0.4,4.8,0,12,3.2,'Dairy & eggs',['egg']],
    ['yogurt','Plain nonfat Greek yogurt','g',59,10,3.6,0.4,0,907,5,'Dairy & eggs',['milk']],
    ['cheese','Cheddar cheese','g',403,25,1.3,33,0,227,2.3,'Dairy & eggs',['milk']],
    ['feta','Feta cheese','g',265,14,4,21,0,170,3,'Dairy & eggs',['milk']],
    ['tofu','Firm tofu, drained','g',144,17,3,9,2,396,2.2,'Plant proteins',['soy']],
    ['beans','Black beans, cooked and drained','g',132,8.9,24,0.5,8.7,255,0.9,'Pantry',[]],
    ['chickpeas','Chickpeas, cooked and drained','g',164,8.9,27,2.6,7.6,255,0.9,'Pantry',[]],
    ['rice','White rice, dry','g',365,7,80,0.7,1.3,907,2.4,'Pantry',[]],
    ['oats','Rolled oats, dry','g',379,13,68,6.5,10,510,2.5,'Pantry',[]],
    ['pasta','Whole-wheat pasta, dry','g',350,14,70,2.5,8,454,1.7,'Pantry',['wheat']],
    ['tortilla','Large flour tortillas (about 65 g)','each',210,6,35,5,2,8,2.4,'Bread & grains',['wheat']],
    ['cornTortilla','Small corn tortillas (about 25 g)','each',52,1.4,11,0.7,1.5,20,2.3,'Bread & grains',[]],
    ['bun','Burger buns','each',150,5,28,2,1,8,2,'Bread & grains',['wheat']],
    ['muffin','English muffins','each',130,5,25,1,1.5,6,2.2,'Bread & grains',['wheat']],
    ['bread','Whole-wheat bread slices','each',80,4,14,1,2,20,2.2,'Bread & grains',['wheat']],
    ['pita','Whole-wheat pita breads','each',165,6,33,1.5,4,6,2.5,'Bread & grains',['wheat']],
    ['potato','Potatoes, raw','g',77,2,17,0.1,2.2,2268,4,'Produce',[]],
    ['lettuce','Romaine lettuce','g',17,1.2,3.3,0.3,2.1,300,2,'Produce',[]],
    ['tomato','Tomatoes','g',18,0.9,3.9,0.2,1.2,454,1.8,'Produce',[]],
    ['onion','Onions','g',40,1.1,9.3,0.1,1.7,907,2,'Produce',[]],
    ['pepper','Bell peppers','g',31,1,6,0.3,2.1,450,2.5,'Produce',[]],
    ['broccoli','Broccoli florets','g',34,2.8,7,0.4,2.6,340,1.5,'Produce',[]],
    ['spinach','Spinach','g',23,2.9,3.6,0.4,2.2,227,2,'Produce',[]],
    ['cucumber','Cucumber','g',15,0.7,3.6,0.1,0.5,300,0.8,'Produce',[]],
    ['avocado','Avocado flesh','g',160,2,8.5,14.7,6.7,150,1,'Produce',[]],
    ['banana','Bananas, peeled','g',89,1.1,23,0.3,2.6,600,1.5,'Produce',[]],
    ['berries','Mixed berries, frozen','g',50,0.7,12,0.3,4,454,3,'Produce',[]],
    ['cauliflower','Cauliflower rice','g',25,2,5,0.3,2,340,2,'Produce',[]],
    ['oil','Olive oil','g',884,0,0,100,0,455,6,'Pantry',[]],
    ['almonds','Almonds','g',579,21,22,50,12,227,3.5,'Pantry',['tree nuts']],
    ['peanut','Peanut butter','g',588,25,20,50,6,454,2,'Pantry',['peanuts']],
    ['chia','Chia seeds','g',486,17,42,31,34,340,4,'Pantry',[]],
    ['soyMilk','Unsweetened soy milk','g',33,3,1.7,1.8,0.5,946,2.2,'Plant proteins',['soy']],
    ['salsa','Tomato salsa','g',36,1,7,0.2,1.5,454,1.8,'Sauces',[]],
    ['pickles','Dill pickles','g',12,0.5,2.4,0.2,1,454,2,'Sauces',[]],
    ['mayo','Mayonnaise','g',680,1,1,75,0,340,2.5,'Sauces',['egg']],
    ['mustard','Yellow mustard','g',66,4,6,4,3,227,1,'Sauces',[]],
    ['soySauce','Soy sauce','g',53,8,5,0.6,0,444,1.8,'Sauces',['soy','wheat']],
    ['orange','Orange juice','g',45,0.7,10,0.2,0.2,946,2.5,'Produce',[]],
    ['honey','Honey','g',304,0,82,0,0,340,3,'Pantry',[]],
    ['starch','Cornstarch','g',381,0.3,91,0.1,0.9,454,1.8,'Pantry',[]],
    ['flour','All-purpose flour','g',364,10,76,1,2.7,907,1.6,'Pantry',['wheat']],
    ['seasoning','Salt-free taco seasoning','g',250,8,45,6,15,70,1.3,'Pantry',[]],
    ['milk','Whole milk','g',61,3.2,4.8,3.3,0,946,1.8,'Dairy & eggs',['milk']],
    ['parmesan','Parmesan cheese','g',431,38,4,29,0,142,3.5,'Dairy & eggs',['milk']],
    ['butter','Butter','g',717,0.9,0.1,81,0,454,4,'Dairy & eggs',['milk']]
  ];
  const ingredients = Object.fromEntries(items.map(([id,name,unit,kcal,protein,carbs,fat,fiber,pack,price,aisle,allergens]) => [id,{id,name,unit,kcal,protein,carbs,fat,fiber,pack,price,aisle,allergens}]));
  const recipes=[];
  const add=(id,name,emoji,slots,diets,prep,cook,parts,steps,brand='')=>recipes.push({id,name,emoji,slots,diets,prep,cook,parts:Object.entries(parts).map(([id,qty])=>({id,qty})),steps,brand});
  const plant=['vegetarian','vegan','mediterranean'];
  const veg=['vegetarian','mediterranean'];
  const low=['low-carb','keto'];
  add('overnight-oats','Peanut butter overnight oats','🥣',['breakfast'],plant,5,0,{oats:65,soyMilk:180,banana:100,peanut:20,chia:8},['Stir oats, soy milk, peanut butter and chia in a covered container.','Refrigerate at least 4 hours or overnight (not included in the 5-minute active time).','Slice the banana over the oats before serving.']);
  add('yogurt-bowl','Berry crunch yogurt bowl','🫐',['breakfast'],veg,5,0,{yogurt:250,oats:45,berries:100,almonds:20},['Spoon the yogurt into a bowl.','Top with oats, berries and chopped almonds. Use thawed berries if preferred.']);
  add('egg-toast','Egg & avocado toast','🥑',['breakfast'],veg,5,8,{egg:2,bread:2,avocado:60,tomato:80,oil:3},['Toast the bread and mash the avocado onto it.','Heat oil in a pan; cook the eggs until whites and yolks are firm.','Add sliced tomato and eggs to the toast.']);
  add('tofu-scramble','Tofu breakfast skillet','🍳',['breakfast'],[...plant,'low-carb','keto'],6,10,{tofu:200,spinach:60,pepper:60,avocado:80,oil:8,seasoning:3},['Drain and crumble the tofu. Chop the pepper.','Heat oil, soften the pepper for 4 minutes, then add tofu and seasoning.','Cook for 5 minutes, stir in spinach until wilted, and serve with avocado.']);
  add('egg-skillet','Spinach & cheese egg skillet','🍳',['breakfast'],['vegetarian',...low],5,10,{egg:3,spinach:70,cheese:30,avocado:60,oil:5},['Warm oil in a skillet and wilt the spinach.','Add beaten eggs and cheese. Cook gently until the egg mixture reaches 160°F / 71°C.','Serve with sliced avocado.']);
  add('chia-bowl','Almond berry chia bowl','🥣',['breakfast'],[...plant,...low],5,0,{chia:35,soyMilk:220,almonds:30,berries:50,peanut:15},['Whisk chia and peanut butter into soy milk.','Chill at least 4 hours or overnight; this waiting time is separate from prep time.','Top with almonds and berries.']);
  add('chicken-rice','Chicken, rice & broccoli','🍚',['lunch','dinner'],['mediterranean'],8,22,{chicken:170,rice:75,broccoli:150,oil:10,seasoning:4},['Cook the dry rice according to its package directions.','Cut chicken into even pieces. Sauté in half the oil with seasoning until the center reaches 165°F / 74°C.','Steam broccoli until tender and serve with the rice and remaining oil.']);
  add('chickpea-pita','Chickpea garden pita','🥙',['lunch','dinner'],plant,12,0,{chickpeas:170,pita:1,cucumber:80,tomato:80,lettuce:30,oil:12},['Rinse and drain the chickpeas; chop the vegetables.','Mash half the chickpeas with olive oil, then fold in the rest.','Fill the pita with chickpeas and vegetables.']);
  add('bean-rice','Black bean burrito bowl','🥗',['lunch','dinner'],plant,8,20,{beans:180,rice:65,pepper:100,salsa:70,avocado:60,oil:5},['Cook the dry rice according to the package.','Sauté sliced pepper in oil; add drained beans and heat through.','Build a bowl with rice, beans, salsa and sliced avocado.']);
  add('med-pasta','Mediterranean chickpea pasta','🍝',['lunch','dinner'],plant,8,15,{pasta:85,chickpeas:100,tomato:140,spinach:60,oil:12},['Boil the pasta according to package directions.','Warm olive oil, chopped tomatoes and drained chickpeas in a second pan.','Fold in spinach and drained pasta, adding a little pasta water if needed.']);
  add('salmon-plate','Salmon & avocado greens','🐟',['lunch','dinner'],['mediterranean',...low],8,15,{salmon:180,broccoli:180,avocado:90,oil:10},['Heat the oven to 400°F / 204°C. Place salmon and broccoli on a tray and brush with oil.','Roast about 12–15 minutes, until fish reaches 145°F / 63°C; thickness changes the time.','Serve with avocado.']);
  add('tofu-greens','Sesame-free tofu & greens','🥬',['lunch','dinner'],[...plant,...low],8,12,{tofu:250,broccoli:150,spinach:80,oil:15,soySauce:12,almonds:20},['Press excess water from tofu, then cut into cubes.','Pan-fry in olive oil for 8 minutes, turning until lightly golden.','Add chopped broccoli, spinach and a splash of water. Cover until tender; finish with soy sauce and almonds.']);
  add('chicken-salad','Chicken avocado salad','🥗',['lunch','dinner'],['mediterranean',...low],8,12,{chicken:200,avocado:100,lettuce:100,cucumber:100,oil:15,mustard:10},['Cut chicken into strips and cook in half the oil until the thickest piece reaches 165°F / 74°C.','Chop lettuce, cucumber and avocado.','Whisk remaining oil with mustard and a little water. Toss with the salad and chicken.']);
  add('tuna-salad','Tuna & crunchy cucumber bowl','🥒',['lunch','dinner'],['mediterranean',...low],10,0,{tuna:170,cucumber:120,lettuce:80,avocado:100,oil:15,almonds:20},['Drain tuna and chop the vegetables.','Combine in a bowl with avocado, olive oil and almonds.','Toss gently and serve immediately.']);
  add('egg-salad','Egg salad lettuce boats','🥬',['lunch','dinner'],['vegetarian',...low],8,12,{egg:3,lettuce:100,avocado:90,mayo:20,mustard:10,cucumber:100},['Hard-boil eggs until whites and yolks are firm, then cool and peel.','Chop eggs and combine with mayonnaise and mustard.','Spoon into lettuce leaves; serve with cucumber and avocado.']);
  add('yogurt-snack','Greek yogurt & berries','🫐',['snack'],veg,3,0,{yogurt:180,berries:100,almonds:10},['Spoon yogurt into a bowl and top with berries and chopped almonds.']);
  add('banana-snack','Banana & peanut butter','🍌',['snack'],plant,2,0,{banana:120,peanut:25},['Slice the banana and serve with peanut butter.']);
  add('almond-snack','Almonds & cucumber','🥒',['snack'],[...plant,...low],3,0,{almonds:35,cucumber:120},['Portion the almonds and slice the cucumber.']);
  add('avocado-snack','Avocado salsa cup','🥑',['snack'],[...plant,...low],4,0,{avocado:120,salsa:40},['Dice avocado and fold in the salsa. Serve in a small bowl.']);
  add('cheese-snack','Cheddar & cucumber plate','🧀',['snack'],['vegetarian',...low],3,0,{cheese:45,cucumber:120,almonds:15},['Slice cheddar and cucumber; serve with almonds.']);
  add('tofu-snack','Golden tofu & cucumber bites','🥒',['snack'],[...plant,...low],4,8,{tofu:160,cucumber:100,soySauce:8,oil:3},['Drain tofu and cut it into small cubes.','Warm oil in a nonstick pan and cook tofu, turning, until heated through and lightly golden, about 8 minutes. Follow any additional cooking instructions on its package.','Toss with soy sauce and serve with sliced cucumber.']);
  add('crunchwrap','Crunchwrap-style crispy wrap','🌮',['lunch','dinner'],[],10,12,{beef:100,tortilla:1,cornTortilla:1,cheese:20,yogurt:25,lettuce:25,tomato:40,seasoning:4,oil:3},['Toast the corn tortilla in a dry pan until crisp. Brown beef with seasoning to 160°F / 71°C.','Warm the flour tortilla. Layer beef, cheese, crisp corn tortilla, yogurt, lettuce and tomato in the center.','Fold edges inward into a tight packet. Brush a pan with oil and toast seam-side down, then flip, until both sides are golden.'], 'Taco Bell');
  add('big-mac','Big Mac-style double burger','🍔',['lunch','dinner'],[],10,12,{beef:140,bun:1,cheese:20,lettuce:25,pickles:25,onion:20,mayo:12,mustard:8},['Mix mayonnaise, mustard and finely chopped pickles into a sauce.','Shape beef into two thin patties. Cook in a hot pan until each reaches 160°F / 71°C; melt cheese on top.','Toast the bun and assemble with sauce, onion, lettuce and the patties. This home version uses one bun.'], "McDonald's");
  add('chipotle-bowl','Chipotle-style chicken bowl','🥑',['lunch','dinner'],[],10,25,{chicken:160,rice:65,beans:100,pepper:80,salsa:70,avocado:50,oil:6,seasoning:5},['Cook dry rice according to its package directions.','Season chicken; pan-cook with oil until it reaches 165°F / 74°C. Slice after a short rest.','Soften pepper in the same pan and warm the beans. Assemble over rice with salsa and avocado.'], 'Chipotle');
  add('crispy-chicken','Chick-fil-A-style chicken sandwich','🥪',['lunch','dinner'],[],12,18,{chicken:160,bun:1,flour:25,egg:0.5,pickles:30,oil:8,mayo:10},['Heat oven to 425°F / 218°C. Pound chicken to an even thickness.','Dip chicken in beaten egg, then coat with flour. Brush with oil and place on a lined tray.','Bake approximately 18 minutes, turning once, until the center reaches 165°F / 74°C. Assemble on a toasted bun with pickles and mayonnaise.'], 'Chick-fil-A');
  add('orange-chicken','Panda-style orange chicken bowl','🍊',['lunch','dinner'],[],10,20,{chicken:170,rice:70,broccoli:100,orange:80,honey:15,soySauce:12,starch:10,oil:8},['Cook the dry rice. Mix orange juice, honey, soy sauce and half the starch with a spoonful of water.','Toss chicken pieces with remaining starch and pan-fry in oil until they reach 165°F / 74°C.','Add the sauce and simmer until thickened. Steam broccoli and serve everything over rice.'], 'Panda Express');
  add('teriyaki-sub','Subway-style teriyaki chicken pita','🥙',['lunch','dinner'],[],8,14,{chicken:170,pita:1,lettuce:40,tomato:60,onion:30,soySauce:15,honey:15,oil:6},['Cut chicken into strips. Cook in oil until the center reaches 165°F / 74°C.','Add soy sauce, honey and a splash of water, simmering until the chicken is glazed.','Warm the pita, split it open and fill with chicken and sliced vegetables.'], 'Subway');
  add('mcmuffin','Egg McMuffin-style breakfast sandwich','🍳',['breakfast'],['vegetarian'],5,8,{muffin:1,egg:2,cheese:20,tomato:40,oil:3},['Split and toast the English muffin.','Cook the eggs in oil until whites and yolks are firm.','Layer eggs, cheese and tomato into the muffin. This vegetarian home version omits the meat.'], "McDonald's");
  add('quesadilla','Taco Bell-style chicken quesadilla','🫓',['lunch','dinner'],[],8,14,{chicken:130,tortilla:1,cheese:35,yogurt:30,salsa:35,seasoning:3,oil:4},['Cook sliced chicken with seasoning and half the oil to 165°F / 74°C. Mix yogurt and salsa for the sauce.','Fill half the tortilla with chicken, cheese and sauce; fold it closed.','Toast in the remaining oil for 2–3 minutes per side until golden.'], 'Taco Bell');
  add('pizza','Pizza-shop margherita pita','🍕',['lunch','dinner'],['vegetarian'],7,12,{pita:1,tomato:120,cheese:60,spinach:25,oil:5},['Heat oven to 425°F / 218°C. Mash half the tomatoes and spread over the pita.','Add cheese, remaining sliced tomatoes, spinach and olive oil.','Bake about 10–12 minutes until the cheese bubbles and the edges crisp.'], 'Pizza-shop favorite');
  add('fries','Drive-through-style oven fries','🍟',['snack'],plant,8,30,{potato:250,oil:10,seasoning:3},['Heat oven to 425°F / 218°C. Cut potatoes into even thin sticks and dry them well.','Toss with oil and seasoning; spread in one layer on a large tray.','Bake about 30 minutes, flipping halfway, until golden and tender.'], 'Drive-through favorite');
  add('veggie-crunch','Black bean Crunchwrap-style wrap','🌮',['lunch','dinner'],plant,10,10,{beans:160,tortilla:1,cornTortilla:1,avocado:50,lettuce:30,salsa:50,oil:3,seasoning:3},['Toast the corn tortilla until crisp. Warm and lightly mash beans with seasoning.','Layer beans, corn tortilla, avocado, lettuce and salsa in the center of the warm flour tortilla.','Fold into a sealed packet. Toast seam-side down in oil, then flip until crisp.'], 'Taco Bell-inspired');
  add('nuggets','Chick-fil-A-style baked nuggets','🍗',['lunch','dinner'],[],12,15,{chicken:180,flour:25,egg:0.5,pickles:25,oil:6,mustard:10,honey:10},['Heat the oven to 425°F / 218°C. Cut chicken into evenly sized bites.','Coat chicken in beaten egg, then flour. Brush with oil and spread on a lined tray.','Bake for about 15 minutes, turning halfway, until each piece reaches 165°F / 74°C. Mix mustard and honey for dipping; serve with pickles.'], 'Chick-fil-A');
  add('chicken-alfredo','Olive Garden-style chicken Alfredo','🍝',['lunch','dinner'],[],10,20,{chicken:150,pasta:90,milk:120,parmesan:30,butter:10,broccoli:100},['Boil pasta according to the package. Add broccoli for the final few minutes, then drain and keep a little pasta water.','Cut chicken into strips. Cook in half the butter until the center reaches 165°F / 74°C.','Warm milk and remaining butter over low heat. Stir in Parmesan off the heat, adding pasta water as needed for a smooth sauce. Toss with pasta, broccoli and chicken.'], 'Olive Garden');
  add('chicken-crispers',"Chili’s-style honey chicken crispers",'🍗',['lunch','dinner'],[],12,18,{chicken:180,flour:30,egg:0.5,oil:7,honey:15,mustard:12,seasoning:3,cucumber:100},['Heat oven to 425°F / 218°C. Cut chicken into thick strips. Mix flour and seasoning in a shallow bowl.','Dip strips in beaten egg, then flour. Brush with oil and bake on a lined tray for about 18 minutes, until the center reaches 165°F / 74°C.','Mix honey and mustard as a dipping sauce. Serve with cucumber. This home version is baked and does not include the restaurant’s combo sides.'], "Chili's");
  // Curated restaurant favorites; order is editorial, not a measured sales ranking.
  const menu = [
    {recipe:'big-mac',item:'Big Mac',restaurant:"McDonald's",source:'https://www.mcdonalds.com/us/en-us/full-menu.html'},
    {recipe:'crispy-chicken',item:'Chicken Sandwich',restaurant:'Chick-fil-A',source:'https://www.chick-fil-a.com/customer-support/our-food/our-menu/what-type-of-food-does-chick-fil-a-have-on-its-menu'},
    {recipe:'nuggets',item:'Chicken Nuggets',restaurant:'Chick-fil-A',source:'https://www.chick-fil-a.com/customer-support/our-food/our-menu/what-type-of-food-does-chick-fil-a-have-on-its-menu'},
    {recipe:'crunchwrap',item:'Crunchwrap Supreme',restaurant:'Taco Bell',source:'https://www.tacobell.com/food/specialties/crunchwrap-supreme'},
    {recipe:'chipotle-bowl',item:'Chicken Burrito Bowl',restaurant:'Chipotle',source:'https://www.chipotle.com/high-protein-meals'},
    {recipe:'orange-chicken',item:'The Original Orange Chicken',restaurant:'Panda Express',source:'https://www.pandaexpress.com/nutritioninformation'},
    {recipe:'chicken-alfredo',item:'Chicken Alfredo',restaurant:'Olive Garden',source:'https://www.olivegarden.com/alfredo-sauce'},
    {recipe:'chicken-crispers',item:'Chicken Crispers',restaurant:"Chili's",source:'https://www.chilis.com/crispers'},
    {recipe:'mcmuffin',item:'Egg McMuffin',restaurant:"McDonald's",source:'https://www.mcdonalds.com/us/en-us/full-menu.html'},
    {recipe:'teriyaki-sub',item:'Sweet Onion Teriyaki',restaurant:'Subway',source:'https://newsroom.subway.com/Subway-Expands-Record-Setting-Subway-Series-Menu-for-the-First-Time-Adding-All-New-Sandwiches-and-Updating-Classics'},
    {recipe:'quesadilla',item:'Chicken Quesadilla',restaurant:'Taco Bell',source:'https://www.tacobell.com/food'},
    {recipe:'fries',item:'World Famous Fries',restaurant:"McDonald's",source:'https://www.mcdonalds.com/us/en-us/full-menu.html'},
    {recipe:'veggie-crunch',item:'Black Bean Crunchwrap',restaurant:'Taco Bell',source:'https://www.tacobell.com/food'},
    {recipe:'pizza',item:'Margherita Pizza',restaurant:'Pizza-shop favorites',source:''}
  ];
  const activities = [
    {id:'walk-easy',name:'Easy walk · 2.0–2.4 mph',met:2.8,code:'17152',source:'walking'},
    {id:'walk',name:'Level walk · about 3 mph',met:3.8,code:'17190',source:'walking'},
    {id:'walk-brisk',name:'Brisk walk · 3.5–3.9 mph',met:4.8,code:'17200',source:'walking'},
    {id:'bike-easy',name:'Cycling · under 10 mph',met:4,code:'01010',source:'bicycling'},
    {id:'bike',name:'Cycling · 10–11.9 mph',met:6.8,code:'01020',source:'bicycling'},
    {id:'bike-moderate',name:'Cycling · 12–13.9 mph',met:8,code:'01030',source:'bicycling'},
    {id:'jog',name:'Jogging · self-selected pace',met:7.5,code:'12020',source:'running'},
    {id:'run-5',name:'Running · 5.0–5.2 mph',met:8.5,code:'12030',source:'running'},
    {id:'run-6',name:'Running · 6.0–6.3 mph',met:9.3,code:'12050',source:'running'},
    {id:'run-7',name:'Running · 7 mph',met:11,code:'12070',source:'running'},
    {id:'run-9',name:'Running · 9 mph',met:13,code:'12110',source:'running'},
    {id:'weights',name:'Weight training · varied resistance',met:3.5,code:'02054',source:'conditioning-exercise'},
    {id:'weights-vigorous',name:'Weight training · vigorous',met:6,code:'02050',source:'conditioning-exercise'},
    {id:'row',name:'Stationary rowing · under 100 W',met:5,code:'02071',source:'conditioning-exercise'},
    {id:'row-vigorous',name:'Stationary rowing · 100–149 W',met:7.5,code:'02072',source:'conditioning-exercise'},
    {id:'rope',name:'Jump rope · general',met:11,code:'02068',source:'conditioning-exercise'},
    {id:'swim',name:'Freestyle laps · slow, recreational',met:5.8,code:'18240',source:'water-activities'},
    {id:'yoga',name:'Hatha yoga',met:2.3,code:'02150',source:'conditioning-exercise'}
  ];
  root.MealData={ingredients,recipes,activities,menu};
})(globalThis);
