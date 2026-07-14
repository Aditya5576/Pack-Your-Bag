// mockData.js - Persistent data seeds and cloud Supabase CRUD API wrapper

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", 
  "Kolkata", "Hyderabad", "Ahmedabad", "Goa", "Jaipur"
];

const TRAVEL_PROVIDERS = {
  bus: [
    { name: "Neeta Travels", rating: 4.2, amenities: ["AC", "Sleeper", "WiFi", "Charging Port"] },
    { name: "National Travels", rating: 3.9, amenities: ["AC", "Seater", "Charging Port"] },
    { name: "VRL Travels", rating: 4.4, amenities: ["AC", "Sleeper", "WiFi", "Water Bottle", "Blanket"] },
    { name: "SRS Travels", rating: 3.8, amenities: ["Non-AC", "Seater"] },
    { name: "Purple Travels", rating: 4.1, amenities: ["AC", "Sleeper", "Charging Port", "Water Bottle"] }
  ],
  train: [
    { name: "Rajdhani Express (12951)", rating: 4.5, classes: ["1A", "2A", "3A"], amenities: ["Food Included", "AC", "Bedding"] },
    { name: "Shatabdi Express (12002)", rating: 4.3, classes: ["CC", "EC"], amenities: ["Food Included", "AC", "WiFi"] },
    { name: "Vande Bharat (22436)", rating: 4.7, classes: ["CC", "EC"], amenities: ["AC", "WiFi", "Meal Service", "Charging Port"] },
    { name: "Garib Rath (12909)", rating: 3.7, classes: ["3A"], amenities: ["AC"] },
    { name: "Duronto Express (12260)", rating: 4.0, classes: ["1A", "2A", "3A", "SL"], amenities: ["AC", "Bedding"] }
  ],
  flight: [
    { name: "IndiGo", rating: 4.1, code: "6E", classes: ["Economy"], amenities: ["Cabin Baggage 7kg", "Check-in Baggage 15kg"] },
    { name: "Air India", rating: 4.0, code: "AI", classes: ["Economy", "Business"], amenities: ["Cabin Baggage 7kg", "Check-in Baggage 25kg", "Meal Included", "AC"] },
    { name: "SpiceJet", rating: 3.6, code: "SG", classes: ["Economy"], amenities: ["Cabin Baggage 7kg", "Check-in Baggage 15kg"] },
    { name: "Vistara", rating: 4.6, code: "UK", classes: ["Economy", "Business"], amenities: ["Cabin Baggage 7kg", "Check-in Baggage 20kg", "Meal Included", "In-flight Entertainment"] },
    { name: "Akasa Air", rating: 4.2, code: "QP", classes: ["Economy"], amenities: ["Cabin Baggage 7kg", "Check-in Baggage 15kg", "USB Port"] }
  ]
};

const INITIAL_COUPONS = [
  { code: "PACKBAGS20", type: "percentage", value: 20, description: "Get 20% off on all travel modes (Max discount ₹500)", maxDiscount: 500, minFare: 500 },
  { code: "FIRSTTRIP", type: "flat", value: 150, description: "Flat ₹150 off on your first booking", minFare: 400 },
  { code: "SUPERFLIGHT", type: "percentage", value: 15, description: "15% off on flights (Max discount ₹1000)", maxDiscount: 1000, minFare: 2000, mode: "flight" },
  { code: "RAILBUDDY", type: "flat", value: 50, description: "Flat ₹50 off on any Train ticket", minFare: 150, mode: "train" }
];

