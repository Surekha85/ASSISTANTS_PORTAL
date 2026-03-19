import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authAPI } from "../services/authAPI";

export default function GithubActivities() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      } catch (e) {
        console.error(e);
        setError("Failed to load candidates");
      }
    };

    load();
  }, []);

  // 🔥 Set today's date by default (yyyy-mm-dd)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // 🔥 Fetch GitHub activities
  const fetchGithubActivities = async (candidateId, selectedDate) => {
    if (!candidateId || !selectedDate) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await authAPI.getGithubActivities(
        candidateId,
        selectedDate // ✅ already yyyy-mm-dd
      );

      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch GitHub activities");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Auto call API when both selected
  useEffect(() => {
    if (selectedId && date) {
      fetchGithubActivities(selectedId, date);
    }
  }, [selectedId, date]);

  // 🔥 Handle date (SAFE - no timezone issue)
  const handleDateChange = (e) => {
    setDate(e.target.value); // ✅ already yyyy-mm-dd
  };

  const allCommits =
    data?.projects?.flatMap((p) => p.commits || []) || [];

  const totalCommits = allCommits.length;
  const currentProject = data?.projects?.[0];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">

      {/* 🔙 BACK */}
      <button
        onClick={() => router.push("/")}
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
      >
        ⬅ Back to Dashboard
      </button>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">GitHub Activities</h1>

        {/* RIGHT CONTROLS */}
        <div className="flex gap-3">

          {/* Candidate Dropdown */}
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="p-2 bg-[#1e293b] border border-slate-700 rounded"
          >
            <option value="">Select Candidate</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="p-2 bg-[#1e293b] border border-slate-700 rounded"
          />

        </div>
      </div>

      {/* STATES */}
      {loading && <p>Loading...</p>}

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {!loading && !data && (
        <p className="text-gray-400">
          Select candidate and date to view GitHub activity
        </p>
      )}

      {/* 🔥 DASHBOARD UI */}
      {data && data.projects && (

        <div className="space-y-6">

          {/* CURRENT PROJECT */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">🚀 Current Project</h2>
              <span className="text-green-400 text-sm">
                Active Development
              </span>
            </div>

            {currentProject && (
              <>
                <h3 className="text-xl font-bold mb-2">
                  {currentProject.project_name}
                </h3>

                <div className="flex justify-between text-sm text-gray-400 mb-3">
                  <span>Started: {currentProject.start_date || "-"}</span>
                  <span>Status: {currentProject.status}</span>
                </div>

                {/* Progress */}
                <div className="w-full bg-[#0f172a] h-2 rounded">
                  <div className="bg-green-500 h-2 rounded w-[70%]"></div>
                </div>
              </>
            )}
          </div>

          {/* ACTIVITY + SUMMARY */}
          <div className="grid grid-cols-3 gap-6">

            {/* RECENT ACTIVITY */}
            <div className="col-span-2 bg-[#1e293b] p-5 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">
                Recent Activity
              </h3>

              {allCommits.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between p-3 bg-[#0f172a] rounded mb-2"
                >
                  <div>
                    <p className="text-sm">{c.message}</p>
                    <p className="text-xs text-gray-400">
                      {c.commit_date}
                    </p>
                  </div>

                  <a
                    href={c.commit_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 text-xs"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>

            {/* SUMMARY */}
            <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">
                This Week
              </h3>

              <div className="space-y-2 text-sm">
                <p>📁 Projects: {data.total_projects}</p>
                <p>✅ Commits: {totalCommits}</p>
                <p>🚀 Active Work</p>
              </div>
            </div>

          </div>

          {/* PROJECT GRID */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Completed Projects
            </h3>

            <div className="grid grid-cols-3 gap-4">

              {data.projects.map((project, i) => (
                <div
                  key={i}
                  className="bg-[#1e293b] p-4 rounded-xl border border-slate-700"
                >
                  <h4 className="font-semibold mb-2">
                    {project.project_name}
                  </h4>

                  <p className="text-sm text-gray-400 mb-2">
                    Commits: {project.commits?.length || 0}
                  </p>

                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 text-sm"
                  >
                    View Repo →
                  </a>
                </div>
              ))}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}