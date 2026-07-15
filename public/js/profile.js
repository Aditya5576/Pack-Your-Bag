// profile.js - Profile management, saved passengers, and booking cancellation engine

// Renders user details and saved passenger profile lists
async function initProfileView() {
  const appView = document.getElementById("app-view");
  const state = window.appState;

  let saved = [];
  try {
    saved = await window.dbAPI.getPassengers();
  } catch (err) {
    console.error("Failed to load saved passenger profiles: ", err);
  }

  renderProfileUI(saved);
  bindProfileEvents(saved);

  function renderProfileUI(saved) {
    appView.innerHTML = `
      <div class="profile-page-container container">
        <div class="profile-layout-grid">
          <!-- Profile info card -->
          <div class="card profile-info-card">
            <div class="avatar-large">AP</div>
            <h3>${state.currentUser.name}</h3>
            <p class="text-muted">Traveler since 2026</p>
            <hr>
            
            <form id="edit-profile-form">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="prof-email" class="form-control" value="${state.currentUser.email}" required>
              </div>
              <div class="form-group">
                <label>Mobile Number</label>
                <input type="tel" id="prof-mobile" class="form-control" value="${state.currentUser.mobile}" required pattern="[0-9]{10}">
              </div>
              <button type="submit" class="btn btn-primary btn-block">Save Profile Changes</button>
            </form>

            <!-- Resend API Integration Settings -->
            <div class="resend-api-card" style="margin-top: 25px; padding-top: 20px; border-top: 1px dashed rgba(255,255,255,0.08);">
              <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                📧 Email Invoice Settings
              </h4>
              <p class="text-muted" style="font-size: 11px; margin-bottom: 12px; line-height: 1.4;">
                Configure a **Resend API Key** to receive stay vouchers & payment invoice receipts directly to your email.
              </p>
              <form id="resend-api-form">
                <div class="form-group">
                  <label style="font-size: 11px;">Resend API Key</label>
                  <input type="password" id="resend-api-key" class="form-control" placeholder="re_123456789..." value="${localStorage.getItem('RESEND_API_KEY') || ''}" style="padding: 8px 12px; font-size: 13px;">
                </div>
                <button type="submit" class="btn btn-secondary btn-block btn-sm" style="margin-top: 8px;">Save API Key</button>
              </form>
            </div>
          </div>

          <!-- Saved Passengers List -->
          <div class="card saved-passengers-card">
            <div class="card-header-row">
              <h3>Saved Passenger Profiles</h3>
              <button id="btn-show-add-pax" class="btn btn-secondary btn-sm">＋ Add Profile</button>
            </div>
            
            <!-- Add Passenger Form (collapsed by default) -->
            <div class="add-passenger-panel glass" id="add-passenger-panel" style="display: none;">
              <h4>Add New Passenger</h4>
              <form id="add-passenger-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="add-p-name" class="form-control" required placeholder="Enter name">
                  </div>
                  <div class="form-group">
                    <label>Age</label>
                    <input type="number" id="add-p-age" class="form-control" required min="1" max="120" placeholder="Age">
                  </div>
                  <div class="form-group">
                    <label>Gender</label>
                    <select id="add-p-gender" class="form-control">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div class="action-row">
                  <button type="button" id="btn-cancel-pax-add" class="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" class="btn btn-primary btn-sm">Save Passenger</button>
                </div>
              </form>
            </div>

            <div class="saved-passengers-list">
              ${saved
                .map(
                  (p) => `
                <div class="passenger-item-row">
                  <div class="pax-details">
                    <strong>${p.name}</strong>
                    <span>Age: ${p.age} | Gender: ${p.gender}</span>
                  </div>
                  <button class="btn-delete-pax btn-danger-link" data-id="${p.id}">Remove</button>
                </div>
              `
                )
                .join("")}

              ${
                saved.length === 0
                  ? `
                <div class="empty-state-pax text-center">
                  <p class="text-muted">No saved passenger profiles. Add one above to autofill during checkout.</p>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindProfileEvents(saved) {
    const editForm = document.getElementById("edit-profile-form");
    const showAddBtn = document.getElementById("btn-show-add-pax");
    const addPanel = document.getElementById("add-passenger-panel");
    const addForm = document.getElementById("add-passenger-form");
    const cancelAddBtn = document.getElementById("btn-cancel-pax-add");

    // Save Profile modifications
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailVal = document.getElementById("prof-email").value.trim();
      const mobileVal = document.getElementById("prof-mobile").value.trim();

      state.currentUser.email = emailVal;
      state.currentUser.mobile = mobileVal;

      showNotification("Profile details saved successfully!", "success");
    });

    // Save Resend API settings
    const resendForm = document.getElementById("resend-api-form");
    resendForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const apiKeyVal = document.getElementById("resend-api-key").value.trim();
      if (apiKeyVal) {
        localStorage.setItem("RESEND_API_KEY", apiKeyVal);
        showNotification("Resend API Key saved successfully! Emails are enabled.", "success");
      } else {
        localStorage.removeItem("RESEND_API_KEY");
        showNotification("Resend API Key removed. Emails are disabled.", "info");
      }
    });

    // Toggle add form
    showAddBtn.addEventListener("click", () => {
      addPanel.style.display = "block";
    });

    cancelAddBtn.addEventListener("click", () => {
      addPanel.style.display = "none";
      addForm.reset();
    });

    // Save passenger profiles
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pName = document.getElementById("add-p-name").value.trim();
      const pAge = parseInt(document.getElementById("add-p-age").value);
      const pGender = document.getElementById("add-p-gender").value;

      const newPax = {
        id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
        name: pName,
        age: pAge,
        gender: pGender
      };

      try {
        await window.dbAPI.addPassenger(newPax);
        // Sync local cache
        state.currentUser.savedPassengers.push(newPax);
        showNotification(`${pName} added to saved passenger list!`, "success");
      } catch (err) {
        console.error("Failed to add passenger: ", err);
      }

      // Refresh views
      await initProfileView();
    });

    // Delete passenger profile
    document.querySelectorAll(".btn-delete-pax").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        try {
          await window.dbAPI.deletePassenger(id);
          state.currentUser.savedPassengers = state.currentUser.savedPassengers.filter((p) => p.id !== id);
          showNotification("Passenger profile removed.", "info");
        } catch (err) {
          console.error("Failed to delete passenger: ", err);
        }
        await initProfileView();
      });
    });
  }
}

