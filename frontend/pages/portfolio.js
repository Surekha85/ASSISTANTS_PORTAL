import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PortfolioDashboard() {
  const router = useRouter();
  const { candidateId } = router.query;

  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    github_repo_url: "",
    github_repo_name: "",
    vercel_project_name: "",
    vercel_deployment_url: "",
  });

  // 🔹 FETCH DATA
  const fetchData = async () => {
    try {
      const res = await authAPI.getPortfolio();
      setData(res.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 CREATE PORTFOLIO
  const createPortfolio = async () => {
    const requiredFields = Object.values(form).filter((v) => !v.trim());

    if (requiredFields.length > 0) {
      alert("Please fill all required fields");
      return;
    }

    if (!candidateId) {
      alert("Candidate ID missing");
      return;
    }

    setLoading(true);
    try {
      await authAPI.createPortfolio({
        ...form,
        jaa_candidate_id: candidateId, // ✅ injected here
      });

      setShowModal(false);
      fetchData();
      setForm({
        github_repo_url: "",
        github_repo_name: "",
        vercel_project_name: "",
        vercel_deployment_url: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error creating portfolio");
    }
    setLoading(false);
  };

  const getStatus = (status) => {
    switch (status) {
      case "LIVE":
        return "bg-green-500/10 text-green-500";
      case "DEPLOYING":
        return "bg-blue-500/10 text-blue-500";
      case "FAILED":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen">

      {/* HEADER */}
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="relative group">
            <span className="btn-back hover flex items-center gap-2">
            <ArrowLeft size={16} />
              Back to Dashboard
            </span>
          </Link>

          <div>
            <h1 className="text-2xl font-semibold text-white">Portfolio Of {candidateId || "Loading..."}</h1>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={!candidateId}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Add Portfolio
        </button>
      </div>

      {/* TABLE */}
      <div className="px-6">
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th>Repo</th>
                <th>Project</th>
                <th>Status</th>
                <th>Deployment</th>
                <th>Updated</th>
              </tr>
            </thead>

            <tbody>
              {data.map((row) => (
                <tr
                  key={row.jaa_candidate_id}
                  className="border-t border-gray-700 hover:bg-gray-800"
                >
                  <td className="p-3">{row.jaa_candidate_id}</td>

                  <td>
                    <a
                      href={row.github_repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Repo
                    </a>
                  </td>

                  <td>{row.vercel_project_name}</td>

                  <td>
                    <span className={`px-2 py-1 rounded ${getStatus(row.status)}`}>
                      {row.status}
                    </span>
                  </td>

                  <td>{row.deployment_status}</td>
                  <td>{row.updated_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL WITH SCROLL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-gray-900 w-[500px] rounded-xl border border-gray-700 flex flex-col max-h-[80vh]">

            {/* HEADER */}
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-xl text-white">Create Portfolio</h2>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="p-5 overflow-y-auto space-y-4">

              {/* Candidate ID */}
              <div>
                <label className="text-sm text-gray-300">
                  Candidate ID <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.jaa_candidate_id}
                  onChange={(e) =>
                    setForm({ ...form, jaa_candidate_id: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>

              {/* GitHub Repo URL */}
              <div>
                <label className="text-sm text-gray-300">
                  GitHub Repo URL <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.github_repo_url}
                  onChange={(e) =>
                    setForm({ ...form, github_repo_url: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>

              {/* GitHub Repo Name */}
              <div>
                <label className="text-sm text-gray-300">
                  GitHub Repo Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.github_repo_name}
                  onChange={(e) =>
                    setForm({ ...form, github_repo_name: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>

              {/* Vercel Project Name */}
              <div>
                <label className="text-sm text-gray-300">
                  Vercel Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.vercel_project_name}
                  onChange={(e) =>
                    setForm({ ...form, vercel_project_name: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>

              {/* Vercel Deployment URL */}
              <div>
                <label className="text-sm text-gray-300">
                  Vercel Deployment URL <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.vercel_deployment_url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vercel_deployment_url: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-600 rounded text-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={createPortfolio}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 rounded text-white"
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