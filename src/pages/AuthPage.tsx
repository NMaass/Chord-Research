import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AuthPage() {
  const isRegister = useLocation().pathname === "/register";
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const err = isRegister
      ? await register(username.trim(), password)
      : await login(username.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      navigate("/");
    }
  };

  return (
    <main className="auth">
      <form className="auth-form" onSubmit={onSubmit}>
        <input
          className="auth-input"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          maxLength={20}
        />
        <input
          className="auth-input"
          type="password"
          placeholder={isRegister ? "password (6+ chars)" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          maxLength={128}
        />
        <button
          className="auth-submit"
          type="submit"
          disabled={busy || !username.trim() || !password}
        >
          {busy ? "..." : isRegister ? "register →" : "login →"}
        </button>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-switch">
          {isRegister ? (
            <>
              already a researcher? <Link to="/login">login</Link>
            </>
          ) : (
            <>
              new here? <Link to="/register">register</Link>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
