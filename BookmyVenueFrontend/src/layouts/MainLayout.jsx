import { Outlet, Link } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            BookMyVenue
          </Link>
          <div className="flex gap-6">
            <Link to="/venues" className="text-gray-600 hover:text-indigo-600">
              Venues
            </Link>
            <Link to="/my-bookings" className="text-gray-600 hover:text-indigo-600">
              My Bookings
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-indigo-600">
              Login
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} BookMyVenue
      </footer>
    </div>
  )
}

export default MainLayout