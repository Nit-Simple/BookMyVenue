import { Link } from "react-router-dom";
import { demoVenues, demoManagerBookings, demoManagerStats } from "../../data/demoVenues";

const statusStyles = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function ManagerDashboard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Here's how your venues are doing.</p>
        </div>
        <Link
          to="/manager/venues/new"
          className="bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800"
        >
          + Add new venue
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total venues" value={demoManagerStats.totalVenues} />
        <StatCard label="Bookings this month" value={demoManagerStats.bookingsThisMonth} />
        <StatCard
          label="Revenue this month"
          value={`₹${demoManagerStats.revenueThisMonth.toLocaleString("en-IN")}`}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 text-sm">Recent bookings</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Venue</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {demoManagerBookings.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-5 py-3 text-gray-900">{b.venue_name}</td>
                <td className="px-5 py-3 text-gray-600">{b.customer}</td>
                <td className="px-5 py-3 text-gray-600">{b.date}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${statusStyles[b.status]}`}>
                    {b.status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-medium text-gray-900">
                  ₹{(b.advance_paid + b.balance_due).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Showing demo data — connect to GET /api/v1/manager/venues and a bookings-by-manager endpoint to replace this.
      </p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}