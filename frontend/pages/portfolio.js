import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";

export default function PortfolioDashboard() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialForm());
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(true);

  function initialForm() {
    return {
      jaa_candidate_id: "",
      github_repo_url: "",
      github_repo_name: "",
      vercel_project_name: "",
      vercel_deployment_url: "",
      status: "DRAFT",
      deployment_status: "",
    };
  }

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

  // 🔹 SAVE
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await authAPI.savePortfolio(form);
      setOpen(false);
      setForm(initialForm());
      fetchData();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

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
    <div className={dark ? "dark bg-gray-900 min-h-screen text-white" : "bg-gray-100 min-h-screen"}>
      
      {/* HEADER */}
      <div className="p-6 flex justify-between items-center">
        <input
          placeholder="Search portfolios..."
          className="px-4 py-2 w-1/3 rounded-lg bg-gray-800 text-white border border-gray-700"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="px-3 py-2 border rounded-lg"
          >
            Toggle Theme
          </button>

          <button
            onClick={() => setOpen(true)}
            className="bg-primary px-4 py-2 rounded-lg text-white"
          >
            + Portfolio
          </button>
        </div>
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
                <th>Action</th>
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

                  <td>
                    <button
                      onClick={() => {
                        setForm(row);
                        setOpen(true);
                      }}
                      className="text-blue-400"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          
          <div className="bg-gray-900 text-white w-[600px] rounded-xl shadow-xl p-6">
            
            <h2 className="text-xl font-semibold mb-4">
              {form.jaa_candidate_id ? "Edit Portfolio" : "Create Portfolio"}
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <Input label="Candidate ID" value={form.jaa_candidate_id} onChange={(v)=>setForm({...form, jaa_candidate_id:v})} full />

              <Input label="GitHub URL" value={form.github_repo_url} onChange={(v)=>setForm({...form, github_repo_url:v})} full />

              <Input label="Repo Name" value={form.github_repo_name} onChange={(v)=>setForm({...form, github_repo_name:v})} />

              <Input label="Project Name" value={form.vercel_project_name} onChange={(v)=>setForm({...form, vercel_project_name:v})} />

              <Input label="Deployment URL" value={form.vercel_deployment_url} onChange={(v)=>setForm({...form, vercel_deployment_url:v})} full />

              <Select label="Status" value={form.status} onChange={(v)=>setForm({...form, status:v})} />

              <Input label="Deployment Status" value={form.deployment_status} onChange={(v)=>setForm({...form, deployment_status:v})} />

            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setOpen(false)} className="border px-4 py-2 rounded-lg">
                Cancel
              </button>

              <button onClick={handleSubmit} className="bg-primary px-4 py-2 rounded-lg">
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 INPUT COMPONENT
function Input({ label, value, onChange, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-sm text-gray-400">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
      />
    </div>
  );
}

// 🔹 SELECT COMPONENT
function Select({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700"
      >
        <option>DRAFT</option>
        <option>DEPLOYING</option>
        <option>LIVE</option>
        <option>FAILED</option>
        <option>ARCHIVED</option>
      </select>
    </div>
  );
}