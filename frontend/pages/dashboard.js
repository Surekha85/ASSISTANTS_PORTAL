import { useState, useEffect, useRef } from "react";
import { Rocket, Users, Github, Linkedin } from "lucide-react";
import { authAPI } from "../services/authAPI";
import { useRouter } from "next/router";

export default function AssistantDashboard() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState("assigned"); // ✅ default
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableHeight, setTableHeight] = useState(0);

  const headerRef = useRef(null);

  // 🔥 HEIGHT CALCULATION
  useEffect(() => {
    const calc = () => {
      const h = window.innerHeight;
      const header = headerRef.current?.offsetHeight || 0;
      setTableHeight(h - header - 20);
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // 🔥 FETCH CANDIDATES
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getAssignedCandidates();
      const ids = res?.assigned_candidates || [];

      const data = await Promise.all(
        ids.map(async (id) => {
          try {
            const d = await authAPI.getCandidateDetails(id);
            return { ...d, id };
          } catch {
            return null;
          }
        })
      );

      setCandidates(data.filter(Boolean));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 LOAD ON PAGE OPEN (DEFAULT ASSIGNED)
  useEffect(() => {
    fetchCandidates();
  }, []);

  // 🔥 ROUTES
  const handleGithub = () => router.push("/github_activities");
  const handleLinkedin = () => router.push("/linkedin_activities");
  const handleJobs = () => router.push("/job_applications");

  return (
    <div className="h-screen flex bg-[#0f172a] text-white overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-72 p-3 flex-shrink-0">
        <div className="bg-[#1e293b] h-full rounded-2xl p-5 border border-slate-700 space-y-3">

          <MenuItem
            label="Assigned Candidates"
            icon={<Users size={20} />}
            active={activeMenu === "assigned"}
            onClick={() => setActiveMenu("assigned")}
          />

          <MenuItem
            label="GitHub"
            icon={<Github size={20} />}
            onClick={handleGithub}
          />

          <MenuItem
            label="LinkedIn"
            icon={<Linkedin size={20} />}
            onClick={handleLinkedin}
          />

          <MenuItem
            label="Job Applications"
            icon={<Rocket size={20} />}
            onClick={handleJobs}
          />

        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden p-4">

        {/* HEADER */}
        <div ref={headerRef} className="mb-4">
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

            {/* 🔥 SCROLL */}
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
                        <a href={c.github} target="_blank" rel="noreferrer">
                          GitHub
                        </a>
                      </td>

                      <td className="p-3">
                        <a href={c.linkedin} target="_blank" rel="noreferrer">
                          LinkedIn
                        </a>
                      </td>

                      <td className="p-3">
                        <a href={c.resumeUrl} target="_blank" rel="noreferrer">
                          Resume
                        </a>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// 🔥 MENU ITEM
function MenuItem({ label, icon, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer flex gap-3 items-center ${
        active
          ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30"
          : "hover:bg-[#0f172a]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}