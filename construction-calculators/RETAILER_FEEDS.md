# Retailer price-feed integration

BuildEstimate never scrapes retailer pages. Automatic prices in the public site must come from an approved affiliate API, product feed, distributor feed, or a supplier-provided export whose agreement permits price display.

The browser reads `data/retailer-offers.json`. A private scheduled importer should authenticate with retailer credentials stored outside the repository, normalize approved records, and publish only the fields needed by the site.

## Feed schema

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-04T15:30:00Z",
  "offers": [
    {
      "retailer": "Example supplier",
      "product": "Example 0.5 cubic foot bag",
      "material": "gravel",
      "quantityPerPackage": 0.5,
      "quantityUnit": "cu_ft",
      "price": 6.99,
      "availability": "Check store availability",
      "productUrl": "https://supplier.example/product",
      "affiliateUrl": "https://approved-tracking.example/link",
      "updatedAt": "2026-09-04T15:15:00Z"
    }
  ]
}
```

The example is illustrative and must not be copied into the production feed. Accepted base units are `cu_ft`, `cu_yd`, `liter`, `gallon`, `each`, `sq_ft`, `sq_m`, `linear_ft`, `meter`, and `board_ft`. Appliance materials use `appliance-refrigerator`, `appliance-dishwasher`, `appliance-range`, `appliance-washer`, `appliance-dryer`, or `appliance-freezer`; a generic `appliance` record can match every appliance type.

## Publishing rules

- Follow each retailer's affiliate and price-display agreement. Some programs allow links but restrict independently displayed prices.
- Never commit API keys, affiliate secrets, or signed feed URLs.
- Set `generatedAt` on every successful export and preserve each offer's `updatedAt`.
- Remove stale offers rather than presenting them as current. A daily refresh is a practical starting point, subject to the provider's rules.
- Prefer `affiliateUrl` when the agreement permits it; otherwise use `productUrl`. The UI marks affiliate destinations as sponsored links.
- Keep location-specific availability explicit. Delivery fees, tax, minimum quantities, and membership pricing are not assumed.
- Validate package quantity and unit before publishing. Records with zero or invalid price/package values are ignored by the browser.

Until an approved feed is connected, the site intentionally shows no invented prices and offers the in-browser manual comparison instead.
