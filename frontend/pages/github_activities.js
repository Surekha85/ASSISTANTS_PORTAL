import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authAPI } from "../services/authAPI";

export default function GithubActivities() {
  const router = useRouter();

  const [candidate, setCandidate] = useState(null);
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 MODAL STATES
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [visibility, setVisibility] = useState("");
  const [estimationDate, setEstimationDate] = useState("");

  // 🔥 TOASTER STATE
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // ✅ Load candidate
  useEffect(() => {
    const stored = localStorage.getItem("selectedCandidate");
    if (stored) {
      setCandidate(JSON.parse(stored));
    }
  }, []);

  // ✅ Default date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  const fetchGithubActivities = async (candidateId, selectedDate) => {
    if (!candidateId || !selectedDate) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await authAPI.getGithubActivities(
        candidateId,
        selectedDate
      );
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to fetch GitHub activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidate?.id && date) {
      fetchGithubActivities(candidate.id, date);
    }
  }, [candidate, date]);

  const handleDateChange = (e) => setDate(e.target.value);

  const allCommits =
    data?.projects?.flatMap((p) => p.commits || []) || [];

  const totalCommits = allCommits.length;
  const currentProject = data?.projects?.[0];

  // 🚀 VALIDATION
  const validateForm = () => {
    if (!projectName.trim())
      return "Project Name is required";
    if (!repoUrl.trim())
      return "Repo URL is required";
    if (!visibility)
      return "Visibility is required";
    if (!estimationDate)
      return "Estimation Date is required";

    return null;
  };

  // 🚀 ADD PROJECT
  const handleAddProject = async () => {
    const errorMsg = validateForm();

    if (errorMsg) {
      showToast(errorMsg, "error");
      return;
    }

    try {
      const payload = {
        jaa_candidate_id: candidate.id,
        project_name: projectName.trim(),
        repo_url: repoUrl.trim(),
        repo_visibility: visibility,
        estimation_date: estimationDate,
      };

      await authAPI.addProject(payload);

      showToast("Project created successfully ✅", "success");

      setShowModal(false);
      setProjectName("");
      setRepoUrl("");
      setVisibility("");
      setEstimationDate("");

      fetchGithubActivities(candidate.id, date);
    } catch (err) {
      showToast(err.message || "Failed to create project", "error");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-[#0f172a] text-black dark:text-white">

      {/* 🔥 TOASTER */}
      {toast.message && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg z-50 text-white
          ${toast.type === "error" ? "bg-red-500" : "bg-green-600"}`}>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            ⬅ Back
          </button>

          <div>
            <h1 className="text-2xl font-bold">GitHub Activities</h1>
            {candidate && (
              <p className="text-sm text-gray-500">
                {candidate.first_name} {candidate.last_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            + Add Project
          </button>

          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="p-2 rounded border"
          />
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !data && (
        <p className="text-gray-500 dark:text-gray-400">
          Loading GitHub activity...
        </p>
      )}

      {/* DASHBOARD */}
      {data && data.projects && (
        <div className="space-y-6">

          {/* CURRENT PROJECT */}
          <div className="p-6 rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">🚀 Current Project</h2>
              <span className="text-green-500 text-sm">Active</span>
            </div>

            {currentProject && (
              <>
                <h3 className="text-xl font-bold">
                  {currentProject.project_name}
                </h3>

                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Est: {currentProject.estimation_date}</span>
                  <span>Status: {currentProject.status}</span>
                </div>
              </>
            )}
          </div>

          {/* ACTIVITY + SUMMARY */}
          <div className="grid grid-cols-3 gap-6">

            <div className="col-span-2 p-5 rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700">
              <h3 className="mb-4 font-semibold">Recent Activity</h3>

              {allCommits.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between p-3 rounded mb-2 bg-gray-100 dark:bg-[#0f172a]"
                >
                  <div>
                    <p>{c.message}</p>
                    <p className="text-xs text-gray-500">{c.commit_date}</p>
                  </div>

                  <a
                    href={c.commit_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 text-xs"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700">
              <h3 className="mb-4 font-semibold">This Week</h3>
              <p>📁 Projects: {data.total_projects}</p>
              <p>✅ Commits: {totalCommits}</p>
            </div>
          </div>

          {/* PROJECT GRID */}
          <div>
            <h3 className="mb-4 font-semibold">Projects</h3>

            <div className="grid grid-cols-3 gap-4">
              {data.projects.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700"
                >
                  <h4 className="font-semibold">{p.project_name}</h4>
                  <p className="text-sm text-gray-500">
                    Commits: {p.commits?.length || 0}
                  </p>

                  <a
                    href={p.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 text-sm"
                  >
                    View Repo →
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 🔥 PREMIUM MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          {/* ⬆️ WIDTH INCREASED */}
          <div className="w-[720px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl">

            <div className="px-6 py-4 border-b flex justify-between">
              <h2 className="font-semibold">Add New Project</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="p-6 space-y-4">

              {/* PROJECT NAME */}
              <div>
                <label className="text-sm">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {/* REPO URL */}
              <div>
                <label className="text-sm">
                  Repo URL <span className="text-red-500">*</span>
                </label>
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* VISIBILITY */}
                <div>
                  <label className="text-sm">
                    Visibility <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                {/* DATE */}
                <div>
                  <label className="text-sm">
                    Estimation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={estimationDate}
                    onChange={(e) => setEstimationDate(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

              </div>

            </div>

            <div className="px-6 py-4  flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleAddProject}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save Project
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}