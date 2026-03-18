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
  const dropdownRef = useRef();

  // ✅ Load user
  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🌙 Theme toggle
  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // 🔓 Logout
  const handleLogout = () => {
    logout();
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0f172a] shadow-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">

        {/* 🔵 LEFT: Logo */}
        <Link href="/" className="flex items-center gap-3">
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
        </Link>

        {/* 🔴 RIGHT */}
        <div className="flex items-center gap-4 text-white relative">

          {/* 🌙 Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className="px-3 py-1 bg-gray-700 rounded"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* 👤 PROFILE */}
          <div ref={dropdownRef} className="relative">

            {/* Profile Circle */}
            <div
              onClick={() => setOpen(!open)}
              className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer font-bold"
            >
              {user?.first_name?.charAt(0).toUpperCase() || "?"}
            </div>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white text-black rounded shadow-lg py-2">
                
                <div className="px-4 py-2 border-b">
                  <p className="font-semibold">
                    {user?.first_name || "User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user?.email || ""}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
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