import { useState } from "react";
import { Link } from "react-router-dom";
import { demoGuestBookings } from "../data/demoVenues";

const tabs = [
  { key: "upcoming", label: "Upcoming", filter: (b) => b.status !== "past" },
  { key: "past", label: "Past", filter: (b) => b.status === "past" },
];

const statusLabel = {
  confirmed: { text: "Confirmed", cls: "bg-green-50 text-green-700 border-green-200" },
  pending: { text: "Advance pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  past: { text: "Completed", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const bookings = demoGuestBookings.filter(tabs.find((t) => t.key === activeTab).filter);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My bookings</h1>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm font-medium px-4 py-2.5 border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="text-gray-400 text-sm">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((b) => {
            const status = statusLabel[b.status];
            return (
              <div key={b.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-20 h-16 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{b.venue_name}</h3>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${status.cls}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    {b.date} · ₹{b.advance_paid.toLocaleString("en-IN")} of ₹{b.total.toLocaleString("en-IN")} paid
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    to={`/venues/${b.venue_id}`}
                    className="text-xs font-semibold border border-gray-300 text-gray-700 rounded-md px-3 py-1.5 hover:bg-gray-50"
                  >
                    View venue
                  </Link>
                  {b.status === "pending" && (
                    <button className="text-xs font-semibold bg-gray-900 text-white rounded-md px-3 py-1.5">
                      Pay balance
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6">
        Showing demo data — connect to GET /api/v1/bookings to replace this.
      </p>
    </div>
  );
}