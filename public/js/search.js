// search.js - Home Landing & Travel Discovery Search module

// Renders the main home booking search form
function initHomeView() {
  const appView = document.getElementById("app-view");
  const searchState = window.appState.currentSearch;

  // Set default tomorrow date if empty
  if (!searchState.date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    searchState.date = tomorrow.toISOString().split("T")[0];
  }

  appView.innerHTML = `
    <!-- Hero Header Banner -->
    <section class="hero-banner">
      <div class="hero-content">
        <h1>Simplify Your Journey</h1>
        <p>Book tickets for Buses, Trains, and Flights in a single click</p>
      </div>
      <div class="hero-background-art"></div>
    </section>

    <!-- Search Engine Container -->
    <section class="search-section container">
      <div class="search-card">
        <!-- Travel Mode Selector Tabs -->
        <div class="mode-tabs">
          <button class="mode-tab ${searchState.type === "bus" ? "active" : ""}" data-mode="bus">
            <span class="icon">🚌</span> Bus
          </button>
          <button class="mode-tab ${searchState.type === "train" ? "active" : ""}" data-mode="train">
            <span class="icon">🚆</span> Train
          </button>
          <button class="mode-tab ${searchState.type === "flight" ? "active" : ""}" data-mode="flight">
            <span class="icon">✈️</span> Flight
          </button>
        </div>

        <!-- Search Input Controls -->
        <div class="search-form-grid">
          <!-- From Field -->
          <div class="input-group-wrapper">
            <label for="search-from">From</label>
            <div class="input-with-icon">
              <span class="input-icon">📍</span>
              <input type="text" id="search-from" placeholder="Origin City" value="${searchState.from}" autocomplete="off">
            </div>
            <div class="autocomplete-list" id="from-autocomplete"></div>
          </div>

          <!-- Swap Button -->
          <button id="btn-swap-cities" class="btn-swap" title="Swap Cities">↔</button>

          <!-- To Field -->
          <div class="input-group-wrapper">
            <label for="search-to">To</label>
            <div class="input-with-icon">
              <span class="input-icon">🏁</span>
              <input type="text" id="search-to" placeholder="Destination City" value="${searchState.to}" autocomplete="off">
            </div>
            <div class="autocomplete-list" id="to-autocomplete"></div>
          </div>

          <!-- Date Field -->
          <div class="input-group-wrapper">
            <label for="search-date">Departure Date</label>
            <div class="input-with-icon">
              <span class="input-icon">📅</span>
              <input type="date" id="search-date" value="${searchState.date}">
            </div>
          </div>

          <!-- Passengers Count -->
          <div class="input-group-wrapper">
            <label for="search-passengers">Passengers</label>
            <div class="input-with-icon">
              <span class="input-icon">👥</span>
              <input type="number" id="search-passengers" min="1" max="10" value="${searchState.passengers}">
            </div>
          </div>
        </div>

        <div class="search-action-row">
          <button id="btn-main-search" class="btn btn-primary btn-lg">Search Journeys</button>
        </div>
      </div>
    </section>

    <!-- Recent Promotional Offers Section -->
    <section class="offers-section container">
      <h2 class="section-title">Special Offers For You</h2>
      <div class="offers-grid">
        <div class="offer-card glass">
          <div class="offer-badge">20% OFF</div>
          <h3>Pack Your Bags Launch</h3>
          <p>Get up to ₹500 off on any bookings using coupon code <strong>PACKBAGS20</strong></p>
        </div>
        <div class="offer-card glass">
          <div class="offer-badge">FLAT ₹150</div>
          <h3>First Journey Discount</h3>
          <p>Save flat ₹150 on your very first trip with code <strong>FIRSTTRIP</strong></p>
        </div>
        <div class="offer-card glass">
          <div class="offer-badge">FLIGHT PROMO</div>
          <h3>Fly High Savings</h3>
          <p>Get 15% discount on flight bookings. Code: <strong>SUPERFLIGHT</strong></p>
        </div>
      </div>
    </section>
  `;

  // Bind UI Events
  bindHomeEvents();
}

