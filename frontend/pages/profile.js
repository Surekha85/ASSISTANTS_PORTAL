import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/auth";
import Link from "next/link";
import {
  User,
  CreditCard,
  Settings,
} from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-6 py-6">

      {/* BACK */}
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
        ← Back to Dashboard
      </Link>

      {/* TITLE */}
      <h1 className="text-3xl font-bold text-blue-400 mt-4">
        My Profile
      </h1>
      <p className="text-gray-400 mt-1">
        Manage your account information and settings here.
      </p>

      {/* CARD */}
      <div className="mt-6 bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl">

        {/* TABS */}
        <div className="flex bg-[#0f172a] rounded-xl p-1 mb-6">

          <button
            onClick={() => setTab("profile")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm ${
              tab === "profile"
                ? "bg-[#1e293b] text-blue-400"
                : "text-gray-400"
            }`}
          >
            <User size={16} /> Profile Information
          </button>

          <button
            onClick={() => setTab("settings")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm ${
              tab === "settings"
                ? "bg-[#1e293b] text-blue-400"
                : "text-gray-400"
            }`}
          >
            <Settings size={16} /> Settings
          </button>

        </div>

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <>
            <h2 className="text-lg font-semibold mb-4">
              Profile Information
            </h2>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Email */}
              <div className="border border-slate-700 rounded-xl p-4 bg-[#0f172a]">
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              {/* First Name */}
              <div className="border border-slate-700 rounded-xl p-4 bg-[#0f172a]">
                <p className="text-sm text-gray-400 mb-1">First Name</p>
                <p className="font-medium">{user?.first_name}</p>
              </div>

              {/* Last Name */}
              <div className="border border-slate-700 rounded-xl p-4 bg-[#0f172a]">
                <p className="text-sm text-gray-400 mb-1">Last Name</p>
                <p className="font-medium">{user?.last_name || "-"}</p>
              </div>

              {/* Email Status */}
              <div className="border border-slate-700 rounded-xl p-4 bg-[#0f172a]">
                <p className="text-sm text-gray-400 mb-1">Email Status</p>
                <p className="text-green-400 font-medium">Verified</p>
              </div>

            </div>

            {/* INFO BOX */}
            <div className="mt-6 border border-blue-500/30 bg-blue-500/10 rounded-xl p-4">
              <p className="font-medium text-blue-300 mb-1">
                Profile Settings
              </p>
              <p className="text-sm text-gray-400">
                Additional profile customization options will be available soon. Stay tuned for updates!
              </p>
            </div>
          </>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div className="text-gray-400">
            Settings options coming soon...
          </div>
        )}

      </div>
    </div>
  );
}