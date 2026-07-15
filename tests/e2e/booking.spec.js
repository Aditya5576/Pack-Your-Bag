import { test, expect } from "@playwright/test";

test.describe("BookMyTrip E2E Integration Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and immediately fail all network calls to Supabase.
    // This forces the client to trigger its built-in localStorage fallback instantly,
    // making the tests fast, self-contained, and offline-compatible.
    await page.route("**/supabase.co/**", (route) => {
      route.abort("failed");
    });

    await page.goto("/");
  });

  test("should load home page and perform a route search query", async ({ page }) => {
    // Assert title
    await expect(page).toHaveTitle(/Pack Your Bags/);

    // Assert search form components are visible using IDs
    await expect(page.locator("#search-from")).toBeVisible();
    await expect(page.locator("#search-to")).toBeVisible();

    // Select bus tab using the correct selector class
    await page.click(".mode-tab[data-mode='bus']");

    // Enter query values using IDs
    await page.fill("#search-from", "Jaipur");
    await page.fill("#search-to", "Pune");

    // Perform search
    await page.click("#btn-main-search");

    // Assert transition to search results screen
    await expect(page).toHaveURL(/#\/search/);
    await expect(page.locator(".results-layout")).toBeVisible();

    // Verify route cards populated
    const routeCards = page.locator(".trip-result-card");
    await expect(routeCards.first()).toBeVisible();
  });

  test("should complete a full traveler checkout, payment, and load the printable boarding ticket", async ({
    page
  }) => {
    // 1. Search for a route using correct IDs
    await page.fill("#search-from", "Jaipur");
    await page.fill("#search-to", "Pune");
    await page.click("#btn-main-search");

    // 2. Open Seat Selection layout for the first available trip card
    const selectSeatsBtn = page.locator(".btn-select-trip").first();
    await selectSeatsBtn.click();
    await expect(page).toHaveURL(/#\/seat-selection/); // Correct routing hash

    // 3. Select an available seat
    const seatItem = page.locator(".seat-item.available").first();
    await expect(seatItem).toBeVisible();
    await seatItem.click();

    // 4. Proceed to passenger details checkout page
    const proceedDetailsBtn = page.locator("#btn-proceed-details");
    await expect(proceedDetailsBtn).toBeEnabled();
    await proceedDetailsBtn.click();
    await expect(page).toHaveURL(/#\/checkout/);

    // 5. Fill out passenger forms
    await page.fill(".form-grid input.p-name", "John Doe");
    await page.fill(".form-grid input.p-age", "28");
    await page.selectOption(".form-grid select.p-gender", "Male");

    await page.fill("#contact-email", "john.doe@playwright-test.com");
    await page.fill("#contact-mobile", "9988776655");

    // 6. Proceed to transaction overlay modal using the correct button ID
    await page.click("#btn-proceed-payment");
    const paymentModal = page.locator(".payment-modal-overlay");
    await expect(paymentModal).toBeVisible();

    // 7. Complete simulated checkout using the correct submit button ID
    await page.click("#btn-submit-payment");

    // 8. Confirm page navigation to boarding pass ticket URL
    await expect(page).toHaveURL(/#\/ticket/);
    await expect(page.locator(".ticket-card")).toBeVisible();
    await expect(page.locator("#qrcode-canvas")).toBeVisible();
    await expect(page.locator("text=Payment Status")).toBeVisible();

    // 9. Verify ticket download button is active
    const downloadPdfBtn = page.locator("#btn-download-pdf");
    await expect(downloadPdfBtn).toBeVisible();
  });

  test("should open the admin statistics panel successfully", async ({ page }) => {
    // Navigate to admin route
    await page.goto("#/admin");
    await expect(page).toHaveURL(/#\/admin/);

    // Assert that metric counters and form layout render using correct template classes
    await expect(page.locator(".metrics-grid")).toBeVisible();
    await expect(page.locator(".add-route-card")).toBeVisible();
    await expect(page.locator(".admin-table").first()).toBeVisible(); // Satisfies Playwright strict mode
  });

  test("should complete a full hotel booking stays search, room selection, guest form entry, and payment confirmation", async ({ page }) => {
    // 1. Click on Stays tab
    await page.click(".mode-tab[data-mode='stays']");

    // 2. Select destination city
    await page.fill("#search-to", "Goa");

    // 3. Perform search
    await page.click("#btn-main-search");

    // 4. Assert transition to stays page
    await expect(page).toHaveURL(/#\/hotels/);
    await expect(page.locator("#hotels-list-grid")).toBeVisible();

    // 5. Click "Select Room" on first hotel card
    const selectRoomBtn = page.locator("#hotels-list-grid button").first();
    await selectRoomBtn.click();

    // 6. Assert room selection modal opens
    const roomModal = page.locator("#room-selection-modal");
    await expect(roomModal).toBeVisible();

    // 7. Click "Book Room" on one room option (this will route to hotel-booking)
    const bookRoomBtn = roomModal.locator("button:has-text('Book Room')").first();
    await bookRoomBtn.click();
    await expect(page).toHaveURL(/#\/hotel-booking/);

    // 8. Fill guest details
    await page.fill(".form-grid input.g-name", "Jane Doe");
    await page.fill(".form-grid input.g-age", "25");
    await page.selectOption(".form-grid select.g-gender", "Female");

    // 9. Proceed to payment modal
    await page.click("#btn-proceed-hotel-payment");
    const paymentModal = page.locator("#razorpay-overlay");
    await expect(paymentModal).toBeVisible();

    // 10. Pay and verify voucher confirmation
    await page.click("#btn-submit-payment");
    await expect(page).toHaveURL(/#\/hotel-voucher/);
    await expect(page.locator("#printable-hotel-voucher")).toBeVisible();
  });
});
