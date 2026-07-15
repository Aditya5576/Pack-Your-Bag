// mockData.js - Persistent data seeds and cloud Supabase CRUD API wrapper

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Pune",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Ahmedabad",
  "Goa",
  "Jaipur"
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
    {
      name: "Rajdhani Express (12951)",
      rating: 4.5,
      classes: ["1A", "2A", "3A"],
      amenities: ["Food Included", "AC", "Bedding"]
    },
    {
      name: "Shatabdi Express (12002)",
      rating: 4.3,
      classes: ["CC", "EC"],
      amenities: ["Food Included", "AC", "WiFi"]
    },
    {
      name: "Vande Bharat (22436)",
      rating: 4.7,
      classes: ["CC", "EC"],
      amenities: ["AC", "WiFi", "Meal Service", "Charging Port"]
    },
    { name: "Garib Rath (12909)", rating: 3.7, classes: ["3A"], amenities: ["AC"] },
    { name: "Duronto Express (12260)", rating: 4.0, classes: ["1A", "2A", "3A", "SL"], amenities: ["AC", "Bedding"] }
  ],
  flight: [
    {
      name: "IndiGo",
      rating: 4.1,
      code: "6E",
      classes: ["Economy"],
      amenities: ["Cabin Baggage 7kg", "Check-in Baggage 15kg"]
    },
    {
      name: "Air India",
      rating: 4.0,
      code: "AI",
      classes: ["Economy", "Business"],
      amenities: ["Cabin Baggage 7kg", "Check-in Baggage 25kg", "Meal Included", "AC"]
    },
    {
      name: "SpiceJet",
      rating: 3.6,
      code: "SG",
      classes: ["Economy"],
      amenities: ["Cabin Baggage 7kg", "Check-in Baggage 15kg"]
    },
    {
      name: "Vistara",
      rating: 4.6,
      code: "UK",
      classes: ["Economy", "Business"],
      amenities: ["Cabin Baggage 7kg", "Check-in Baggage 20kg", "Meal Included", "In-flight Entertainment"]
    },
    {
      name: "Akasa Air",
      rating: 4.2,
      code: "QP",
      classes: ["Economy"],
      amenities: ["Cabin Baggage 7kg", "Check-in Baggage 15kg", "USB Port"]
    }
  ]
};

