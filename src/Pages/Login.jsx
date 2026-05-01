import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const response = await fetch("http://localhost:3000/api/v1/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    // Check if response is valid JSON
    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid server response");
    }

    const data = await response.json();

    console.log("Login Response:", data);

    if (response.ok) {
      // Save token if provided
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setMessage("Login successful!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } else {
      setMessage(data.message || "Invalid credentials");
    }

  } catch (error) {
    console.error("Login Error:", error);

    if (error.message.includes("Failed to fetch")) {
      setMessage("Unable to connect to server. Check backend.");
    } else if (error.message.includes("Invalid server response")) {
      setMessage("Server returned invalid response.");
    } else {
      setMessage("Server error. Please try again.");
    }

  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600 px-4">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome Back
          </h2>
          <p className="text-gray-500 mt-2">
            Login to continue
          </p>
        </div>

        {/* Message */}
        {message && (
          <p className="text-center mb-4 text-sm text-red-500">
            {message}
          </p>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;