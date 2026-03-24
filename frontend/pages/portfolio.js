import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authAPI } from "../services/authAPI";

export default function PortfolioDashboard() {
  const router = useRouter();
  const { candidateId } = router.query;

  const [portfolio, setPortfolio] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    github_repo_url: "",
    github_repo_name: "",
    vercel_project_name: "",
    vercel_deployment_url: "" 
  });

  const fetchPortfolio = async () => {
    try {
      const res = await authAPI.getPortfolio(candidateId);
      setPortfolio(res.item || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCandidate = async () => {
    try {
      const res = await authAPI.getCandidate(candidateId);
      setCandidate(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchPortfolio();
      fetchCandidate();
    }
  }, [candidateId]);

  const createPortfolio = async () => {
    if (!candidateId) return;

    const requiredFields = Object.values(form).filter((v) => !v.trim());
    if (requiredFields.length > 0) {
      alert("Fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await authAPI.createPortfolio({
        ...form,
        jaa_candidate_id: candidateId,
        vercel_deployment_url: form.vercel_deployment_url,
      });

      setShowModal(false);
      fetchPortfolio();

      setForm({
        github_repo_url: "",
        github_repo_name: "",
        vercel_project_name: "",
        vercel_deployment_url: ""
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const hasPortfolio = !!portfolio;
  const hasChangeRequests = portfolio?.change_requests?.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* HEADER */}
      <div className="p-6 flex items-center gap-4">
        <Link href="/dashboard" className="relative group">
          <span className="btn-back flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </span>
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">
            Portfolio Of {candidateId}
          </h1>
        </div>
      </div>

      <div className="px-6">

        {hasPortfolio ? (
          <>
            {/* Candidate */}
            <div className="mb-6">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
                <h2 className="font-semibold mb-4">Candidate Details</h2>

                {candidate && (
                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">ID</p>
                      <p>{candidate.jaa_candidate_id}</p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Name</p>
                      <p>{candidate.name || "—"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Email</p>
                      <p>{candidate.email || "—"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Phone</p>
                      <p>{candidate.phone || "—"}</p>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Portfolio Details
                </h2>

                {hasChangeRequests && (
                  <button className="px-4 py-2 rounded text-[var(--primary-contrast)] bg-[var(--primary)]">
                    Update
                  </button>
                )}
              </div>

              <div className="space-y-4">

                <div>
                  <p className="text-xs text-[var(--text-secondary)]">GitHub Repo</p>
                  <a href={portfolio.github_repo_url} target="_blank" className="text-[var(--primary)]">
                    {portfolio.github_repo_name}
                  </a>
                </div>

                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Project</p>
                  <p>{portfolio.vercel_project_name}</p>
                </div>

                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Deployment</p>
                  <a href={portfolio.vercel_deployment_url} target="_blank" className="text-[var(--primary)]">
                    Open
                  </a>
                </div>

                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Status</p>
                  <p>{portfolio.status}</p>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh]">

            <p className="text-[var(--text-secondary)] text-lg mb-4">
              No Portfolio Found
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2 rounded text-[var(--primary-contrast)] bg-[var(--primary)]"
            >
              + Add Portfolio
            </button>

          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">

          <div className="bg-[var(--card)] text-[var(--text)] w-[500px] rounded-xl border border-[var(--border)] max-h-[80vh] flex flex-col">

            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold">Create Portfolio</h2>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  GitHub Repo URL *
                </label>
                <input
                  value={form.github_repo_url}
                  onChange={(e) =>
                    setForm({ ...form, github_repo_url: e.target.value })
                  }
                  className="input mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Repository Name *
                </label>
                <input
                  value={form.github_repo_name}
                  onChange={(e) =>
                    setForm({ ...form, github_repo_name: e.target.value })
                  }
                  className="input mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Vercel Project Name *
                </label>
                <input
                  value={form.vercel_project_name}
                  onChange={(e) =>
                    setForm({ ...form, vercel_project_name: e.target.value })
                  }
                  className="input mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">
                  Vercel Deployment URL *
                </label>
                <input
                  value={form.vercel_deployment_url || ""}
                  onChange={(e) =>
                    setForm({ ...form, vercel_deployment_url: e.target.value })
                  }
                  className="input mt-1"
                />
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                URL: https://{form.vercel_project_name || "your-app"}.vercel.app
              </p>

            </div>

            <div className="p-5 border-t border-[var(--border)] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="text-[var(--text-secondary)]">
                Cancel
              </button>

              <button
                onClick={createPortfolio}
                className="px-4 py-2 rounded bg-[var(--primary)] text-[var(--primary-contrast)]"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}