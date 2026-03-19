import { useState, useEffect } from "react";
import { Users, Github, Linkedin, Rocket, Folder } from "lucide-react";
import { authAPI } from "../services/authAPI";
import { useRouter } from "next/router";

export default function AssistantDashboard() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // 🔥 Load candidates
  useEffect(() => {
    const load = async () => {
      try {
        const res = await authAPI.getAssignedCandidates();
        const ids = res?.assigned_candidates || [];

        const all = await Promise.all(
          ids.map(async (id) => {
            try {
              const d = await authAPI.getCandidateDetails(id);
              return { ...d, id };
            } catch {
              return null;
            }
          })
        );

        setCandidates(all.filter(Boolean));
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  // 🔥 Restore selected candidate (IMPORTANT)
  useEffect(() => {
    const stored = localStorage.getItem("selectedCandidate");
    if (stored) {
      setSelectedCandidate(JSON.parse(stored));
    }
  }, []);

  // 🔥 Handle select candidate
  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    localStorage.setItem("selectedCandidate", JSON.stringify(candidate));
  };

  // 🔥 Navigation handler (keeps menu active)
  const navigateWithCandidate = (path) => {
    if (!selectedCandidate) return;

    localStorage.setItem(
      "selectedCandidate",
      JSON.stringify(selectedCandidate)
    );

    router.push(`${path}?candidateId=${selectedCandidate.id}`);
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0f172a] text-black dark:text-white">
      
      {/* SIDEBAR */}
      <aside className="w-72 p-4 bg-gray-100 dark:bg-[#1e293b]">
        
        {/* TITLE */}
        <div className="p-3 font-semibold flex gap-2">
          <Users /> Candidates
        </div>

        {/* SELECTED CANDIDATE */}
        {selectedCandidate && (
          <div className="p-3 mt-3 bg-white dark:bg-[#0f172a] rounded">
            <p className="font-semibold">
              {selectedCandidate.first_name} {selectedCandidate.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {selectedCandidate.email}
            </p>
          </div>
        )}

        {/* MENU */}
        {selectedCandidate && (
          <div className="mt-4 space-y-2">

            <MenuItem
              label="Job Applications"
              icon={<Rocket />}
              onClick={() => navigateWithCandidate("/job_applications")}
            />

            <MenuItem
              label="GitHub"
              icon={<Github />}
              onClick={() => navigateWithCandidate("/github_activities")}
            />

            <MenuItem
              label="LinkedIn"
              icon={<Linkedin />}
              onClick={() => navigateWithCandidate("/linkedin_activities")}
            />

            <MenuItem
              label="Portfolio"
              icon={<Folder />}
              onClick={() => alert("Portfolio Coming Soon")}
            />

          </div>
        )}
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">

        {!selectedCandidate && (
          <>
            <h1 className="text-2xl mb-4">Select Candidate</h1>

            <div className="grid grid-cols-3 gap-4">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCandidate(c)}
                  className="p-4 border rounded-xl cursor-pointer bg-white dark:bg-[#1e293b] hover:shadow-md"
                >
                  <h3 className="font-semibold">
                    {c.first_name} {c.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{c.email}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* OPTIONAL: Show dashboard content when selected */}
        {selectedCandidate && (
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              Welcome, {selectedCandidate.first_name}
            </h1>
            <p className="text-gray-500">
              Select a menu option from the left to continue.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

function MenuItem({ label, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-2 cursor-pointer flex gap-2 rounded hover:bg-gray-200 dark:hover:bg-[#0f172a]"
    >
      {icon}
      {label}
    </div>
  );
}