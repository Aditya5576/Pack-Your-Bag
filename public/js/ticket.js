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
          <div class="ticket-header">
            <div class="ticket-brand">
              <span class="logo">🎒</span> Pack Your Bags
            </div>
            <div class="ticket-type-badge">${booking.type.toUpperCase()} BOARDING PASS</div>
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
