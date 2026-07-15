export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API Route for sending emails via Resend (avoiding browser CORS policy restrictions)
    if (url.pathname === "/api/send-email" && request.method === "POST") {
      try {
        const booking = await request.json();
        
        // Read key from custom header (UI settings) or Worker environment variables
        const apiKey = request.headers.get("X-Resend-Key") || env.RESEND_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Resend API Key not configured. Please add your Resend API Key in your Profile settings."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
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

        const fromEmail = request.headers.get("X-Resend-From") || "onboarding@resend.dev";

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: booking.email,
            subject: `🎉 Booking Confirmed: ${isHotel ? booking.hotelName : booking.provider} (ID: ${booking.id})`,
            html: emailHtml
          })
        });

        const resData = await response.json();
        return new Response(JSON.stringify(resData), {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
    }

    // Default: Serve static assets
    return env.ASSETS.fetch(request);
  }
};
