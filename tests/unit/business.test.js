import { describe, test, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("BookMyTrip Core Business Logic & State", () => {
  beforeAll(() => {
    // 1. Initialize browser-like mock elements in JSDOM
    document.body.innerHTML = `
      <div id="app-view"></div>
      <div id="nav-auth-container"></div>
      <div id="notification-container"></div>
      
      <!-- Checkout fare breakdown elements -->
      <div id="summary-base-fare"></div>
      <div id="coupon-row"></div>
      <div id="coupon-code-label"></div>
      <div id="summary-discount"></div>
      <div id="summary-gst"></div>
      <div id="summary-grand-total"></div>
      <div id="payment-modal-amount"></div>
    `;

    // 2. Inject global libraries that index.html loads so scripts don't fail
    window.QRCode = class MockQRCode {};
    window.confetti = () => {};
    window.html2pdf = () => ({
      set: () => ({
        from: () => ({
          save: async () => {},
          output: async () => new Blob(["test"], { type: "application/pdf" })
        })
      })
    });

    // Mock Supabase CDN global client
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          signInAnonymously: async () => ({ data: { user: { id: "test-user-id-123" } }, error: null })
        }
      })
    };

    // 3. Load application script files by executing them directly inside the JSDOM global context
    const loadScript = (relativePath) => {
      const fullPath = path.resolve(__dirname, "../../public", relativePath);
      const code = fs.readFileSync(fullPath, "utf8");
      window.eval(code); // Evaluate code directly in JSDOM scope
    };

    loadScript("js/supabaseConfig.js");
    loadScript("js/mockData.js");
    loadScript("js/search.js");
    loadScript("js/booking.js");
    loadScript("js/app.js");
  });

  // Test Case A: Date formatting
  test("formatDisplayDate formats valid dates correctly and returns empty string for missing input", () => {
    expect(window.formatDisplayDate("2026-07-15")).toBe("Jul 15, 2026");
    expect(window.formatDisplayDate("2026-12-25")).toBe("Dec 25, 2026");
    expect(window.formatDisplayDate("")).toBe("");
    expect(window.formatDisplayDate(null)).toBe("");
  });

  // Test Case B: Base fare calculations
  test("calculateFareBreakdown computes totals correctly without coupons", () => {
    window.appState.selectedTrip = { price: 1200 };
    window.appState.selectedSeats = ["12-L", "13-M"]; // 2 seats
    window.appState.appliedCoupon = null;

    window.calculateFareBreakdown();

    expect(document.getElementById("summary-base-fare").textContent).toBe("₹2400");
    expect(document.getElementById("summary-gst").textContent).toBe("₹432"); // 18% of 2400 = 432
    expect(document.getElementById("summary-grand-total").textContent).toBe("₹2832");
    expect(window.appState.bookingBill.grandTotal).toBe(2832);
  });

  // Test Case C: Coupon discounts (Percentage)
  test("calculateFareBreakdown applies percentage coupon discounts correctly with limits", () => {
    window.appState.selectedTrip = { price: 2000 };
    window.appState.selectedSeats = ["1-A", "2-B"]; // 2 seats = 4000
    window.appState.appliedCoupon = {
      code: "PACKBAGS20",
      type: "percentage",
      value: 20, // 20% of 4000 = 800
      maxDiscount: 500 // Limit discount to 500
    };

    window.calculateFareBreakdown();

    expect(document.getElementById("summary-base-fare").textContent).toBe("₹4000");
    expect(document.getElementById("summary-discount").textContent).toBe("-₹500"); // Capped at maxDiscount
    expect(document.getElementById("summary-gst").textContent).toBe("₹630"); // 18% of (4000 - 500) = 18% of 3500 = 630
    expect(document.getElementById("summary-grand-total").textContent).toBe("₹4130"); // 3500 + 630 = 4130
  });

  // Test Case D: Coupon discounts (Flat)
  test("calculateFareBreakdown applies flat coupon discounts correctly", () => {
    window.appState.selectedTrip = { price: 1500 };
    window.appState.selectedSeats = ["4-U"]; // 1 seat = 1500
    window.appState.appliedCoupon = {
      code: "FLAT150",
      type: "flat",
      value: 150
    };

    window.calculateFareBreakdown();

    expect(document.getElementById("summary-base-fare").textContent).toBe("₹1500");
    expect(document.getElementById("summary-discount").textContent).toBe("-₹150");
    expect(document.getElementById("summary-gst").textContent).toBe("₹243"); // 18% of (1500 - 150) = 18% of 1350 = 243
    expect(document.getElementById("summary-grand-total").textContent).toBe("₹1593"); // 1350 + 243 = 1593
  });
});
