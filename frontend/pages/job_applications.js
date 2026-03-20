import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";

export default function JobApplications() {
  const router = useRouter();
  const { candidateId } = router.query;

  const [data, setData] = useState(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    experience: "",
    job_link: "",
    applied_via: "",
    employment_type: "",
  });

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  // ================= FETCH =================
  const fetchData = async () => {
    if (!candidateId || !date) return;

    setLoading(true);
    try {
      const res = await authAPI.getJobApplications(candidateId, date);
      const parsed =
        typeof res.body === "string" ? JSON.parse(res.body) : res;

      setData(parsed);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchData();
  }, [router.isReady, candidateId, date]);

  // ================= WEEK =================
  const getWeekRange = (dateStr) => {
    const d = new Date(dateStr);
    const start = new Date(d);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const format = (x) => x.toISOString().split("T")[0];

    return { start: format(start), end: format(end) };
  };

  const week = date ? getWeekRange(date) : {};
  const startDate = data?.week_start_date || week.start;
  const endDate = data?.week_end_date || week.end;

  // ================= FORM =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ FIXED SUBMIT (ONLY FIXED LOGIC)
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (!candidateId || candidateId === "undefined") {
        alert("Candidate ID missing ❌");
        console.error("❌ candidateId:", candidateId);
        return;
      }

      if (!form.company || !form.role || !form.job_link) {
        alert("Please fill required fields");
        return;
      }

      const cleanUrl = form.job_link.trim();

      if (!cleanUrl.startsWith("http")) {
        alert("URL must start with http/https");
        return;
      }

      const payload = {
        jaa_candidate_id: String(candidateId), // ✅ FORCE STRING
        company_name: form.company,
        job_title: form.role,
        experience: Number(form.experience) || 0,
        application_link: cleanUrl,
        applied_via: form.applied_via || "LinkedIn",
        employment_type: form.employment_type || "Full-Time",
      };

      console.log("🔥 FINAL PAYLOAD:", payload); // 👈 IMPORTANT

      const res = await authAPI.createJobApplication(payload);

      console.log("✅ RESPONSE:", res);

      alert("Job application created successfully ✅");

      setShowModal(false);

      setForm({
        company: "",
        role: "",
        experience: "",
        job_link: "",
        applied_via: "",
        employment_type: "",
      });

      fetchData();

    } catch (err) {
      console.error("❌ ERROR FULL:", err);
      alert(err.message || "Something went wrong ❌");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f172a] text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          ← Back
        </button>

        <div className="flex gap-3 items-center">

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-[#1e293b] border border-gray-600 rounded"
          />

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            + Add Job Application
          </button>

        </div>
      </div>

      {/* TITLE */}
      <h1 className="text-2xl font-semibold mb-6">
        Job Applications ({startDate} → {endDate})
      </h1>

      {loading && <p className="text-gray-400">Loading...</p>}

      {/* EMPTY */}
      {!loading && data?.applications?.length === 0 && (
        <h2 className="text-center text-2xl mt-20 text-gray-500">
          NO APPLICATIONS FOUND
        </h2>
      )}

      {/* ✅ TABLE (UNCHANGED AS YOU REQUESTED) */}
      {data?.applications?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700 rounded-lg text-sm">

            <thead className="bg-[#1e293b]">
              <tr>
                <th className="p-3 text-left">Job</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Exp</th>
                <th className="p-3 text-left">Via</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">ATS</th>
                <th className="p-3 text-left">Resume</th>
              </tr>
            </thead>

            <tbody>
              {data.applications.map((j, i) => (
                <tr key={i} className="border-t border-gray-700 hover:bg-[#1e293b]">
                  <td className="p-3 font-medium">{j.job_title}</td>
                  <td className="p-3">{j.company_name}</td>
                  <td className="p-3">{j.application_date}</td>
                  <td className="p-3">{j.employment_type}</td>
                  <td className="p-3">{j.experience}</td>
                  <td className="p-3">{j.applied_via}</td>

                  <td className="p-3">
                    <span className="px-2 py-1 text-xs rounded bg-yellow-600">
                      {j.approval_status}
                    </span>
                  </td>

                  <td className="p-3">{j.ats_score}</td>

                  <td className="p-3">
                    {j.resume_s3_url ? (
                      <a href={j.resume_s3_url} target="_blank" className="text-blue-400 underline">
                        View
                      </a>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">

          <div className="w-full max-w-2xl bg-[#1e293b] rounded-2xl p-6">

            <div className="flex justify-between mb-6">
              <h2 className="text-xl">Add Job Application</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <Input label="Company" name="company" onChange={handleChange} />
              <Input label="Role" name="role" onChange={handleChange} />
              <Input label="Experience" name="experience" onChange={handleChange} />

              <Select label="Type" name="employment_type" onChange={handleChange}
                options={["Full-Time", "Part-Time", "Internship"]} />

              <Select label="Applied Via" name="applied_via" onChange={handleChange}
                options={["LinkedIn", "Indeed", "Referral"]} />

              <div className="col-span-2">
                <Input label="Job Link" name="job_link" onChange={handleChange} />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="border px-4 py-2 rounded">
                Cancel
              </button>

              <button onClick={handleSubmit} className="bg-green-600 px-4 py-2 rounded">
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* INPUT */
function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <input {...props} className="w-full p-2 mt-1 bg-[#0f172a] border rounded" />
    </div>
  );
}

/* SELECT */
function Select({ label, options = [], ...props }) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <select {...props} className="w-full p-2 mt-1 bg-[#0f172a] border rounded">
        <option value="">Select</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}