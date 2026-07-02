import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/manager", label: "Dashboard", end: true },
  { to: "/manager/venues", label: "My Venues" },
];

export default function ManagerLayout() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <Link to="/manager" className="font-bold text-gray-900">BookMyVenue</Link>
        <span className="text-[10px] font-bold tracking-wide bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
          MANAGER MODE
        </span>

        <nav className="flex gap-1 ml-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-800">
          Switch to guest view
        </Link>
        <button
          onClick={signOut}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Log out
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-semibold">
          VM
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}