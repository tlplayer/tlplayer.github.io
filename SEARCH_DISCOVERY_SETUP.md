# Search and answer-engine setup

The repository now contains the technical pieces that can be published without access to external accounts:

- `robots.txt` explicitly allows `OAI-SearchBot` and general search crawlers.
- `robots.txt` blocks `GPTBot`, keeping search discovery separate from model-training crawling.
- `sitemap.xml` lists the calculator, planner, and reference URLs.
- Important answers, formulas, examples, assumptions, and tables are static HTML rather than canvas-only or login-only content.
- Calculator controls use native labels and result regions use accessible live status.
- Canonical URLs, descriptions, internal links, and accurate structured data are present on the flagship gravel pages.

The following require the site owner's external accounts and cannot be completed from this static repository alone:

1. Publish the changes and confirm `https://tlplayer.github.io/robots.txt` and `https://tlplayer.github.io/sitemap.xml` return HTTP 200.
2. Add the sitemap in Google Search Console.
3. Add the sitemap in Bing Webmaster Tools and enable IndexNow if desired.
4. If a CDN or WAF is later placed in front of GitHub Pages, allow the search crawler's current published IP ranges there.
5. Configure an analytics property and report for referrals containing `utm_source=chatgpt.com`.
6. Track landing page, calculator use, retailer click, and affiliate conversion without collecting project measurements unnecessarily.

Search inclusion and citation are not guaranteed. Keep changing facts—especially retailer prices—timestamped, attributable, and sourced from approved feeds.
