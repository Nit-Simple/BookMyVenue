import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { demoVenues, demoVenueDescription, demoAmenities } from "../data/demoVenues";

const tabs = ["Overview", "Amenities", "Reviews", "Location"];

export default function VenueDetails() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const venue = demoVenues.find((v) => v.id === venueId) ?? demoVenues[0];

  const [activeTab, setActiveTab] = useState("Overview");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(100);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <p className="text-xs text-gray-500 mb-4">
        <Link to="/" className="hover:text-gray-800">Home</Link> /{" "}
        <Link to="/venues" className="hover:text-gray-800">Venues</Link> / {venue.name}
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-64 rounded-xl flex items-center justify-center text-gray-500 text-sm font-medium mb-3">
            {venue.category}
          </div>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 h-16 rounded-lg flex items-center justify-center text-[10px] text-gray-400">
                photo
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
          <p className="text-gray-500 text-sm mt-1 mb-5">
            {venue.city} · ⭐ {venue.rating} · {venue.category}
          </p>

          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium px-4 py-2.5 border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <p className="text-gray-600 text-sm leading-relaxed">{demoVenueDescription}</p>
          )}
          {activeTab === "Amenities" && (
            <div className="grid grid-cols-2 gap-2">
              {demoAmenities.map((a) => (
                <div key={a} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="text-green-600">✓</span> {a}
                </div>
              ))}
            </div>
          )}
          {activeTab === "Reviews" && (
            <p className="text-gray-400 text-sm">No reviews yet — demo placeholder.</p>
          )}
          {activeTab === "Location" && (
            <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center text-xs text-gray-400">
              Map placeholder — {venue.city}
            </div>
          )}
        </div>

        {/* Sticky booking card */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="border border-gray-200 rounded-xl p-5 lg:sticky lg:top-6">
            <p className="text-xl font-bold text-gray-900">
              ₹{venue.price_per_day.toLocaleString("en-IN")}
              <span className="text-sm font-normal text-gray-400"> / day</span>
            </p>
            <div className="h-px bg-gray-200 my-4" />

            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Event date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Guests</label>
            <input
              type="number"
              value={guests}
              max={venue.capacity}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <button
              onClick={() => navigate(`/venues/${venue.id}/book`, { state: { date, guests } })}
              disabled={!date}
              className="w-full bg-gray-900 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book now
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Pay 20% advance to confirm · balance due 7 days before event
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}