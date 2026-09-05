# AdSense setup

The calculator pages are wired to the AdSense publisher account `ca-pub-7010590645085744`.

1. Add and approve this GitHub Pages site in AdSense.
2. Turn on Auto ads for the site if you want Google to choose placements automatically.
3. To activate the reserved in-page placements, create a responsive display ad unit and set `displayAdSlot` in `construction-calculators/config.js` to its numeric slot ID.
4. In the AdSense privacy and messaging dashboard, configure the consent message required for the regions you serve.
5. Confirm that the checked-in root `ads.txt` entry matches the line shown in your AdSense account.

   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`

The Google script now loads on every BuildEstimate page, so Auto ads can run once the site is approved in AdSense. The reserved responsive placements activate when `displayAdSlot` is configured.

## SLAcheck and SpendCheck

`sla-check/index.html` and `spend-check/index.html` also load the same publisher's asynchronous AdSense script directly in their document heads, matching the main homepage. They use Auto ads; no manual display slot is configured for these two pages. Their footers link to `operations-tools/privacy.html`, which describes local file processing and Google advertising cookies and requests.

Deploy the updated pages through GitHub Pages for this wiring to take effect. Site approval, Auto ads, any page exclusions, and regional consent messages remain controlled in the AdSense dashboard; adding the script does not confirm ad delivery or change those account settings.

References: [Google's code placement guide](https://support.google.com/adsense/answer/9274516?hl=en) and [advertising privacy disclosures](https://support.google.com/adsense/answer/1348695?hl=en).
