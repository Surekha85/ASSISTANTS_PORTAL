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
    applied_via_custom: "",
    employment_type: "",
  });

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!candidateId || !date) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await authAPI.getJobApplications(candidateId, date);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidateId, date]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
        setSubmitting(true);

        const payload = {
        jaa_candidate_id: candidateId,
        company_name: form.company?.trim(),
        job_title: form.role?.trim(),
        experience: Number(form.experience) || 0,
        application_link: form.job_link?.trim(),
        applied_via:
            form.applied_via === "Other"
            ? form.applied_via_custom?.trim()
            : form.applied_via,
        employment_type: form.employment_type, // keep as-is
        };

        console.log("🚀 FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

        const res = await authAPI.createJobApplication(payload);

        console.log("✅ RESPONSE:", res);

        alert("Job application created successfully ✅");

        // 🔥 Reset form + close modal
        setForm({
        company: "",
        role: "",
        experience: "",
        job_link: "",
        applied_via: "",
        applied_via_custom: "",
        employment_type: "",
        });

        setShowModal(false);

    } catch (err) {
        console.error("❌ FULL ERROR:", err?.response || err);
        alert("Something went wrong ❌");
    } finally {
        setSubmitting(false);
    }
    };

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-[#0f172a] text-black dark:text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ⬅ Back
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          + Add Job Application
        </button>
      </div>

      <h1 className="text-2xl mb-4">Job Applications</h1>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 p-2 border rounded bg-white dark:bg-[#1e293b]"
      />

      {loading && <p>Loading...</p>}

      {data && data.applications?.map((j, i) => (
        <div
          key={i}
          className="p-4 mb-3 border rounded-xl bg-white dark:bg-[#1e293b] shadow-sm"
        >
          <p className="font-semibold">{j.job_title}</p>
          <p className="text-sm text-gray-500">{j.company_name}</p>
          <p className="text-xs">Applied: {j.application_date}</p>
        </div>
      ))}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

          <div className="w-full max-w-2xl rounded-2xl shadow-2xl bg-white dark:bg-[#1e293b] p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Add Job Application
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-500 text-lg"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4">

              <Input label="Company Name" name="company" value={form.company} onChange={handleChange} />

              <Input label="Job Title" name="role" value={form.role} onChange={handleChange} />

              <Input label="Experience" name="experience" value={form.experience} onChange={handleChange} />

              <Select
                label="Employment Type"
                name="employment_type"
                value={form.employment_type}
                onChange={handleChange}
                options={["Full-time", "Part-time", "Internship", "Contract"]}
              />

              {/* 🔥 Applied Via with Other */}
              <div>
                <Select
                  label="Applied Via"
                  name="applied_via"
                  value={form.applied_via}
                  onChange={handleChange}
                  options={[
                    "LinkedIn",
                    "Company Website",
                    "Referral",
                    "Indeed",
                    "Other",
                  ]}
                />

                {form.applied_via === "Other" && (
                  <input
                    name="applied_via_custom"
                    placeholder="Enter source (e.g. Naukri, Friend)"
                    value={form.applied_via_custom}
                    onChange={handleChange}
                    className="mt-2 w-full p-2 rounded-lg border 
                               bg-white dark:bg-[#0f172a]
                               border-gray-300 dark:border-gray-600
                               focus:ring-2 focus:ring-green-500 outline-none"
                  />
                )}
              </div>

              <div className="col-span-2">
                <Input label="Application Link" name="job_link" value={form.job_link} onChange={handleChange} />
              </div>

            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? "Submitting..." : "Submit"}
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
    <div className="flex flex-col">
      <label className="text-sm mb-1 text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <input
        {...props}
        className="p-2 rounded-lg border bg-white dark:bg-[#0f172a]
                   border-gray-300 dark:border-gray-600
                   focus:ring-2 focus:ring-green-500 outline-none"
      />
    </div>
  );
}

/* SELECT */
function Select({ label, options = [], ...props }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm mb-1 text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <select
        {...props}
        className="p-2 rounded-lg border bg-white dark:bg-[#0f172a]
                   border-gray-300 dark:border-gray-600
                   focus:ring-2 focus:ring-green-500 outline-none"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}