import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";

export default function PortfolioDashboard() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 FETCH DATA
  const fetchData = async () => {
    try {
      const res = await authAPI.getPortfolios();
      setData(res.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 STATUS COLORS
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

  const filtered = data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      
      {/* HEADER */}
      <div className="p-6 flex justify-between items-center">
        <input
          placeholder="Search portfolios..."
          className="px-4 py-2 w-1/3 rounded-lg bg-gray-800 text-white border border-gray-700"
          onChange={(e) => setSearch(e.target.value)}
        />
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
              {filtered.map((row) => (
                <tr
                  key={row.jaa_candidate_id}
                  className="border-t border-gray-700 hover:bg-gray-800"
                >
                  <td className="p-3">{row.jaa_candidate_id}</td>

                  <td>
                    <a
                      href={row.github_repo_url}
                      target="_blank"
                      className="text-blue-400"
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
    </div>
  );
}