function bindHomeEvents() {
  const fromInput = document.getElementById("search-from");
  const toInput = document.getElementById("search-to");
  const dateInput = document.getElementById("search-date");
  const paxInput = document.getElementById("search-passengers");
  const swapBtn = document.getElementById("btn-swap-cities");
  const searchBtn = document.getElementById("btn-main-search");

  // Set min date for datepicker to today
  const todayStr = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", todayStr);

  // Tab selections
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      document.querySelectorAll(".mode-tab").forEach((t) => t.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      window.appState.currentSearch.type = target.getAttribute("data-mode");
    });
  });

  // Autocomplete bindings
  setupAutocomplete(fromInput, document.getElementById("from-autocomplete"));
  setupAutocomplete(toInput, document.getElementById("to-autocomplete"));

  // Swap button
  swapBtn.addEventListener("click", () => {
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
    window.appState.currentSearch.from = fromInput.value;
    window.appState.currentSearch.to = toInput.value;
  });

  // Save changes to state on input
  fromInput.addEventListener("input", (e) => {
    window.appState.currentSearch.from = e.target.value;
  });
  toInput.addEventListener("input", (e) => {
    window.appState.currentSearch.to = e.target.value;
  });
  dateInput.addEventListener("change", (e) => {
    window.appState.currentSearch.date = e.target.value;
  });
  paxInput.addEventListener("change", (e) => {
    window.appState.currentSearch.passengers = parseInt(e.target.value) || 1;
  });

  // Main search action
  searchBtn.addEventListener("click", () => {
    const searchVal = window.appState.currentSearch;

    // Validations
    if (!searchVal.from.trim()) {
      showNotification("Please enter an origin city.", "error");
      fromInput.focus();
      return;
    }
    if (!searchVal.to.trim()) {
      showNotification("Please enter a destination city.", "error");
      toInput.focus();
      return;
    }
    if (!CITIES.map((c) => c.toLowerCase()).includes(searchVal.from.trim().toLowerCase())) {
      showNotification(`Origin city is invalid. Select from: ${CITIES.join(", ")}`, "error");
      return;
    }
    if (!CITIES.map((c) => c.toLowerCase()).includes(searchVal.to.trim().toLowerCase())) {
      showNotification(`Destination city is invalid. Select from: ${CITIES.join(", ")}`, "error");
      return;
    }
    if (searchVal.from.trim().toLowerCase() === searchVal.to.trim().toLowerCase()) {
      showNotification("Origin and destination cities cannot be the same.", "error");
      return;
    }
    if (!searchVal.date) {
      showNotification("Please select a departure date.", "error");
      return;
    }
    if (searchVal.passengers < 1 || searchVal.passengers > 10) {
      showNotification("Passengers count must be between 1 and 10.", "error");
      return;
    }

    // Format inputs to Title Case matching database
    window.appState.currentSearch.from = CITIES.find((c) => c.toLowerCase() === searchVal.from.trim().toLowerCase());
    window.appState.currentSearch.to = CITIES.find((c) => c.toLowerCase() === searchVal.to.trim().toLowerCase());

    // Redirect to search view (dynamic seeding is handled by dbAPI)
    navigateTo("#/search");
  });
}

// Setup simple click list autocomplete
function setupAutocomplete(inputEl, listEl) {
  inputEl.addEventListener("focus", showList);
  inputEl.addEventListener("input", showList);

  // Close list when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target !== inputEl && e.target !== listEl) {
      listEl.style.display = "none";
    }
  });

  function showList() {
    const val = inputEl.value.toLowerCase();
    const matches = CITIES.filter((city) => city.toLowerCase().includes(val));

    if (matches.length > 0) {
      listEl.innerHTML = matches.map((city) => `<div class="autocomplete-item">${city}</div>`).join("");
      listEl.style.display = "block";

      listEl.querySelectorAll(".autocomplete-item").forEach((item) => {
        item.addEventListener("click", () => {
          inputEl.value = item.textContent;
          inputEl.dispatchEvent(new Event("input"));
          listEl.style.display = "none";
        });
      });
    } else {
      listEl.style.display = "none";
    }
  }
}

