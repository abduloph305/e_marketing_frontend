import { useContext, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

const initialForm = {
  email: import.meta.env.VITE_ADMIN_EMAIL || "",
  password: import.meta.env.VITE_ADMIN_PASSWORD || "",
};

function LoginPage() {
  const { admin, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (admin) {
    return <Navigate to="/overview" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/overview", {
        replace: true,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="shell-card-strong overflow-hidden p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ui-muted">
            Standalone Module
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-tight text-ui-strong">
            Email marketing control center for campaign ops and admin workflows.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ui-body">
            This frontend is intentionally API-ready and isolated, so it can
            plug into a broader platform later without reshaping the dashboard
            shell.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Admin auth", "JWT-based session flow with protected routes."],
              [
                "Dashboard shell",
                "Reusable sidebar, topbar, and content cards.",
              ],
              [
                "Future APIs",
                "Clean route boundaries for later feature integration.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-[24px] bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] p-5 text-white shadow-[0_20px_36px_rgba(99,91,255,0.22)]"
              >
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="shell-card-strong p-8 md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ui-muted">
              Admin Login
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-ui-strong">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-ui-body">
              Use the admin email and password configured in the backend
              environment.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ui-strong">Email</span>
              <input
                className="field"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Admin email from backend env"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ui-strong">
                Password
              </span>
              <input
                className="field"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Admin password from backend env"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="primary-button w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
