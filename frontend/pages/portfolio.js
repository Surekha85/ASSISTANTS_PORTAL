import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { authAPI } from "../services/authAPI";

export default function PortfolioDashboard() {
  const router = useRouter();
  const { candidateId } = router.query;

  const [portfolio, setPortfolio] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [toast, setToast] = useState("");
  const [localRequests, setLocalRequests] = useState([]);

  const [form, setForm] = useState({
    github_repo_url: "",
    github_repo_name: "",
    vercel_project_name: "",
    vercel_deployment_url: "",
    project_id: "",                 // ✅ optional
    vercel_project_id: "",          // ✅ optional
    deployment_status: "",          // ✅ optional
  });

  const [availableHeight, setAvailableHeight] = useState(0);

  useEffect(() => {
    const calculateHeight = () => {
      const navbar = document.getElementById("app-navbar");
      if (navbar) {
        setAvailableHeight(window.innerHeight - navbar.offsetHeight);
      }
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const normalizePortfolio = (res) => {
    if (!res) return null;
    return {
      ...res,
      github_repo_url: res.github?.repo_url,
      github_repo_name: res.github?.repo_name,
      vercel_project_name: res.vercel?.project_name,
      vercel_deployment_url: res.vercel?.deployment_url,
    };
  };

  const saveRequests = async () => {
    try {
      await authAPI.createAndUpdatePortfolio({
        jaa_candidate_id: candidateId,
        change_requests: localRequests.map(({ _tempVisible, ...rest }) => rest),
      });

      setShowRequests(false);
      fetchPortfolio();

      setToast("Updated successfully");
      setTimeout(() => setToast(""), 3000);

    } catch (e) {
      console.error(e);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await authAPI.getPortfolio(candidateId);
      const normalized = normalizePortfolio(res);
      setPortfolio(normalized);
      setRequests(normalized?.change_requests || []);
      setLocalRequests(normalized?.change_requests || []);
    } catch (err) {
      setPortfolio(null);
    }
  };

  const fetchCandidate = async () => {
    try {
      const res = await authAPI.getCandidateDetails(candidateId);
      setCandidate(res);
    } catch { }
  };

  useEffect(() => {
    if (candidateId) {
      fetchPortfolio();
      fetchCandidate();
    }
  }, [candidateId]);

  const createPortfolio = async () => {
    const requiredFields = [
      form.github_repo_url,
      form.github_repo_name,
      form.vercel_project_name,
      form.vercel_deployment_url,
    ].filter((v) => !v.trim());

    if (requiredFields.length > 0) {
      alert("Fill required fields");
      return;
    }

    setLoading(true);
    try {
      await authAPI.createAndUpdatePortfolio({
        ...form,
        jaa_candidate_id: candidateId,
      });

      setShowModal(false);
      fetchPortfolio();
      setToast("Created successfully");
    } catch { }
    setLoading(false);
  };

  const handleStatusChange = (req, newStatus) => {
    const now = new Date().toISOString();

    setLocalRequests((prev) =>
      prev.map((r) =>
        r.request_id === req.request_id
          ? {
            ...r,
            status: newStatus,
            completed_at:
              newStatus === "COMPLETED" ? now : r.completed_at,
            _tempVisible: true, // ✅ keep visible
          }
          : r
      )
    );
  };

  const pendingRequests = localRequests.filter(
    (r) =>
      r.status === "PENDING" ||
      r.status === "IN_PROGRESS" ||
      r._tempVisible
  );


  const hasPortfolio = !!portfolio;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* HEADER */}
      <div className="px-8 py-6 flex items-center justify-between border-b border-[var(--border)]">

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="btn-back flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div>
            <h1 className="text-xl font-semibold">
              Portfolio Details
            </h1>
          </div>
        </div>

        {/* REQUESTS */}
        {pendingRequests.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-black"
            >
              Requests
            </button>

            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {pendingRequests.length}
            </span>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className="px-8 py-6 flex items-start justify-center overflow-hidden" style={{ height: availableHeight }}>

        {hasPortfolio ? (
          <div className="w-full max-w-6xl mx-auto">

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">

              {/* ================= TOP: CANDIDATE ================= */}
              <div className="p-6 flex justify-between items-start">

                {/* LEFT */}
                <div className="flex items-start gap-4">

                  <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-[var(--primary-contrast)] flex items-center justify-center text-lg font-semibold">
                    {candidate?.first_name?.charAt(0)?.toUpperCase() || "C"}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      {candidate?.first_name || ""} {candidate?.last_name || ""}
                    </h2>

                    <p className="text-sm text-[var(--text-secondary)]">
                      {candidate?.email || "—"}
                    </p>

                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      <p>User ID: {candidate?.user_id || "—"}</p>
                      <p>Candidate ID: {candidate?.jaa_candidate_id || candidateId}</p>
                    </div>
                  </div>

                </div>

                {/* RIGHT: STATUS + LAST UPDATED */}
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xm">
                    Last Updated: {portfolio.updated_at
                      ? new Date(portfolio.updated_at).toLocaleString()
                      : "—"}
                  </p>
                </div>

              </div>

              {/* ================= DIVIDER ================= */}
              <div className="border-t border-[var(--border)]" />

              {/* ================= PORTFOLIO ================= */}
              <div className="p-6 space-y-6 text-sm">

                <h3 className="text-sm font-semibold">
                  Portfolio Details
                </h3>

                <div className="grid grid-cols-2 gap-6">

                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Portfolio ID</p>
                    <p className="font-medium break-all">{portfolio.portfolio_id}</p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Created By</p>
                    <p className="font-medium break-all">{portfolio.created_by}</p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">GitHub Repo</p>
                    <p className="font-medium">{portfolio.github_repo_name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Project Name</p>
                    <p className="font-medium">{portfolio.vercel_project_name}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className="font-medium break-all"
                      title={portfolio.github_repo_url}
                    >
                      {portfolio.github_repo_url}
                    </span>

                    <a
                      href={portfolio.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open GitHub Repo"
                      className="text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className="font-medium break-all"
                      title={portfolio.vercel_deployment_url}
                    >
                      {portfolio.vercel_deployment_url}
                    </span>

                    <a
                      href={portfolio.vercel_deployment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Deployment"
                      className="text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Created At</p>
                    <p className="font-medium">
                      {portfolio.created_at
                        ? new Date(portfolio.created_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          </div>
        ) : (
          /* KEEP SAME EMPTY STATE */
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">

            <p className="text-lg font-medium mb-2">
              No Portfolio Found
            </p>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Add a portfolio to get started
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-contrast)] mt-4"
            >
              + Add Portfolio
            </button>

          </div>
        )}

      </div>

      {showRequests && pendingRequests.length > 0 && (
        <div className="fixed right-6 top-24 w-[500px] max-h-[50vh] bg-[var(--card)] border rounded-xl shadow-lg flex flex-col">

          {/* HEADER */}
          <div className="flex justify-between items-center p-3">
            <h3>Requests ({pendingRequests.length}) </h3>

            <button onClick={() => setShowRequests(false)}>✕</button>
          </div>

          {/* LIST */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {pendingRequests.map((req) => (
              <div key={req.request_id} className="border p-3 rounded-xl flex justify-between items-start gap-4">

                <div className="text-sm leading-5 text-[var(--text)] font-medium flex-1 pr-2 break-words whitespace-normal">
                  <p>{req.description}</p>
                </div>

                <select
                  value={req.status}
                  onChange={(e) => handleStatusChange(req, e.target.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border outline-none transition font-medium min-w-[140px]
                      bg-[var(--card)] border-[var(--border)]
                      focus:ring-2 focus:ring-[var(--primary)]
                      ${req.status === "PENDING"
                      ? "text-yellow-400"
                      : req.status === "IN_PROGRESS"
                        ? "text-blue-400"
                        : req.status === "COMPLETED"
                          ? "text-green-400"
                          : "text-red-400"
                    }
                    `}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className="p-3 flex justify-end gap-2">
            <button onClick={() => setShowRequests(false)}>
              Cancel
            </button>

            <button
              onClick={saveRequests}
              className="bg-[var(--primary)] px-4 py-1 rounded text-white"
            >
              Save
            </button>
          </div>

        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">

          <div className="bg-[var(--card)] text-[var(--text)] w-[500px] rounded-xl border border-[var(--border)] max-h-[80vh] flex flex-col">

            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold">Create Portfolio</h2>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">

              {/* REQUIRED FIELDS */}
              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  GitHub Repo URL <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.github_repo_url}
                  onChange={(e) =>
                    setForm({ ...form, github_repo_url: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Repository Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.github_repo_name}
                  onChange={(e) =>
                    setForm({ ...form, github_repo_name: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="my-project"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Vercel Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.vercel_project_name}
                  onChange={(e) =>
                    setForm({ ...form, vercel_project_name: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="my-app"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Deployment URL <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.vercel_deployment_url || ""}
                  onChange={(e) =>
                    setForm({ ...form, vercel_deployment_url: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="https://my-app.vercel.app"
                />
              </div>

              {/* OPTIONAL FIELDS */}
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  Optional Fields
                </p>
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Project ID
                </label>
                <input
                  value={form.project_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, project_id: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="internal project id"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Vercel Project ID
                </label>
                <input
                  value={form.vercel_project_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, vercel_project_id: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="vercel project id"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Deployment Status
                </label>
                <input
                  value={form.deployment_status || ""}
                  onChange={(e) =>
                    setForm({ ...form, deployment_status: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="LIVE / FAILED / DEPLOYING"
                />
              </div>

            </div>

            <div className="p-5 border-t border-[var(--border)] flex justify-end gap-3">

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] transition"
              >
                Cancel
              </button>

              <button
                onClick={createPortfolio}
                className="px-5 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-contrast)] font-medium hover:opacity-90 transition"
              >
                {loading ? "Creating..." : "Create Portfolio"}
              </button>
            </div>

          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

    </div>
  );
}