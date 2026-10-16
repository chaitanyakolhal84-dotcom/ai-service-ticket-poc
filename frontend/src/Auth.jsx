
import { useState } from "react";
import "./Auth.css";

const AUTH_API = "http://localhost:5000/api/auth";

export default function Auth({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (mode === "register" && !name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        setLoading(true);

        try {
            const endpoint =
                mode === "login" ? "/login" : "/register";

            const payload =
                mode === "login"
                    ? { email: email.trim(), password }
                    : { name: name.trim(), email: email.trim(), password };

            const response = await fetch(`${AUTH_API}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.message || "Authentication failed.");
            }

            if (mode === "register") {
                setMode("login");
                setPassword("");
                setMessage("Registration successful. Please log in.");
            } else if (data.token && data.user) {
                onLogin(data.token, data.user);
            } else {
                throw new Error("Login response did not contain a token and user.");
            }
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    <div className="auth-logo">TS</div>
                    <h1>TicketSense</h1>
                    <p>AI-Powered Service Ticket Management</p>
                </div>

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={mode === "login" ? "active" : ""}
                        onClick={() => {
                            setMode("login");
                            setError("");
                            setMessage("");
                        }}
                    >
                        Login
                    </button>

                    <button
                        type="button"
                        className={mode === "register" ? "active" : ""}
                        onClick={() => {
                            setMode("register");
                            setError("");
                            setMessage("");
                        }}
                    >
                        Register
                    </button>
                </div>

                <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                <p className="auth-subtitle">
                    {mode === "login"
                        ? "Sign in to manage your support tickets."
                        : "Register as a customer to get started."}
                </p>

                <form onSubmit={handleSubmit}>
                    {mode === "register" && (
                        <label>
                            Full Name
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                autoComplete="name"
                                required
                            />
                        </label>
                    )}

                    <label>
                        Email Address
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete={
                                mode === "login" ? "current-password" : "new-password"
                            }
                            minLength={6}
                            required
                        />
                    </label>

                    {error && <div className="auth-error">{error}</div>}
                    {message && <div className="auth-success">{message}</div>}

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading
                            ? "Please wait..."
                            : mode === "login"
                                ? "Sign In"
                                : "Create Account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Secure access for customers and support administrators.
                </p>
            </section>
        </main>
    );
}
