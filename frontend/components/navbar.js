import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { logout, getCurrentUser } from "../utils/auth";

// ✅ Icons
import {
  LayoutDashboard,
  User,
  Moon,
  LogOut,
  ChevronDown
} from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeDropdown = () => setOpen(false);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
    <header className="sticky top-0 z-50 w-full bg-[#0f172a] border-b border-slate-800" id="app-navbar">
      <div className="w-full px-6 py-4 flex items-center">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Image 
            src="/jobsyme_logo.png" 
            alt="Jobsyme Logo" 
            width={32} 
            height={32} 
            className="rounded-full bg-white"
          />
          <span className="text-xl font-bold text-blue-400">
            Jobsyme
          </span>
        </div>

        {/* RIGHT */}
        <div className="ml-auto flex items-center gap-4 text-white relative shrink-0">

          {/* PROFILE */}
          <div ref={dropdownRef} className="relative">

            {/* Profile Button */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-500/40 bg-[#111827] hover:bg-[#1f2937] cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.first_name?.[0]?.toUpperCase() || "A"}
              </div>

              <ChevronDown
                size={16}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>

            {/* DROPDOWN */}
            {open && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1e2633] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700"
              >

                {/* HEADER */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-purple-600 flex items-center justify-center font-semibold">
                    {user?.first_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {user?.email}
                    </p>
                    <p className="text-white/80 text-xs">
                      Welcome back!
                    </p>
                  </div>
                </div>

                {/* MENU */}
                <div className="py-1 text-sm text-gray-700 dark:text-gray-200">

                  {/* Dashboard */}
                  <Link
                    href="/dashboard"
                    onClick={closeDropdown}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <LayoutDashboard size={18} />
                    <div>
                      <p className="font-medium">Dashboard</p>
                      <p className="text-xs text-gray-500">Access your workspace</p>
                    </div>
                  </Link>

                  {/* Profile */}
                  <Link
                    href="/profile"
                    onClick={closeDropdown}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <User size={18} />
                    <div>
                      <p className="font-medium">My Profile</p>
                      <p className="text-xs text-gray-500">Account settings</p>
                    </div>
                  </Link>

                  {/* Theme */}
                  <button
                    onClick={() => {
                      handleThemeToggle();
                      closeDropdown();
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <Moon size={18} />
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-xs text-gray-500">
                        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                      </p>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="my-1 border-t border-gray-200 dark:border-slate-700" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={18} />
                    <div>
                      <p className="font-medium">Logout</p>
                      <p className="text-xs text-gray-500">
                        Sign out of your account
                      </p>
                    </div>
                  </button>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}