"use client";

import { useState, useEffect, useRef } from "react";
import {
  Github,
  Linkedin,
  User,
  Check ,
  FileText,
  LayoutGrid } from "lucide-react";
import { authAPI } from "../services/authAPI";
import { useRouter } from "next/router";
import { MapPin } from "lucide-react";

export default function AssistantDashboard() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [height, setHeight] = useState("100vh");
  const [loading, setLoading] = useState(true);


  const dropdownRef = useRef();

  // 🔥 Dynamic height based on navbar
  useEffect(() => {
    const updateHeight = () => {
      const nav = document.getElementById("app-navbar");
      if (nav) {
        setHeight(`calc(100vh - ${nav.offsetHeight}px)`);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // 🔥 Load candidates
   useEffect(() => {
    const load = async () => {
      try {
        const res = await authAPI.getAssignedCandidates();
        const ids = res?.assigned_candidates || [];

        const all = await Promise.all(
          ids.map(async (id) => {
            const d = await authAPI.getCandidateDetails(id);
            return { ...d, id };
          })
        );

        setCandidates(all);

        const stored = localStorage.getItem("selectedCandidate");

        if (stored) {
          const parsed = JSON.parse(stored);
          const match = all.find((c) => c.id === parsed.id);
          setSelectedCandidate(match || all[0]);
        } else {
          setSelectedCandidate(all[0]);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false); // 🔥 IMPORTANT
      }
    };

    load();
  }, []);

  const handleSelect = (c) => {
    setSelectedCandidate(c);
    localStorage.setItem("selectedCandidate", JSON.stringify(c)); // 🔥 ADD THIS
    setOpenDropdown(false);
  };

  const navigate = (path) => {
    if (!selectedCandidate) return;

    // 🔥 SAVE BEFORE NAVIGATION
    localStorage.setItem(
      "selectedCandidate",
      JSON.stringify(selectedCandidate)
    );

    router.push(`${path}?candidateId=${selectedCandidate.id}`);
  };

  const sorted = selectedCandidate
    ? [selectedCandidate, ...candidates.filter((c) => c.id !== selectedCandidate.id)]
    : candidates;

    // 🔥 LOADER UI
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)]">

        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>

        <p className="text-sm text-[var(--text-secondary)]">
          Loading candidates...
        </p>

      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="flex overflow-hidden bg-[var(--bg)] text-[var(--text)]"
    >

      {/* 🔥 SIDEBAR ONLY AFTER SELECT */}
      {selectedCandidate && (
        <aside className="w-72 m-4 rounded-2xl p-5 bg-[var(--card)] border border-[var(--border)] overflow-hidden">

          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl mb-6">
            <p className="font-semibold">
              {selectedCandidate.first_name} {selectedCandidate.last_name}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {selectedCandidate.email}
            </p>
          </div>

          <MenuItem icon={<User size={18} />} label="Candidate Profile" onClick={() => navigate("/candiate_details")} />
          <MenuItem icon={<FileText size={18} />} label="Job Applications" onClick={() => navigate("/job_applications")} />
          <MenuItem icon={<Github size={18} />} label="GitHub" onClick={() => navigate("/github_activities")} />
          <MenuItem icon={<Linkedin size={18} />} label="LinkedIn" onClick={() => navigate("/linkedin_activities")} />
          <MenuItem icon={<LayoutGrid size={18} />} label="Portfolio" onClick={() => navigate("/portfolio")} />

        </aside>
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden">

        {/* HEADER */}
        {candidates.length > 0 && (
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h1 className="text-2xl font-semibold">All Candidates</h1>

            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setOpenDropdown(!openDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] cursor-pointer"
              >
                {selectedCandidate?.first_name}
              </div>

              {openDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50">

                  {candidates.map((c) => {
                    const active = selectedCandidate?.id === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        className={`flex justify-between items-center px-4 py-3 cursor-pointer text-sm
                        ${active ? "bg-[#144ca7] text-white" : "hover:bg-[var(--bg-secondary)]"}
                        `}
                      >
                        <span>{c.first_name}</span>
                        {active && <Check size={14} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIST */}
        <div className="flex-1 overflow-y-auto pr-2">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              {/* ICON */}
              <div className="
                w-20 h-20 mb-6 
                flex items-center justify-center 
                rounded-full 
                bg-[var(--bg-secondary)] 
                text-[var(--primary)] text-3xl
              ">
                👤
              </div>

              {/* TITLE */}
              <h2 className="text-xl font-semibold">
                No Candidates Found
              </h2>

              {/* DESCRIPTION */}
              <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm">
                No candidates are currently assigned to this assistant. 
                Once candidates are added, they will appear here.
              </p>
            </div>

          ) : (
            <div className="space-y-4">

              {sorted.map((c) => {
                const isActive = selectedCandidate?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`p-5 rounded-2xl cursor-pointer transition
                    ${
                      isActive
                        ? "bg-[#144ca7] text-white"
                        : "bg-[var(--card)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <div className="flex justify-between items-center">

                      <div className="flex gap-4">

                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow">
                          {c.first_name?.[0]}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {c.first_name} {c.last_name}
                          </p>

                          <p className="text-sm opacity-80">
                            {c.email}
                          </p>

                          <div className="flex items-center gap-2 text-xs opacity-70">
                            <span>
                              {c?.address?.city} • {c?.address?.state}
                            </span>

                            {c?.address?.country && (
                              <>
                                <MapPin size={14} className="opacity-70" />
                                <span>{c.address.country}</span>
                              </>
                            )}
                          </div>

                          <p className="text-xs opacity-70">
                            📞 <span>{c.phone}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}


/* MENU */
function MenuItem({ icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[var(--bg-secondary)]"
    >
      {icon}
      {label}
    </div>
  );
}