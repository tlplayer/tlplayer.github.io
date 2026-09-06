# CravePlan

Static meal budget and activity planner at `/meal-planner/`, with a copycat menu at `/meal-planner/copycat/`. No build step or application backend. Serve the repository with `python3 -m http.server 8000` for local use.

Both pages use a dark screen theme; printed plans retain a light background. The menu uses a responsive grid of food cards grouped into restaurant-style sections. Category buttons in the menu header filter Breakfast, Burgers & sandwiches, Wraps & quesadillas, Bowls & plates, Pizza & pasta, Salads, Chicken bites, and Snacks & sides. Category, restaurant, text, and meal-time filters combine; Clear filters restores the menu. `menu.js` shares category definitions, filtering and card rendering across the planner and standalone copycat index; `menu-grid.css` controls the layout. Cards retain ingredient cost, calories, preparation time, source links and separate Recipe and Add meal buttons on both pages.

The default shortlist is curated from popular or signature restaurant dishes, not measured user-selection counts or a cross-chain sales ranking. Sources include [Chick-fil-A's popular menu items](https://www.chick-fil-a.com/customer-support/our-food/our-menu/what-type-of-food-does-chick-fil-a-have-on-its-menu), [Olive Garden's Alfredo favorites](https://www.olivegarden.com/alfredo-sauce), and [Chili's Chicken Crispers](https://www.chilis.com/crispers). Each restaurant entry carries its reference URL in `data.js`. Recipe variants can differ from the named restaurant dish; the menu list labels its home estimates. The Recipe button opens expanded ingredients and instructions, followed by separate make and buy values, with source links and explicit portion differences.

## Page layout

The page follows Menu → Plan → Plan analysis. The menu has Recipe and Add meal buttons, followed by the editable weekly board and meal budget. Plan analysis groups meal kcal and cost summaries, leftovers, freshness dates, optional exercise, and shared shopping totals. Header navigation and analysis links follow that order.

## Choosing the week

A new week has seven empty days, each with breakfast, lunch, dinner and optional snack blocks. Clicking Add meal adds one home meal to the next empty matching block; no date chooser or generated menu intervenes. Repeated clicks or ↻ Repeat fill more days with the same choice. Drag a menu card into a specific block, or move existing meals between days and meal types. Dropping onto an occupied block appends without replacing its meals. The ⠿ handle uses pointer capture for mouse, pen and touch; Move → Move here supports tapping and keyboard users; Escape cancels. Filled weeks and full days produce an explicit error without losing meals.

`week-board.js` separates placement operations from nutrition and inventory. Operations remap explicit cooking dates when meal positions change. Copies start uneaten with dates appropriate to their new day. Meals marked eaten must be undone before removal or movement so consumed ingredients stay accounted for. Recipe opens ingredients, instructions and an optional single-meal comparison, and restaurant additions retain their chosen calorie/price snapshots.

Users can leave any slots open, choose a replacement themselves, and mark individual meals eaten or undo that progress. There is no automatic swap or generation API. Saving preferences preserves choices and progress. Shortening a week is blocked when it would silently remove chosen meals or logged activities. Budget edits never overwrite food choices. Notes address food spending; there are no calorie targets, dietary filters, macro goals or cooking-time limits.

## Shopping across days

For example, choosing overnight oats for five breakfasts produces five day entries and a single combined shopping list. Ingredient quantities are combined within each viable purchase/storage window **before** package rounding. Per-serving ingredient cost is consumed value, not a separate package purchase per meal.

`purchased` records whole packages already bought this week. The freshness layer allocates dated batches to preparation dates. Later choices use available package capacity when storage dates fit; expired batches can require replacements. The list shows quantity needed across the week, packages bought, additional packages needed, and leftovers. Bought inventory stays visible even if its last planned meal is removed. Marking a meal eaten retains its ingredient allocation so already-consumed food is not mistakenly available again. The pantry checkbox covers the entire required ingredient quantity from other supplies.

Purchased quantities and meal progress survive JSON save/restore. Old saved grocery checkmarks migrate into package counts. Menu CSV includes `progress`; shopping CSV includes `packages_already_bought` and remaining `packages_to_buy`. Store quotes compare the remaining basket. Budget notes include estimated value of bought packages and remaining purchases, plus restaurant choices. Package values use editable reference prices and are estimates, not a receipt ledger.

The batch summary groups chosen home recipes and meal slots, showing covered days, total household servings and eaten progress. Ingredients-only additions are extra grocery servings outside scheduled meals; servings per person and household size scale quantities. Remove an extra if later scheduling the same home meal to avoid buying both allocations.

Menu, shopping and activity CSVs, print, and JSON Save/Open remain available. State stays in tab memory until saved; use the downloaded file to continue later. Logged workouts include their body weight. MET activity comparisons, workout burn totals, restaurant choices and disclosure-aware outbound links remain available.

## Data and limits

Ingredient nutrition is a representative estimate, not verified package nutrition or a direct USDA dataset. Prices, nutrients, quantities, and recipes are defined in `data.js`; the app never fetches live prices or nutrition. Recipe costs use consumed ingredients; grocery checkout rounds up package purchases and subtracts full-ingredient pantry coverage. Cooking totals sum prep and cook times for small batches without assuming overlap or prep-ahead savings. Overnight chilling is described separately in recipe instructions.

The default food budget is $85 for one person across seven days, editable from $0 to $100,000 per plan. Household size supports 1–8 people and 1–7 days. Spending includes recorded whole packages, remaining date-aware grocery purchases and planned restaurant meals. Daily ingredient/order value is shown separately from checkout spending. Meal kcal, time to expend equivalent energy at the selected MET and weight, and workout percentages remain visible; estimates never add a calorie allowance. Gross and net workout totals update with the comparison basis. Old JSON files load their choices, purchases and workouts while discarding retired diet, calorie-target, protein-goal, cooking-limit and exercise-credit settings.

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


## Freshness calendar and dated exports

`freshness.js` adds date-only purchase batches and a user-selected calendar start, while leaving meal choices under user control. `freshness-ui.js` renders the timeline, dated trips, editable batches, attention list and preparation schedule. The calendar supports a review/as-of date; this changes alert calculations without changing the week. The timeline and trips can be printed to PDF.

Shopping strategies: freeze suitable portions of raw chicken, ground beef or salmon while buying fragile produce later (default); fresh-only trips within storage windows; or one early shop with explicit date conflicts. Rounding happens per viable purchase batch. Extra fresh-only packages and unallocated surplus are visible, and both cart estimates and store quote totals use these quantities. Future recorded stock is considered when sizing earlier purchases. This is a deterministic purchasing aid, not a claim of an optimal shopping route or guaranteed food safety.

Each actual purchase keeps its own package count, purchase/open/label dates, storage, frozen date and fully-thawed date. Record the displayed purchase and storage information only when it happened. Existing aggregate purchased counts migrate to batches with unknown dates, never invented fresh dates. Recording a later purchase does not reset an earlier batch's clock. An entered earlier label date caps a storage estimate; a later label date does not extend it. Freezing after the conservative refrigerated window flags a conflict and retains the earlier deadline. Source windows assume appropriate temperatures and handling; the tool cannot observe spoilage, refrigerator temperatures or time out of refrigeration.

The app uses conservative lower bounds from [FoodSafety.gov's cold-storage chart](https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts) for raw proteins and eggs, [Maryland Extension](https://extension.umd.edu/resource/storing-garden-fruits-and-vegetables) for selected whole produce, and [Maine Extension](https://extension.umaine.edu/food-health/2025/05/29/storing-and-washing-fresh-fruits-and-vegetables/) for cucumber storage. Thawing guidance links to [USDA's Big Thaw](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/big-thaw-safe-defrosting-methods). Frozen windows are **quality review dates**, not automatic safety expiration. Other exact products have no hard-coded expiry; users must enter package dates and check after-opening guidance in [FoodKeeper](https://www.foodsafety.gov/keep-food-safe/foodkeeper-app). Dates and sources were checked September 5, 2026.

Cooking/preparation dates can be edited for every home meal. By default, meals are prepared on their eating date; overnight oats and chia bowls prepare the day before. Moving preparation earlier moves ingredient demand and can reveal a leftover conflict. Cooked dishes use a conservative three-day refrigerated leftover planning limit. Uncooked assembled meals receive a clearly labeled two-day review reminder, not a validated recipe shelf life. Prepared-food dates do not rehabilitate unsafe raw ingredients. Cooked-food freezing is not modeled; users can move preparation later or handle freezer plans separately.

Shopping CSV now has **one row per dated batch**, including planned vs bought status, package quantities, `buy_on`, `purchased_on`, `opened_or_cut_on`, `storage`, `freeze_on`, `thawed_on`, `start_thawing_on`, `cook_or_prepare_on`, `eat_on`, `label_date`, `estimated_use_by_or_review`, deadline basis, freshness status, remaining/surplus quantities, action and source URL. Multiple relevant dates use semicolons within a CSV cell. Retailer quotes, links and disclosures remain included. Menu CSV adds eating, preparation and prepared-food review dates. Unscheduled extra groceries have blank dates until scheduled. Save/Open preserves the freshness data and validates dates, batch IDs/counts and preparation entries.

Run `runFreshnessTests()` from `freshness-tests.js` in the planner to cover calendar math, storage windows, separate batches, frozen/fresh package costs, label caps, late freezing, thawing, unknown dates, leftovers and saved-data validation.


## Leftovers and waste

`leftovers.js` separates owned unallocated ingredients from projected surplus in future purchases. Both remain tied to individual dated purchase batches. Removing an uneaten meal frees its bought ingredients for another use. Waste records subtract only unallocated owned quantities, preserve package spending history, can be undone, and survive JSON Save/Open. Correcting a recorded purchase count also caps or removes its attached waste quantity. Pantry checkboxes represent unmeasured outside supplies, so they do not claim measured surplus.

Reuse suggestions consider one recipe and an available meal block at a time, verify that date-aware allocation actually uses the batch, and rank by extra whole-package checkout, amount used, then cooking time. Calories and time remain visible for the user to choose. Suggestions exclude unknown, conflicting, and past-review storage dates. This is a bounded local ranking, not a global knapsack optimizer or automatic week generator. The separate Leftovers CSV includes allocations, surplus, discarded amounts, and purchase/preparation/eating/review dates; the shopping CSV also includes discarded quantity.

Load `week-board.js`, `leftovers.js`, and `week-board-tests.js` after the engine and freshness modules; run `runWeekBoardTests()`. Tests cover lossless placement, cooking-date remapping, eaten inventory, wasted stock, date-aware reuse and save validation. Browser checks additionally exercise clicks, repeat, drag/drop, touch-style moves, make/buy, exports and responsive widths of 320, 390 and 768 pixels.