const INITIAL_COUPONS = [
  {
    code: "PACKBAGS20",
    type: "percentage",
    value: 20,
    description: "Get 20% off on all travel modes (Max discount ₹500)",
    maxDiscount: 500,
    minFare: 500
  },
  { code: "FIRSTTRIP", type: "flat", value: 150, description: "Flat ₹150 off on your first booking", minFare: 400 },
  {
    code: "SUPERFLIGHT",
    type: "percentage",
    value: 15,
    description: "15% off on flights (Max discount ₹1000)",
    maxDiscount: 1000,
    minFare: 2000,
    mode: "flight"
  },
  {
    code: "RAILBUDDY",
    type: "flat",
    value: 50,
    description: "Flat ₹50 off on any Train ticket",
    minFare: 150,
    mode: "train"
  }
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
      hotels: [],
      coupons: INITIAL_COUPONS,
      passengers: [{ id: "P-1", name: "Aditya Patil", age: 24, gender: "Male" }]
    };
    localStorage.setItem("bookmytrip_db", JSON.stringify(db));
  } else {
    db = JSON.parse(db);
    if (!db.hotels) {
      db.hotels = [];
      saveDB(db);
    }
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
        const depHour = 7 + b * 5 + Math.floor(Math.random() * 3);
        const depMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        const durationHours = 4 + Math.floor(Math.random() * 4);
        const durationMins = [0, 15, 30][Math.floor(Math.random() * 3)];

        const depTime = `${String(depHour).padStart(2, "0")}:${String(depMin).padStart(2, "0")}`;
        let arrHour = (depHour + durationHours) % 24;
        let arrMin = depMin + durationMins;
        if (arrMin >= 60) {
          arrHour = (arrHour + 1) % 24;
          arrMin -= 60;
        }
        const arrTime = `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`;
        const price = Math.floor(400 + durationHours * 90 + Math.random() * 100);

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
          seatLayout: Array(40)
            .fill(null)
            .map((_, idx) => (Math.random() > 0.6 ? null : "booked"))
        });
      }

      // Seed Train
      const trainCount = 1;
      for (let t = 0; t < trainCount; t++) {
        const provider = TRAVEL_PROVIDERS.train[Math.floor(Math.random() * TRAVEL_PROVIDERS.train.length)];
        const depHour = 6 + t * 8 + Math.floor(Math.random() * 3);
        const depMin = [0, 30][Math.floor(Math.random() * 2)];
        const durationHours = 5 + Math.floor(Math.random() * 6);
        const durationMins = [0, 30][Math.floor(Math.random() * 2)];

        const depTime = `${String(depHour).padStart(2, "0")}:${String(depMin).padStart(2, "0")}`;
        let arrHour = (depHour + durationHours) % 24;
        let arrMin = depMin + durationMins;
        if (arrMin >= 60) {
          arrHour = (arrHour + 1) % 24;
          arrMin -= 60;
        }
        const arrTime = `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`;
        const price = Math.floor(300 + durationHours * 70);
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
          seatLayout: Array(72)
            .fill(null)
            .map((_, idx) => (Math.random() > 0.6 ? null : "booked"))
        });
      }

      // Seed Flight
      const flightCount = 1;
      for (let f = 0; f < flightCount; f++) {
        const provider = TRAVEL_PROVIDERS.flight[Math.floor(Math.random() * TRAVEL_PROVIDERS.flight.length)];
        const depHour = 8 + f * 6;
        const depMin = [0, 15, 45][Math.floor(Math.random() * 3)];
        const durationHours = 2 + Math.floor(Math.random() * 2);
        const durationMins = [0, 30][Math.floor(Math.random() * 2)];

        const depTime = `${String(depHour).padStart(2, "0")}:${String(depMin).padStart(2, "0")}`;
        let arrHour = (depHour + durationHours) % 24;
        let arrMin = depMin + durationMins;
        if (arrMin >= 60) {
          arrHour = (arrHour + 1) % 24;
          arrMin -= 60;
        }
        const arrTime = `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`;
        const price = Math.floor(3000 + durationHours * 800);

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
          seatLayout: Array(180)
            .fill(null)
            .map((_, idx) => (Math.random() > 0.65 ? null : "booked"))
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
    let localMatches = db.routes.filter(
      (r) => r.type === type && r.origin === origin && r.destination === destination && r.date === dateStr
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
    db.routes = db.routes.filter((r) => r.id !== routeId);
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
  // Helpers to map camelCase properties and hotel records to/from database snake_case columns
  mapDBRecordToBooking(record) {
    if (!record) return null;
    if (record.type === "hotel" || record.bookingType === "hotel") {
      return {
        id: record.id,
        bookingType: "hotel",
        hotelId: record.tripId || record.hotelId,
        hotelName: record.origin || record.hotelName,
        platform: record.provider || record.platform,
        photo: record.classSelected || record.photo,
        rating: record.seats && record.seats[0] ? parseFloat(record.seats[0]) : (record.rating || 0),
        city: record.destination || record.city,
        checkIn: record.date || record.checkIn,
        checkOut: record.duration || record.checkOut,
        roomType: record.departureTime || record.roomType,
        roomNumber: record.arrivalTime || record.roomNumber,
        passengers: record.passengers,
        billing: record.billing,
        email: record.email,
        mobile: record.mobile,
        bookingDate: record.bookingDate,
        status: record.status
      };
    }
    return {
      id: record.id,
      bookingType: record.bookingType || record.type,
      tripId: record.tripId,
      type: record.type,
      provider: record.provider,
      origin: record.origin,
      destination: record.destination,
      date: record.date,
      departureTime: record.departureTime,
      arrivalTime: record.arrivalTime,
      duration: record.duration,
      classSelected: record.classSelected,
      seats: record.seats,
      passengers: record.passengers,
      billing: record.billing,
      email: record.email,
      mobile: record.mobile,
      bookingDate: record.bookingDate,
      status: record.status
    };
  },

  mapBookingToDBRecord(booking) {
    if (!booking) return null;
    if (booking.bookingType === "hotel" || booking.type === "hotel") {
      return {
        id: booking.id,
        tripId: booking.hotelId || "",
        type: "hotel",
        provider: booking.platform || "",
        origin: booking.hotelName || "",
        destination: booking.city || "",
        date: booking.checkIn || "",
        departureTime: booking.roomType || "",
        arrivalTime: booking.roomNumber || "",
        duration: booking.checkOut || "",
        classSelected: booking.photo || "",
        seats: [String(booking.rating || 0)],
        passengers: booking.passengers,
        billing: booking.billing,
        email: booking.email,
        mobile: booking.mobile,
        status: booking.status,
        user_id: booking.user_id
      };
    }
    return {
      id: booking.id,
      tripId: booking.tripId || "",
      type: booking.bookingType || booking.type || "",
      provider: booking.provider || "",
      origin: booking.origin || "",
      destination: booking.destination || "",
      date: booking.date || "",
      departureTime: booking.departureTime || "",
      arrivalTime: booking.arrivalTime || "",
      duration: booking.duration || "",
      classSelected: booking.classSelected || "",
      seats: booking.seats || [],
      passengers: booking.passengers,
      billing: booking.billing,
      email: booking.email,
      mobile: booking.mobile,
      status: booking.status,
      user_id: booking.user_id
    };
  },

  // 5. Fetch bookings matching authenticated user session
  async getBookings() {
    let localBookings = [];
    try {
      localBookings = getDB().bookings || [];
    } catch (e) {
      console.warn("Failed to load local bookings:", e);
    }

    if (window.useSupabase) {
      try {
        // RLS automatically filters by auth.uid() = user_id on select
        const { data, error } = await window.supabaseClient.from("bookings").select("*");
        if (error) throw error;
        
        const dbBookings = (data || []).map(r => this.mapDBRecordToBooking(r));
        const dbIds = new Set(dbBookings.map(b => b.id));
        const merged = [...dbBookings, ...localBookings.filter(b => !dbIds.has(b.id))];
        return merged;
      } catch (err) {
        console.error("Supabase getBookings failed, falling back to LocalStorage: ", err);
      }
    }
    return localBookings;
  },

  // 6. Fetch a single booking by ID (Ticket display)
  async getBookingById(bookingId) {
    if (window.useSupabase) {
      try {
        const { data, error } = await window.supabaseClient.from("bookings").select("*").eq("id", bookingId);
        if (error) throw error;
        if (data && data.length > 0) {
          return this.mapDBRecordToBooking(data[0]);
        }
      } catch (err) {
        console.error("Supabase getBookingById failed, falling back to LocalStorage: ", err);
      }
    }
    return getDB().bookings.find((b) => b.id === bookingId) || null;
  },

  // 7. Save a new booking (Checkout completion)
  async addBooking(booking) {
    // 1. Always save to LocalStorage first to ensure local durability
    const db = getDB();
    if (!db.bookings.some(b => b.id === booking.id)) {
      db.bookings.push(booking);
      saveDB(db);
    }

    // 2. Try to sync to Supabase if connected
    if (window.useSupabase) {
      try {
        const {
          data: { session }
        } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
          booking.user_id = session.user.id;
        }
        
        const dbRecord = this.mapBookingToDBRecord(booking);
        const { error } = await window.supabaseClient.from("bookings").insert([dbRecord]);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase addBooking failed, fallback active: ", err);
      }
    }

    // 3. Fire-and-forget sending of email invoice if Resend API key is configured
    this.sendInvoiceEmail(booking);

    return true;
  },

  async sendInvoiceEmail(booking) {
    let apiKey = localStorage.getItem("RESEND_API_KEY");
    if (!apiKey) {
      const checkoutKeyInput = document.getElementById("checkout-resend-key");
      if (checkoutKeyInput && checkoutKeyInput.value.trim()) {
        apiKey = checkoutKeyInput.value.trim();
        localStorage.setItem("RESEND_API_KEY", apiKey); // Save it for convenience
      }
    }

    if (!apiKey) {
      apiKey = "re_aPsZpkTp_EebXuYJBCKKMNXosXKcKdtje";
    }

    if (!apiKey) {
      console.log("Resend API Key not configured. Skipping email invoice dispatch.");
      return;
    }

    const isHotel = booking.bookingType === "hotel" || booking.type === "hotel";
    let emailHtml = "";

    if (isHotel) {
      const numNights = booking.checkIn && booking.checkOut
        ? Math.ceil(Math.abs(new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))
        : 1;

      emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0d1117; color: #c9d1d9; border-radius: 8px; border: 1px solid #30363d;">
          <div style="text-align: center; border-bottom: 2px solid #00f2fe; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #00f2fe; margin: 0; font-size: 24px;">🎒 Pack Your Bags Stays</h1>
            <p style="color: #8b949e; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Booking Confirmation Voucher</p>
          </div>

          <div style="background-color: #161b22; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #21262d;">
            <h2 style="color: #00f2fe; margin-top: 0; font-size: 18px;">Stay Details</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
              <tr>
                <td style="color: #8b949e; width: 40%; padding: 4px 0;">Accommodation:</td>
                <td style="color: #f0f6fc; font-weight: bold;">${booking.hotelName}</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Destination City:</td>
                <td style="color: #f0f6fc;">📍 ${booking.city}</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Check-In Date:</td>
                <td style="color: #f0f6fc;">${booking.checkIn}</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Check-Out Date:</td>
                <td style="color: #f0f6fc;">${booking.checkOut}</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Duration:</td>
                <td style="color: #f0f6fc;">${numNights} Night(s)</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Selected Room:</td>
                <td style="color: #00f2fe; font-weight: bold;">${booking.roomType} (Room ${booking.roomNumber || 'TBD'})</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #161b22; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #21262d;">
            <h2 style="color: #00f2fe; margin-top: 0; font-size: 18px;">Tax Invoice Receipt</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Room Stay Charges:</td>
                <td style="text-align: right; color: #f0f6fc;">₹${booking.billing.baseFare}</td>
              </tr>
              ${booking.billing.discount > 0 ? `
              <tr>
                <td style="color: #10b981; padding: 4px 0;">🎁 Discount Applied:</td>
                <td style="text-align: right; color: #10b981; font-weight: bold;">-₹${booking.billing.discount}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">SGST & CGST (18%):</td>
                <td style="text-align: right; color: #f0f6fc;">₹${booking.billing.gst}</td>
              </tr>
              <tr style="border-top: 1px solid #30363d;">
                <td style="color: #f0f6fc; font-weight: bold; padding: 8px 0 0 0;">Total Amount Paid:</td>
                <td style="text-align: right; color: #00f2fe; font-weight: bold; font-size: 16px; padding: 8px 0 0 0;">₹${booking.billing.grandTotal}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #161b22; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #21262d;">
            <h2 style="color: #00f2fe; margin-top: 0; font-size: 18px;">Guest Directory</h2>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
              ${booking.passengers.map(p => `<li style="color: #f0f6fc; margin-bottom: 4px;">👤 ${p.name} (${p.age}, ${p.gender})</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #21262d; padding-top: 15px; margin-top: 20px;">
            <p style="margin: 0;">Confirmation ID: <span style="font-family: monospace; font-weight: bold; color: #f0f6fc;">${booking.id}</span></p>
            <p style="margin: 5px 0 0 0;">Thank you for choosing Pack Your Bags stays!</p>
          </div>
        </div>
      `;
    } else {
      // Transport booking
      emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0d1117; color: #c9d1d9; border-radius: 8px; border: 1px solid #30363d;">
          <div style="text-align: center; border-bottom: 2px solid #a855f7; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #a855f7; margin: 0; font-size: 24px;">🎒 Pack Your Bags Travel</h1>
            <p style="color: #8b949e; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Boarding Pass & Invoice</p>
          </div>

          <div style="background-color: #161b22; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #21262d;">
            <h2 style="color: #a855f7; margin-top: 0; font-size: 18px;">Route Details</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
              <tr>
                <td style="color: #8b949e; width: 40%; padding: 4px 0;">Transport Type:</td>
                <td style="color: #f0f6fc; font-weight: bold; text-transform: uppercase;">${booking.bookingType || booking.type}</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Operator:</td>
                <td style="color: #f0f6fc;">${booking.provider}</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Route:</td>
                <td style="color: #f0f6fc;">${booking.origin} ➔ ${booking.destination}</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Date & Time:</td>
                <td style="color: #f0f6fc;">${booking.date} (${booking.departureTime} - ${booking.arrivalTime})</td>
              </tr>
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Seat(s) Booked:</td>
                <td style="color: #a855f7; font-weight: bold;">${(booking.seats || []).join(', ')}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #161b22; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #21262d;">
            <h2 style="color: #a855f7; margin-top: 0; font-size: 18px;">Tax Invoice Receipt</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">Base Fare Ticket:</td>
                <td style="text-align: right; color: #f0f6fc;">₹${booking.billing.baseFare}</td>
              </tr>
              ${booking.billing.discount > 0 ? `
              <tr>
                <td style="color: #10b981; padding: 4px 0;">🎁 Promo Code Discount:</td>
                <td style="text-align: right; color: #10b981; font-weight: bold;">-₹${booking.billing.discount}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: #8b949e; padding: 4px 0;">SGST & CGST (18%):</td>
                <td style="text-align: right; color: #f0f6fc;">₹${booking.billing.gst}</td>
              </tr>
              <tr style="border-top: 1px solid #30363d;">
                <td style="color: #f0f6fc; font-weight: bold; padding: 8px 0 0 0;">Total Amount Paid:</td>
                <td style="text-align: right; color: #a855f7; font-weight: bold; font-size: 16px; padding: 8px 0 0 0;">₹${booking.billing.grandTotal}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #21262d; padding-top: 15px; margin-top: 20px;">
            <p style="margin: 0;">Boarding ID: <span style="font-family: monospace; font-weight: bold; color: #f0f6fc;">${booking.id}</span></p>
            <p style="margin: 5px 0 0 0;">Safe travels from Pack Your Bags!</p>
          </div>
        </div>
      `;
    }

    let fromEmail = localStorage.getItem("RESEND_FROM_EMAIL");
    if (!fromEmail) {
      const checkoutSenderInput = document.getElementById("checkout-resend-sender");
      if (checkoutSenderInput && checkoutSenderInput.value.trim()) {
        fromEmail = checkoutSenderInput.value.trim();
        localStorage.setItem("RESEND_FROM_EMAIL", fromEmail);
      }
    }
    if (!fromEmail) fromEmail = "onboarding@resend.dev";

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Resend-Key": apiKey,
          "X-Resend-From": fromEmail
        },
        body: JSON.stringify(booking)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || response.statusText);
      }
      console.log("Resend email dispatch successful! ID: ", resData.id);
      showNotification("Invoice voucher emailed successfully!", "success");
    } catch (err) {
      console.error("Resend email delivery failed: ", err);
      let errMsg = err.message;
      if (errMsg.toLowerCase().includes("to") || errMsg.toLowerCase().includes("verify") || errMsg.toLowerCase().includes("restriction")) {
        errMsg += " (Note: Sandbox Resend accounts can only send to their own registered owner email. Please check your recipient address.)";
      }
      showNotification("Email dispatch failed: " + errMsg, "error");
    }
  },

  // 8. Update seat maps on routes table
  async updateRouteSeats(routeId, seatLayout, seatsAvailable) {
    if (window.useSupabase) {
      try {
        const { error } = await window.supabaseClient
          .from("routes")
          .update({ seatLayout: seatLayout, seatsAvailable: seatsAvailable })
          .eq("id", routeId);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase updateRouteSeats failed: ", err);
      }
    }

    const db = getDB();
    const idx = db.routes.findIndex((r) => r.id === routeId);
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

        if (routeId) {
          const { error: routeErr } = await window.supabaseClient
            .from("routes")
            .update({ seatLayout: seatLayout, seatsAvailable: seatsAvailable })
            .eq("id", routeId);
          if (routeErr) throw routeErr;
        }

        return true;
      } catch (err) {
        console.error("Supabase cancelBooking failed, falling back to LocalStorage: ", err);
      }
    }

    const db = getDB();
    const bIdx = db.bookings.findIndex((b) => b.id === bookingId);
    if (bIdx > -1) {
      db.bookings[bIdx].status = "Cancelled";
    }
    if (routeId) {
      const rIdx = db.routes.findIndex((r) => r.id === routeId);
      if (rIdx > -1) {
        db.routes[rIdx].seatLayout = seatLayout;
        db.routes[rIdx].seatsAvailable = seatsAvailable;
      }
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
        const {
          data: { session }
        } = await window.supabaseClient.auth.getSession();
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
    db.passengers = db.passengers.filter((p) => p.id !== passengerId);
    saveDB(db);
    return true;
  },

  // 13. Fetch administrative statistics
  async getAdminStats() {
    if (window.useSupabase) {
      try {
        const { data: bData, error: bErr } = await window.supabaseClient.from("bookings").select("status, billing");
        if (bErr) throw bErr;

        const { count: routesCount, error: rErr } = await window.supabaseClient
          .from("routes")
          .select("*", { count: "exact", head: true });
        if (rErr) throw rErr;

        const { count: paxCount, error: pErr } = await window.supabaseClient
          .from("passengers")
          .select("*", { count: "exact", head: true });
        if (pErr) throw pErr;

        const totalBookingsCount = bData.length;
        const totalRevenue = bData
          .filter((b) => b.status === "Confirmed")
          .reduce((sum, b) => sum + b.billing.grandTotal, 0);

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
    const activeBookings = db.bookings.filter((b) => b.status === "Confirmed");
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
  },

  // 15. Fetch hotels for a city (Support ScoutingAPI integration)
  async getHotels(city) {
    if (window.SCOUTINGAPI_KEY) {
      try {
        const response = await fetch(`https://api.scoutingapi.com/v1/search?location=${encodeURIComponent(city)}&limit=8`, {
          headers: {
            "Authorization": `Bearer ${window.SCOUTINGAPI_KEY}`
          }
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.data && resJson.data.length > 0) {
            return resJson.data.map((h, i) => ({
              id: h.id || `HTL-${city.slice(0,3).toUpperCase()}-${100000 + i}`,
              name: h.name,
              platform: h.platform || "booking",
              city: city,
              rating: h.rating || parseFloat((4.0 + Math.random() * 0.9).toFixed(1)),
              price: h.price?.rate || h.price || Math.floor(2000 + Math.random() * 3000),
              photo: h.photos?.[0] || [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80"
              ][i % 3],
              amenities: h.amenities || ["Free WiFi", "AC", "Breakfast Included"],
              description: h.description || "Premium accommodation options retrieved via live ScoutingAPI integration."
            }));
          }
        }
      } catch (err) {
        console.error("ScoutingAPI lookup failed, using local fallback:", err);
      }
    }

    const db = getDB();
    return db.hotels.filter((h) => h.city.toLowerCase() === city.toLowerCase());
  },

  // 16. Fetch specific hotel by ID
  async getHotelById(hotelId) {
    const db = getDB();
    return db.hotels.find((h) => h.id === hotelId) || null;
  }
};

