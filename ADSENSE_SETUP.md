# AdSense setup for BuildEstimate

The calculator pages are wired to the AdSense publisher account `ca-pub-7010590645085744`.

1. Add and approve this GitHub Pages site in AdSense.
2. Turn on Auto ads for the site if you want Google to choose placements automatically.
3. To activate the reserved in-page placements, create a responsive display ad unit and set `displayAdSlot` in `construction-calculators/config.js` to its numeric slot ID.
4. In the AdSense privacy and messaging dashboard, configure the consent message required for the regions you serve.
5. Confirm that the checked-in root `ads.txt` entry matches the line shown in your AdSense account.

   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`

The Google script now loads on every BuildEstimate page, so Auto ads can run once the site is approved in AdSense. The reserved responsive placements activate when `displayAdSlot` is configured.
