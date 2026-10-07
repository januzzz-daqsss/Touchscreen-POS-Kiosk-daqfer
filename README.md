# Skyline Market — Touchscreen POS Kiosk

A self-service café and market checkout demo for the IT415 Practical Examination. Custom sky-blue and midnight-navy styling, touch controls, and a complete order-to-receipt flow.

## Setup and run

Requirements: **Node.js 20 or newer** and npm (included with Node.js). No packages, API keys, database, or paid services are needed. After cloning your group's repository, open a terminal in its root:

```powershell
npm start
```

Open **http://localhost:5173**. Stop the server with Ctrl+C in the terminal that runs it. If port 5173 is occupied, use a different port:

```powershell
$env:PORT = '5174'
npm start
```

There are no third-party dependencies to install. If your setup workflow requires an npm installation command, you can run `npm install`; it is optional for this project. There is no build command or compilation step. The development server binds only to this computer (`127.0.0.1`) and serves an explicit list of public files. Use HTTP through this server, rather than opening `index.html` as a file, because the application uses JavaScript modules.

## Features

- Welcome screen with branding, clock, animated café illustration, and Start Order.
- Nine sample products, four categories, search, product selection feedback, and a separate cart.
- Quantity increase/decrease, removal at zero, maximum quantity of 99, subtotals, and consistent totals.
- Dedicated review screen and Order → Review → Payment → Receipt indicator.
- Cash keypad, exact-amount and denomination shortcuts, validation, and change calculation.
- QR and card simulations with processing, success, decline, and retry states.
- Receipt with product quantities, unit prices, line totals, date, UUID reference, and payment details.
- New Transaction clears cart, search/category selection, payment state, errors, receipt, and notification state.
- Responsive layouts, touch-sized controls, pressed states, focus indicators, polite toast announcements, and reduced-motion support.

## Stack and dependencies

HTML, custom CSS, native JavaScript modules, and Node.js built-ins (`http`, `fs`, `path`, and `node:test`). There are **no third-party runtime or test dependencies**, remote fonts, or external image requests. Product visuals use platform-rendered emoji placeholders; their appearance varies by operating system. A modern browser with CSS Grid and `crypto.randomUUID()` is required. Localhost provides the secure context needed by the UUID API.

## Project structure

```text
index.html                Entry page and live notification region
styles.css                Theme, layouts, touch controls, animation, breakpoints
src/
  catalog.js              Store configuration and immutable sample catalog
  store.js                Cart, navigation, payment validation, receipts, money
  app.js                  Screen rendering and user interaction handlers
server.mjs                Dependency-free local static server
tests/store.test.mjs      Node built-in business-logic tests
package.json              Run, test, and syntax-check commands
AI_DEVELOPMENT_LOG.md      Actual AI-assisted work and verification evidence
.gitignore                Excludes logs, dependencies, secrets, test output
```

## Architecture and storage

`createStore()` owns the cart, current screen, payment state, and receipt. UI components call its methods instead of implementing their own payment calculations. A single summary function calculates item subtotals, count, and total. Prices and monetary arithmetic use **integer centavos**; formatting into Philippine pesos happens at display time.

The catalog is static source data. The cart, payment attempt, and latest receipt are **memory only**. Refreshing the page loses the transaction; there is no database, browser storage, customer record, transaction history, stock management, or server-side transaction API. Successful payments capture an immutable receipt snapshot and generate a new UUID reference. References are generated on completion, so each new checkout receives a fresh reference without reusing the previous customer's reference.

Back navigation preserves the order and clears temporary payment selection when leaving Payment. During processing, navigation and payment controls are disabled. Attempt tokens reject stale callbacks and repeated completion. New Transaction clears state and invalidates any previous attempt.

## Payment simulation

**All payment methods are demonstrations. No money is transferred.** Cash records a manually entered amount; there is no bill acceptor or cash hardware. Cash accepts ordinary decimal values with at most two decimal places, up to seven whole-number digits. Invalid and insufficient amounts cannot complete payment.

QR displays an intentionally non-payable decorative placeholder. It does not encode a payment address and should not be scanned to make a payment. Select **Simulate Successful Payment** or **Simulate declined payment** to choose the outcome. Card uses the same simulated outcome controls and never asks for a card number, PIN, CVV, or account details. Both wait about 1.4 seconds before returning the chosen outcome. After a decline, retry, select another method, or use Back to Review. Processing cannot be cancelled mid-attempt; it finishes after the short demo delay.

Prices have no additional fees or separate tax calculation. Receipts are labeled demo documents and are not fiscal receipts. Currency and sample products can be changed in `src/catalog.js`.

