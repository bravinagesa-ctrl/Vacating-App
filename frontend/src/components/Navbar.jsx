import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 font-semibold ${isActive ? "bg-jacaranda-mist text-jacaranda-deep" : "hover:bg-jacaranda-mist/60"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-[1000] h-14 border-b border-line bg-white">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4" aria-label="Main">
        <Link to="/" className="font-display text-2xl font-bold text-jacaranda-deep">
          Hama
        </Link>
        <div className="flex items-center gap-1 text-sm sm:text-base">
          <NavLink to="/search" className={linkClass}>Search</NavLink>
          {user && <NavLink to="/dashboard" className={linkClass}>{user.can_post_listings ? "My listings" : "Account"}</NavLink>}
          {user ? (
            <button
              className="btn-ghost ml-2 py-1.5"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </button>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <Link to="/register" className="btn-primary ml-1 py-1.5">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
