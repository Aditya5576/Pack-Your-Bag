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
          <div class="ticket-header" style="background: var(--secondary-gradient);">
            <div class="ticket-brand">
              <span>🎒</span> Pack Your Bags stays
            </div>
            <span class="ticket-type-badge">${booking.platform.toUpperCase()} PARTNER</span>
          </div>

          <div class="ticket-body">
            <!-- Hotel Name and City -->
            <div class="ticket-row route-row" style="background-color: rgba(255, 255, 255, 0.02);">
              <div class="col">
                <span class="lbl">Accommodation Name</span>
                <span class="val" style="font-size: 18px; font-weight: 700; color: var(--accent-teal);">${booking.hotelName}</span>
              </div>
              <div class="col" style="text-align: right;">
                <span class="lbl">City Destination</span>
                <span class="val">📍 ${booking.city}</span>
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
                <span class="lbl">Reserved Room Type</span>
                <span class="val" style="color: var(--text-primary); font-size: 16px;">${booking.roomType}</span>
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
