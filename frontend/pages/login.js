import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { validateEmail } from "../utils/auth";
import { assistantLogin } from "../services/authAPI";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  // Email validation
  useEffect(() => {
    setEmailValid(validateEmail(email));
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!emailValid) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!password) {
      toast.error("Please enter password");
      return;
    }

    setLoading(true);

    try {
      const response = await assistantLogin(email, password);

      // Store data
      localStorage.setItem("assistant_token", response.token);
      localStorage.setItem("assistant_user", JSON.stringify(response.user));

      toast.success("Login successful!");
      router.push("/assistant-dashboard");

    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] py-12 px-4">

      <div className="max-w-md w-full bg-white dark:bg-[#1e2633]/95 p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-purple-500/20">

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Assistant Login
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Access your assistant dashboard
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-6">

          {/* EMAIL */}
          <div className="relative">
            <input
              type="email"
              placeholder="Email address"
              className="w-full p-3 border rounded-lg bg-white dark:bg-[#1e2633] text-gray-900 dark:text-white border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && (
              <div className="absolute right-3 top-3">
                {emailValid ? (
                  <span className="text-green-500">✓</span>
                ) : (
                  <span className="text-red-500">✗</span>
                )}
              </div>
            )}
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-3 border rounded-lg bg-white dark:bg-[#1e2633] text-gray-900 dark:text-white border-gray-300 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading || !emailValid || !password}
            className="w-full p-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}