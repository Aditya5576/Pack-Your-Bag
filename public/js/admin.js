// admin.js - Admin Dashboard & Route Scheduler module
// TODO: Restrict access to the Admin Dashboard (initAdminView) to authorized administrator role accounts only (implement role checks in auth.js)

// Renders the main administration panel views
async function initAdminView() {
  const appView = document.getElementById("app-view");

  let stats = { totalRevenue: 0, totalBookingsCount: 0, totalPassengers: 0, totalRoutes: 0 };
  let routes = [];
  let bookings = [];

  try {
    stats = await window.dbAPI.getAdminStats();
    routes = await window.dbAPI.getAllRoutes();
    bookings = await window.dbAPI.getAllSystemBookings();

    // Supplement stats counts if local storage fallback returns them directly
    if (routes.length && !stats.totalRoutes) stats.totalRoutes = routes.length;
    if (bookings.length && !stats.totalBookingsCount) {
      stats.totalBookingsCount = bookings.length;
      stats.totalRevenue = bookings
        .filter((b) => b.status === "Confirmed")
        .reduce((sum, b) => sum + b.billing.grandTotal, 0);
    }
  } catch (err) {
    console.error("Failed to load admin panel data: ", err);
  }

  renderAdminUI(stats, routes, bookings);
  bindAdminEvents();

  function renderAdminUI(stats, routes, bookings) {
    appView.innerHTML = `
      <div class="admin-page-container container">
        <h2 class="page-title">Admin Control Center</h2>
        
        <!-- Metrics Stats Grid -->
        <div class="metrics-grid">
          <div class="metric-card card">
            <span class="m-icon">💰</span>
            <div>
              <h3>₹${stats.totalRevenue}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div class="metric-card card">
            <span class="m-icon">🎫</span>
            <div>
              <h3>${stats.totalBookingsCount}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
          <div class="metric-card card">
            <span class="m-icon">👥</span>
            <div>
              <h3>${stats.totalPassengers}</h3>
              <p>Registered Travelers</p>
            </div>
          </div>
          <div class="metric-card card">
            <span class="m-icon">🗺️</span>
            <div>
              <h3>${stats.totalRoutes}</h3>
              <p>Active Schedules</p>
            </div>
          </div>
        </div>

        <!-- Management Tabs -->
        <div class="admin-tabs-wrapper">
          <div class="trips-tabs">
            <button class="admin-tab active" data-target="admin-routes-view">Route Schedule Manager</button>
            <button class="admin-tab" data-target="admin-bookings-view">System Bookings DB</button>
          </div>
        </div>

        <!-- Route Manager Panel -->
        <div class="admin-content-panel" id="admin-routes-view">
          <div class="card add-route-card">
            <h3>Add New Journey Route</h3>
            <form id="add-route-form">
              <div class="form-grid">
                <div class="form-group">
                  <label>Travel Mode</label>
                  <select id="route-type" class="form-control" required>
                    <option value="bus">🚌 Bus</option>
                    <option value="train">🚆 Train</option>
                    <option value="flight">✈️ Flight</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>Provider / Company Name</label>
                  <input type="text" id="route-provider" class="form-control" required placeholder="e.g. Indigo, Neeta Travels">
                </div>

                <div class="form-group">
                  <label>Origin</label>
                  <select id="route-origin" class="form-control" required>
                    ${CITIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
                  </select>
                </div>

                <div class="form-group">
                  <label>Destination</label>
                  <select id="route-destination" class="form-control" required>
                    ${CITIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
                  </select>
                </div>

                <div class="form-group">
                  <label>Travel Date</label>
                  <input type="date" id="route-date" class="form-control" required>
                </div>

                <div class="form-group">
                  <label>Departure Time</label>
                  <input type="time" id="route-dep-time" class="form-control" required>
                </div>

                <div class="form-group">
                  <label>Duration (e.g. 2h 30m)</label>
                  <input type="text" id="route-duration" class="form-control" required placeholder="e.g. 3h 15m">
                </div>

                <div class="form-group">
                  <label>Base Price (₹)</label>
                  <input type="number" id="route-price" class="form-control" min="1" required placeholder="e.g. 450">
                </div>
              </div>
              <div class="action-row" style="margin-top: 15px;">
                <button type="submit" class="btn btn-primary">Publish New Route</button>
              </div>
            </form>
          </div>

          <div class="card routes-table-card">
            <h3>Recent Active Routes</h3>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mode</th>
                    <th>Provider</th>
                    <th>Origin ➔ Destination</th>
                    <th>Date</th>
                    <th>Departure</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${routes
                    .slice(-15)
                    .reverse()
                    .map(
                      (r) => `
                    <tr>
                      <td>${r.id}</td>
                      <td>${r.type.toUpperCase()}</td>
                      <td>${r.provider}</td>
                      <td><strong>${r.origin}</strong> ➔ <strong>${r.destination}</strong></td>
                      <td>${r.date}</td>
                      <td>${r.departureTime || r.departure_time}</td>
                      <td>₹${r.price}</td>
                      <td>
                        <button class="btn-delete-route btn-danger-link" data-id="${r.id}">Delete</button>
                      </td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Bookings DB Panel -->
        <div class="admin-content-panel" id="admin-bookings-view" style="display:none;">
          <div class="card bookings-table-card">
            <h3>All Bookings database</h3>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Mode</th>
                    <th>Customer Contact</th>
                    <th>Route</th>
                    <th>Seats</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    bookings.length === 0
                      ? '<tr><td colspan="7" class="text-center">No bookings placed yet.</td></tr>'
                      : bookings
                          .slice()
                          .reverse()
                          .map(
                            (b) => {
                              const isHotel = b.bookingType === "hotel";
                              const modeText = isHotel ? "HOTEL" : (b.type || "transport").toUpperCase();
                              const routeText = isHotel 
                                ? `${b.hotelName} (${b.city})<br><small>In: ${b.checkIn} | Out: ${b.checkOut}</small>`
                                : `${b.origin} ➔ ${b.destination}<br><small>${b.date} (${b.departureTime || b.departure_time})</small>`;
                              const seatsText = isHotel
                                ? `${b.roomType} (${b.passengers.length} guests)`
                                : (b.seats || []).join(", ");
                              return `
                                <tr>
                                  <td><strong>${b.id}</strong></td>
                                  <td>${modeText}</td>
                                  <td>
                                    <div>${b.passengers[0]?.name || "N/A"}</div>
                                    <small class="text-muted">${b.email} | ${b.mobile}</small>
                                  </td>
                                  <td>${routeText}</td>
                                  <td>${seatsText}</td>
                                  <td>₹${b.billing.grandTotal}</td>
                                  <td>
                                    <span class="status-badge ${b.status.toLowerCase()}">${b.status}</span>
                                  </td>
                                </tr>
                              `;
                            }
                          )
                          .join("")
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  function bindAdminEvents() {
    // Tabs switching
    const tabs = document.querySelectorAll(".admin-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        tabs.forEach((t) => t.classList.remove("active"));
        e.currentTarget.classList.add("active");

        const targetId = e.currentTarget.getAttribute("data-target");
        document.querySelectorAll(".admin-content-panel").forEach((panel) => {
          panel.style.display = "none";
        });
        document.getElementById(targetId).style.display = "block";
      });
    });

    // Set default route datepicker min value to today
    const datepicker = document.getElementById("route-date");
    if (datepicker) {
      const todayStr = new Date().toISOString().split("T")[0];
      datepicker.setAttribute("min", todayStr);
      datepicker.value = todayStr;
    }

    // Submit new route form
    const addRouteForm = document.getElementById("add-route-form");
    if (addRouteForm) {
      addRouteForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const type = document.getElementById("route-type").value;
        const provider = document.getElementById("route-provider").value.trim();
        const origin = document.getElementById("route-origin").value;
        const destination = document.getElementById("route-destination").value;
        const date = document.getElementById("route-date").value;
        const depTime = document.getElementById("route-dep-time").value;
        const duration = document.getElementById("route-duration").value.trim();
        const price = parseInt(document.getElementById("route-price").value);

        if (origin === destination) {
          showNotification("Origin and destination cannot be the same.", "error");
          return;
        }

        // Calculate arrival time dynamically based on departure + duration
        const depParts = depTime.split(":");
        let depHour = parseInt(depParts[0]);
        let depMin = parseInt(depParts[1]);

        // Simple duration parser: e.g. "3h 15m" or just "2h"
        let durHour = 2;
        let durMin = 0;
        const hourMatch = duration.match(/(\d+)\s*h/);
        const minMatch = duration.match(/(\d+)\s*m/);
        if (hourMatch) durHour = parseInt(hourMatch[1]);
        if (minMatch) durMin = parseInt(minMatch[1]);

        let arrHour = (depHour + durHour) % 24;
        let arrMin = depMin + durMin;
        if (arrMin >= 60) {
          arrHour = (arrHour + 1) % 24;
          arrMin = arrMin - 60;
        }
        const arrTime = `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`;

        // Create route record
        const prefix = type === "bus" ? "BUS" : type === "train" ? "TRN" : "FLT";
        const totalSeats = type === "bus" ? 40 : type === "train" ? 72 : 180;

        const newRoute = {
          id: `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`,
          type,
          provider,
          rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
          amenities:
            type === "bus"
              ? ["AC", "Charging Port"]
              : type === "train"
                ? ["AC"]
                : ["Cabin Baggage 7kg", "Check-in Baggage 15kg"],
          origin,
          destination,
          date,
          departure_time: depTime,
          departureTime: depTime,
          arrival_time: arrTime,
          arrivalTime: arrTime,
          duration,
          price,
          seats_total: totalSeats,
          seatsTotal: totalSeats,
          seats_available: totalSeats,
          seatsAvailable: totalSeats,
          seat_layout: Array(totalSeats).fill(null),
          seatLayout: Array(totalSeats).fill(null)
        };

        try {
          await window.dbAPI.addRoute(newRoute);
          showNotification(`New ${type.toUpperCase()} route successfully added!`, "success");
        } catch (err) {
          console.error("Failed to add route: ", err);
          showNotification("Failed to add route.", "error");
        }

        // Refresh UI
        await initAdminView();
      });
    }

    // Delete route handler
    document.querySelectorAll(".btn-delete-route").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        try {
          await window.dbAPI.deleteRoute(id);
          showNotification("Route schedule deleted from database.", "info");
        } catch (err) {
          console.error("Failed to delete route: ", err);
          showNotification("Failed to delete route.", "error");
        }
        await initAdminView();
      });
    });
  }
}
