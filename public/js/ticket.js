// ticket.js - Confirmation, QR code rendering, and invoice printing module

async function initTicketView(params) {
  const appView = document.getElementById("app-view");
  const bookingId = params.bookingId;

  if (!bookingId) {
    navigateTo("#/");
    return;
  }

  // Fetch booking from database API (Cloud/Local)
  let booking = null;
  try {
    booking = await window.dbAPI.getBookingById(bookingId);
  } catch (err) {
    console.error("Failed to fetch booking details: ", err);
  }

  if (!booking) {
    appView.innerHTML = `
      <div class="container text-center" style="margin-top: 50px;">
        <h3>Ticket Not Found</h3>
        <p>We couldn't locate any booking with ID: <strong>${bookingId}</strong>.</p>
        <a href="#/" class="btn btn-primary">Go to Home</a>
      </div>
    `;
    return;
  }

  // Trigger celebration confetti
  triggerConfetticelebration();

  // Render Page Layout
  appView.innerHTML = `
    <div class="ticket-page-container container">
      <!-- Confirmation Banner -->
      <div class="success-banner card">
        <div class="success-icon">🎉</div>
        <h2>Booking Confirmed!</h2>
        <p>Your tickets have been reserved and sent to <strong>${booking.email}</strong></p>
        <div class="booking-id-tag">Booking ID: <strong>${booking.id}</strong></div>
      </div>

      <!-- Ticket & Invoice Panel -->
      <div class="ticket-invoice-grid">
        
        <!-- Boarding Pass Card layout -->
        <div class="ticket-card card" id="ticket-pass-print">
          <div class="ticket-header" style="background: linear-gradient(rgba(5, 8, 16, 0.45), rgba(5, 8, 16, 0.75)), url('/images/boarding_pass_header.png') no-repeat center center; background-size: cover; padding: 20px 24px; border-radius: var(--radius-md) var(--radius-md) 0 0; border-bottom: 2px solid var(--accent-purple);">
            <div class="ticket-brand" style="font-weight: 800; font-size: 16px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 22px; height: 22px;">
                <path d="M10 6C10 4.34315 11.3431 3 13 3H19C20.6569 3 22 4.34315 22 6V8H26C27.6569 8 29 9.34315 29 11V25C29 27.2091 27.2091 29 25 29H7C4.79086 29 3 27.2091 3 25V11C3 9.34315 4.34315 8 6 8H10V6ZM12 6V8H20V6C20 5.44772 19.5523 5 19 5H13C12.4477 5 12 5.44772 12 6ZM8 12C7.44772 12 7 12.4477 7 13V24C7 24.5523 7.44772 25 8 25C8.55228 25 9 24.5523 9 24V13C9 12.4477 8.55228 12 8 12ZM24 12C23.4477 12 23 12.4477 23 13V24C23 24.5523 23.4477 25 24 25C24.5523 25 25 24.5523 25 24V13C25 12.4477 24.5523 12 24 12Z" fill="url(#tkt-logo-grad)" />
                <path d="M16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11ZM16 19.5C14.067 19.5 12.5 17.933 12.5 16C12.5 14.067 14.067 12.5 16 12.5C17.933 12.5 19.5 14.067 19.5 16C19.5 17.933 17.933 19.5 16 19.5Z" fill="url(#tkt-logo-grad)" />
                <path d="M5 23C10 21 22 21 27 23" stroke="url(#tkt-logo-grad)" stroke-width="2" stroke-linecap="round" />
                <defs>
                  <linearGradient id="tkt-logo-grad" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#00f2fe" />
                    <stop offset="1" stop-color="#4facfe" />
                  </linearGradient>
                </defs>
              </svg>
              <span>Pack Your Bags</span>
            </div>
            <div class="ticket-type-badge" style="text-shadow: none;">${booking.type.toUpperCase()} BOARDING PASS</div>
          </div>
          
          <div class="ticket-body">
            <div class="ticket-row">
              <div class="col">
                <span class="lbl">Travel Provider</span>
                <span class="val">${booking.provider}</span>
              </div>
              <div class="col">
                <span class="lbl">Class / Category</span>
                <span class="val">${booking.classSelected}</span>
              </div>
            </div>
            
            <div class="ticket-row route-row">
              <div class="col">
                <span class="time">${booking.departureTime}</span>
                <span class="station">${booking.origin}</span>
                <span class="date">${formatDisplayDate(booking.date)}</span>
              </div>
              <div class="path-symbol">
                <span>✈️</span>
                <div class="dash-line"></div>
              </div>
              <div class="col text-right">
                <span class="time">${booking.arrivalTime}</span>
                <span class="station">${booking.destination}</span>
                <span class="date">${formatDisplayDate(booking.date)}</span>
              </div>
            </div>
            
            <hr class="dashed-hr">
            
            <div class="ticket-row">
              <div class="col">
                <span class="lbl">Passengers</span>
                <span class="val">${booking.passengers.map((p) => p.name).join(", ")}</span>
              </div>
              <div class="col text-right">
                <span class="lbl">Seat Number(s)</span>
                <span class="val seat-highlight">${booking.seats.join(", ")}</span>
              </div>
            </div>
            
            <hr class="dashed-hr">

            <div class="ticket-footer-row">
              <div class="qr-code-wrapper">
                <div id="qrcode-canvas"></div>
                <p class="qr-caption">Scan QR at Gate / Terminal</p>
              </div>
              
              <div class="ticket-meta">
                <p>Status: <span class="status-confirmed">${booking.status}</span></p>
                <p>Date Booked: ${new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p>Support: support@packbags.com</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoice Receipt Card -->
        <div class="invoice-card card">
          <h3>Payment Receipt</h3>
          <hr>
          <div class="invoice-meta-rows">
            <p><strong>Receipt No:</strong> REC-${booking.id.split("-")[1]}</p>
            <p><strong>Payment Status:</strong> Paid (via Razorpay)</p>
            <p><strong>Mobile No:</strong> +91 ${booking.mobile}</p>
          </div>
          <hr>
          <div class="invoice-bill-list">
            <div class="bill-row">
              <span>Ticket Base Fare (${booking.seats.length} Seats)</span>
              <span>₹${booking.billing.baseFare}</span>
            </div>
            ${
              booking.billing.discount > 0
                ? `
              <div class="bill-row promo">
                <span>Coupon Promo Discount</span>
                <span>-₹${booking.billing.discount}</span>
              </div>
            `
                : ""
            }
            <div class="bill-row">
              <span>GST Tax (18%)</span>
              <span>₹${booking.billing.gst}</span>
            </div>
            <hr>
            <div class="bill-row grand-total">
              <span>Total Amount Paid</span>
              <span>₹${booking.billing.grandTotal}</span>
            </div>
          </div>
          
          <div class="action-buttons-invoice">
            <button id="btn-download-pdf" class="btn btn-primary btn-block">
              📥 Download Ticket PDF
            </button>
            <button id="btn-print-ticket" class="btn btn-outline btn-block" style="margin-top: 8px;">
              🖨️ Print Ticket & Invoice
            </button>
            <a href="#/my-trips" class="btn btn-outline btn-block" style="margin-top: 8px;">
              📅 Go to My Trips
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render QR Code in background
  setTimeout(() => {
    generateQRCodeImage(booking);
  }, 100);

  // Bind Print Trigger
  document.getElementById("btn-print-ticket").addEventListener("click", () => {
    window.print();
  });

  // Bind Download PDF Trigger
  document.getElementById("btn-download-pdf").addEventListener("click", async () => {
    const downloadBtn = document.getElementById("btn-download-pdf");
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = "Generating PDF...";
    downloadBtn.setAttribute("disabled", "true");

    const element = document.getElementById("ticket-pass-print");
    try {
      const options = {
        margin: 5,
        filename: `${booking.id}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 1.8, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      if (window.useSupabase) {
        // Direct link to public Supabase Storage bucket
        const publicUrl = `https://${window.SUPABASE_URL.split("//")[1]}/storage/v1/object/public/tickets/${booking.id}.pdf`;
        window.open(publicUrl, "_blank");
      } else {
        // Fallback local download using html2pdf
        await html2pdf().set(options).from(element).save();
      }
    } catch (err) {
      console.error("PDF generation failed: ", err);
      showNotification("PDF download failed. Try printing instead.", "error");
    } finally {
      downloadBtn.innerHTML = originalText;
      downloadBtn.removeAttribute("disabled");
    }
  });

  // Trigger background upload if Supabase is connected
  if (window.useSupabase) {
    generateAndUploadTicketPDF(booking);
  }
}

