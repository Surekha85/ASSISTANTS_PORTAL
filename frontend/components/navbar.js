import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { logout, getCurrentUser } from "../utils/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    const loadUser = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    };

    loadUser();

    window.addEventListener("authChanged", loadUser);

    return () => {
      window.removeEventListener("authChanged", loadUser);
    };
  }, []);

  // ✅ Outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    setOpen(false);
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0f172a] shadow-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">

        {/* ✅ LOGO (NO LOGOUT ISSUE NOW) */}
        <div className="flex items-center gap-3">
          <Image 
            src="/jobsyme_logo.png" 
            alt="Jobsyme Logo" 
            width={32} 
            height={32} 
            priority 
            className="rounded-full bg-white"
          />
          <span className="text-xl font-bold text-blue-400">
            Jobsyme
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-white relative">

          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className="px-3 py-1 bg-gray-700 rounded"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* PROFILE */}
          <div ref={dropdownRef} className="relative">

            {/* Profile Circle */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
              className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer font-bold"
            >
              {user?.first_name?.[0]?.toUpperCase() || "U"}
            </div>

            {/* Dropdown */}
            {open && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-52 bg-[#0f172a] text-white rounded-lg shadow-lg py-2 border border-slate-700"
              >
                
                <div className="px-4 py-2 border-b border-slate-700">
                  <p className="font-semibold text-white">
                    {user?.first_name || "User"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {user?.email || ""}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 text-red-400 hover:text-red-300"
                >
                  Logout
                </button>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}