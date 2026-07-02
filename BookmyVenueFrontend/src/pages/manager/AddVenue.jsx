import { useState } from "react";
import { useNavigate } from "react-router-dom";

const amenitiesList = [
  "Parking", "In-house catering", "AC", "Stage / AV", "Outdoor space", "Wheelchair access",
];

export default function AddVenue() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", category: "Banquet Hall", description: "",
    address: "", city: "",
    maxGuests: "", pricePerDay: "", advancePercent: "20",
    amenities: [],
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleAmenity(a) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: wire to POST /api/v1/venues/applications (submitVenueApplicationHandler).
    // That route requires an authenticated venue_manager token — axiosClient
    // already attaches it automatically once signed in.
    console.log("Venue application payload (demo):", form);
    setTimeout(() => {
      setSubmitting(false);
      navigate("/manager/venues");
    }, 600);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Add new venue</h1>
      <p className="text-gray-500 text-sm mb-6">
        Submitted venues go through admin review before they're visible to guests.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6">
        <Section title="Basic info">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Venue name">
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Rose Garden Hall"
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {["Banquet Hall", "Rooftop", "Garden / Outdoor", "Conference Room"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the space, style and ideal use cases..."
              className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </Field>
        </Section>

        <Section title="Location">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Address">
              <input
                required
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
            <Field label="City">
              <input
                required
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
          </div>
        </Section>

        <Section title="Capacity & pricing">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Max guests">
              <input
                type="number"
                required
                value={form.maxGuests}
                onChange={(e) => update("maxGuests", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
            <Field label="Price / day (₹)">
              <input
                type="number"
                required
                value={form.pricePerDay}
                onChange={(e) => update("pricePerDay", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
            <Field label="Advance required (%)">
              <input
                type="number"
                required
                value={form.advancePercent}
                onChange={(e) => update("advancePercent", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
          </div>
        </Section>

        <Section title="Amenities">
          <div className="grid grid-cols-2 gap-2">
            {amenitiesList.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                  className="rounded border-gray-300"
                />
                {a}
              </label>
            ))}
          </div>
        </Section>

        <Section title="Photos">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400"
              >
                + upload
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Photo upload not wired yet — needs a file-upload endpoint from the backend.
          </p>
        </Section>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/manager/venues")}
            className="border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 text-white text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-gray-800 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
      {label}
      {children}
    </label>
  );
}