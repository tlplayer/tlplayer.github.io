# CravePlan

Static meal and activity planner at `/meal-planner/`, with a copycat menu at `/meal-planner/copycat/`. No build step or application backend. Serve the repository with `python3 -m http.server 8000` for local use.

Both pages use a dark screen theme; printed plans retain a light background. The recipe search opens as a restaurant-menu list with dish names, restaurant filters, original home-recipe estimates, and links to the restaurant references. `menu.js` shares filtering and row rendering across the planner and standalone index.

The default shortlist is curated from popular or signature restaurant dishes, not measured user-selection counts or a cross-chain sales ranking. Sources include [Chick-fil-A's popular menu items](https://www.chick-fil-a.com/customer-support/our-food/our-menu/what-type-of-food-does-chick-fil-a-have-on-its-menu), [Olive Garden's Alfredo favorites](https://www.olivegarden.com/alfredo-sauce), and [Chili's Chicken Crispers](https://www.chilis.com/crispers). Each restaurant entry carries its reference URL in `data.js`. Recipe variants can differ from the named restaurant dish; displayed nutrition, cost and timing always refer to the home version.

## Features

- Seven eating styles, dairy-free ingredient filtering, per-person calorie/protein preferences, household grocery budget, and daily cooking-time preferences.
- Deterministic beam search through an original recipe library. Ingredient reuse, cost, cooking time, variety, and calorie/protein proximity influence the result. It is a heuristic, not an exact constraint optimizer. Missed targets are reported. Pinned meals survive rebuilding; incompatible pins reject a diet change.
- Copycat recipes inspired by Taco Bell, McDonald's, Chipotle, Chick-fil-A, Panda Express, Subway, and pizza/drive-through favorites. These are independent home recipes, not official restaurant recipes, prices, or nutrition. Each includes ingredient amounts, prep/cook time, method, and common-allergen notes.
- Recipe replacement, extra meals, portion changes, nutrition totals, and a full-period overview. Household scaling affects shopping, while calories and logged activity remain per person.
- Combined shopping quantities, whole-package rounding, pantry coverage, checklist, editable reference prices, and per-store package quotes. Walmart, Kroger, and Target links open searches only. Store totals distinguish partial quotes from complete baskets. Package sizes use edible/drained yield where stated. Sample prices are illustrative USD values, not live offers.
- MET activity comparisons show kcal/min, equivalent duration, and workout energy as a percentage of any meal. Gross uses `MET × 3.5 × kg / 200`; net uses `max(MET − 1, 0)`. Percentages above 100 remain visible numerically. Activities are optional; default food-target credit is zero. Optional 50%/100% credit uses net energy and influences targets on rebuilding.
- Menu, activity, and shopping CSV exports; full-menu/shopping print view; JSON plan save/open. Data stays in tab memory until exported. Saved workout entries include the body weight used for that entry. Comparison controls are not part of the saved plan. Imports are validated before replacing state.

## Data and limits

Ingredient nutrition is a representative estimate, not verified package nutrition or a direct USDA dataset. Prices, nutrients, quantities, and recipes are defined in `data.js`; the app never fetches live prices or nutrition. Recipe costs use consumed ingredients; grocery checkout rounds up package purchases and subtracts full-ingredient pantry coverage. Cooking totals sum prep and cook times for small batches without assuming overlap or prep-ahead savings. Overnight chilling is described separately in recipe instructions.

Targets are user-selected adult planning inputs, not prescribed weight-loss targets. Supported UI range is 1,200–4,000 kcal per person, 1–8 people, and 1–7 days. Diet labels describe this library's ingredients and preferences, not guaranteed nutritional adequacy, allergen safety, or ketosis. Low-carb uses a 130 g total carbohydrate/day planning threshold, keto style 50 g net; these are software thresholds, not clinical guidance. If a future recipe library change leaves no match for a meal slot, the builder reports the missing match instead of violating the filter.

## Sources

Activity MET values and codes were checked against the [2024 Compendium](https://pacompendium.com/): [walking](https://pacompendium.com/walking/), [bicycling](https://pacompendium.com/bicycling/), [running](https://pacompendium.com/running/), [conditioning](https://pacompendium.com/conditioning-exercise/), and [water activities](https://pacompendium.com/water-activities/). The app preserves those source values and links the selected activity to its source. Some values differ from older Compendium editions (for example, the current level walk around 3 mph is 3.8 MET).

Cooking temperature guidance links to [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures). [FoodData Central](https://fdc.nal.usda.gov/) is linked as a lookup resource, not claimed as the provenance of this site's approximate ingredient values.

## Advertising and privacy

Both pages load the shared `construction-calculators/config.js` followed by `construction-calculators/adsense.js`, as requested for the other subsites. AdSense may make third-party requests and use cookies. Planner calculations, exports, and retailer links do not depend on ad delivery. Privacy disclosures are in the planner's method section.

## Checks

Load `data.js`, `engine.js`, and `tests.js` in a browser, then run `runMealTests()`. Results cover diet constraints, pinned meals, deterministic planning, portions, price changes, package arithmetic, pantry handling, MET formulas, percentages, credits, and saved-plan validation. Core CSV parsing/export safety is shared with the existing operations tools.
