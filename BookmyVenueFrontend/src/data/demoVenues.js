// Demo/placeholder data — replace with real API responses once
// GET /api/v1/venues and /api/v1/manager/venues are wired up.

export const demoVenues = [
  { id: "v1", name: "Rose Garden Hall", city: "Kochi", rating: 4.6, price_per_day: 85000, capacity: 300, category: "Banquet Hall", image_url: null, status: "Active", bookings_count: 12 },
  { id: "v2", name: "Skyline Rooftop", city: "Kochi", rating: 4.3, price_per_day: 45000, capacity: 120, category: "Rooftop", image_url: null, status: "Active", bookings_count: 5 },
  { id: "v3", name: "Conference Suite B", city: "Ernakulam", rating: 4.8, price_per_day: 20000, capacity: 60, category: "Conference Room", image_url: null, status: "Active", bookings_count: 9 },
  { id: "v4", name: "Lakeside Lawn", city: "Alappuzha", rating: 4.1, price_per_day: 60000, capacity: 250, category: "Garden / Outdoor", image_url: null, status: "Inactive", bookings_count: 0 },
  { id: "v5", name: "Emerald Banquet", city: "Thrissur", rating: 4.5, price_per_day: 70000, capacity: 400, category: "Banquet Hall", image_url: null, status: "Active", bookings_count: 18 },
  { id: "v6", name: "The Grand Terrace", city: "Kochi", rating: 4.7, price_per_day: 55000, capacity: 150, category: "Rooftop", image_url: null, status: "Active", bookings_count: 7 },
];

export const demoManagerBookings = [
  { id: "b1", venue_id: "v1", venue_name: "Rose Garden Hall", customer: "A. Menon", date: "2026-09-12", guests: 200, advance_paid: 25000, balance_due: 100000, status: "confirmed" },
  { id: "b2", venue_id: "v1", venue_name: "Rose Garden Hall", customer: "S. Kumar", date: "2026-09-20", guests: 150, advance_paid: 0, balance_due: 95000, status: "pending" },
  { id: "b3", venue_id: "v2", venue_name: "Skyline Rooftop", customer: "R. Nair", date: "2026-10-03", guests: 80, advance_paid: 12000, balance_due: 33000, status: "confirmed" },
  { id: "b4", venue_id: "v3", venue_name: "Conference Suite B", customer: "TechCorp Ltd", date: "2026-08-18", guests: 45, advance_paid: 5000, balance_due: 15000, status: "confirmed" },
];

export const demoManagerStats = {
  totalVenues: demoVenues.filter(v => v.status === "Active").length,
  bookingsThisMonth: 17,
  revenueThisMonth: 432000,
};

export const demoVenueDescription =
  "Spacious indoor-outdoor hall suited for weddings and large corporate events, with in-house catering and parking for 150 cars. Natural light pours in through floor-to-ceiling windows, and the adjoining garden makes it easy to host both the ceremony and reception in one place.";

export const demoAmenities = ["Parking", "In-house catering", "AC", "Stage / AV", "Outdoor space", "Wheelchair access"];

export const demoGuestBookings = [
  { id: "gb1", venue_id: "v1", venue_name: "Rose Garden Hall", date: "2026-09-12", status: "confirmed", advance_paid: 25000, total: 125000 },
  { id: "gb2", venue_id: "v2", venue_name: "Skyline Rooftop", date: "2026-10-03", status: "pending", advance_paid: 0, total: 60000 },
  { id: "gb3", venue_id: "v5", venue_name: "Emerald Banquet", date: "2026-04-02", status: "past", advance_paid: 70000, total: 70000 },
];