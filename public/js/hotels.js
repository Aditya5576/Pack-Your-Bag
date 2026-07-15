// hotels.js - Hotel stays listing, room selection, and checkout flow module

// 1. HOTEL SEARCH LISTINGS VIEW
async function initHotelsView() {
  const appView = document.getElementById("app-view");
  const searchState = window.appState.currentSearch;
  const destination = searchState.to || "Goa";

  let hotels = [];
  try {
    hotels = await window.dbAPI.getHotels(destination);
  } catch (err) {
    console.error("Failed to load hotels: ", err);
  }

  // Calculate stays duration in nights
  const checkinDate = new Date(searchState.date);
  const checkoutDate = new Date(searchState.checkoutDate);
  const diffTime = Math.abs(checkoutDate - checkinDate);
  const numNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  appView.innerHTML = `
    <div class="search-results-page container">
      <!-- Search Summary Header -->
      <div class="search-header-summary card">
        <div class="summary-details">
          <div class="trip-icon">🏨</div>
          <div>
            <h3>Stays in ${destination}</h3>
            <p>${formatDisplayDate(searchState.date)} ➔ ${formatDisplayDate(searchState.checkoutDate)} | ${numNights} Night(s) | ${searchState.passengers} Guest(s)</p>
          </div>
        </div>
        <button onclick="navigateTo('#/')" class="btn btn-outline">Modify Search</button>
      </div>

      <!-- Results Body split layout -->
      <div class="results-layout">
        <!-- Sidebar Filter controls -->
        <aside class="results-filters card">
          <h4>Filter Stays</h4>
          <div class="dashed-hr"></div>

          <!-- Max price filter -->
          <div class="form-group">
            <label id="lbl-price-filter">Max Price per night: ₹40000</label>
            <input type="range" id="filter-price-slider" class="range-slider" min="1000" max="40000" step="500" value="40000">
          </div>
          <div class="dashed-hr"></div>

          <!-- Platform filter -->
          <div class="form-group">
            <label>OTA Platforms</label>
            <div class="checkbox-list">
              <label class="checkbox-label">
                <input type="checkbox" class="filter-platform" value="booking" checked> Booking.com
              </label>
              <label class="checkbox-label">
                <input type="checkbox" class="filter-platform" value="airbnb" checked> Airbnb
              </label>
              <label class="checkbox-label">
                <input type="checkbox" class="filter-platform" value="vrbo" checked> Vrbo
              </label>
              <label class="checkbox-label">
                <input type="checkbox" class="filter-platform" value="google" checked> Google Hotels
              </label>
            </div>
          </div>
          <div class="dashed-hr"></div>

          <!-- Rating filter -->
          <div class="form-group">
            <label>Guest Rating</label>
            <div class="checkbox-list">
              <label class="checkbox-label">
                <input type="radio" name="filter-rating" class="filter-rating" value="0" checked> Any Rating
              </label>
              <label class="checkbox-label">
                <input type="radio" name="filter-rating" class="filter-rating" value="4.2"> 4.2+ Stars
              </label>
              <label class="checkbox-label">
                <input type="radio" name="filter-rating" class="filter-rating" value="4.6"> 4.6+ Stars
              </label>
            </div>
          </div>
        </aside>

        <!-- Right Listings Grid -->
        <div class="results-content">
          <p class="results-count" id="stays-count-text">${hotels.length} stays found</p>
          <div class="results-list" id="hotels-list-grid"></div>
        </div>
      </div>
    </div>

    <!-- Room Selection Dialog Modal -->
    <div class="payment-modal-overlay" id="room-selection-modal" style="display: none;">
      <div class="razorpay-modal-box" style="max-width: 550px;">
        <div class="razorpay-header">
          <div class="brand">
            <span class="logo">🏨</span>
            <div>
              <h4 id="modal-hotel-name">Hotel Room Selection</h4>
              <p class="mode" style="color: var(--accent-teal)">Unified ScoutingAPI Schema</p>
            </div>
          </div>
          <button class="btn btn-danger-link" onclick="closeRoomModal()" style="font-size: 20px;">✕</button>
        </div>
        <div class="razorpay-body" id="modal-rooms-body"></div>
      </div>
    </div>
  `;

  // Bind active listing triggers
  bindHotelsListingEvents(hotels, numNights);
}

