# CravePlan

Static meal and activity planner at `/meal-planner/`, with a copycat menu at `/meal-planner/copycat/`. No build step or application backend. Serve the repository with `python3 -m http.server 8000` for local use.

Both pages use a dark screen theme; printed plans retain a light background. The recipe search opens as a restaurant-menu list with dish names, restaurant filters, original home-recipe estimates, and links to the restaurant references. `menu.js` shares filtering and row rendering across the planner and standalone index.

The default shortlist is curated from popular or signature restaurant dishes, not measured user-selection counts or a cross-chain sales ranking. Sources include [Chick-fil-A's popular menu items](https://www.chick-fil-a.com/customer-support/our-food/our-menu/what-type-of-food-does-chick-fil-a-have-on-its-menu), [Olive Garden's Alfredo favorites](https://www.olivegarden.com/alfredo-sauce), and [Chili's Chicken Crispers](https://www.chilis.com/crispers). Each restaurant entry carries its reference URL in `data.js`. Recipe variants can differ from the named restaurant dish; the menu list labels its home estimates. Opening an item shows separate make and buy values, with source links and explicit portion differences.

## Choosing the week

The menu comes first. A new week contains seven empty days and no generated meals. Breakfast, lunch, dinner and snack tabs filter the available menu. Selecting a meal lets the user choose a starting day, number of consecutive days, and servings per person. The preview shows affected days, existing choices that will be replaced, and the change to the whole remaining grocery shop. Scheduling is atomic: an invalid range or full day leaves all previous choices intact.

Users can leave any slots open, choose a replacement themselves, and mark individual meals eaten or undo that progress. There is no automatic swap or generation API. Saving preferences preserves choices and progress. Shortening a week is blocked when it would silently remove chosen meals or logged activities. Eating-style filters are optional menu filters; changing preferences never overwrites the user's food choices. Notes do not treat an unfinished day as a calorie or protein deficit.

## Shopping across days

For example, choosing overnight oats for five breakfasts produces five day entries and a single combined shopping list. All ingredient quantities, including ingredients shared with other meals, are added **before** package rounding. Per-serving ingredient cost is consumed value, not a separate package purchase per meal.

`purchased` records whole packages already bought this week. Later choices use the available package capacity; only packages beyond that capacity increase the remaining shop. The list shows quantity needed across the week, packages bought, additional packages needed, and leftovers. Bought inventory stays visible even if its last planned meal is removed. Marking a meal eaten retains its ingredient allocation so already-consumed food is not mistakenly available again. The pantry checkbox covers the entire required ingredient quantity from other supplies.

Purchased quantities and meal progress survive JSON save/restore. Old saved grocery checkmarks migrate into package counts. Menu CSV includes `progress`; shopping CSV includes `packages_already_bought` and remaining `packages_to_buy`. Store quotes compare the remaining basket. Budget notes include estimated value of bought packages and remaining purchases, plus restaurant choices. Package values use editable reference prices and are estimates, not a receipt ledger.

The batch summary groups chosen home recipes and meal slots, showing covered days, total household servings and eaten progress. Ingredients-only additions are extra grocery servings outside scheduled meals; their selected day count scales quantities. Remove an extra if later scheduling the same home meal to avoid buying both allocations.

Menu, shopping and activity CSVs, print, and JSON Save/Open remain available. State stays in tab memory until saved; use the downloaded file to continue later. Logged workouts include their body weight. Optional MET activity comparisons, net target credits, restaurant choices and disclosure-aware outbound links remain available.

## Data and limits

Ingredient nutrition is a representative estimate, not verified package nutrition or a direct USDA dataset. Prices, nutrients, quantities, and recipes are defined in `data.js`; the app never fetches live prices or nutrition. Recipe costs use consumed ingredients; grocery checkout rounds up package purchases and subtracts full-ingredient pantry coverage. Cooking totals sum prep and cook times for small batches without assuming overlap or prep-ahead savings. Overnight chilling is described separately in recipe instructions.

Targets are user-selected adult planning inputs, not prescribed weight-loss targets. Supported UI range is 1,200–4,000 kcal per person, 1–8 people, and 1–7 days. Diet labels describe this library's ingredients and preferences, not guaranteed nutritional adequacy, allergen safety, or ketosis. Low-carb uses a 130 g total carbohydrate/day planning threshold, keto style 50 g net; these are software thresholds, not clinical guidance. The menu shows an empty state when no recipes match the selected filters; it never inserts a substitute.

## Sources

Activity MET values and codes were checked against the [2024 Compendium](https://pacompendium.com/): [walking](https://pacompendium.com/walking/), [bicycling](https://pacompendium.com/bicycling/), [running](https://pacompendium.com/running/), [conditioning](https://pacompendium.com/conditioning-exercise/), and [water activities](https://pacompendium.com/water-activities/). The app preserves those source values and links the selected activity to its source. Some values differ from older Compendium editions (for example, the current level walk around 3 mph is 3.8 MET).

Cooking temperature guidance links to [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures). [FoodData Central](https://fdc.nal.usda.gov/) is linked as a lookup resource, not claimed as the provenance of this site's approximate ingredient values.

## Advertising and privacy

Both pages load the shared `construction-calculators/config.js` followed by `construction-calculators/adsense.js`, as requested for the other subsites. AdSense may make third-party requests and use cookies. Planner calculations, exports, and retailer links do not depend on ad delivery. Privacy disclosures are in the planner's method section.

## Checks

Load `data.js`, `engine.js`, and `tests.js` in a browser, then run `runMealTests()`. Results cover empty-week initialization, atomic multi-day selections, preference preservation, progress, purchased-package reuse, shared package arithmetic, pantry handling, MET formulas and saved-plan validation. Core CSV parsing/export safety is shared with the existing operations tools.


## Make versus buy

Every restaurant shortlist entry opens a shareable comparison at `/meal-planner/?recipe=ID`. `commerce.js` maps menu items to official ordering entry points, DoorDash and Uber Eats. Links open provider sites; they do not prefill a cart, guarantee local availability, or place an order. McDonald's uses its official app-ordering instructions. Generic pizza has delivery discovery but no invented chain affiliation.

Three standard US items have prefilled restaurant calories checked on 2026-09-05: [Big Mac](https://www.mcdonalds.com/us/en-us/product/big-mac.html), [Chick-fil-A original sandwich](https://www.chick-fil-a.com/menu/entrees/chick-fil-a-chicken-sandwich), and [8-count nuggets](https://www.chick-fil-a.com/menu/entrees/8-ct-chick-fil-a-nuggets). Other items require calories for the user's actual configuration. Restaurant price and time to food start blank. Enter an all-in price per serving, including allocated fees/tax/tip. Unknown inputs never imply zero price or immediate delivery. Home cost is ingredient consumption; the grocery basket still buys whole packages.

Make/buy comparisons show differences in calories, money and estimated time until food, plus optional activity minutes and workout percentage for each portion. Adding a restaurant meal requires calories and price; its snapshot contributes to daily/weekly calories, household food spending, save/restore, CSV and activity comparisons. It adds no cooking time or groceries. Restaurant macros are unknown (blank in CSV); UI totals show known home-meal macros, and macro-goal judgments are suppressed for affected days. Restaurant meals remain the user’s explicit choices; other slots stay open.

The ingredients-only action creates extra groceries without adding calories to the plan. Extras scale with household size, combine with planned home ingredients, survive save/restore and appear in grocery exports. They are explicitly additional: remove the extra if subsequently scheduling the same home meal. An on-screen list provides individual removal.

## Partnerships and disclosures

No paid restaurant, delivery or grocery partnership is configured. Direct unpaid links work now. Add an **approved** public URL to `commerce-config.js` under the documented provider key, with `paid: true` for a commission relationship. The renderer adds `rel="sponsored"` and the visible text “We may earn a commission if you buy through this link.” immediately beside the link. Store search overrides accept an encoded `{query}` placeholder; shopping CSV includes the resolved URL and a disclosure column for each store. Unsafe URLs or overrides lacking an explicit `paid` boolean fall back to the original unpaid URL. Never put partner secrets here.

Disclosure placement follows the [FTC's endorsement guidance](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking). Configurability does not mean a chain has a public affiliate program or that a partnership exists.

## Intent events

`events.js` emits `recipe_view`, `add_to_plan`, `add_to_shopping_list`, `click_restaurant`, and `click_delivery`. Views fire when a meal opens; each confirmed multi-day selection and ingredients-only action fires one conversion event. Opening the menu to choose a replacement does not count as a meal addition. Imports and preference changes do not count as new user additions. Outbound events measure clicks, not completed orders or earned commissions. Each includes timestamp and applicable recipe ID, make/buy choice, provider and placement. No weight, calories, targets, quotes, search terms, user identity or full URLs are included.

There is **no production analytics destination or server collection configured**. The newest 1,000 events remain in tab memory and can be exported or cleared under Privacy & ads. Closing/reloading clears them. Integrate an existing analytics destination through the `craveplan:event` window CustomEvent, whose `detail` is the allowlisted event payload; update the public privacy text when connecting a collector. `CraveEvents.read()` returns copies for diagnostics. No accounts, credentials, cookies, remote SDKs or unsolicited analytics endpoints were added.

Load `commerce-tests.js` in the planner and run `runCommerceTests()` for source defaults, missing-value comparisons, referral disclosures, URL validation and event payload checks. `tests.js` additionally checks restaurant snapshots, food budgets, shopping exclusion, extra grocery arithmetic and import validation.
