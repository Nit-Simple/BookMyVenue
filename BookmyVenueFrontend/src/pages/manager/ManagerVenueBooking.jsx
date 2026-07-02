import { useParams, Link } from "react-router-dom";
import { demoVenues, demoManagerBookings } from "../../data/demoVenues";

const statusStyles = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function ManagerVenueBookings() {
  const { venueId } = useParams();
  const venue = demoVenues.find((v) => v.id === venueId) ?? demoVenues[0];
  const bookings = demoManagerBookings.filter((b) => b.venue_id === venue.id);

  // Fake a couple of "booked" days on a 14-day strip just for the visual.
  const bookedDays = new Set([3, 8, 12]);

  return (
    <div>
      <Link to="/manager/venues" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to My venues
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">{venue.name} — Bookings</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Next 14 days</p>
        <div className="flex gap-1.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 text-center text-xs py-2 rounded-md border ${
                bookedDays.has(i)
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Dark = already booked</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Guests</th>
              <th className="px-5 py-3 font-medium">Advance paid</th>
              <th className="px-5 py-3 font-medium">Balance due</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">
                  No bookings yet for this venue.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-5 py-3 text-gray-900">{b.customer}</td>
                <td className="px-5 py-3 text-gray-600">{b.date}</td>
                <td className="px-5 py-3 text-gray-600">{b.guests}</td>
                <td className="px-5 py-3 text-gray-600">₹{b.advance_paid.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3 text-gray-600">₹{b.balance_due.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${statusStyles[b.status]}`}>
                    {b.status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {b.status === "pending" ? (
                    <div className="flex gap-2 justify-end">
                      <button className="text-xs font-semibold bg-gray-900 text-white rounded-md px-3 py-1.5">
                        Approve
                      </button>
                      <button className="text-xs font-semibold border border-gray-300 text-gray-700 rounded-md px-3 py-1.5">
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button className="text-xs font-semibold border border-gray-300 text-gray-700 rounded-md px-3 py-1.5">
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Showing demo data. Note: your backend's /bookings routes currently only
        support create/list/get/cancel — no approve/reject endpoint exists yet,
        so the buttons above are visual only until that's added.
      </p>
    </div>
  );
}