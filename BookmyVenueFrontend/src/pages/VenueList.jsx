import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { demoVenues } from "../data/demoVenues";

const categories = ["Banquet Hall", "Rooftop", "Garden / Outdoor", "Conference Room"];

export default function VenueList() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [search, setSearch] = useState("");

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const filtered = useMemo(() => {
    return demoVenues.filter((v) => {
      if (v.status === "Inactive") return false;
      if (selectedCategories.length && !selectedCategories.includes(v.category)) return false;
      if (v.price_per_day > maxPrice) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.city.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [selectedCategories, maxPrice, search]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <input
        type="text"
        placeholder="Search venues by name or city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-8 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      <div className="flex gap-8">
        {/* Filters */}
        <aside className="w-56 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Venue type</h3>
          <div className="flex flex-col gap-2 mb-6">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-gray-300"
                />
                {cat}
              </label>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-3">Max price / day</h3>
          <input
            type="range"
            min="10000"
            max="100000"
            step="5000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">Up to ₹{maxPrice.toLocaleString("en-IN")}</p>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">{filtered.length} venues found</p>
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm">No venues match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((venue) => (
                <Link
                  key={venue.id}
                  to={`/venues/${venue.id}`}
                  className="group block border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow"
                >
                  <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-40 flex items-center justify-center text-gray-500 text-xs font-medium">
                    {venue.category}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{venue.name}</h3>
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-700 shrink-0">⭐ {venue.rating}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{venue.city} · Up to {venue.capacity} guests</p>
                    <p className="text-gray-900 text-sm mt-3 font-semibold">
                      ₹{venue.price_per_day.toLocaleString("en-IN")}
                      <span className="text-gray-400 font-normal"> / day</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Showing demo data with client-side filtering. Once GET /api/v1/venues supports
        query params for category/price/search, swap this for a real API call.
      </p>
    </div>
  );
}