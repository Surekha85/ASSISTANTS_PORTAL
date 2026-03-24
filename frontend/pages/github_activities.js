import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { authAPI } from "../services/authAPI";
import { ArrowLeft, Github } from "lucide-react";
import Link from "next/link";

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
  const [selectedProject, setSelectedProject] = useState(null);


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
    const savedDate = localStorage.getItem("selectedDate");

    if (savedDate) {
      setDate(savedDate);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
    }
  }, []);

  useEffect(() => {
    if (!data?.projects?.length) return;

    // ⭐ keep same project after refresh
    const updatedProject = data.projects.find(
      (p) => p.project_id === selectedProject?.project_id
    );

    if (updatedProject) {
      setSelectedProject(updatedProject);
    } else {
      setSelectedProject(data.projects[0]);
    }
  }, [data]);

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
  const lastFetchedDateRef = useRef("");
  useEffect(() => {
    if (!candidate?.id || !date) return;

    if (lastFetchedDateRef.current === date) return;

    lastFetchedDateRef.current = date;

    fetchGithubActivities(candidate.id, date);
  }, [candidate, date]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    localStorage.setItem("selectedDate", newDate);
  };

  const allCommits =
    data?.projects?.flatMap((p) => p.commits || []) || [];

  const totalCommits = allCommits.length;
  const currentProject = selectedProject;
  console.log(currentProject)

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

  const formatDateTime = (iso) => {
    const d = new Date(iso);

    const date = d.toISOString().split("T")[0]; // 2026-01-24

    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${date} ${time}`;
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
    <div className="min-h-screen p-6 bg-[var(--bg)] text-[var(--text)]">

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
          <Link href="/dashboard" className="relative group">
            <span className="btn-back hover flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Dashboard
            </span>
          </Link>

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

      {!loading && (
        <>
          {/* ✅ NO PROJECTS */}
          {!data && (
            <div className="flex flex-col items-center justify-center mt-24">
              <div className="w-20 h-20 rounded-full bg-[#0d1117] flex items-center justify-center mb-6 border border-gray-700">
                <Github size={36} className="text-white" />
              </div>

              <h2 className="text-lg font-semibold mb-2">
                No Projects Found
              </h2>

              <p className="text-gray-400 text-sm text-center">
                This candidate has no GitHub projects yet.
              </p>
            </div>
          )}

          {/* ✅ HAS PROJECTS */}
          {data && data.projects && data.projects.length > 0 && (
            <div className="space-y-6">
              {/* KEEP YOUR EXISTING DASHBOARD CODE HERE */}
              <div className="space-y-6">

                {/* CURRENT PROJECT */}
                <div className="p-6 rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700">

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">✔</span>
                      <h2 className="font-semibold text-lg">Current Project</h2>
                    </div>
                  </div>

                  {selectedProject && (
                    <div className="grid grid-cols-2 gap-6">

                      {/* LEFT SIDE */}
                      <div>
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedProject.project_name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Started: {selectedProject.start_date?.split("T")[0]}
                        </p>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="text-sm">

                        <p className="font-semibold mb-2">
                          This Week: {totalCommits} Commits
                        </p>

                        <p className="text-gray-500">
                          Status:{" "}
                          <span className="text-green-500 font-medium">
                            ● {selectedProject.status || "Actively Developing"}
                          </span>
                        </p>

                        <p className="text-gray-500 mt-2">
                          Estimation Date: {selectedProject.estimation_date || "-"}
                        </p>

                      </div>

                    </div>
                  )}

                </div>

                {/* ACTIVITY + SUMMARY */}
                <div className="grid grid-cols-3 gap-6">

                  <div
                    className={`col-span-2 h-[32vh] p-5 rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700 flex flex-col overflow-y-auto`}>
                    <h3 className="mb-4 font-semibold">Recent Activity</h3>

                    {selectedProject?.commits?.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        No Recent Activity Found
                      </div>
                    ) : (
                      selectedProject?.commits?.map((c, i) => (
                        <div
                          key={i}
                          className="flex justify-between p-4 mb-3 rounded-xl bg-gray-100 dark:bg-[#0f172a] card-hover"
                        >
                          <div>
                            <p>{c.message}</p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(c.commit_date)}
                            </p>
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
                      ))
                    )}
                  </div>

                  <div className="p-5 h-[32vh] rounded-xl border bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700">

                    <h3 className="mb-4 font-semibold text-lg">Project Summary</h3>

                    {/* GRID STATS */}
                    <div className="grid grid-cols-2 gap-4 mb-4">

                      {/* PROJECTS */}
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-[#0f172a] flex items-center justify-between card-hover">
                        <div>
                          <p className="text-xs text-gray-500">Projects</p>
                          <p className="text-xl font-bold">{data.total_projects}</p>
                        </div>
                        <span className="text-2xl">📁</span>
                      </div>

                      {/* COMMITS */}
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-[#0f172a] flex items-center justify-between card-hover">
                        <div>
                          <p className="text-xs text-gray-500">Commits</p>
                          <p className="text-xl font-bold">{totalCommits}</p>
                        </div>
                        <span className="text-2xl">✅</span>
                      </div>

                    </div>

                    {/* EXTRA INSIGHTS */}
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>🔥 Active Project: {selectedProject?.project_name}</p>
                    </div>

                  </div>
                </div>

                {/* PROJECT GRID */}
                <div>
                  <h3 className="mb-4 font-semibold">Github Projects</h3>

                  <div className="grid grid-cols-3 gap-4">
                    {data.projects.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedProject(p);

                          const today = new Date().toISOString().split("T")[0];

                          setDate(today);
                          localStorage.setItem("selectedDate", today);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer 
                    bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-700
                    ${selectedProject?.project_id === p.project_id ? "ring-2 ring-blue-500" : ""}
                  `}
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
            </div>
          )}
        </>
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