## Tests and verified results

```powershell
npm test
npm run check
```

Member 2 verification on October 7, 2026: all 17 automated store tests and the syntax checks passed using Node.js 24.18.0. The receipt/reset tests cover exact item details, cash change, all three payment methods, UUID references, receipt snapshots across successive transactions, clearing declined-payment errors, and rejection of stale payment callbacks after reset. These are business-logic checks; rendering was inspected in source.

**Browser verification is pending.** No browser workflow, screenshot inspection, physical touch check, or viewport check was completed for this contribution. Automated business-logic results must not be interpreted as proof that rendered controls work. The manual checklist below records expected behavior, not completed test results.

| Required verification | Actual evidence |
| --- | --- |
| Application startup | Local server and asset HTTP smoke checks passed; browser runtime pending |
| Product selection/add/increase/decrease/remove | Store tests passed; UI interaction pending |
| Cart totals and review consistency | Store tests passed using 2 lattes + 1 cookie = ₱365.00 |
| Back navigation and empty checkout | Store tests passed; visible controls pending |
| Cash success, invalid input, insufficient input, change | Tests passed, including ₱500.00 tendered → ₱135.00 change |
| QR and card payment | Success/decline/retry state tests passed; visible simulations pending |
| Receipt accuracy and original-order consistency | All three methods tested against original order |
| Unique references | Consecutive transactions produce different references in tests |
| Full reset | All store fields and stale callback rejection tested; UI reset pending |
| Touch comfort | Controls implemented; physical touch testing pending |
| 1366×768 and 1920×1080 | Responsive CSS implemented; visual checks pending |

## Manual Testing

Use this checklist to exercise the basic POS flow. Supported methods are **Cash**, **QR (simulated)**, and **Card (simulated)**. A transaction is complete only when the successful receipt appears. Check that its products match the reviewed order, each line amount equals quantity times unit price, and the total equals the sum of line amounts. Subtotal and total are equal because there are no additional fees or separate tax calculation. Verify the date/time, payment method, and a nonempty `SKY-` UUID reference; cash receipts must also show the tendered amount and change.

Run this at **both 1366×768 and 1920×1080 browser viewport sizes**, preferably with touch emulation or the actual touchscreen. Confirm labels are readable, controls do not overlap, and catalog/cart scrolling works independently.

1. Open the welcome screen. Select Start Order; verify an empty bag and disabled Review Order.
2. Filter Coffee, add Iced cloud latte, then increase to 2. Verify ₱290.00. Decrease to 1, then to zero; verify removal.
3. Search for `cookie`, add Chocolate chunk, clear search, select All items, and add 2 lattes. Verify 3 items totaling **₱365.00**. Test the Remove control on a temporary third product.
4. Review the order. Check unit prices, quantities, line subtotals, and total. Go Back to Order, then review again; contents must be unchanged.
5. Proceed to Payment. Select Cash. Enter `abc`, `-1`, `1.234`, and `364.99` in separate attempts. Each must show a relevant error without a receipt. Test the touch keypad as well.
6. Enter `500`. Complete Cash Payment; rapidly tap again. Expect one processing state and one receipt: **₱365.00 total, ₱500.00 tendered, ₱135.00 change**. Record the reference.
7. Select New Transaction. Confirm welcome, then Start Order: empty bag, All items, blank search, and no previous payment or receipt. Complete a second purchase and compare its reference.
8. Repeat checkout with QR. Verify the simulation label and waiting state; simulate a decline, retry, and simulate success. Check receipt totals and QR method.
9. Repeat with Card. Verify no sensitive data is requested. Decline, retry, succeed, and inspect the receipt. Test Back to Review before submitting each method.
10. Enable reduced motion in the operating system/browser and repeat navigation. Check visible keyboard focus, Tab access, live errors, and comfortable touch targets.

Expected complete sequence: **Welcome → Start Order → Select Products → Modify Quantities → Review Order → Choose Payment Method → Complete Payment → View Receipt → New Transaction → Welcome**.

## Contribution and examination evidence

Member 2 works on `feature/member2-docs-testing`, focusing on transaction completion, receipt/reset verification, and documentation. This contribution preserves the existing implementation and sky-blue/midnight-navy design. No commits or pushes were made as part of this verification. Record actual manual test outcomes separately, including the environment, date, and any failures; the checklist itself is not evidence that those tests were performed.

Known limitations: browser/viewport checks remain pending; no real payment integration, printer, inventory backend, persistent receipt history, inactivity timeout, or production security deployment. These are outside this self-service demonstration's implemented scope.
