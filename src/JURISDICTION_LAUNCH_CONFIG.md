# Jurisdiction / Launch Configuration

This file describes the intended technical switchboard for a future live service. It is not legal advice and does not itself authorize cash play.

## Current build

`launch-config.js` is deliberately configured as:

- mode: `demo`
- realMoneyEnabled: `false`
- approvedJurisdictions: `[]`
- blockedJurisdictions: `['TH']`
- 18+ required for any future cash mode
- identity verification required
- location verification required
- fair-play/device check required

## Before enabling a jurisdiction

For each country/state/province counsel should provide a written answer on:

1. competition classification,
2. required licences / registrations,
3. age threshold,
4. allowed entry/prize/fee structure,
5. payment/custody permissions,
6. KYC/AML/sanctions obligations,
7. geolocation standard,
8. responsible-play / self-exclusion duties,
9. advertising restrictions,
10. tax and reporting obligations,
11. dispute/refund requirements,
12. record-retention requirements.

Only after those requirements are implemented should the approved jurisdiction be added to the production allowlist.

## Recommended production behavior

- Practice: available where ordinary game distribution is lawful.
- Competitive cash lobby: hidden/disabled unless location is positively matched to the approved allowlist.
- Location uncertainty/VPN/proxy conflict: no cash entry.
- KYC/age incomplete: no cash entry.
- Fair-play/device risk unresolved: no cash entry.
- Payment provider declines jurisdiction: no cash entry.