// Listing Event handlers
function bindHotelsListingEvents(hotels, numNights) {
  const priceSlider = document.getElementById("filter-price-slider");
  const priceLbl = document.getElementById("lbl-price-filter");
  const platformChecks = document.querySelectorAll(".filter-platform");
  const ratingRadios = document.querySelectorAll(".filter-rating");

  function renderFilteredGrid() {
    const maxPrice = parseInt(priceSlider.value);
    priceLbl.textContent = `Max Price per night: ₹${maxPrice}`;

    const checkedPlatforms = Array.from(platformChecks)
      .filter((c) => c.checked)
      .map((c) => c.value);

    let minRating = 0;
    ratingRadios.forEach((r) => {
      if (r.checked) minRating = parseFloat(r.value);
    });

    const filtered = hotels.filter((h) => {
      return (
        h.price <= maxPrice &&
        checkedPlatforms.includes(h.platform) &&
        h.rating >= minRating
      );
    });

    document.getElementById("stays-count-text").textContent = `${filtered.length} stays found`;

    const grid = document.getElementById("hotels-list-grid");
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="card no-results-box">
          <span class="empty-icon">🏖️</span>
          <h3>No matching stays found</h3>
          <p>Try modifying your filter settings or search criteria.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (h) => `
      <div class="card trip-result-card">
        <div class="trip-card-main" style="align-items: stretch;">
          <!-- Hotel Image Thumbnail -->
          <div class="col-provider" style="flex: 0 0 160px; min-width: 160px; height: 120px; border-radius: var(--radius-sm); overflow: hidden; position: relative;">
            <img src="${h.photo}" style="width: 100%; height: 100%; object-fit: cover;" alt="${h.name}">
            <span class="badge badge-secondary" style="position: absolute; bottom: 8px; left: 8px; font-size: 9px; background: rgba(5,8,16,0.85);">${h.platform.toUpperCase()}</span>
          </div>

          <!-- Hotel Details Info -->
          <div style="flex: 1; padding: 0 10px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">${h.name}</h3>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">📍 ${h.city} City Centre</p>
              <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 6px;">
                <span class="rating-stars">★ ${h.rating}</span>
                <span style="font-size: 11px; color: var(--text-muted);">Guest Rating</span>
              </div>
            </div>
            
            <div class="amenities-list">
              ${h.amenities.slice(0, 3).map((a) => `<span class="amenity-pill">${a}</span>`).join("")}
              ${h.amenities.length > 3 ? `<span class="amenity-pill">+${h.amenities.length - 3} more</span>` : ""}
            </div>
          </div>

          <!-- Price & Select action -->
          <div class="col-price-action" style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
            <div class="price-section" style="text-align: right;">
              <span class="price-label">Starts from</span>
              <span class="price">₹${h.price}</span>
              <span class="tax-info">/ night</span>
            </div>
            <button class="btn btn-primary" onclick="openRoomModal('${h.id}', ${numNights})">Select Room</button>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Bind input listeners
  priceSlider.addEventListener("input", renderFilteredGrid);
  platformChecks.forEach((c) => c.addEventListener("change", renderFilteredGrid));
  ratingRadios.forEach((r) => r.addEventListener("change", renderFilteredGrid));

  // Initial draw
  renderFilteredGrid();
}

// Room Selector dialog handler
async function openRoomModal(hotelId, numNights) {
  const modal = document.getElementById("room-selection-modal");
  const roomsBody = document.getElementById("modal-rooms-body");
  const hotelNameEl = document.getElementById("modal-hotel-name");

  let hotel = null;
  try {
    hotel = await window.dbAPI.getHotelById(hotelId);
  } catch (err) {
    console.error("Failed to load hotel: ", err);
  }

  if (!hotel) return;

  hotelNameEl.textContent = hotel.name;

  const roomTypes = [
    { type: "Standard Room", multiplier: 1.0, desc: "Cozy room with double bed, basic cooling, and free high-speed wifi." },
    { type: "Deluxe King Room", multiplier: 1.35, desc: "Spacious bedroom with King bed, central AC, balcony views, and mini bar." },
    { type: "Executive Garden Suite", multiplier: 1.8, desc: "Luxurious suite with separate living lounge, garden deck, bath tub, and VIP services." }
  ];

  roomsBody.innerHTML = `
    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">
      ${hotel.description}
    </div>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${roomTypes
        .map((r) => {
          const rate = Math.floor(hotel.price * r.multiplier);
          const total = rate * numNights;
          return `
            <div class="card" style="margin-bottom: 0; padding: 16px; background-color: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div style="flex: 1;">
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${r.type}</h4>
                <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 0;">${r.desc}</p>
              </div>
              <div style="text-align: right; min-width: 140px;">
                <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">₹${rate} <span style="font-size: 11px; font-weight: 500; color: var(--text-muted);">/ night</span></h3>
                <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">Total: ₹${total} (${numNights} nights)</p>
                <button class="btn btn-secondary btn-sm" onclick="bookRoom('${hotel.id}', '${r.type}', ${rate})">Book Room</button>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  modal.style.display = "flex";
}

function closeRoomModal() {
  document.getElementById("room-selection-modal").style.display = "none";
}

function bookRoom(hotelId, roomType, rate) {
  closeRoomModal();
  navigateTo(`#/hotel-booking?hotelId=${hotelId}&roomType=${encodeURIComponent(roomType)}&rate=${rate}`);
}


// 2. HOTEL BOOKING FORM & CHECKOUT VIEW
async function initHotelBookingView(queryParams) {
  const appView = document.getElementById("app-view");
  const hotelId = queryParams.hotelId;
  const roomType = queryParams.roomType;
  const rate = parseInt(queryParams.rate);

  if (!hotelId || !roomType || !rate) {
    navigateTo("#/");
    return;
  }

  let hotel = null;
  try {
    hotel = await window.dbAPI.getHotelById(hotelId);
  } catch (err) {
    console.error("Hotel query failed: ", err);
  }

  if (!hotel) {
    navigateTo("#/");
    return;
  }

  const searchState = window.appState.currentSearch;
  const checkinDate = new Date(searchState.date);
  const checkoutDate = new Date(searchState.checkoutDate);
  const diffTime = Math.abs(checkoutDate - checkinDate);
  const numNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const numGuests = searchState.passengers;

  // Initialize booking details inside state
  window.appState.hotelBookingDetails = {
    hotel,
    roomType,
    rate,
    numNights,
    numGuests,
    checkIn: searchState.date,
    checkOut: searchState.checkoutDate,
    passengers: []
  };

  appView.innerHTML = `
    <div class="booking-flow-container container">
      <!-- Steps Indicator -->
      <div class="booking-steps">
        <span class="step">1. Select Stays</span>
        <span class="step-divider">➔</span>
        <span class="step active">2. Guest Details & Checkout</span>
        <span class="step-divider">➔</span>
        <span class="step">3. Payment</span>
      </div>

      <div class="booking-layout">
        <!-- Guest Forms -->
        <main class="passenger-details-section">
          <form id="hotel-guest-info-form">
            <!-- Autocomplete quick Profiles -->
            <div class="card autofill-passenger-box" style="margin-bottom: 20px;">
              <h4>Saved Passenger Profiles</h4>
              <p class="help-text" style="margin-bottom: 10px;">Click to autofill passenger details instantly:</p>
              <div class="saved-profiles-list" id="saved-profiles-list">
                <p class="help-text" style="color: var(--text-muted); font-style: italic;">No saved passenger profiles.</p>
              </div>
            </div>

            <!-- Generate Dynamic Guest Info inputs -->
            <div class="card">
              <h3>Guest Information</h3>
              <div class="dashed-hr"></div>
              ${Array(numGuests)
                .fill(null)
                .map((_, idx) => `
                <div class="passenger-card-item">
                  <div class="p-card-header">
                    <h4>Guest ${idx + 1}</h4>
                    <span class="seat-badge">Room Stay</span>
                  </div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Full Name</label>
                      <input type="text" class="form-control g-name" data-index="${idx}" placeholder="Enter Name" required>
                    </div>
                    <div class="form-group">
                      <label>Age</label>
                      <input type="number" class="form-control g-age" data-index="${idx}" min="1" max="120" placeholder="Age" required>
                    </div>
                    <div class="form-group">
                      <label>Gender</label>
                      <select class="form-control g-gender" data-index="${idx}">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>

            <!-- Contact & Ticket Delivery details -->
            <div class="card">
              <h3>Contact & Voucher Delivery</h3>
              <div class="dashed-hr"></div>
              <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" id="contact-email" class="form-control" placeholder="your@email.com" value="${window.appState.currentUser.email}" required>
                </div>
                <div class="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" id="contact-mobile" class="form-control" placeholder="10-digit Mobile" pattern="[0-9]{10}" value="${window.appState.currentUser.mobile}" required>
                </div>
              </div>
            </div>
          </form>
        </main>

        <!-- Ticket Pricing Summary Sidebar -->
        <aside class="booking-summary-panel">
          <div class="card ticket-summary-card">
            <h3>Stay Summary</h3>
            <div class="dashed-hr"></div>
            <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${hotel.name}</h4>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">📍 ${hotel.city}</p>
            
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;"><strong>Room:</strong> ${roomType}</p>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;"><strong>Check-in:</strong> ${formatDisplayDate(searchState.date)}</p>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;"><strong>Check-out:</strong> ${formatDisplayDate(searchState.checkoutDate)}</p>
            <div class="dashed-hr"></div>

            <div class="fare-breakdown-list">
              <div class="fare-row">
                <span>Nightly rate (${numNights} nights)</span>
                <span id="summary-base-fare">₹0</span>
              </div>
              <div class="fare-row promo" id="coupon-row" style="display: none;">
                <span>Coupon (<span id="coupon-code-label">CODE</span>)</span>
                <span id="summary-discount">-₹0</span>
              </div>
              <div class="fare-row">
                <span>GST Tax (18%)</span>
                <span id="summary-gst">₹0</span>
              </div>
              <div class="dashed-hr"></div>
              <div class="fare-row total-row">
                <span>Total Amount</span>
                <span id="summary-grand-total">₹0</span>
              </div>
            </div>
          </div>

          <!-- Coupon promo box -->
          <div class="card coupon-card">
            <h4>Apply Promo Code</h4>
            <div class="coupon-input-group">
              <input type="text" id="coupon-input" placeholder="e.g. PACKBAGS20" class="form-control">
              <button id="btn-apply-hotel-coupon" class="btn btn-outline">Apply</button>
            </div>
            <p class="coupon-message" id="coupon-message-status"></p>
          </div>

          <button type="button" id="btn-proceed-hotel-payment" class="btn btn-primary btn-block btn-lg">
            Proceed to Payment
          </button>
        </aside>
      </div>
    </div>

    <!-- Razorpay Checkout simulation modal -->
    <div class="payment-modal-overlay" id="razorpay-overlay" style="display: none;">
      <div class="razorpay-modal-box">
        <div class="razorpay-header">
          <div class="brand">
            <span class="logo">💳</span>
            <div>
              <h4>Razorpay Checkout</h4>
            </div>
          </div>
          <div class="amount-header">
            <p>Amount to Pay</p>
            <h3 id="payment-modal-amount">₹0</h3>
          </div>
        </div>
        
        <div class="razorpay-body">
          <div class="payment-methods-tabs">
            <button class="pay-method-tab active" data-method="card">Cards</button>
            <button class="pay-method-tab" data-method="upi">UPI / QR</button>
            <button class="pay-method-tab" data-method="netbank">Netbanking</button>
          </div>
          
          <div class="payment-method-views">
            <!-- Cards View -->
            <div class="payment-method-view" id="view-card">
              <div class="form-group">
                <label>Card Number</label>
                <input type="text" id="razorpay-card-number" class="form-control card-mask" placeholder="1111 2222 3333 4444" value="4315 7824 9912 3456" maxlength="23" required>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Expiry Date</label>
                  <input type="text" id="razorpay-card-expiry" class="form-control" placeholder="MM/YY" value="12/29" maxlength="5" required>
                </div>
                <div class="form-group">
                  <label>CVV</label>
                  <input type="password" id="razorpay-card-cvv" class="form-control" placeholder="123" value="999" maxlength="4" required>
                </div>
              </div>
              <p class="help-text">Enter card details and click "Pay Now" to complete booking.</p>
            </div>
            
            <!-- UPI View -->
            <div class="payment-method-view" id="view-upi" style="display: none;">
              <div class="form-group">
                <label>UPI ID</label>
                <input type="text" class="form-control" placeholder="username@upi" value="aditya@okaxis">
              </div>
              <p class="help-text">A simulation request will be sent to your virtual UPI app.</p>
            </div>

            <!-- Netbanking View -->
            <div class="payment-method-view" id="view-netbank" style="display: none;">
              <div class="form-group">
                <label>Select Bank</label>
                <select class="form-control">
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="razorpay-footer">
          <button class="btn btn-secondary" id="btn-cancel-payment">Cancel</button>
          <button class="btn btn-success" id="btn-submit-payment">Pay Now</button>
        </div>
        
        <!-- Loading Processing screen inside modal -->
        <div class="payment-loading-screen" id="payment-loading" style="display: none;">
          <div class="spinner"></div>
          <h4 id="payment-loading-status">Contacting Payment Server...</h4>
          <p>Please do not refresh the page or click back.</p>
        </div>
      </div>
    </div>
  `;

  // Initialize and bind checkout event listeners
  initHotelBookingLogic(numNights, rate, numGuests);
}

// Booking Pricing Logic
function initHotelBookingLogic(numNights, rate, numGuests) {
  const state = window.appState.hotelBookingDetails;
  
  // Calculate fare totals
  function calculateHotelFareBreakdown() {
    const baseFare = numNights * rate;
    let discount = 0;
    const coupon = window.appState.appliedCoupon;

    if (coupon) {
      if (coupon.type === "percentage") {
        discount = (baseFare * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.type === "flat") {
        discount = coupon.value;
      }
    }

    const taxableFare = Math.max(0, baseFare - discount);
    const gst = Math.floor(taxableFare * 0.18);
    const grandTotal = taxableFare + gst;

    document.getElementById("summary-base-fare").textContent = `₹${baseFare}`;

    const couponRow = document.getElementById("coupon-row");
    if (coupon && discount > 0) {
      couponRow.style.display = "flex";
      document.getElementById("coupon-code-label").textContent = coupon.code;
      document.getElementById("summary-discount").textContent = `-₹${discount}`;
    } else {
      couponRow.style.display = "none";
    }

    document.getElementById("summary-gst").textContent = `₹${gst}`;
    document.getElementById("summary-grand-total").textContent = `₹${grandTotal}`;
    document.getElementById("payment-modal-amount").textContent = `₹${grandTotal}`;

    // Store billing
    state.billing = {
      baseFare,
      discount,
      gst,
      grandTotal
    };
  }

  // Apply Coupon promo code
  const applyPromoBtn = document.getElementById("btn-apply-hotel-coupon");
  const promoInput = document.getElementById("coupon-input");
  const promoStatus = document.getElementById("coupon-message-status");

  applyPromoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const code = promoInput.value.trim().toUpperCase();
    if (!code) {
      showNotification("Please enter a coupon code.", "error");
      return;
    }

    const matchingCoupon = getDB().coupons.find((c) => c.code === code);
    if (!matchingCoupon) {
      promoStatus.className = "coupon-message error";
      promoStatus.textContent = "Invalid Coupon Code!";
      window.appState.appliedCoupon = null;
      calculateHotelFareBreakdown();
      return;
    }

    // Min fare validation
    const totalBase = numNights * rate;
    if (matchingCoupon.minFare && totalBase < matchingCoupon.minFare) {
      promoStatus.className = "coupon-message error";
      promoStatus.textContent = `Min fare requirement of ₹${matchingCoupon.minFare} not met!`;
      window.appState.appliedCoupon = null;
      calculateHotelFareBreakdown();
      return;
    }

    window.appState.appliedCoupon = matchingCoupon;
    promoStatus.className = "coupon-message success";
    promoStatus.textContent = `Coupon "${code}" applied successfully!`;
    calculateHotelFareBreakdown();
  });

  // Calculate default fare
  calculateHotelFareBreakdown();

  // Load autofill saved passengers
  const savedList = document.getElementById("saved-profiles-list");
  const savedPassengers = window.appState.currentUser.savedPassengers;

  if (savedPassengers && savedPassengers.length > 0) {
    savedList.innerHTML = savedPassengers
      .map(
        (p) => `
      <button type="button" class="btn btn-outline btn-sm btn-quick-pax" data-name="${p.name}" data-age="${p.age}" data-gender="${p.gender}">
        ＋ ${p.name} (${p.age}, ${p.gender})
      </button>
    `
      )
      .join("");

    document.querySelectorAll(".btn-quick-pax").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const name = e.target.getAttribute("data-name");
        const age = e.target.getAttribute("data-age");
        const gender = e.target.getAttribute("data-gender");

        // Fill first empty input row
        const names = document.querySelectorAll(".g-name");
        const ages = document.querySelectorAll(".g-age");
        const genders = document.querySelectorAll(".g-gender");

        for (let i = 0; i < names.length; i++) {
          if (!names[i].value) {
            names[i].value = name;
            ages[i].value = age;
            genders[i].value = gender;
            break;
          }
        }
      });
    });
  }

  // Open Payment checkout modal
  const form = document.getElementById("hotel-guest-info-form");
  const proceedBtn = document.getElementById("btn-proceed-hotel-payment");
  const overlay = document.getElementById("razorpay-overlay");

  proceedBtn.addEventListener("click", () => {
    if (!form.reportValidity()) {
      showNotification("Please fill guest details correctly.", "error");
      return;
    }

    const email = document.getElementById("contact-email").value.trim();
    const mobile = document.getElementById("contact-mobile").value.trim();

    if (!email || !mobile || mobile.length !== 10) {
      showNotification("Please enter a valid email and 10-digit mobile number.", "error");
      return;
    }

    state.email = email;
    state.mobile = mobile;

    // Load guest profiles array
    state.passengers = [];
    const names = document.querySelectorAll(".g-name");
    const ages = document.querySelectorAll(".g-age");
    const genders = document.querySelectorAll(".g-gender");

    for (let i = 0; i < names.length; i++) {
      state.passengers.push({
        name: names[i].value.trim(),
        age: parseInt(ages[i].value),
        gender: genders[i].value
      });
    }

    overlay.style.display = "flex";
  });

  // Razorpay Card formatters
  const cardInp = document.getElementById("razorpay-card-number");
  const expiryInp = document.getElementById("razorpay-card-expiry");
  const cvvInp = document.getElementById("razorpay-card-cvv");

  if (cardInp) {
    cardInp.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "");
      let formatted = "";
      for (let i = 0; i < val.length; i += 4) {
        formatted += val.substring(i, i + 4) + " ";
      }
      e.target.value = formatted.trim();
    });
  }

  if (expiryInp) {
    expiryInp.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if (val.length >= 2) {
        e.target.value = val.substring(0, 2) + "/" + val.substring(2, 4);
      } else {
        e.target.value = val;
      }
    });
  }

  if (cvvInp) {
    cvvInp.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  }

  // Cancel Payment
  document.getElementById("btn-cancel-payment").addEventListener("click", () => {
    overlay.style.display = "none";
    showNotification("Payment cancelled.", "error");
  });

  // Razorpay complete simulation
  document.getElementById("btn-submit-payment").addEventListener("click", () => {
    // Validate Card fields
    const cardVal = cardInp.value.replace(/\s+/g, "");
    const expiryVal = expiryInp.value.trim();
    const cvvVal = cvvInp.value.trim();

    const cardRegex = /^\d{12,19}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3,4}$/;

    if (!cardRegex.test(cardVal)) {
      showNotification("Please enter a valid card number.", "error");
      return;
    }
    if (!expiryRegex.test(expiryVal)) {
      showNotification("Please enter a valid expiry date (MM/YY).", "error");
      return;
    }
    if (!cvvRegex.test(cvvVal)) {
      showNotification("Please enter a valid CVV.", "error");
      return;
    }

    const loading = document.getElementById("payment-loading");
    const status = document.getElementById("payment-loading-status");

    loading.style.display = "flex";

    setTimeout(() => {
      status.textContent = "Processing room reservation...";
      setTimeout(() => {
        overlay.style.display = "none";
        loading.style.display = "none";
        processSuccessfulHotelBooking();
      }, 1000);
    }, 800);
  });
}

// Payment successful - save to database and route to voucher
async function processSuccessfulHotelBooking() {
  const state = window.appState;
  const hotelDetails = state.hotelBookingDetails;

  const bookingId = `PYB-HTL-${Math.floor(100000 + Math.random() * 900000)}`;

  const newBooking = {
    id: bookingId,
    bookingType: "hotel",
    hotelId: hotelDetails.hotel.id,
    hotelName: hotelDetails.hotel.name,
    platform: hotelDetails.hotel.platform,
    photo: hotelDetails.hotel.photo,
    rating: hotelDetails.hotel.rating,
    city: hotelDetails.hotel.city,
    checkIn: hotelDetails.checkIn,
    checkOut: hotelDetails.checkOut,
    roomType: hotelDetails.roomType,
    passengers: [...hotelDetails.passengers],
    billing: { ...hotelDetails.billing },
    email: hotelDetails.email,
    mobile: hotelDetails.mobile,
    bookingDate: new Date().toISOString(),
    status: "Confirmed"
  };

  // 1. Save booking to DB
  try {
    await window.dbAPI.addBooking(newBooking);
  } catch (err) {
    console.error("Booking save failed: ", err);
  }

  // 2. Save new guest profiles to saved passengers if they don't exist
  for (let p of hotelDetails.passengers) {
    const exists = state.currentUser.savedPassengers.some(
      (savedP) => savedP.name.toLowerCase() === p.name.toLowerCase()
    );
    if (!exists) {
      const newPax = {
        id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
        name: p.name,
        age: p.age,
        gender: p.gender
      };
      try {
        await window.dbAPI.addPassenger(newPax);
        state.currentUser.savedPassengers.push(newPax);
      } catch (err) {
        console.error("Passenger save failed: ", err);
      }
    }
  }

  showNotification("Stay Booked successfully! Confetti is in the air!", "success");
  navigateTo(`#/hotel-voucher?bookingId=${bookingId}`);
}
