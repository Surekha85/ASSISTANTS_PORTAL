import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";
import { useSortableData } from "../hooks/sortableData";

export default function JobApplications() {
  const router = useRouter();
  const { candidateId } = router.query;

  const [data, setData] = useState(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ EDIT STATES
  const [editMode, setEditMode] = useState(false);
  const [editJobId, setEditJobId] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    company: "",
    role: "",
    experience: "",
    job_link: "",
    applied_via: "",
    employment_type: "",
    application_date: today,
  });

  useEffect(() => {
    setDate(today);
  }, []);

  /* ================= FETCH ================= */
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

  /* ================= SORT ================= */
  const { sortedItems, requestSort, sortConfig } =
    useSortableData(data?.applications || []);

  /* ================= WEEK ================= */
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

  /* ================= FORM ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormValid = () => {
    return (
      form.company &&
      form.role &&
      form.experience &&
      form.job_link &&
      form.applied_via &&
      form.employment_type &&
      form.application_date &&
      form.job_link.startsWith("http")
    );
  };

  /* ================= EDIT ================= */
  const handleEdit = (job) => {
    setEditMode(true);
    setEditJobId(job.job_id);

    const prefill = {
      company: job.company_name || "",
      role: job.job_title || "",
      experience: job.experience || "",
      job_link: job.application_link || "",
      applied_via: job.applied_via || "",
      employment_type: job.employment_type || "",
      application_date: job.application_date || today,
    };

    setForm(prefill);
    setOriginalForm(prefill);
    setShowModal(true);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert("Please fill all fields correctly ❌");
      return;
    }

    try {
      setSubmitting(true);

      if (editMode) {
        const updatedFields = {};

        if (form.company !== originalForm.company)
          updatedFields.company_name = form.company;

        if (form.role !== originalForm.role)
          updatedFields.job_title = form.role;

        if (form.experience !== originalForm.experience)
          updatedFields.experience = Number(form.experience);

        if (form.job_link !== originalForm.job_link)
          updatedFields.application_link = form.job_link.trim();

        if (form.applied_via !== originalForm.applied_via)
          updatedFields.applied_via = form.applied_via;

        if (form.employment_type !== originalForm.employment_type)
          updatedFields.employment_type = form.employment_type;

        if (form.application_date !== originalForm.application_date)
          updatedFields.application_date = form.application_date;

        await authAPI.createJobApplication({
          job_id: editJobId,
          ...updatedFields,
        });

        alert("Updated successfully ✅");
      } else {
        const payload = {
          jaa_candidate_id: String(candidateId),
          company_name: form.company,
          job_title: form.role,
          experience: Number(form.experience),
          application_link: form.job_link.trim(),
          applied_via: form.applied_via,
          employment_type: form.employment_type,
          application_date: form.application_date,
        };

        await authAPI.createJobApplication(payload);

        alert("Created successfully ✅");
      }

      setShowModal(false);
      setEditMode(false);
      fetchData();
    } catch (err) {
      console.error("❌ ERROR:", err);
      alert("Something went wrong ❌");
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
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-[#1e293b] border border-gray-600 rounded"
          />

          <button
            onClick={() => {
              setEditMode(false);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            + Add Job Application
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-6">
        Job Applications ({startDate} → {endDate})
      </h1>

      {loading && <p className="text-gray-400">Loading...</p>}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-700 rounded-lg text-sm">

          <thead className="bg-[#1e293b]">
            <tr>
              <th className="p-3 text-left">S.No</th>
              <th className="p-3 text-left">Job</th>
              <th className="p-3 text-left">Company</th>

              <th
                onClick={() => requestSort("application_date", "date")}
                className="p-3 text-left cursor-pointer"
              >
                Application Date
              </th>

              <th className="p-3 text-left">Type</th>

              <th
                onClick={() => requestSort("experience", "number")}
                className="p-3 text-left cursor-pointer"
              >
                Exp
              </th>

              <th className="p-3 text-left">Via</th>
              <th className="p-3 text-left">Job Link</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">ATS</th>
              <th className="p-3 text-left">Resume</th>
            </tr>
          </thead>

          <tbody>
            {sortedItems.map((j, i) => (
              <tr key={i} className="border-t border-gray-700 hover:bg-[#1e293b]">
                <td className="p-3">{i + 1}</td>

                <td className="p-3 font-medium">
                  {j.job_title}
                  <button
                    onClick={() => handleEdit(j)}
                    className="ml-2 text-blue-400 hover:text-blue-600"
                  >
                    ✏️
                  </button>
                </td>

                <td className="p-3">{j.company_name}</td>
                <td className="p-3">{j.application_date}</td>
                <td className="p-3">{j.employment_type}</td>
                <td className="p-3">{j.experience}</td>
                <td className="p-3">{j.applied_via}</td>

                <td className="p-3">
                  {j.application_link ? (
                    <a href={j.application_link} target="_blank" className="text-blue-400 underline">
                      Open
                    </a>
                  ) : "-"}
                </td>

                <td className="p-3">{j.approval_status}</td>
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

      {/* MODAL (UNCHANGED UI) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl bg-[#1e293b] rounded-2xl p-6">

            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editMode ? "Update Job Application" : "Create Job Application"}
              </h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Company" required name="company" value={form.company} onChange={handleChange} />
              <Input label="Role" required name="role" value={form.role} onChange={handleChange} />
              <Input label="Experience" required name="experience" value={form.experience} onChange={handleChange} />

              <Input
                label="Application Date"
                type="date"
                required
                name="application_date"
                value={form.application_date}
                onChange={handleChange}
              />

              <Select label="Type" required name="employment_type" value={form.employment_type} onChange={handleChange}
                options={["Full-Time", "Part-Time", "Internship"]} />

              <Select label="Applied Via" required name="applied_via" value={form.applied_via} onChange={handleChange}
                options={["LinkedIn", "Indeed", "Referral"]} />

              <div className="col-span-2">
                <Input label="Job Link" required name="job_link" value={form.job_link} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="border px-4 py-2 rounded">
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || submitting}
                className="px-4 py-2 rounded bg-green-600"
              >
                {submitting ? "Saving..." : editMode ? "Update" : "Submit"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* INPUT */
function Input({ label, required, ...props }) {
  return (
    <div>
      <label className="text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input {...props} className="w-full p-2 mt-1 bg-[#0f172a] border rounded" />
    </div>
  );
}

/* SELECT */
function Select({ label, options = [], required, ...props }) {
  return (
    <div>
      <label className="text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select {...props} className="w-full p-2 mt-1 bg-[#0f172a] border rounded">
        <option value="">Select</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}