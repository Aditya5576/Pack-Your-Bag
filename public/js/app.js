// app.js - Core orchestrator, state management, and routing engine for Pack Your Bags

// Global Application State
window.appState = {
  currentUser: null,
  currentSearch: {
    type: "bus", // bus, train, flight
    from: "",
    to: "",
    date: "",
    passengers: 1
  },
  selectedTrip: null,
  selectedSeats: [],
  passengersDetails: [],
  appliedCoupon: null,
  activeRoute: "home"
};

// Routing Table mapping hashes to view renderers
const routes = {
  "": renderHomeView,
  "#/": renderHomeView,
  "#/search": renderSearchView,
  "#/seat-selection": renderSeatSelectionView,
  "#/checkout": renderCheckoutView,
  "#/ticket": renderTicketView,
  "#/my-trips": renderMyTripsView,
  "#/profile": renderProfileView,
  "#/admin": renderAdminView,
  "#/hotels": initHotelsView,
  "#/hotel-booking": initHotelBookingView,
  "#/hotel-voucher": initHotelVoucherView
};

// Initialize Application on DOM Content Loaded
document.addEventListener("DOMContentLoaded", async () => {
  await initAppState();
  window.addEventListener("hashchange", router);
  router(); // Run router for initial load
  initMobileNav(); // Initialize hamburger navigation
  initSplashScreen(); // Handle startup splash screen dismiss
});

// Animate and dismiss splash screen on startup
function initSplashScreen() {
  const splash = document.getElementById("splash-screen");
  if (!splash) return;

  // Skip animations instantly in E2E automated environments to avoid test execution delay/timeouts
  const isAutomation = navigator.webdriver || window.location.search.includes("test=true") || localStorage.getItem("TEST_MODE") === "true" || window.useSupabase === false;
  if (isAutomation) {
    splash.remove();
    return;
  }

  const progressBar = splash.querySelector(".splash-progress");
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 8;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        splash.classList.add("fade-out");
        setTimeout(() => {
          splash.remove();
        }, 500); // Wait for transition to complete
      }, 200);
    }
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }, 100);
}


// Mobile Hamburger Navigation Toggle
function initMobileNav() {
  const hamburger = document.getElementById("nav-hamburger");
  const mainNav = document.getElementById("main-nav");
  if (!hamburger || !mainNav) return;

  // Show hamburger only on small screens
  function checkBreakpoint() {
    if (window.innerWidth <= 768) {
      hamburger.style.display = "flex";
    } else {
      hamburger.style.display = "none";
      mainNav.classList.remove("nav-open");
    }
  }

  checkBreakpoint();
  window.addEventListener("resize", checkBreakpoint);

  hamburger.addEventListener("click", () => {
    mainNav.classList.toggle("nav-open");
  });

  // Close nav when any nav link is clicked
  mainNav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("nav-open");
    });
  });
}

// Seed user state and synchronize local storage
async function initAppState() {
  let savedPassengers = [];
  try {
    savedPassengers = await window.dbAPI.getPassengers();
  } catch (err) {
    console.error("Failed to load passengers on boot: ", err);
  }

  // Default logged in user details
  window.appState.currentUser = {
    name: "Aditya Patil",
    age: 24,
    gender: "Male",
    email: "aditya@example.com",
    mobile: "9876543210",
    savedPassengers: savedPassengers || []
  };

  // Inspect if Supabase has a real (non-anonymous) GitHub user logged in
  if (window.useSupabase && window.supabaseClient) {
    try {
      const { data } = await window.supabaseClient.auth.getSession();
      if (data.session && data.session.user) {
        const user = data.session.user;
        const isAnon = user.is_anonymous || !user.identities || user.identities.length === 0;
        if (!isAnon) {
          const meta = user.user_metadata || {};
          window.appState.currentUser.name = meta.full_name || meta.user_name || "GitHub Traveler";
          window.appState.currentUser.email = user.email || "aditya@example.com";
          console.log("Supabase: Active GitHub user loaded: ", window.appState.currentUser.name);
        }
      }
    } catch (err) {
      console.error("Failed to check active auth session: ", err);
    }
  }

  // Set search date default to today
  const today = new Date().toISOString().split("T")[0];
  window.appState.currentSearch.date = today;

  // Sync navigation menu active states
  updateNavbarActiveState();
}

// Router function that intercepts URL hash and swaps templates
function router() {
  const hash = window.location.hash;

  // Parse query parameters if any (e.g. #/ticket?bookingId=PYB-1234)
  const path = hash.split("?")[0] || "";
  const queryParams = parseQueryParams(hash);

  const renderer = routes[path] || renderNotFoundView;

  // Set loading state (optional, for visual polish)
  const appView = document.getElementById("app-view");
  if (appView) {
    appView.innerHTML = `
      <div class="view-loader">
        <div class="spinner"></div>
        <p>Loading journey details...</p>
      </div>
    `;

    // Execute renderer after short timeout to let transitions run
    setTimeout(() => {
      renderer(queryParams);
      window.scrollTo(0, 0);
      updateNavbarActiveState();
    }, 50);
  }
}