// Helper to generate a random ID
function generateId(prefix = "ID") {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

// ----------------------------------------------------
// LOCAL STORAGE DB FALLBACK CONTROLLER
// ----------------------------------------------------
function getDB() {
  let db = localStorage.getItem("bookmytrip_db");
  if (!db) {
    db = {
      routes: [],
      bookings: [],
      coupons: INITIAL_COUPONS,
      passengers: [
        { id: "P-1", name: "Aditya Patil", age: 24, gender: "Male" }
      ]
    };
    localStorage.setItem("bookmytrip_db", JSON.stringify(db));
  } else {
    db = JSON.parse(db);
  }
  return db;
}

function saveDB(db) {
  localStorage.setItem("bookmytrip_db", JSON.stringify(db));
}

// Local mock route generator
function generateLocalTripsForDate(dateStr) {
  const newRoutes = [];
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = 0; j < CITIES.length; j++) {
      if (i === j) continue;
      
      const origin = CITIES[i];
      const destination = CITIES[j];
      
      // Seed Bus
      const busCount = 2;
      for (let b = 0; b < busCount; b++) {
        const provider = TRAVEL_PROVIDERS.bus[Math.floor(Math.random() * TRAVEL_PROVIDERS.bus.length)];
        const depHour = 7 + (b * 5) + Math.floor(Math.random() * 3);
        const depMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        const durationHours = 4 + Math.floor(Math.random() * 4);
        const durationMins = [0, 15, 30][Math.floor(Math.random() * 3)];
        
        const depTime = `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`;
        let arrHour = (depHour + durationHours) % 24;
        let arrMin = (depMin + durationMins);
        if (arrMin >= 60) { arrHour = (arrHour + 1) % 24; arrMin -= 60; }
        const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
        const price = Math.floor(400 + (durationHours * 90) + (Math.random() * 100));

        newRoutes.push({
          id: generateId("BUS"),
          type: "bus",
          provider: provider.name,
          rating: provider.rating,
          amenities: provider.amenities,
          origin,
          destination,
          date: dateStr,
          departureTime: depTime,
          arrivalTime: arrTime,
          duration: `${durationHours}h ${durationMins}m`,
          price,
          seatsTotal: 40,
          seatsAvailable: Math.floor(10 + Math.random() * 20),
          seatLayout: Array(40).fill(null).map((_, idx) => Math.random() > 0.6 ? null : "booked")
        });
      }

      // Seed Train
      const trainCount = 1;
      for (let t = 0; t < trainCount; t++) {
        const provider = TRAVEL_PROVIDERS.train[Math.floor(Math.random() * TRAVEL_PROVIDERS.train.length)];
        const depHour = 6 + (t * 8) + Math.floor(Math.random() * 3);
        const depMin = [0, 30][Math.floor(Math.random() * 2)];
        const durationHours = 5 + Math.floor(Math.random() * 6);
        const durationMins = [0, 30][Math.floor(Math.random() * 2)];
        
        const depTime = `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`;
        let arrHour = (depHour + durationHours) % 24;
        let arrMin = (depMin + durationMins);
        if (arrMin >= 60) { arrHour = (arrHour + 1) % 24; arrMin -= 60; }
        const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
        const price = Math.floor(300 + (durationHours * 70));
        const selectedClass = provider.classes[Math.floor(Math.random() * provider.classes.length)];

        newRoutes.push({
          id: generateId("TRN"),
          type: "train",
          provider: provider.name,
          rating: provider.rating,
          amenities: provider.amenities,
          origin,
          destination,
          date: dateStr,
          departureTime: depTime,
          arrivalTime: arrTime,
          duration: `${durationHours}h ${durationMins}m`,
          price: selectedClass === "1A" ? price * 3.0 : selectedClass === "2A" ? price * 2.0 : price * 1.3,
          classSelected: selectedClass,
          classesAvailable: provider.classes,
          seatsTotal: 72,
          seatsAvailable: Math.floor(15 + Math.random() * 30),
          seatLayout: Array(72).fill(null).map((_, idx) => Math.random() > 0.6 ? null : "booked")
        });
      }

      // Seed Flight
      const flightCount = 1;
      for (let f = 0; f < flightCount; f++) {
        const provider = TRAVEL_PROVIDERS.flight[Math.floor(Math.random() * TRAVEL_PROVIDERS.flight.length)];
        const depHour = 8 + (f * 6);
        const depMin = [0, 15, 45][Math.floor(Math.random() * 3)];
        const durationHours = 2 + Math.floor(Math.random() * 2);
        const durationMins = [0, 30][Math.floor(Math.random() * 2)];
        
        const depTime = `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`;
        let arrHour = (depHour + durationHours) % 24;
        let arrMin = (depMin + durationMins);
        if (arrMin >= 60) { arrHour = (arrHour + 1) % 24; arrMin -= 60; }
        const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
        const price = Math.floor(3000 + (durationHours * 800));

        newRoutes.push({
          id: generateId("FLT"),
          type: "flight",
          provider: `${provider.name} (${provider.code}-${100 + Math.floor(Math.random() * 899)})`,
          rating: provider.rating,
          amenities: provider.amenities,
          origin,
          destination,
          date: dateStr,
          departureTime: depTime,
          arrivalTime: arrTime,
          duration: `${durationHours}h ${durationMins}m`,
          price,
          seatsTotal: 180,
          seatsAvailable: Math.floor(30 + Math.random() * 80),
          seatLayout: Array(180).fill(null).map((_, idx) => Math.random() > 0.65 ? null : "booked")
        });
      }
    }
  }
  return newRoutes;
}