// Renders the My Trips bookings list and refund modals
async function initMyTripsView() {
  const appView = document.getElementById("app-view");

  let bookings = [];
  try {
    bookings = await window.dbAPI.getBookings();
  } catch (err) {
    console.error("Failed to retrieve user bookings: ", err);
  }

  // Sort bookings: Newest booking date first
  bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

  const todayStr = new Date().toISOString().split("T")[0];

  // Categorize bookings
  const upcoming = bookings.filter((b) => b.status === "Confirmed" && b.date >= todayStr);
  const past = bookings.filter((b) => b.status === "Confirmed" && b.date < todayStr);
  const cancelled = bookings.filter((b) => b.status === "Cancelled");

  renderMyTripsUI();
  bindMyTripsEvents();

  function renderMyTripsUI() {
    appView.innerHTML = `
      <div class="my-trips-page container">
        <h2 class="page-title">My Journeys</h2>
        
        <div class="trips-tabs-wrapper">
          <div class="trips-tabs">
            <button class="trips-tab active" data-target="upcoming-trips-list">Upcoming Trips (${upcoming.length})</button>
            <button class="trips-tab" data-target="completed-trips-list">Completed Trips (${past.length})</button>
            <button class="trips-tab" data-target="cancelled-trips-list">Cancelled (${cancelled.length})</button>
          </div>
        </div>

        <!-- Upcoming Trips -->
        <div class="trips-content-panel" id="upcoming-trips-list">
          ${upcoming.length === 0 ? renderEmptyTripsState("No upcoming trips booked.") : upcoming.map((b) => renderTripCard(b, true)).join("")}
        </div>

        <!-- Completed Trips -->
        <div class="trips-content-panel" id="completed-trips-list" style="display:none;">
          ${past.length === 0 ? renderEmptyTripsState("No past trips found.") : past.map((b) => renderTripCard(b, false)).join("")}
        </div>

        <!-- Cancelled Trips -->
        <div class="trips-content-panel" id="cancelled-trips-list" style="display:none;">
          ${cancelled.length === 0 ? renderEmptyTripsState("No cancelled trips.") : cancelled.map((b) => renderTripCard(b, false)).join("")}
        </div>
      </div>

      <!-- Cancellation Confirmation Modal overlay -->
      <div class="payment-modal-overlay" id="cancel-modal-overlay" style="display: none;">
        <div class="cancel-modal-box">
          <div class="cancel-modal-header">
            <h4>Cancel Booking</h4>
          </div>
          <div class="cancel-modal-body">
            <p>Are you sure you want to cancel your ticket for booking <strong id="cancel-booking-id">ID</strong>?</p>
            <p class="text-danger">A standard cancellation penalty of 10% applies. Refund value: <strong id="cancel-refund-amount">₹0</strong></p>
            <p>The refunded amount will be credited back to your original source of payment (Razorpay) in 3-5 business days.</p>
          </div>
          <div class="cancel-modal-footer">
            <button class="btn btn-outline" id="btn-abort-cancellation">Abort</button>
            <button class="btn btn-danger" id="btn-confirm-cancellation">Yes, Cancel Booking</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmptyTripsState(message) {
    return `
      <div class="empty-trips-card card text-center">
        <span class="empty-icon">🎒</span>
        <h3>${message}</h3>
        <p>Start exploring flights, trains, and bus rides now.</p>
        <a href="#/" class="btn btn-primary">Plan a Trip</a>
      </div>
    `;
  }

  function renderTripCard(booking, isUpcoming) {
    if (booking.bookingType === "hotel") {
      return `
        <div class="trip-ticket-summary card">
          <div class="trip-summary-header">
            <span class="provider-tag" style="background: var(--secondary-gradient); color: white;">🏨 ${booking.hotelName}</span>
            <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
          </div>
          
          <div class="trip-summary-body">
            <div class="trip-summary-locations">
              <div>
                <h4>Check-In</h4>
                <p>${formatDisplayDate(booking.checkIn)}</p>
              </div>
              <div class="trip-path-arrow">➔</div>
              <div>
                <h4>Check-Out</h4>
                <p>${formatDisplayDate(booking.checkOut)}</p>
              </div>
            </div>
            
            <div class="trip-summary-details">
              <p><strong>Room Stay:</strong> ${booking.roomType}</p>
              <p><strong>Guest(s):</strong> ${booking.passengers.map((p) => p.name).join(", ")}</p>
              <p><strong>OTA Partner:</strong> ${booking.platform.toUpperCase()}</p>
            </div>
            
            <div class="trip-summary-pricing">
              <p><strong>Total Paid:</strong> ₹${booking.billing.grandTotal}</p>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
            </div>
          </div>
          
          <div class="trip-summary-footer">
            ${
              booking.status === "Confirmed"
                ? `
              <a href="#/hotel-voucher?bookingId=${booking.id}" class="btn btn-outline btn-sm">View Voucher</a>
            `
                : ""
            }
            ${
              isUpcoming && booking.status === "Confirmed"
                ? `
              <button class="btn btn-danger btn-sm btn-trigger-cancel" data-id="${booking.id}" data-total="${booking.billing.grandTotal}">
                Cancel Stay
              </button>
            `
                : ""
            }
          </div>
        </div>
      `;
    }

    return `
      <div class="trip-ticket-summary card">
        <div class="trip-summary-header">
          <span class="provider-tag">${booking.provider} (Transport)</span>
          <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
        </div>
        
        <div class="trip-summary-body">
          <div class="trip-summary-locations">
            <div>
              <h4>${booking.departureTime}</h4>
              <p>${booking.origin}</p>
            </div>
            <div class="trip-path-arrow">➔</div>
            <div>
              <h4>${booking.arrivalTime}</h4>
              <p>${booking.destination}</p>
            </div>
          </div>
          
          <div class="trip-summary-details">
            <p><strong>Travel Date:</strong> ${formatDisplayDate(booking.date)}</p>
            <p><strong>Passenger(s):</strong> ${booking.passengers.map((p) => p.name).join(", ")}</p>
            <p><strong>Seat(s):</strong> ${booking.seats.join(", ")}</p>
          </div>
          
          <div class="trip-summary-pricing">
            <p><strong>Total Paid:</strong> ₹${booking.billing.grandTotal}</p>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
          </div>
        </div>
        
        <div class="trip-summary-footer">
          ${
            booking.status === "Confirmed"
              ? `
            <a href="#/ticket?bookingId=${booking.id}" class="btn btn-outline btn-sm">View Ticket</a>
          `
              : ""
          }
          ${
            isUpcoming && booking.status === "Confirmed"
              ? `
            <button class="btn btn-danger btn-sm btn-trigger-cancel" data-id="${booking.id}" data-total="${booking.billing.grandTotal}">
              Cancel Journey
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  function bindMyTripsEvents() {
    // Tabs clicking
    const tabs = document.querySelectorAll(".trips-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        tabs.forEach((t) => t.classList.remove("active"));
        e.currentTarget.classList.add("active");

        const targetId = e.currentTarget.getAttribute("data-target");
        document.querySelectorAll(".trips-content-panel").forEach((panel) => {
          panel.style.display = "none";
        });
        document.getElementById(targetId).style.display = "block";
      });
    });

    // Cancellation modals triggering
    let selectedBookingId = null;
    let selectedBookingRefund = 0;

    document.querySelectorAll(".btn-trigger-cancel").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        selectedBookingId = e.currentTarget.getAttribute("data-id");
        const total = parseFloat(e.currentTarget.getAttribute("data-total"));
        selectedBookingRefund = Math.floor(total * 0.9); // 10% penalty deduction

        document.getElementById("cancel-booking-id").textContent = selectedBookingId;
        document.getElementById("cancel-refund-amount").textContent = `₹${selectedBookingRefund}`;
        document.getElementById("cancel-modal-overlay").style.display = "flex";
      });
    });

    document.getElementById("btn-abort-cancellation").addEventListener("click", () => {
      document.getElementById("cancel-modal-overlay").style.display = "none";
    });

    document.getElementById("btn-confirm-cancellation").addEventListener("click", async () => {
      document.getElementById("cancel-modal-overlay").style.display = "none";
      if (!selectedBookingId) return;

      let booking = null;
      try {
        booking = await window.dbAPI.getBookingById(selectedBookingId);
      } catch (err) {
        console.error("Failed to load booking: ", err);
      }

      if (booking) {
        if (booking.bookingType === "hotel") {
          try {
            await window.dbAPI.cancelBooking(selectedBookingId, null, null, null);
            showNotification(
              `Refund of ₹${selectedBookingRefund} initiated successfully! Ref: RZP-REF-9923`,
              "success"
            );
          } catch (err) {
            console.error("Failed to cancel: ", err);
            showNotification("Cancellation failed.", "error");
          }
          await initMyTripsView();
          return;
        }

        // Fetch corresponding route to free seat map
        let route = null;
        if (window.useSupabase) {
          try {
            const { data, error } = await window.supabaseClient.from("routes").select("*").eq("id", booking.tripId);
            if (!error && data.length > 0) {
              route = data[0];
            }
          } catch (err) {
            console.error("Failed to load route: ", err);
          }
        } else {
          const db = getDB();
          route = db.routes.find((r) => r.id === booking.tripId);
        }

        if (route) {
          const updatedLayout = [...(route.seat_layout || route.seatLayout)];
          booking.seats.forEach((seatNo) => {
            let seatIdx = -1;
            if (booking.type === "bus") {
              const row = parseInt(seatNo) - 1;
              const col = ["A", "B", "C", "D"].indexOf(seatNo.slice(-1));
              seatIdx = row * 4 + col;
            } else if (booking.type === "train") {
              seatIdx = parseInt(seatNo.split("-")[0]) - 1;
            } else if (booking.type === "flight") {
              const row = parseInt(seatNo) - 1;
              const col = ["A", "B", "C", "D", "E", "F"].indexOf(seatNo.slice(-1));
              seatIdx = row * 6 + col;
            }
            if (seatIdx > -1) {
              updatedLayout[seatIdx] = null; // Free seat
            }
          });

          const seatsLeft = Math.min(
            route.seats_total || route.seatsTotal,
            (route.seats_available || route.seatsAvailable) + booking.seats.length
          );
          try {
            await window.dbAPI.cancelBooking(selectedBookingId, booking.tripId, updatedLayout, seatsLeft);
            showNotification(
              `Refund of ₹${selectedBookingRefund} initiated successfully! Ref: RZP-REF-9923`,
              "success"
            );
          } catch (err) {
            console.error("Failed to cancel: ", err);
            showNotification("Cancellation failed.", "error");
          }
        } else {
          // Fallback if route not found
          try {
            await window.dbAPI.cancelBooking(selectedBookingId, booking.tripId, [], 0);
            showNotification(
              `Refund of ₹${selectedBookingRefund} initiated successfully! Ref: RZP-REF-9923`,
              "success"
            );
          } catch (err) {
            console.error(err);
          }
        }

        // Refresh UI lists
        await initMyTripsView();
      }
    });
  }
}
