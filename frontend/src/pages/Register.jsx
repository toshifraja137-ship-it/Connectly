
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/register.css";
import { Link } from "react-router-dom";

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.name.trim().length < 3) {
        setError("Name must be at least 3 characters.");
        return;
    }

    if (formData.username.trim().length < 3) {
        setError("Username must be at least 3 characters.");
        return;
    }

    if (formData.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

    if (!passwordRegex.test(formData.password)) {
        setError("Password must contain uppercase, lowercase and a number.");
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    try {
        setLoading(true);

        const response = await api.post("/auth/register", {
            name: formData.name.trim(),
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password
        });

        navigate("/login", {
    state: {
        successMessage: "Account created successfully! Please login."
    }
});

        // Account created successfully.
        // Login page navigation will be added next.

    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Registration failed. Please try again."
        );
    } finally {
        setLoading(false);
    }
};





return (
    <div className="register-page">
        <div className="register-container">

            <div className="register-header">
                <h1>Connectly</h1>
                <p>Create your account and join the community.</p>
            </div>

            {error && (
                <p className="register-error">{error}</p>
            )}

            <form className="register-form" onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                </button>

            </form>

            <div className="register-footer">
                Already have an account? <Link to="/login">Login</Link>
            </div>

        </div>
    </div>
);


}

export default Register;
