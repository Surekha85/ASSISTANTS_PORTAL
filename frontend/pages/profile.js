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
    <div className=" bg-[var(--bg)] text-[var(--text)] min-h-screen bg-[#0f172a] text-white px-6 py-6">

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
      <div className=" bg-[var(--bg)] text-[var(--text)] mt-6 bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl">

        {/* TABS */}
        <div className="flex w-full bg-[var(--bg-secondary)] rounded-xl p-1 mb-6">

          {/* PROFILE */}
          <button
            onClick={() => setTab("profile")}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                tab === "profile"
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)]"
              }
            `}
          >
            <User size={16} />
            Profile Information
          </button>

          {/* SETTINGS */}
          <button
            onClick={() => setTab("settings")}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                tab === "settings"
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)]"
              }
            `}
          >
            <Settings size={16} />
            Settings
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

              {/* First Name */}
              <div className="border border-slate-700 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">First Name</p>
                <p className="font-medium">{user?.first_name}</p>
              </div>

              {/* Last Name */}
              <div className="border border-slate-700 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Last Name</p>
                <p className="font-medium">{user?.last_name || "-"}</p>
              </div>

              {/* Email */}
              <div className="border border-slate-700 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            {/* INFO BOX */}
            <div className="
              mt-6 
              border border-[var(--primary)]/30 
              bg-[var(--primary)]/10 
              rounded-xl p-4
            ">

              <p className="
                font-medium mb-1 
                text-[var(--primary)]
              ">
                Profile Settings
              </p>

              <p className="
                text-sm 
                text-[var(--text-secondary)]
              ">
                Additional profile customization options will be available soon. Stay tuned for updates!
              </p>

            </div>
          </>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div className="
            mt-6 
            border border-[var(--border)] 
            bg-[var(--bg-secondary)] 
            rounded-xl p-5
          ">

            <div className="flex gap-3 items-start">

              {/* ICON */}
              <div className="
                w-8 h-8 flex items-center justify-center 
                rounded-full 
                bg-[var(--primary)]/15 
                text-[var(--primary)]
                shrink-0
              ">
                ℹ️
              </div>

              {/* CONTENT */}
              <div>
                <p className="
                  font-semibold 
                  text-[var(--text)]
                ">
                  More Options Coming Soon
                </p>

                <p className="
                  text-sm mt-1 
                  text-[var(--text-secondary)]
                ">
                  Additional account settings and customization options will be available soon. Stay tuned for updates!
                </p>
              </div>

            </div>

</div>
        )}

      </div>
    </div>
  );
}