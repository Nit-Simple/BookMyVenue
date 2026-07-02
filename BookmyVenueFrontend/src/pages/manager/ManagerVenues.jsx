import { Link } from "react-router-dom";
import { demoVenues } from "../../data/demoVenues";

export default function ManagerVenues() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My venues</h1>
        <Link
          to="/manager/venues/new"
          className="bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800"
        >
          + Add new venue
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {demoVenues.map((venue) => (
          <div key={venue.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
            <div className="w-24 h-20 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 shrink-0 flex items-center justify-center text-[10px] text-gray-500 font-medium text-center px-1">
              {venue.category}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">{venue.name}</h3>
                <span
                  className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border shrink-0 ${
                    venue.status === "Active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {venue.status}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">{venue.city} · {venue.bookings_count} bookings total</p>
              <div className="flex gap-2 mt-3">
                <Link
                  to={`/manager/venues/${venue.id}/edit`}
                  className="text-xs font-semibold border border-gray-300 text-gray-700 rounded-md px-3 py-1.5 hover:bg-gray-50"
                >
                  Edit
                </Link>
                <Link
                  to={`/manager/venues/${venue.id}/bookings`}
                  className="text-xs font-semibold bg-gray-900 text-white rounded-md px-3 py-1.5 hover:bg-gray-800"
                >
                  View bookings
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-5">
        Showing demo data — connect to GET /api/v1/manager/venues to replace this.
      </p>
    </div>
  );
}