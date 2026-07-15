// hotelTicket.js - Hotel printable vouchers and confirmation displays

async function initHotelVoucherView(queryParams) {
  const appView = document.getElementById("app-view");
  const bookingId = queryParams.bookingId;

  if (!bookingId) {
    navigateTo("#/");
    return;
  }

  let booking = null;
  try {
    booking = await window.dbAPI.getBookingById(bookingId);
  } catch (err) {
    console.error("Voucher load failed: ", err);
  }

  if (!booking || booking.bookingType !== "hotel") {
    navigateTo("#/");
    return;
  }

  // Calculate nights
  const checkin = new Date(booking.checkIn);
  const checkout = new Date(booking.checkOut);
  const diffTime = Math.abs(checkout - checkin);
  const numNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const specsMap = {
    "Standard Room": ["🛏️ Queen Bed", "📶 Free WiFi", "❄️ AC", "☕ Coffee Maker"],
    "Deluxe King Room": ["🛏️ King Bed", "🌅 Balcony View", "🍹 Mini Bar", "📺 Smart TV", "🚿 Rain Shower"],
    "Executive Garden Suite": ["🛏️ Royal King Bed", "🛋️ Living Lounge", "🛁 Luxury Bathtub", "🏊 Pool Access", "🤵 Butler Service"]
  };
  const specs = specsMap[booking.roomType] || [];

  appView.innerHTML = `
    <div class="ticket-page-container container" style="max-width: 900px; padding-top: 30px;">
      <!-- Success Celebration Banner -->
      <div class="card success-banner">
        <span class="success-icon">🎉</span>
        <h2>Congratulations! Your Stay is Confirmed</h2>
        <p>A confirmation email and SMS voucher has been sent to <strong>${booking.email}</strong></p>
        <span class="booking-id-tag">Confirmation ID: ${bookingId}</span>
      </div>

      <!-- Ticket & Invoice Grid -->
      <div class="ticket-invoice-grid">
        <!-- Printable Voucher Card -->
        <main class="card ticket-card" id="printable-hotel-voucher">
          <div class="ticket-header" style="background: linear-gradient(rgba(5, 8, 16, 0.4), rgba(5, 8, 16, 0.75)), url('${booking.photo || ''}'); background-size: cover; background-position: center; min-height: 120px; display: flex; flex-direction: column; justify-content: space-between; padding: 16px; border-radius: var(--radius-md) var(--radius-md) 0 0; border-bottom: 2px solid var(--accent-teal);">
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <div class="ticket-brand" style="font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 6px;">
                <span>🎒</span> Pack Your Bags Stays
              </div>
              <span class="ticket-type-badge" style="background: var(--accent-teal); color: var(--bg-primary); font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-shadow: none;">
                ${booking.platform.toUpperCase()} CONFIRMED
              </span>
            </div>
            <div style="color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.6); text-align: left;">
              <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; font-weight: 700; color: var(--accent-teal);">OFFICIAL CONFIRMATION VOUCHER</span>
              <h2 style="font-size: 20px; font-weight: 800; margin: 2px 0 0 0; color: #fff; line-height: 1.2;">${booking.hotelName}</h2>
            </div>
          </div>

          <div class="ticket-body">
            <!-- Hotel Name and City -->
            <div class="ticket-row route-row" style="background-color: rgba(255, 255, 255, 0.02);">
              <div class="col">
                <span class="lbl">Accommodation Location</span>
                <span class="val" style="font-size: 16px; font-weight: 700; color: var(--text-primary);">📍 ${booking.city} City Centre</span>
              </div>
              <div class="col" style="text-align: right;">
                <span class="lbl">Booking Reference</span>
                <span class="val" style="font-family: monospace; font-size: 15px; color: var(--accent-teal); font-weight: 700;">${bookingId}</span>
              </div>
            </div>

            <!-- Check-in & Check-out details -->
            <div class="ticket-row">
              <div class="col">
                <span class="lbl">Check-In Date</span>
                <span class="val" style="font-size: 16px;">${formatDisplayDate(booking.checkIn)}</span>
                <span style="font-size: 11px; color: var(--text-muted);">Standard: 12:00 PM</span>
              </div>
              <div class="col" style="text-align: center;">
                <span class="lbl">Duration</span>
                <span class="val" style="font-size: 16px; color: var(--accent-purple);">${numNights} Night(s)</span>
              </div>
              <div class="col" style="text-align: right;">
                <span class="lbl">Check-Out Date</span>
                <span class="val" style="font-size: 16px;">${formatDisplayDate(booking.checkOut)}</span>
                <span style="font-size: 11px; color: var(--text-muted);">Standard: 11:00 AM</span>
              </div>
            </div>

            <div class="dashed-hr"></div>

            <!-- Room & Guest details -->
            <div class="ticket-row">
              <div class="col">
                <span class="lbl">Reserved Room Details</span>
                <span class="val" style="color: var(--text-primary); font-size: 16px; font-weight: 700;">
                  ${booking.roomType} &mdash; <span style="color: var(--accent-teal);">Room ${booking.roomNumber || 'TBD'}</span>
                </span>
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px;">
                  ${specs.map(spec => `<span style="font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(0, 242, 254, 0.06); border: 1px solid rgba(0, 242, 254, 0.15); color: var(--accent-teal); font-weight: 500;">${spec}</span>`).join('')}
                </div>
              </div>
              <div class="col" style="text-align: right;">
                <span class="lbl">Total Guest(s)</span>
                <span class="val">${booking.passengers.length} Person(s)</span>
              </div>
            </div>

            <!-- List of Guest Names -->
            <div class="ticket-row" style="margin-top: 10px;">
              <div class="col">
                <span class="lbl">Guest Directory</span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                  ${booking.passengers
                    .map(
                      (p) => `
                    <span style="font-size: 12px; background-color: var(--glass-bg); padding: 4px 8px; border-radius: 4px; color: var(--text-secondary);">
                      👤 ${p.name} (${p.age}, ${p.gender})
                    </span>
                  `
                    )
                    .join("")}
                </div>
              </div>
            </div>

            <!-- Embedded Printed Invoice details -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 6px; padding: 12px; margin-bottom: 15px;">
              <span class="lbl" style="margin-bottom: 6px; display: block; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; color: var(--text-muted);">🧾 Tax Invoice & Payment Receipt</span>
              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                  <span>Room Stay Charges (${numNights} nights)</span>
                  <span style="font-weight: 600;">₹${booking.billing.baseFare}</span>
                </div>
                ${
                  booking.billing.discount > 0
                    ? `
                  <div style="display: flex; justify-content: space-between; color: #10b981;">
                    <span>🎁 Promo Code Discount</span>
                    <span style="font-weight: 700;">-₹${booking.billing.discount}</span>
                  </div>
                `
                    : ""
                }
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                  <span>Tax (SGST & CGST 18%)</span>
                  <span style="font-weight: 600;">₹${booking.billing.gst}</span>
                </div>
                <div style="height: 1px; background: rgba(255, 255, 255, 0.05); margin: 4px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-weight: 700; color: var(--text-primary);">
                  <span>Total Amount Paid</span>
                  <span style="color: var(--accent-teal); font-size: 14px; font-weight: 800;">₹${booking.billing.grandTotal}</span>
                </div>
              </div>
            </div>

            <div class="dashed-hr"></div>

            <!-- QR code & voucher footer -->
            <div class="ticket-footer-row">
              <div class="qr-code-wrapper">
                <div id="hotel-qr-container"></div>
                <span class="qr-caption">${bookingId}</span>
              </div>
              <div class="ticket-meta">
                <p>Status: <span class="status-confirmed">CONFIRMED</span></p>
                <p style="margin-top: 4px; font-size: 11px; color: var(--text-muted);">Booked via ${booking.platform.toUpperCase()} on ${formatDisplayDate(booking.bookingDate.split("T")[0])}</p>
              </div>
            </div>
          </div>
        </main>

        <!-- Bill breakdown & actions panel -->
        <aside class="invoice-card">
          <div class="card" style="margin-bottom: 20px;">
            <h3>Payment Invoice</h3>
            <div class="dashed-hr"></div>
            
            <div class="invoice-container" style="background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 8px;">
              <h4 style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                🧾 Tax Invoice Summary
              </h4>
              <div class="invoice-bill-list" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="fare-row" style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary);">
                  <span>Room Stay Charges (${numNights} nights)</span>
                  <span style="font-weight: 600; color: var(--text-primary);">₹${booking.billing.baseFare}</span>
                </div>
                ${
                  booking.billing.discount > 0
                    ? `
                  <div class="fare-row promo" style="display: flex; justify-content: space-between; font-size: 13px; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 4px; border: 1px dashed rgba(16, 185, 129, 0.3);">
                    <span>🎁 Discount Applied</span>
                    <span style="font-weight: 700;">-₹${booking.billing.discount}</span>
                  </div>
                `
                    : ""
                }
                <div class="fare-row" style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary);">
                  <span>SGST & CGST (18%)</span>
                  <span style="font-weight: 600; color: var(--text-primary);">₹${booking.billing.gst}</span>
                </div>
                <div style="height: 1px; background: rgba(255, 255, 255, 0.08); margin: 6px 0;"></div>
                <div class="fare-row grand-total" style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--text-primary); padding-top: 2px;">
                  <span style="color: var(--text-primary);">Amount Paid</span>
                  <span style="font-size: 18px; font-weight: 800; color: var(--accent-teal);">₹${booking.billing.grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons-invoice">
            <button class="btn btn-outline" id="btn-print-voucher">
              <span>🖨️</span> Print Voucher
            </button>
            <button class="btn btn-secondary" id="btn-download-pdf-voucher">
              <span>📥</span> Download PDF
            </button>
            <button class="btn btn-primary" onclick="navigateTo('#/')">
              <span>🏠</span> Back to Home
            </button>
          </div>
        </aside>
      </div>
    </div>
  `;

  // Dynamic animations & QR rendering
  triggerConfettiCelebration();
  renderHotelVoucherQR(bookingId);
  bindHotelVoucherActions(bookingId);
}

// Confetti burst
function triggerConfettiCelebration() {
  if (typeof confetti === "function") {
    // Burst 1
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    // Burst 2
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 }
      });
    }, 300);
  }
}

// Render dynamic QR
function renderHotelVoucherQR(bookingId) {
  const qrContainer = document.getElementById("hotel-qr-container");
  if (qrContainer && typeof QRCode === "function") {
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: `PACKYOURBAGS:HOTEL:${bookingId}`,
      width: 100,
      height: 100,
      colorDark: "#1a202c",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

// Voucher Actions: Print & PDF
function bindHotelVoucherActions(bookingId) {
  document.getElementById("btn-print-voucher").addEventListener("click", () => {
    window.print();
  });

  document.getElementById("btn-download-pdf-voucher").addEventListener("click", () => {
    const element = document.getElementById("printable-hotel-voucher");
    if (typeof html2pdf === "function") {
      const opt = {
        margin: 10,
        filename: `Voucher_${bookingId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#111827" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };
      html2pdf().set(opt).from(element).save();
    } else {
      showNotification("PDF engine loading. Try again.", "error");
    }
  });
}
