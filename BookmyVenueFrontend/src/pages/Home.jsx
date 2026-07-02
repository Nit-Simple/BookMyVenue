import { Link } from "react-router-dom";
import { demoVenues } from "../data/demoVenues";

// NOTE: using demoVenues for now so the page can be reviewed fully rendered.
// Swap the array below for a real listVenues() API call (see api/venues.js)
// once GET /api/v1/venues is ready to test against.

export default function Home() {
  const featured = demoVenues.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white px-6 py-24 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
          Find and book the perfect venue
        </h1>
        <p className="text-gray-300 mb-8 max-w-lg mx-auto text-base md:text-lg">
          Banquet halls, rooftops, gardens and conference rooms — browse and
          book with an advance payment, no back-and-forth calls.
        </p>
        <Link
          to="/venues"
          className="inline-block bg-white text-gray-900 font-semibold px-7 py-3.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Browse venues
        </Link>
      </section>

      {/* Category strip */}
      <section className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap gap-3 justify-center">
        {["Banquet Hall", "Rooftop", "Garden / Outdoor", "Conference Room"].map((cat) => (
          <span
            key={cat}
            className="text-sm font-medium text-gray-700 border border-gray-200 rounded-full px-4 py-2 bg-white hover:border-gray-400 cursor-pointer transition-colors"
          >
            {cat}
          </span>
        ))}
      </section>

      {/* Featured venues */}
      <section className="max-w-6xl mx-auto px-6 py-10 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Popular venues</h2>
          <Link to="/venues" className="text-sm font-semibold text-gray-700 hover:text-gray-900">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((venue) => (
            <Link
              key={venue.id}
              to={`/venues/${venue.id}`}
              className="group block border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow"
            >
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-44 flex items-center justify-center text-gray-500 text-xs font-medium">
                {venue.category}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                    {venue.name}
                  </h3>
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-700 shrink-0">
                    ⭐ {venue.rating}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {venue.city} · Up to {venue.capacity} guests
                </p>
                <p className="text-gray-900 text-sm mt-3 font-semibold">
                  ₹{venue.price_per_day.toLocaleString("en-IN")}
                  <span className="text-gray-400 font-normal"> / day</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}