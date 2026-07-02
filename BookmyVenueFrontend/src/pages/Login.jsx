import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, decodeToken } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  // TODO: "guest" / "venue_manager" are GUESSES for the domain.Role string
  // values — confirm exact strings against the `domain` package.
  const [role, setRole] = useState("guest"); // "guest" | "venue_manager"
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await register({ email: form.email, password: form.password, phone: form.phone, role });
      }
      const data = await login({ email: form.email, password: form.password });
      signIn(data);

      const decodedRole = decodeToken(data.access_token)?.role;
      navigate(decodedRole === "venue_manager" ? "/manager" : "/");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900">BookMyVenue</h1>
          <p className="text-sm text-gray-500">Find and book the perfect venue</p>
        </div>

        <div className="flex border border-gray-300 rounded-lg overflow-hidden mb-5">
          <button
            type="button"
            onClick={() => setRole("guest")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              role === "guest" ? "bg-gray-900 text-white" : "bg-white text-gray-500"
            }`}
          >
            I'm a Guest
          </button>
          <button
            type="button"
            onClick={() => setRole("venue_manager")}
            className={`flex-1 py-2.5 text-sm font-semibold border-l border-gray-300 transition-colors ${
              role === "venue_manager" ? "bg-gray-900 text-white" : "bg-white text-gray-500"
            }`}
          >
            I'm a Venue Manager
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
              Phone number
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
            Password
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 text-white rounded-md py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-gray-900 font-semibold underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-gray-900 font-semibold underline"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}