// Renders the Available Results Search View
async function initSearchView() {
  const appView = document.getElementById("app-view");
  const searchState = window.appState.currentSearch;

  if (!searchState.from || !searchState.to || !searchState.date) {
    // If accessed directly without valid search state, redirect home
    navigateTo("#/");
    return;
  }

  // Fetch from Database API (Supabase Cloud or LocalStorage fallback)
  let filteredTrips = [];
  try {
    filteredTrips = await window.dbAPI.getRoutes(searchState.type, searchState.from, searchState.to, searchState.date);
  } catch (err) {
    console.error("Error loading route details: ", err);
  }

  // Default filters state
  let priceFilterVal = 10000;
  let operatorsFilter = [];
  let sortCriteria = "earliest"; // earliest, cheapest, fastest

  renderResultsUI();

  // Primary rendering helper
  function renderResultsUI() {
    // Generate operators listing for filters
    const availableOperators = [...new Set(filteredTrips.map((t) => t.provider))];

    // Apply client side filters
    let displayTrips = filteredTrips.filter(
      (trip) =>
        trip.price <= priceFilterVal && (operatorsFilter.length === 0 || operatorsFilter.includes(trip.provider))
    );

    // Apply sorting
    if (sortCriteria === "cheapest") {
      displayTrips.sort((a, b) => a.price - b.price);
    } else if (sortCriteria === "earliest") {
      displayTrips.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } else if (sortCriteria === "fastest") {
      displayTrips.sort((a, b) => {
        const getMins = (durStr) => {
          const parts = durStr.split(" ");
          const h = parseInt(parts[0]) || 0;
          const m = parseInt(parts[1]) || 0;
          return h * 60 + m;
        };
        return getMins(a.duration) - getMins(b.duration);
      });
    }

    appView.innerHTML = `
      <div class="search-results-page container">
        <!-- Search Info bar -->
        <div class="search-header-summary card">
          <div class="summary-details">
            <span class="trip-icon">
              ${searchState.type === "bus" ? "🚌" : searchState.type === "train" ? "🚆" : "✈️"}
            </span>
            <div>
              <h3>${searchState.from} to ${searchState.to}</h3>
              <p>${formatDisplayDate(searchState.date)} | ${searchState.passengers} Passenger(s)</p>
            </div>
          </div>
          <button onclick="window.location.hash='#/'" class="btn btn-outline btn-sm">Modify Search</button>
        </div>

        <div class="results-layout">
          <!-- Sidebar Filters -->
          <aside class="results-filters card">
            <div class="filter-group">
              <h4>Sort By</h4>
              <select id="sort-selector" class="form-control">
                <option value="earliest" ${sortCriteria === "earliest" ? "selected" : ""}>Earliest Departure</option>
                <option value="cheapest" ${sortCriteria === "cheapest" ? "selected" : ""}>Cheapest Price</option>
                <option value="fastest" ${sortCriteria === "fastest" ? "selected" : ""}>Fastest Duration</option>
              </select>
            </div>

            <hr>

            <div class="filter-group">
              <h4>Max Price: ₹<span id="price-val">${priceFilterVal}</span></h4>
              <input type="range" id="price-range" min="100" max="10000" step="50" value="${priceFilterVal}" class="range-slider">
            </div>

            <hr>

            <div class="filter-group">
              <h4>Travel Operators</h4>
              <div class="checkbox-list">
                ${availableOperators
                  .map(
                    (op) => `
                  <label class="checkbox-label">
                    <input type="checkbox" class="filter-op-check" value="${op}" ${operatorsFilter.includes(op) ? "checked" : ""}>
                    ${op}
                  </label>
                `
                  )
                  .join("")}
                ${availableOperators.length === 0 ? '<p class="text-muted">No operators</p>' : ""}
              </div>
            </div>
          </aside>

          <!-- Main results list -->
          <main class="results-list-wrapper">
            <h4 class="results-count">${displayTrips.length} options found</h4>
            
            <div class="results-list">
              ${displayTrips
                .map(
                  (trip) => `
                <div class="trip-result-card card hover-trigger">
                  <div class="trip-card-main">
                    <!-- Operator Column -->
                    <div class="col-provider">
                      <div class="provider-logo-box">
                        ${searchState.type === "bus" ? "🚌" : searchState.type === "train" ? "🚆" : "✈️"}
                      </div>
                      <div>
                        <h4 class="provider-name">${trip.provider}</h4>
                        ${trip.classSelected ? `<span class="badge badge-secondary">${trip.classSelected}</span>` : ""}
                        <div class="rating-stars">★ ${trip.rating.toFixed(1)}</div>
                      </div>
                    </div>

                    <!-- Timings Column -->
                    <div class="col-timings">
                      <div class="time-block">
                        <span class="time">${trip.departureTime}</span>
                        <span class="station">${trip.origin}</span>
                      </div>
                      <div class="duration-path">
                        <span class="duration-text">${trip.duration}</span>
                        <div class="path-line"></div>
                        <span class="stops-text">Direct</span>
                      </div>
                      <div class="time-block">
                        <span class="time">${trip.arrivalTime}</span>
                        <span class="station">${trip.destination}</span>
                      </div>
                    </div>

                    <!-- Price / Booking Action Column -->
                    <div class="col-price-action">
                      <div class="price-section">
                        <span class="price-label">Fare starting at</span>
                        <span class="price">₹${trip.price}</span>
                        <span class="tax-info">+ GST (18%)</span>
                      </div>
                      <div class="seat-warning ${trip.seatsAvailable <= 5 ? "critical" : ""}">
                        ${trip.seatsAvailable} seats left
                      </div>
                      <button class="btn btn-primary btn-select-trip" data-trip-id="${trip.id}">
                        Select
                      </button>
                    </div>
                  </div>

                  <!-- Amenities Bar -->
                  <div class="trip-card-amenities">
                    <div class="amenities-list">
                      ${trip.amenities.map((amenity) => `<span class="amenity-pill">${amenity}</span>`).join("")}
                    </div>
                  </div>
                </div>
              `
                )
                .join("")}

              ${
                displayTrips.length === 0
                  ? `
                <div class="no-results-box card">
                  <span class="empty-icon">🔍</span>
                  <h3>No journeys match your filters</h3>
                  <p>Try expanding your price range or selecting different operators.</p>
                  <button id="btn-clear-filters" class="btn btn-outline">Reset Filters</button>
                </div>
              `
                  : ""
              }
            </div>
          </main>
        </div>
      </div>
    `;

    bindResultsEvents();
  }

  function bindResultsEvents() {
    // Select Trip handler
    document.querySelectorAll(".btn-select-trip").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tripId = e.currentTarget.getAttribute("data-trip-id");
        const selected = filteredTrips.find((t) => t.id === tripId);

        // Save to state
        window.appState.selectedTrip = selected;
        window.appState.selectedSeats = [];
        window.appState.passengersDetails = [];
        window.appState.appliedCoupon = null;

        navigateTo("#/seat-selection");
      });
    });

    // Sorting event
    const sortSel = document.getElementById("sort-selector");
    if (sortSel) {
      sortSel.addEventListener("change", (e) => {
        sortCriteria = e.target.value;
        renderResultsUI();
      });
    }

    // Range slider event
    const slider = document.getElementById("price-range");
    const valText = document.getElementById("price-val");
    if (slider && valText) {
      slider.addEventListener("input", (e) => {
        priceFilterVal = parseInt(e.target.value);
        valText.textContent = priceFilterVal;
      });
      slider.addEventListener("change", () => {
        renderResultsUI();
      });
    }

    // Checkboxes event
    document.querySelectorAll(".filter-op-check").forEach((chk) => {
      chk.addEventListener("change", () => {
        const checked = Array.from(document.querySelectorAll(".filter-op-check:checked")).map((c) => c.value);
        operatorsFilter = checked;
        renderResultsUI();
      });
    });

    // Reset filters
    const clearBtn = document.getElementById("btn-clear-filters");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        priceFilterVal = 10000;
        operatorsFilter = [];
        sortCriteria = "earliest";
        renderResultsUI();
      });
    }
  }
}

// Utility to format date for display e.g. "Jul 15, 2026"
function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
