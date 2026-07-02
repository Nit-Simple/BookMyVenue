import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { demoVenues } from "../data/demoVenues";

export default function Booking() {
  const { venueId } = useParams();
  const { state } = useLocation(); // { date, guests } passed from VenueDetails
  const navigate = useNavigate();
  const venue = demoVenues.find((v) => v.id === venueId) ?? demoVenues[0];

  const date = state?.date ?? "Not selected";
  const guests = state?.guests ?? 0;
  const venueTotal = venue.price_per_day;
  const cateringTotal = guests * 200; // demo estimate, ₹200/guest
  const total = venueTotal + cateringTotal;
  const advancePercent = 0.2;
  const advanceDue = Math.round(total * advancePercent);
  const balanceDue = total - advanceDue;

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);

  async function handlePay(e) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: wire to POST /api/v1/bookings once the request/response shape is
    // confirmed (venue_id, date, guests, and however payment is captured —
    // likely a separate payment-gateway step before or after this call).
    console.log("Booking payload (demo):", { venueId: venue.id, date, guests, total, advanceDue, paymentMethod });
    setTimeout(() => {
      setSubmitting(false);
      navigate("/my-bookings");
    }, 700);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex gap-2 mb-8">
        {["Date & package", "Guest details", "Payment"].map((step, i) => (
          <div
            key={step}
            className={`flex-1 text-center text-xs font-medium py-2.5 rounded-md border ${
              i === 2 ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-400"
            }`}
          >
            {i + 1}. {step}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Summary */}
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Booking summary</h2>
          <div className="border border-gray-200 rounded-xl p-5">
            <p className="font-semibold text-gray-900">{venue.name}</p>
            <p className="text-gray-500 text-sm mt-1">{date} · {guests} guests</p>
            <div className="h-px bg-gray-200 my-4" />
            <Row label="Venue total" value={venueTotal} />
            <Row label={`Catering (${guests} guests)`} value={cateringTotal} />
            <div className="h-px bg-gray-200 my-3" />
            <Row label="Total" value={total} bold />
          </div>
        </div>

        {/* Payment */}
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment</h2>
          <form onSubmit={handlePay} className="border border-gray-200 rounded-xl p-5">
            <div className="bg-gray-100 rounded-lg p-4 mb-5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Due today (20% advance)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{advanceDue.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-500 mt-1">Remaining ₹{balanceDue.toLocaleString("en-IN")} due 7 days before event</p>
            </div>

            <p className="text-xs font-semibold text-gray-700 mb-2">Payment method</p>
            <div className="flex flex-col gap-2 mb-5">
              {[
                { id: "card", label: "Credit / debit card" },
                { id: "upi", label: "UPI" },
                { id: "netbanking", label: "Net banking" },
              ].map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  {m.label}
                </label>
              ))}
            </div>

            {paymentMethod === "card" && (
              <div className="flex flex-col gap-3 mb-5">
                <input placeholder="Card number" className="border border-gray-300 rounded-md px-3 py-2.5 text-sm" />
                <div className="flex gap-3">
                  <input placeholder="MM/YY" className="flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-sm" />
                  <input placeholder="CVV" className="flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-sm" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? "Processing..." : `Pay ₹${advanceDue.toLocaleString("en-IN")} advance & confirm`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between text-sm mb-2 ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
      <span>{label}</span>
      <span>₹{value.toLocaleString("en-IN")}</span>
    </div>
  );
}