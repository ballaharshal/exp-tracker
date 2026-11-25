import { useState } from "react";
import "./Auth.css";

const USERS_KEY = "expenseUsers";

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

// Passwords are never saved as plain text.
// Note: this is still browser-only login, not real server security.
async function hashPassword(email, password) {
  const bytes = new TextEncoder().encode(`${email}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function passwordScore(value) {
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const score = passwordScore(values.password);

  function update(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
    setError("");
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setShowPassword(false);
    setValues((v) => ({ ...v, password: "", confirm: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    const { password, confirm } = values;

    if (isSignup) {
      if (!name) return setError("Please enter your name.");
      if (password.length < 6) {
        return setError("Password must be at least 6 characters.");
      }
      if (password !== confirm) return setError("Passwords do not match.");
    }

    setBusy(true);

    try {
      const users = readUsers();
      const existing = users.find((u) => u.email === email);
      const passwordHash = await hashPassword(email, password);

      if (isSignup) {
        if (existing) {
          return setError("An account with this email already exists.");
        }
        localStorage.setItem(
          USERS_KEY,
          JSON.stringify([...users, { name, email, passwordHash }])
        );
        return onLogin({ name, email });
      }

      if (!existing || existing.passwordHash !== passwordHash) {
        return setError("Incorrect email or password.");
      }

      onLogin({ name: existing.name, email });
    } catch {
      setError("Could not continue. Open the app on localhost or HTTPS.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lx-page">
      {/* Left: showcase */}
      <section className="lx-showcase">
        <div className="lx-orb lx-orb-1" />
        <div className="lx-orb lx-orb-2" />
        <div className="lx-grid-lines" />

        <Brand />

        <div className="lx-hero">
          <h1>
            Know where every <span>rupee</span> goes.
          </h1>
          <p>
            Track spending, set budgets and read clear reports, all in one
            simple dashboard.
          </p>
        </div>

        <div className="lx-preview" aria-hidden="true">
          <div className="lx-glass lx-balance">
            <small>Sample balance</small>
            <strong>₹48,250</strong>
            <div className="lx-bars">
              {[38, 55, 44, 72, 60, 86, 100].map((h, i) => (
                <i
                  key={i}
                  style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          </div>

          <div className="lx-glass lx-goal">
            <div className="lx-ring">
              <span>68%</span>
            </div>
            <div>
              <small>Budget used</small>
              <b>On track</b>
            </div>
          </div>
        </div>

        <ul className="lx-features">
          <li>Smart budgets</li>
          <li>Visual reports</li>
          <li>CSV export</li>
        </ul>
      </section>

      {/* Right: form */}
      <main className="lx-panel">
        <div className="lx-card">
          <div className="lx-mobile-brand">
            <Brand />
          </div>

          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p className="lx-subtitle">
            {isSignup
              ? "Start managing your money in under a minute."
              : "Sign in to continue to your dashboard."}
          </p>

          <div className={`lx-tabs ${isSignup ? "lx-tabs-right" : ""}`}>
            <button
              type="button"
              aria-pressed={!isSignup}
              disabled={busy}
              onClick={() => switchMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={isSignup}
              disabled={busy}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} key={mode}>
            {isSignup && (
              <Field
                label="Full name"
                icon="user"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                value={values.name}
                onChange={update}
              />
            )}

            <Field
              label="Email address"
              icon="mail"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={update}
            />

            <Field
              label="Password"
              icon="lock"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="Enter your password"
              value={values.password}
              onChange={update}
            >
              <button
                type="button"
                className="lx-eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} />
              </button>
            </Field>

            {isSignup && values.password && (
              <div className={`lx-strength lx-s${score}`}>
                <div>
                  {[1, 2, 3, 4].map((n) => (
                    <i key={n} className={n <= score ? "on" : ""} />
                  ))}
                </div>
                <span>{strengthLabels[score]}</span>
              </div>
            )}

            {isSignup && (
              <Field
                label="Confirm password"
                icon="lock"
                name="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={values.confirm}
                onChange={update}
              />
            )}

            {error && (
              <div className="lx-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="lx-submit" disabled={busy}>
              {busy ? (
                <span className="lx-spinner" aria-label="Please wait" />
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <Icon name="arrow" />
                </>
              )}
            </button>
          </form>

          <p className="lx-switch">
            {isSignup ? "Already have an account?" : "New to ExpenseTrack?"}{" "}
            <button
              type="button"
              disabled={busy}
              onClick={() => switchMode(isSignup ? "signin" : "signup")}
            >
              {isSignup ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>

        <footer className="lx-footer">
          Designed and Developed by <strong>Harshal Balla</strong>
        </footer>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="lx-brand">
      <div className="lx-brand-icon">₹</div>
      <div>
        <b>
          Expense<span>Track</span>
        </b>
        <small>Finance Manager</small>
      </div>
    </div>
  );
}

function Field({ label, icon, name, type = "text", children, ...props }) {
  return (
    <div className="lx-field">
      <label htmlFor={`lx-${name}`}>{label}</label>
      <div className="lx-input">
        <Icon name={icon} />
        <input id={`lx-${name}`} name={name} type={type} required {...props} />
        {children}
      </div>
    </div>
  );
}

const paths = {
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3.5 6.5 12 13l8.5-6.5",
  lock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff:
    "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.500 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6C3.600 8.500 2 12 2 12s3.500 7 10 7a10 10 0 0 0 4.400-1",
  arrow: "M5 12h14M13 6l6 6-6 6"
};

function Icon({ name }) {
  return (
    <svg
      className="lx-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