// Background compiler that pushes ticket PDFs to Supabase tickets bucket
async function generateAndUploadTicketPDF(booking) {
  if (!window.useSupabase || !window.supabaseClient) return;

  // Wait to ensure QR Code rendering completes
  setTimeout(async () => {
    const element = document.getElementById("ticket-pass-print");
    if (!element) return;

    try {
      const options = {
        margin: 5,
        filename: `${booking.id}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      // Generate PDF blob
      const pdfBlob = await html2pdf().set(options).from(element).output("blob");

      // Upload PDF to Supabase Storage tickets bucket
      const { data, error } = await window.supabaseClient.storage.from("tickets").upload(`${booking.id}.pdf`, pdfBlob, {
        contentType: "application/pdf",
        upsert: true
      });

      if (error) throw error;
      console.log("Supabase Storage: Ticket PDF uploaded to cloud: ", data.path);
    } catch (err) {
      console.error("Supabase Storage: Failed to upload ticket PDF: ", err);
    }
  }, 1500);
}

// Render dynamic QR code container using QRCode CDN
function generateQRCodeImage(booking) {
  const qrContainer = document.getElementById("qrcode-canvas");
  if (!qrContainer) return;

  qrContainer.innerHTML = ""; // Clear

  const qrText = `BookingID: ${booking.id}\nProvider: ${booking.provider}\nRoute: ${booking.origin} to ${booking.destination}\nSeats: ${booking.seats.join(",")}\nDate: ${booking.date}`;

  try {
    // Check if QRCode is available from script library
    if (typeof QRCode !== "undefined") {
      new QRCode(qrContainer, {
        text: qrText,
        width: 110,
        height: 110,
        colorDark: "#1a202c",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      // Fallback if library offline: Google Chart API QR Generator
      qrContainer.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrText)}" alt="QR Code" width="110" height="110">
      `;
    }
  } catch (err) {
    console.error("Failed to render QR Code library", err);
    qrContainer.innerHTML = `<span style="font-size:10px;color:red;">QR Error</span>`;
  }
}

// Celebration confetti wrapper
function triggerConfetticelebration() {
  try {
    if (typeof confetti !== "undefined") {
      // Direct call to Canvas-Confetti library
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  } catch (err) {
    console.log("Confetti library not loaded or failing", err);
  }
}
