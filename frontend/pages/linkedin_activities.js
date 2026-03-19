import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";

export default function LinkedinPage() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await authAPI.getAssignedCandidates();
      const ids = res?.assigned_candidates || [];

      const data = await Promise.all(
        ids.map((id) => authAPI.getCandidateDetails(id))
      );

      setCandidates(data.filter(c => c?.linkedin));
    };

    load();
  }, []);

  return (
    <div className="p-6 bg-[#0f172a] min-h-screen text-white">
      <h1 className="text-2xl mb-4">LinkedIn Candidates</h1>

      {candidates.map((c, i) => (
        <div key={i} className="p-4 bg-[#1e293b] rounded mb-3">
          <p>{c.first_name} {c.last_name}</p>
          <a href={c.linkedin} target="_blank">
            View LinkedIn
          </a>
        </div>
      ))}
    </div>
  );
}