// Helper to parse URL Query Parameters
function parseQueryParams(hash) {
  const params = {};
  if (!hash.includes("?")) return params;

  const queryString = hash.split("?")[1];
  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  }
  return params;
}

// Navigation Helper
function navigateTo(hash) {
  window.location.hash = hash;
}

// Highlight the active link in the navigation header
function updateNavbarActiveState() {
  const hash = window.location.hash || "#/";
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const linkHash = link.getAttribute("href");
    if (linkHash === hash || (linkHash === "#/" && hash === "")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  updateAuthUI(); // Update authorization button display
}

// Dynamically update the Navbar Login/Logout buttons based on Supabase session state
async function updateAuthUI() {
  const container = document.getElementById("nav-auth-container");
  if (!container) return;

  if (!window.useSupabase || !window.supabaseClient) {
    container.innerHTML = `<span class="badge badge-secondary" style="margin-left: 10px;">Local DB Only</span>`;
    return;
  }

  try {
    const { data } = await window.supabaseClient.auth.getSession();
    if (data.session && data.session.user) {
      const user = data.session.user;
      const isAnon = user.is_anonymous || !user.identities || user.identities.length === 0;

      if (!isAnon) {
        // Authenticated GitHub user
        const meta = user.user_metadata || {};
        const displayName = meta.full_name || meta.user_name || user.email || "OAuth User";
        container.innerHTML = `
          <button onclick="window.signOutUser()" class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger); margin-left: 10px; padding: 6px 12px; font-size: 13px;">
            Sign Out (${displayName})
          </button>
        `;
      } else {
        // Guest user - Show Sign In with GitHub option
        container.innerHTML = `
          <button onclick="window.signInWithGitHub()" class="btn btn-primary btn-sm" style="margin-left: 10px; padding: 6px 12px; font-size: 13px;">
            Sign In with GitHub
          </button>
        `;
      }
    } else {
      // No session at all
      container.innerHTML = `
        <button onclick="window.signInWithGitHub()" class="btn btn-primary btn-sm" style="margin-left: 10px; padding: 6px 12px; font-size: 13px;">
          Sign In with GitHub
        </button>
      `;
    }
  } catch (err) {
    console.error("Failed to update auth UI: ", err);
  }
}

// Toast notification helper for professional micro-feedback
function showNotification(message, type = "success") {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  const notification = document.createElement("div");
  notification.className = `notification-toast ${type} animate-slide-in`;
  notification.innerHTML = `
    <span class="notification-icon">${type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"}</span>
    <span class="notification-text">${message}</span>
  `;

  container.appendChild(notification);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    notification.classList.add("animate-fade-out");
    setTimeout(() => {
      notification.remove();
    }, 400);
  }, 3500);
}

// Renderers for Views (Fallbacks that will be overridden by custom script modules)
function renderHomeView() {
  if (typeof initHomeView === "function") {
    initHomeView();
  } else {
    document.getElementById("app-view").innerHTML = `<h2>Welcome to Pack Your Bags</h2>`;
  }
}

function renderSearchView() {
  if (typeof initSearchView === "function") {
    initSearchView();
  } else {
    document.getElementById("app-view").innerHTML = `<h2>Search Results</h2>`;
  }
}

function renderSeatSelectionView() {
  if (typeof initSeatSelectionView === "function") {
    initSeatSelectionView();
  } else {
    navigateTo("#/");
  }
}

function renderCheckoutView() {
  if (typeof initCheckoutView === "function") {
    initCheckoutView();
  } else {
    navigateTo("#/");
  }
}

function renderTicketView(params) {
  if (typeof initTicketView === "function") {
    initTicketView(params);
  } else {
    navigateTo("#/");
  }
}

function renderMyTripsView() {
  if (typeof initMyTripsView === "function") {
    initMyTripsView();
  } else {
    document.getElementById("app-view").innerHTML = `<h2>My Bookings</h2>`;
  }
}

function renderProfileView() {
  if (typeof initProfileView === "function") {
    initProfileView();
  } else {
    document.getElementById("app-view").innerHTML = `<h2>User Profile</h2>`;
  }
}

function renderAdminView() {
  if (typeof initAdminView === "function") {
    initAdminView();
  } else {
    document.getElementById("app-view").innerHTML = `<h2>Admin Control Center</h2>`;
  }
}

function renderNotFoundView() {
  document.getElementById("app-view").innerHTML = `
    <div class="error-view container">
      <h1>404</h1>
      <p>Oops! The itinerary you are looking for has been cancelled or rescheduled.</p>
      <a href="#/" class="btn btn-primary">Return Home</a>
    </div>
  `;
}
