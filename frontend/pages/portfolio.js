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
  

  const [form, setForm] = useState({
    github_repo_url: "",
    github_repo_name: "",
    vercel_project_name: "",
    vercel_deployment_url: "",
  });

  const [availableHeight, setAvailableHeight] = useState(0);

  useEffect(() => {
    const calculateHeight = () => {
      const navbar = document.getElementById("app-navbar");

      if (navbar) {
        const navHeight = navbar.offsetHeight;
        const screenHeight = window.innerHeight;

        setAvailableHeight(screenHeight - navHeight);
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

  const fetchPortfolio = async () => {
    try {
      const res = await authAPI.getPortfolio(candidateId);
      setPortfolio(normalizePortfolio(res));
    } catch (err) {
      setPortfolio(null);
    }
  };

  const fetchCandidate = async () => {
    try {
      const res = await authAPI.getCandidateDetails(candidateId);
      setCandidate(res);
    } catch {}
  };

  useEffect(() => {
    if (candidateId) {
      fetchPortfolio();
      fetchCandidate();
    }
  }, [candidateId]);

  const createPortfolio = async () => {
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
      });

      setShowModal(false);
      fetchPortfolio();
    } catch {}
    setLoading(false);
  };

  const hasPortfolio = !!portfolio;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* HEADER */}
      <div className="px-8 py-6 flex items-center gap-4 border-b border-[var(--border)]">
        <Link href="/dashboard" className="btn-back flex items-center gap-2">
          <ArrowLeft size={16} />
          Back
        </Link>

        <div>
          <h1 className="text-xl font-semibold">
            Portfolio
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Candidate ID: {candidateId}
          </p>
        </div>
      </div>

      <div className="px-8 py-6 flex items-start justify-center overflow-hidden" style={{ height: availableHeight }}>

        {hasPortfolio ? (
          <div className="grid grid-cols-3 gap-6 w-full max-w-6xl h-full">

            {/* 🔥 LEFT: CANDIDATE (SMALL) */}
            <div className="col-span-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm h-full flex flex-col">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-contrast)] flex items-center justify-center font-semibold">
                  {candidate?.name?.charAt(0)?.toUpperCase() || "C"}
                </div>

                <div>
                  <h2 className="font-semibold">
                    {candidate?.name || "Candidate"}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {candidate?.email || "—"}
                  </p>
                </div>

              </div>

              <div className="space-y-3 text-sm">

                <div>
                  <p className="text-[var(--text-secondary)] text-xs">
                    Candidate ID
                  </p>
                  <p className="font-medium">{candidateId}</p>
                </div>

                <div>
                  <p className="text-[var(--text-secondary)] text-xs">
                    User ID
                  </p>
                  <p className="font-medium">
                    {portfolio.created_by || "—"}
                  </p>
                </div>

              </div>
            </div>

            {/* 🔥 RIGHT: PORTFOLIO (BIG) */}
            <div className="col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm h-full flex flex-col">

              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold">Portfolio Details</h2>

                {/* STATUS HERE */}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary)] text-[var(--primary-contrast)]">
                  {portfolio.status}
                </span>
              </div>

              <div className="space-y-6 text-sm">

                {/* GitHub */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[var(--text-secondary)] text-xs">GitHub</p>
                    <p className="font-medium">
                      {portfolio.github_repo_name}
                    </p>
                  </div>

                  <a
                    href={portfolio.github_repo_url}
                    target="_blank"
                    className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                  >
                    Open <ExternalLink size={14} />
                  </a>
                </div>

                {/* Project */}
                <div>
                  <p className="text-[var(--text-secondary)] text-xs">Project</p>
                  <p className="font-medium">
                    {portfolio.vercel_project_name}
                  </p>
                </div>

                {/* Deployment */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[var(--text-secondary)] text-xs">
                      Deployment
                    </p>
                    <p className="font-medium break-all">
                      {portfolio.vercel_deployment_url}
                    </p>
                  </div>

                  <a
                    href={portfolio.vercel_deployment_url}
                    target="_blank"
                    className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                  >
                    Visit <ExternalLink size={14} />
                  </a>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">

            <p className="text-lg font-medium mb-2">
              No Portfolio Found
            </p>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Add a portfolio to get started
            </p>

            <button className="px-6 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-contrast)]">
              + Add Portfolio
            </button>

          </div>
        )}

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-[var(--card)] w-[520px] rounded-2xl border border-[var(--border)] shadow-lg">

            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">Create Portfolio</h2>
            </div>

            <div className="p-6 space-y-4">

              {[
                ["GitHub Repo URL", "github_repo_url"],
                ["Repository Name", "github_repo_name"],
                ["Vercel Project Name", "vercel_project_name"],
                ["Deployment URL", "vercel_deployment_url"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-sm text-[var(--text-secondary)]">
                    {label} *
                  </label>
                  <input
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent outline-none focus:border-[var(--primary)]"
                  />
                </div>
              ))}

            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-secondary)]"
              >
                Cancel
              </button>

              <button
                onClick={createPortfolio}
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-contrast)]"
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