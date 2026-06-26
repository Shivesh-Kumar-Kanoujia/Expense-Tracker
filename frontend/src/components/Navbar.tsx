import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        Expense Tracker
      </Link>
      <div style={styles.right}>
        {user ? (
          <>
            <span style={styles.user}>Hi, {user.name}</span>
            <Link to="/add" style={styles.link}>
              + Add Expense
            </Link>
            <Link to="/categories" style={styles.link}>
              Categories
            </Link>
            <button onClick={handleLogout} style={styles.button}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brand: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#1a1a1a",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  user: {
    color: "#666",
    fontSize: "0.95rem",
  },
  link: {
    color: "#333",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.95rem",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  button: {
    background: "linear-gradient(135deg, #333, #1a1a1a)",
    color: "white",
    border: "none",
    padding: "8px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
};
