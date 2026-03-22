"use client";

import { useState, useEffect, useRef } from "react";
import {
  Github,
  Linkedin,
  Folder,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { authAPI } from "../services/authAPI";
import { useRouter } from "next/router";

export default function AssistantDashboard() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [height, setHeight] = useState("100vh");

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
      const res = await authAPI.getAssignedCandidates();
      const ids = res?.assigned_candidates || [];

      const all = await Promise.all(
        ids.map(async (id) => {
          const d = await authAPI.getCandidateDetails(id);
          return { ...d, id };
        })
      );

      setCandidates(all);
      if (all.length) setSelectedCandidate(all[0]);
    };

    load();
  }, []);

  const handleSelect = (c) => {
    setSelectedCandidate(c);
    setOpenDropdown(false);
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const navigate = (path) => {
    if (!selectedCandidate) return;
    router.push(`${path}?candidateId=${selectedCandidate.id}`);
  };

  const sorted = selectedCandidate
    ? [selectedCandidate, ...candidates.filter((c) => c.id !== selectedCandidate.id)]
    : candidates;

  return (
    <div
      style={{ height }}
      className="flex overflow-hidden bg-[var(--bg)] text-[var(--text)]"
    >

      {/* SIDEBAR */}
      <aside className="w-72 p-5 bg-[var(--card)] border-r border-[var(--border)]">

        {selectedCandidate && (
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl mb-6">
            <p className="font-semibold">
              {selectedCandidate.first_name} {selectedCandidate.last_name}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {selectedCandidate.email}
            </p>
          </div>
        )}
        <MenuItem icon={<Briefcase size={18} />} label="Candidate Profile" onClick={() => navigate("/candiate_details")} />
        <MenuItem icon={<Briefcase size={18} />} label="Job Applications" onClick={() => navigate("/job_applications")} />
        <MenuItem icon={<Github size={18} />} label="GitHub" onClick={() => navigate("/github_activities")} />
        <MenuItem icon={<Linkedin size={18} />} label="LinkedIn" onClick={() => navigate("/linkedin_activities")} />
        <MenuItem icon={<Folder size={18} />} label="Portfolio" onClick={() => navigate("/portfolio")} />
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h1 className="text-2xl font-semibold">All Candidates</h1>

          {/* 🔥 MODERN DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] cursor-pointer"
            >
              {selectedCandidate?.first_name}
              <ChevronDown size={16} />
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

        {/* 🔥 LIST SCROLL ONLY */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">

          {sorted.map((c) => {
            const isActive = selectedCandidate?.id === c.id;
            const isExpanded = expandedId === c.id;

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
                {/* TOP */}
                <div className="flex justify-between items-center">

                  <div className="flex gap-4">

                    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                      {c.first_name?.[0]}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="text-sm opacity-80">{c.email}</p>
                      <p className="text-xs opacity-70">
                        {c?.jobPreferences?.preferredJobTitles?.[0]} •{" "}
                        {c?.address?.city} •{" "}
                        {c?.careerDetails?.yearsExperience} yrs
                      </p>
                    </div>
                  </div>

                  <div onClick={(e) => toggleExpand(e, c.id)}>
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {/* 🔥 EXPANDED SECTION */}
                {isExpanded && (
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-sm">

                    <div>
                      <p className="opacity-70">Phone</p>
                      <p className="font-medium">{c.phone}</p>
                    </div>

                    <div>
                      <p className="opacity-70">Education</p>
                      <p className="font-medium">
                        {c?.careerDetails?.highestEducation}
                      </p>
                    </div>

                    <div>
                      <p className="opacity-70">Salary</p>
                      <p className="font-medium">
                        ₹{c?.jobPreferences?.salaryExpectation}
                      </p>
                    </div>

                    <div>
                      <p className="opacity-70 mb-1">Skills</p>
                      <div className="flex gap-2 flex-wrap">
                        {c?.careerDetails?.skills?.map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs rounded-full bg-white/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}

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