// ----------------------------------------------------
// UNIFIED DATABASE CRUD API LAYER
// ----------------------------------------------------
window.dbAPI = {
  // 1. Fetch routes matching search filter
  async getRoutes(type, origin, destination, dateStr) {
    if (window.useSupabase) {
      try {
        const { data, error } = await window.supabaseClient
          .from("routes")
          .select("*")
          .eq("type", type)
          .eq("origin", origin)
          .eq("destination", destination)
          .eq("date", dateStr);
        
        if (error) throw error;
        
        // If no routes found in Cloud DB for this search query, generate and upload them
        if (data.length === 0) {
          console.log(`Supabase: No routes for date ${dateStr}. Generating dynamically...`);
          const newRoutes = generateLocalTripsForDate(dateStr);
          const { error: insErr } = await window.supabaseClient.from("routes").insert(newRoutes);
          if (insErr) throw insErr;
          return newRoutes;
        }
        return data;
      } catch (err) {
        console.error("Supabase getRoutes failed, falling back to LocalStorage: ", err);
      }
    }
    
    // Fallback: LocalStorage
    const db = getDB();
    let localMatches = db.routes.filter(r => 
      r.type === type && r.origin === origin && r.destination === destination && r.date === dateStr
    );
    if (localMatches.length === 0) {
      const generated = generateLocalTripsForDate(dateStr);
      db.routes = [...db.routes, ...generated];
      saveDB(db);
      return generated;
    }
    return localMatches;
  },

  // 2. Add a new route (Admin view)
  async addRoute(route) {
    if (window.useSupabase) {
      try {
        const { data, error } = await window.supabaseClient.from("routes").insert([route]);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase addRoute failed, falling back to LocalStorage: ", err);
      }
    }
    
    const db = getDB();
    db.routes.push(route);
    saveDB(db);
    return true;
  },

  // 3. Delete a route (Admin view)
  async deleteRoute(routeId) {
    if (window.useSupabase) {
      try {
        const { error } = await window.supabaseClient.from("routes").delete().eq("id", routeId);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase deleteRoute failed, falling back to LocalStorage: ", err);
      }
    }
    
    const db = getDB();
    db.routes = db.routes.filter(r => r.id !== routeId);
    saveDB(db);
    return true;
  },

  // 4. Fetch all active routes (Admin display)
  async getAllRoutes() {
    if (window.useSupabase) {
      try {
        const { data, error } = await window.supabaseClient.from("routes").select("*");
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Supabase getAllRoutes failed, falling back to LocalStorage: ", err);
      }
    }
    return getDB().routes;
  },

  // 5. Fetch bookings matching authenticated user session
  async getBookings() {
    if (window.useSupabase) {
      try {
        // RLS automatically filters by auth.uid() = user_id on select
        const { data, error } = await window.supabaseClient.from("bookings").select("*");
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Supabase getBookings failed, falling back to LocalStorage: ", err);
      }
    }
    return getDB().bookings;
  },

  // 6. Fetch a single booking by ID (Ticket display)
  async getBookingById(bookingId) {
    if (window.useSupabase) {
      try {
        const { data, error } = await window.supabaseClient.from("bookings").select("*").eq("id", bookingId);
        if (error) throw error;
        return data[0] || null;
      } catch (err) {
        console.error("Supabase getBookingById failed, falling back to LocalStorage: ", err);
      }
    }
    return getDB().bookings.find(b => b.id === bookingId) || null;
  },

  // 7. Save a new booking (Checkout completion)
  async addBooking(booking) {
    if (window.useSupabase) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
          booking.user_id = session.user.id;
        }
        const { error } = await window.supabaseClient.from("bookings").insert([booking]);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase addBooking failed, falling back to LocalStorage: ", err);
      }
    }
    
    const db = getDB();
    db.bookings.push(booking);
    saveDB(db);
    return true;
  },

  // 8. Update seat maps on routes table
  async updateRouteSeats(routeId, seatLayout, seatsAvailable) {
    if (window.useSupabase) {
      try {
        const { error } = await window.supabaseClient
          .from("routes")
          .update({ seat_layout: seatLayout, seats_available: seatsAvailable })
          .eq("id", routeId);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase updateRouteSeats failed: ", err);
      }
    }
    
    const db = getDB();
    const idx = db.routes.findIndex(r => r.id === routeId);
    if (idx > -1) {
      db.routes[idx].seatLayout = seatLayout;
      db.routes[idx].seatsAvailable = seatsAvailable;
      saveDB(db);
    }
    return true;
  },

  // 9. Cancel a booking and refund seat indices
  async cancelBooking(bookingId, routeId, seatLayout, seatsAvailable) {
    if (window.useSupabase) {
      try {
        const { error: bookErr } = await window.supabaseClient
          .from("bookings")
          .update({ status: "Cancelled" })
          .eq("id", bookingId);
        if (bookErr) throw bookErr;

        const { error: routeErr } = await window.supabaseClient
          .from("routes")
          .update({ seat_layout: seatLayout, seats_available: seatsAvailable })
          .eq("id", routeId);
        if (routeErr) throw routeErr;
        
        return true;
      } catch (err) {
        console.error("Supabase cancelBooking failed, falling back to LocalStorage: ", err);
      }
    }

    const db = getDB();
    const bIdx = db.bookings.findIndex(b => b.id === bookingId);
    if (bIdx > -1) {
      db.bookings[bIdx].status = "Cancelled";
    }
    const rIdx = db.routes.findIndex(r => r.id === routeId);
    if (rIdx > -1) {
      db.routes[rIdx].seatLayout = seatLayout;
      db.routes[rIdx].seatsAvailable = seatsAvailable;
    }
    saveDB(db);
    return true;
  },

  // 10. Fetch saved passengers list
  async getPassengers() {
    if (window.useSupabase) {
      try {
        // RLS automatically filters by auth.uid() = user_id on select
        const { data, error } = await window.supabaseClient.from("passengers").select("*");
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Supabase getPassengers failed, falling back to LocalStorage: ", err);
      }
    }
    return getDB().passengers;
  },

  // 11. Add a saved passenger profile
  async addPassenger(passenger) {
    if (window.useSupabase) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
          passenger.user_id = session.user.id;
        }
        const { error } = await window.supabaseClient.from("passengers").insert([passenger]);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase addPassenger failed, falling back to LocalStorage: ", err);
      }
    }
    
    const db = getDB();
    db.passengers.push(passenger);
    saveDB(db);
    return true;
  },

  // 12. Delete a saved passenger profile
  async deletePassenger(passengerId) {
    if (window.useSupabase) {
      try {
        const { error } = await window.supabaseClient.from("passengers").delete().eq("id", passengerId);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase deletePassenger failed, falling back to LocalStorage: ", err);
      }
    }
    
    const db = getDB();
    db.passengers = db.passengers.filter(p => p.id !== passengerId);
    saveDB(db);
    return true;
  },

  // 13. Fetch administrative statistics
  async getAdminStats() {
    if (window.useSupabase) {
      try {
        const { data: bData, error: bErr } = await window.supabaseClient.from("bookings").select("status, billing");
        if (bErr) throw bErr;
        
        const { count: routesCount, error: rErr } = await window.supabaseClient.from("routes").select("*", { count: 'exact', head: true });
        if (rErr) throw rErr;
        
        const { count: paxCount, error: pErr } = await window.supabaseClient.from("passengers").select("*", { count: 'exact', head: true });
        if (pErr) throw pErr;

        const totalBookingsCount = bData.length;
        const totalRevenue = bData.filter(b => b.status === "Confirmed").reduce((sum, b) => sum + b.billing.grandTotal, 0);

        return {
          totalBookingsCount,
          totalRevenue,
          totalPassengers: paxCount || 0,
          totalRoutes: routesCount || 0,
          bookingsList: [] // Managed separately
        };
      } catch (err) {
        console.error("Supabase getAdminStats failed, falling back to LocalStorage: ", err);
      }
    }

    const db = getDB();
    const activeBookings = db.bookings.filter(b => b.status === "Confirmed");
    return {
      totalBookingsCount: db.bookings.length,
      totalRevenue: activeBookings.reduce((sum, b) => sum + b.billing.grandTotal, 0),
      totalPassengers: db.passengers.length,
      totalRoutes: db.routes.length
    };
  },

  // 14. Fetch all bookings database (Admin view override)
  async getAllSystemBookings() {
    if (window.useSupabase) {
      try {
        // Admin gets all bookings (In true production, auth policy would check admin claims)
        const { data, error } = await window.supabaseClient.from("bookings").select("*");
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Supabase getAllSystemBookings failed, falling back: ", err);
      }
    }
    return getDB().bookings;
  }
};

// Initial local seed execution for fallback
(function seedLocalDatabase() {
  const today = new Date();
  const db = getDB();
  if (db.routes.length === 0) {
    for (let i = 0; i < 3; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const dateStr = nextDate.toISOString().split('T')[0];
      const generated = generateLocalTripsForDate(dateStr);
      db.routes = [...db.routes, ...generated];
    }
    saveDB(db);
  }
})();
