import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div>
        <h1 className="header-title">
          <Link to="/">Chord Research Inc.</Link>
        </h1>
        <nav className="header-nav">
          <NavLink to="/" end>
            research
          </NavLink>
          <NavLink to="/stats">stats</NavLink>
          <NavLink to="/info">info</NavLink>
        </nav>
      </div>
      <div className="header-auth">
        {user && (
          <>
            <Link to={`/profile/${user.username}`}>@{user.username}</Link>
            <button
              onClick={() => {
                void logout().then(() => navigate("/"));
              }}
            >
              logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
