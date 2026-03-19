import { useState, useEffect, useRef } from "react";
import { Rocket, Users } from "lucide-react";
import { authAPI } from "../services/authAPI";

export default function AssistantDashboard() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableHeight, setTableHeight] = useState(0);

  const headerRef = useRef(null);

  // 🔥 AUTO HEIGHT CALCULATION
  useEffect(() => {
    const calculateHeight = () => {
      const screenHeight = window.innerHeight;
      const headerHeight = headerRef.current?.offsetHeight || 0;

      const remaining = screenHeight - headerHeight - 20; // small padding
      setTableHeight(remaining);
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const handleAssignedCandidates = async () => {
    setActiveMenu("assigned");
    setLoading(true);

    try {
      const res = await authAPI.getAssignedCandidates();
      const ids = res?.assigned_candidates || [];

      const allDetails = await Promise.all(
        ids.map(async (id) => {
          try {
            return await authAPI.getCandidateDetails(id);
          } catch {
            return null;
          }
        })
      );

      setCandidates(allDetails.filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#0f172a] text-white">

      {/* SIDEBAR */}
      <aside className="w-72 p-3 flex-shrink-0">
        <div className="h-full bg-[#1e293b] rounded-2xl p-5 border border-slate-700">

          <div className="space-y-3">
            <div
              onClick={handleAssignedCandidates}
              className={`p-4 rounded-xl cursor-pointer ${
                activeMenu === "assigned"
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30"
                  : "hover:bg-[#0f172a]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={20} />
                <span>Assigned Candidates</span>
              </div>
            </div>

            <div className="p-4 rounded-xl hover:bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <Rocket size={20} />
                <span>More Tools</span>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden p-4">

        {/* 🔥 HEADER (USED FOR HEIGHT CALCULATION) */}
        <div ref={headerRef} className="mb-4 shrink-0">
          <h1 className="text-2xl font-bold">
            Assigned Candidates
          </h1>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && candidates.length > 0 && (

          <div
            className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden"
            style={{ height: tableHeight }}
          >

            {/* 🔥 ONLY HORIZONTAL SCROLL */}
            <div className="w-full h-full overflow-x-auto overflow-y-hidden">

              <table className="min-w-[1600px] w-full text-sm">

                {/* HEADER */}
                <thead className="bg-[#0f172a] sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">City</th>
                    <th className="p-3 text-left">Experience</th>
                    <th className="p-3 text-left">Education</th>
                    <th className="p-3 text-left">Skills</th>
                    <th className="p-3 text-left">Job Type</th>
                    <th className="p-3 text-left">Salary</th>
                    <th className="p-3 text-left">Work Auth</th>
                    <th className="p-3 text-left">Relocate</th>
                    <th className="p-3 text-left">GitHub</th>
                    <th className="p-3 text-left">LinkedIn</th>
                    <th className="p-3 text-left">Resume</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {candidates.map((c, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-700 hover:bg-[#0f172a]/50"
                    >
                      <td className="p-3 font-semibold">
                        {c.first_name} {c.last_name}
                      </td>

                      <td className="p-3">{c.email}</td>
                      <td className="p-3">{c.phone}</td>
                      <td className="p-3">{c.address?.city}</td>

                      <td className="p-3">
                        {c.careerDetails?.yearsExperience || 0} yrs
                      </td>

                      <td className="p-3">
                        {c.careerDetails?.highestEducation}
                      </td>

                      <td className="p-3">
                        {c.careerDetails?.skills?.join(", ")}
                      </td>

                      <td className="p-3">
                        {c.careerDetails?.preferredJobType}
                      </td>

                      <td className="p-3">
                        {c.jobPreferences?.salaryExpectation}
                      </td>

                      <td className="p-3">
                        {c.careerDetails?.workAuthorized ? "Yes" : "No"}
                      </td>

                      <td className="p-3">
                        {c.careerDetails?.willingToRelocate ? "Yes" : "No"}
                      </td>

                      <td className="p-3">
                        <a href={c.github} target="_blank">GitHub</a>
                      </td>

                      <td className="p-3">
                        <a href={c.linkedin} target="_blank">LinkedIn</a>
                      </td>

                      <td className="p-3">
                        <a href={c.resumeUrl} target="_blank">Resume</a>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )}

        {!loading && candidates.length === 0 && (
          <p>Click Assigned Candidates to load data</p>
        )}

      </main>
    </div>
  );
}