const REAL_HOTELS = {
  "Mumbai": [
    {
      name: "The Taj Mahal Palace",
      platform: "booking",
      rating: 4.9,
      price: 18500,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Sea View Rooms", "Butler Service", "Luxury Spa", "Infinity Pool", "9 Award-winning Restaurants", "Free WiFi"],
      description: "India's iconic heritage hotel, standing majestically opposite the Gateway of India, offering unparalleled luxury, vintage architecture, and refined hospitality."
    },
    {
      name: "Trident Nariman Point",
      platform: "google",
      rating: 4.7,
      price: 11000,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["Oceanfront View", "24h Room Service", "Outdoor Pool", "Fitness Centre", "Free WiFi", "Bar"],
      description: "Located on Marine Drive, Trident Nariman Point offers stunning panoramic views of the Arabian Sea, modern guest rooms, and award-winning dining."
    },
    {
      name: "JW Marriott Mumbai Juhu",
      platform: "airbnb",
      rating: 4.8,
      price: 14500,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Beachfront Access", "Saltwater Pools", "Quan Spa", "Award-winning Dining", "AC", "Smart TV"],
      description: "A premium luxury resort nestled along Juhu Beach, popular with Bollywood stars, offering a beautiful beachside sanctuary, luxury amenities, and fine dining."
    },
    {
      name: "Ginger Mumbai Andheri",
      platform: "vrbo",
      rating: 4.2,
      price: 4500,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Lean Luxe Concept", "Free WiFi", "Fitness Room", "In-house Restaurant", "AC", "Laundry"],
      description: "A smart, budget-friendly design hotel featuring modular interiors, high-speed WiFi, and contemporary comforts close to Mumbai Airport."
    }
  ],
  "Delhi": [
    {
      name: "The Leela Palace New Delhi",
      platform: "booking",
      rating: 4.9,
      price: 16500,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Rooftop Temperature Pool", "Luxury Spa", "Award-winning Dining", "Butler Service", "Free WiFi", "AC"],
      description: "Located in Diplomatic Enclave, Chanakyapuri, combining grand Lutyens' architecture with royal Indian heritage, top-tier dining, and unmatched luxury rooms."
    },
    {
      name: "Taj Palace New Delhi",
      platform: "google",
      rating: 4.8,
      price: 13500,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["6 Acres of Gardens", "Golf Putting Green", "Luxury Spa", "Swimming Pool", "High-speed WiFi"],
      description: "Set in Delhi’s prestigious Diplomatic Enclave, Taj Palace has hosted world leaders for decades. Features refined heritage comfort, lush lawns, and premium spa retreats."
    },
    {
      name: "The Lalit New Delhi",
      platform: "airbnb",
      rating: 4.5,
      price: 8500,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Connaught Place Location", "Nightclub Kitty Su", "Rejuve Spa", "Free WiFi", "Swimming Pool"],
      description: "A luxury skyscraper hotel situated in the heart of Connaught Place, offering modern rooms, multiple dining venues, and a lively downtown nightlife."
    },
    {
      name: "Bloomrooms @ Janpath",
      platform: "vrbo",
      rating: 4.3,
      price: 3900,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Signature Yellow Design", "Free WiFi", "Cloudbeds Comfort", "Cafe", "AC", "Smart TV"],
      description: "A highly rated, vibrant, and minimal design hotel situated near Janpath Market, featuring clean interiors and smart spaces."
    }
  ],
  "Bangalore": [
    {
      name: "The Oberoi Bengaluru",
      platform: "booking",
      rating: 4.9,
      price: 14000,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Garden View Rooms", "Century-old Rain Tree View", "Luxury Spa", "Outdoor Pool", "Free WiFi"],
      description: "A luxury oasis on MG Road, built around a majestic 120-year-old rain tree, offering private balconies with garden views and award-winning personalized service."
    },
    {
      name: "ITC Gardenia",
      platform: "google",
      rating: 4.8,
      price: 12500,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["LEED Platinum Certified", "Outdoor Heli-Pad View", "Kaya Kalp Spa", "Pillared Corridors", "Free WiFi"],
      description: "Inspired by the garden city theme, ITC Gardenia offers sustainable luxury architecture, premium regional dining venues, and spacious sky suites."
    },
    {
      name: "The Taj West End",
      platform: "airbnb",
      rating: 4.8,
      price: 15500,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["20 Acres of Heritage Gardens", "Historic Postbox", "Tennis Courts", "Outdoor Pool", "Spa"],
      description: "Dating back to 1887, Taj West End is a heritage sanctuary with lush green gardens, historic Victorian architecture, and world-class fine dining."
    },
    {
      name: "Ibiza Guest House Indiranagar",
      platform: "vrbo",
      rating: 4.0,
      price: 2900,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Boutique Balcony Rooms", "Free WiFi", "Kitchenette", "AC", "Laundry Services"],
      description: "A trendy boutique guest house in Indiranagar, close to major pubs and restaurants, catering to remote workers and creative professionals."
    }
  ],
  "Pune": [
    {
      name: "JW Marriott Hotel Pune",
      platform: "booking",
      rating: 4.8,
      price: 11500,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Senapati Bapat Rd Location", "Rooftop Lounge", "Infinity Pool", "Quan Spa", "Free WiFi"],
      description: "An iconic landmark hotel on Senapati Bapat Road, offering luxury guest rooms, extensive banquet halls, and a vibrant rooftop restaurant."
    },
    {
      name: "The Ritz-Carlton Pune",
      platform: "google",
      rating: 4.9,
      price: 14500,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["Golf Course View", "Ritz-Carlton Club Access", "Luxury Spa", "Whiskey Lounge", "Free WiFi"],
      description: "Overlooking the beautiful Poona Club Golf Course, this hotel offers bespoke luxury, classic design details, and elite club concierge services."
    },
    {
      name: "Conrad Pune",
      platform: "airbnb",
      rating: 4.8,
      price: 10000,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Art Deco Design", "Heated Outdoor Pool", "Concierge Service", "Free WiFi", "6 Dining Venues"],
      description: "Pune's luxury business address featuring grand Art Deco styling, advanced smart-room controls, and a gorgeous pool deck."
    },
    {
      name: "FabHotel Baner Prime",
      platform: "vrbo",
      rating: 4.1,
      price: 2500,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Free WiFi", "AC Rooms", "Complimentary Breakfast", "Daily Housekeeping", "Smart TV"],
      description: "A comfortable, budget-friendly business hotel offering clean rooms, quick service, and easy access to Baner IT Hub."
    }
  ],
  "Chennai": [
    {
      name: "ITC Grand Chola",
      platform: "booking",
      rating: 4.9,
      price: 13500,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Chola Dynasty Architecture", "3 Swimming Pools", "Peshawri Restaurant", "Kaya Kalp Spa", "Free WiFi"],
      description: "A massive luxury palace hotel showcasing majestic Chola dynasty architecture, hand-carved pillars, elite suites, and extensive dining options."
    },
    {
      name: "The Leela Palace Chennai",
      platform: "google",
      rating: 4.8,
      price: 12500,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["Bay of Bengal Sea View", "Infinity Pool", "ESPACIO Spa", "Free WiFi", "AC", "Mini Bar"],
      description: "Chennai's only sea-facing palace hotel, situated on the Marina Beach seafront, combining grand design features with breathtaking ocean views."
    },
    {
      name: "Taj Coromandel",
      platform: "airbnb",
      rating: 4.8,
      price: 11000,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Central Location", "Fine Dining Southern Spice", "Luxury Pool", "Jiva Spa", "Free WiFi"],
      description: "A legendary city icon hosting celebrities and royalty, known for its outstanding South Indian fine dining restaurant Southern Spice."
    },
    {
      name: "Treebo Trend Palm Tree",
      platform: "vrbo",
      rating: 4.0,
      price: 2400,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Free WiFi", "AC", "Complimentary Breakfast", "Free Parking", "Room Service"],
      description: "A clean and pocket-friendly boutique lodging located in Mylapore, offering easy access to temples and heritage markets."
    }
  ],
  "Kolkata": [
    {
      name: "The Oberoi Grand Kolkata",
      platform: "booking",
      rating: 4.9,
      price: 13000,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Colonial Architecture", "Quadrangle Pool", "Bespoke Spa", "Chowringhee Location", "Free WiFi"],
      description: "Known affectionately as the 'Grand Dame of Chowringhee', this heritage luxury hotel features grand colonial style, luxury rooms, and elegant gardens."
    },
    {
      name: "Taj Bengal",
      platform: "google",
      rating: 4.7,
      price: 10500,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["Alipore Elite Enclave", "Lush Atrium lobby", "Swimming Pool", "Jiva Spa", "Free WiFi"],
      description: "Located in elite Alipore, Taj Bengal offers a calm retreat featuring classic Bengali artwork, a soaring green atrium, and premium suites."
    },
    {
      name: "ITC Sonar Kolkata",
      platform: "airbnb",
      rating: 4.8,
      price: 11500,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Bagh-E-Sonar Lawns", "Water Lilies Pond", "Kaya Kalp Spa", "Free WiFi", "AC"],
      description: "Designed as a resort-inspired sanctuary with lily ponds and lush green lawns, combining eco-luxury vibes with stellar regional food options."
    },
    {
      name: "The Peerless Inn Kolkata",
      platform: "vrbo",
      rating: 4.2,
      price: 4300,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Authentic Bengali Aaheli", "Esplanade Location", "Free WiFi", "AC", "Fitness Centre"],
      description: "Located near Esplanade Metro, famous for its iconic traditional Bengali restaurant Aaheli, offering comfortable rooms at moderate rates."
    }
  ],
  "Hyderabad": [
    {
      name: "Taj Falaknuma Palace",
      platform: "booking",
      rating: 4.9,
      price: 36000,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Horse-Drawn Carriage Entry", "101-seat Dining Table", "Nizam Palace Tour", "Royal Jiva Spa", "Free WiFi"],
      description: "A spectacular palace hotel floating 2,000 feet above Hyderabad. Experience the actual royal lifestyle of the Nizams with horse-drawn carriage entries."
    },
    {
      name: "The Westin Hyderabad Mindspace",
      platform: "google",
      rating: 4.7,
      price: 9500,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["Hitech City Location", "Heavenly Bed Concept", "Westin Workout Gym", "Outdoor Pool", "Spa"],
      description: "Located in the heart of Hitech City, this hotel offers spacious modern rooms, signature wellness amenities, and extensive executive business lounges."
    },
    {
      name: "Novotel Hyderabad Airport",
      platform: "airbnb",
      rating: 4.5,
      price: 7500,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Resort Green Architecture", "Spa & Sauna", "Airport Shuttle", "Outdoor Sports Pitch", "Free WiFi"],
      description: "A peaceful resort-style transit hotel located near Hyderabad International Airport, surrounded by scenic lawns and sports pitches."
    },
    {
      name: "Red Fox Hotel Hitech City",
      platform: "vrbo",
      rating: 4.0,
      price: 3400,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Vibrant Smart Interiors", "Free WiFi", "AC", "Cafe & Bar", "Fitness Corner"],
      description: "A budget design hotel catering to business executives, featuring crisp bold decor, reliable WiFi, and comfortable beds."
    }
  ],
  "Ahmedabad": [
    {
      name: "Taj Skyline Ahmedabad",
      platform: "booking",
      rating: 4.7,
      price: 8500,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Sindhu Bhavan Rd Location", "Indoor Temperature Pool", "Jiva Spa", "Free WiFi", "AC"],
      description: "A contemporary luxury skyscraper on Sindhu Bhavan Road, featuring premium regional Gujarati cuisine, modern rooms, and dynamic city skyline views."
    },
    {
      name: "The House of MG",
      platform: "google",
      rating: 4.8,
      price: 8900,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["Heritage Haveli Stay", "Agashiye Rooftop Dining", "Indoor Pool", "Heritage Walks", "Free WiFi"],
      description: "A beautifully restored 20th-century heritage mansion haveli offering traditional Gujarati hospitality, luxury rooms, and its famous rooftop dining, Agashiye."
    },
    {
      name: "Hyatt Regency Ahmedabad",
      platform: "airbnb",
      rating: 4.6,
      price: 7200,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Sabarmati Riverfront View", "24h Room Service", "Arogya Spa", "Free WiFi", "Luxury Lounges"],
      description: "Overlooking the Sabarmati Riverfront, this business hotel offers luxury guest rooms, fine-dining restaurants, and reliable business amenities."
    },
    {
      name: "Lemon Tree Hotel Ahmedabad",
      platform: "vrbo",
      rating: 4.1,
      price: 3900,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Citrus Cafe", "Free WiFi", "AC", "Fitness Corner", "Room Service"],
      description: "Located near CG Road, this cheerful hotel features bright color palettes, standard amenities, and signature warm hospitality."
    }
  ],
  "Goa": [
    {
      name: "Taj Exotica Resort & Spa Goa",
      platform: "booking",
      rating: 4.9,
      price: 21500,
      photo: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
      amenities: ["Benaulim Beach Access", "Mediterranean Villas", "9-hole Golf Greens", "Jiva Spa", "Free WiFi"],
      description: "A gorgeous Mediterranean-style resort sprawled across 56 acres of manicured lawns in South Goa, leading to pristine Benaulim Beach."
    },
    {
      name: "W Goa",
      platform: "google",
      rating: 4.7,
      price: 18500,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["Vagator Cliff View", "WooBar Sunsets", "AWAY Spa", "Infinity Beach Pool", "Free WiFi"],
      description: "Nestled under the historic Chapora Fort cliff overlooking Vagator Beach, W Goa features vibrant party vibes, signature beach pools, and scenic sundowners."
    },
    {
      name: "Cidade de Goa - IHCL",
      platform: "airbnb",
      rating: 4.5,
      price: 10500,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Vainguinim Beachfront", "Portuguese Village Vibe", "Water Sports", "Outdoor Pool", "Spa"],
      description: "Designed as a rustic Portuguese Goan village on the beachfront, offering watersports, sunset cruises, and cozy sea-facing balconies."
    },
    {
      name: "The Zuri White Sands",
      platform: "vrbo",
      rating: 4.6,
      price: 12500,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Varca Beach Access", "Giant Lagoon Pool", "In-house Casino Dunes", "Maya Spa", "Free WiFi"],
      description: "A premium South Goa getaway featuring one of India’s longest lagoon pools, an in-house casino lounge, and access to Varca Beach."
    }
  ],
  "Jaipur": [
    {
      name: "Rambagh Palace",
      platform: "booking",
      rating: 4.9,
      price: 36000,
      photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      amenities: ["Former Royal Palace Stay", "Peacock Garden Walks", "Suvarna Mahal Fine Dining", "Jiva Grand Spa", "Free WiFi"],
      description: "The 'Jewel of Jaipur', a grand former residence of the Maharaja. Wander among strutting peacocks, heritage corridors, and experience dining in gold-plated salons."
    },
    {
      name: "The Oberoi Rajvilas",
      platform: "google",
      rating: 4.9,
      price: 31000,
      photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      amenities: ["32-acre Oasis", "Luxury Tents & Villas", "Shiva Temple on site", "Oberoi Spa", "Free WiFi"],
      description: "A luxury fortress resort spread across 32 acres of gardens, featuring royal tents, luxury private villas with pools, and a 280-year-old Shiva temple."
    },
    {
      name: "Taj Amer Jaipur",
      platform: "airbnb",
      rating: 4.8,
      price: 15500,
      photo: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
      amenities: ["Aravali Hill Views", "Amer Fort proximity", "Luxury Pool", "Mughal Garden lawns", "Free WiFi"],
      description: "Set against the backdrop of the Aravali Hills near Amer Fort, offering royal Rajput hospitality, traditional music shows, and luxury comfort."
    },
    {
      name: "Umaid Bhawan Hotel Jaipur",
      platform: "vrbo",
      rating: 4.4,
      price: 4500,
      photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      amenities: ["Traditional Haveli Balconies", "Rooftop Puppet Shows", "Swimming Pool", "Free WiFi", "AC"],
      description: "A highly rated heritage style boutique hotel, featuring hand-painted ceilings, classic Rajasthani balconies, and daily rooftop puppet performances."
    }
  ]
};

function generateLocalHotels() {
  const hotels = [];
  CITIES.forEach((city) => {
    const list = REAL_HOTELS[city];
    if (list) {
      list.forEach((item, idx) => {
        hotels.push({
          id: `HTL-${city.slice(0, 3).toUpperCase()}-${100000 + idx}`,
          name: item.name,
          platform: item.platform,
          city: city,
          rating: item.rating,
          price: item.price,
          photo: item.photo,
          amenities: item.amenities,
          description: item.description
        });
      });
    }
  });
  return hotels;
}

// Initial local seed execution for fallback
(function seedLocalDatabase() {
  const today = new Date();
  const db = getDB();
  let changed = false;

  if (db.routes.length === 0) {
    for (let i = 0; i < 3; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const dateStr = nextDate.toISOString().split("T")[0];
      const generated = generateLocalTripsForDate(dateStr);
      db.routes = [...db.routes, ...generated];
    }
    changed = true;
  }

  // Always synchronize with high-fidelity real-world hotel list
  db.hotels = generateLocalHotels();
  changed = true;

  if (changed) {
    saveDB(db);
  }
})();
