"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";
import { useSortableData } from "../hooks/sortableData";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { ExternalLink, Download } from "lucide-react";

export default function JobApplications() {
  const router = useRouter();
  const { candidateId } = router.query;

  const today = new Date().toISOString().split("T")[0];
  const [toast, setToast] = useState(null);

  const [data, setData] = useState(null);
  const [date, setDate] = useState(today);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);

  const [form, setForm] = useState({
    company: "",
    role: "",
    job_link: "",
    applied_via: "",
    employment_type: "",
    experience: "",
    application_date: today,
    ats_score: ""
  });
  /* ================= FETCH ================= */
  const fetchData = async () => {
    if (!candidateId) return;

    const res = await authAPI.getJobApplications(candidateId, date);
    const parsed =
      typeof res.body === "string" ? JSON.parse(res.body) : res;

    setData(parsed);
  };

  useEffect(() => {
    if (!router.isReady) return;

    fetchData();

    const stored = localStorage.getItem("selectedCandidate");
    if (stored) setSelectedCandidate(JSON.parse(stored));
  }, [router.isReady, candidateId, date]);

  const { sortedItems } = useSortableData(data?.applications || []);

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

  const week = getWeekRange(date);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const experienceValue =
      form.experience === "Other"
        ? form.experience_other
        : form.experience;

    const payload = {
      jaa_candidate_id: String(candidateId),
      company_name: form.company,
      job_title: form.role,
      application_link: form.job_link,
      applied_via: form.applied_via,
      employment_type: form.employment_type || "Full-time",
      experience: experienceValue,
      ats_score: Number(form.ats_score)
    };

    try {
      if (editJob) {
        // ✅ UPDATE
        await authAPI.createJobApplication({
          ...payload,
          job_id: editJob.job_id   // IMPORTANT
        });

        showToast("Job updated successfully ✅", "success");

      } else {
        // ✅ CREATE
        await authAPI.createJobApplication(payload);

        showToast("Job Application added successfully ✅", "success");
      }

    } catch (e) {
      console.error("API Error:", e);

      const errorMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Something went wrong ❌";

      showToast(errorMsg);
    }

    setShowModal(false);
    fetchData();
  };

  /* ================= HANDLERS ================= */
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openAddModal = () => {
    setEditJob(null);

    setForm({
      company: "",
      role: "",
      job_link: "",
      applied_via: "",
      employment_type: "Full-time",
      experience: "",
      ats_score: ""
    });

    setShowModal(true);
  };

  const openEditModal = (job) => {
    setEditJob(job);

    setForm({
      company: job.company_name || "",
      role: job.job_title || "",
      job_link: job.application_link || "",
      applied_via: job.applied_via || "",
      employment_type: job.employment_type || "Full-time",
      experience: job.experience || "",
      ats_score: job.ats_score || ""
    });

    setShowModal(true);
  };

  return (
    <div className="min-h-screen p-6 bg-[var(--bg)] text-[var(--text)]">
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-2 px-4 py-2 rounded-lg bg-blue-600 text-white btn-blue"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-semibold">
            {selectedCandidate?.first_name || "Candidate"} – Job Applications
          </h1>

          <p className="text-sm text-[var(--text-secondary)]">
            {week.start} → {week.end}
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--card)] border"
          />

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white btn-blue"
          >
            + Add Job Applications
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {sortedItems.length === 0 && (
        <div className="empty-box">
          <p className="text-lg font-medium">No Applications Found</p>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4">

        {sortedItems.map((j, i) => {
          const isExpanded = expandedId === i;

          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[var(--card)] card-hover"
            >

              {/* TOP */}
              <div className="flex justify-between items-center">

                <div>
                  <p className="font-semibold text-lg">{j.job_title}</p>
                  <p className="text-sm text-gray-400">
                    {j.company_name}
                  </p>
                </div>

                <div className="flex items-center gap-4">

                  <span className="text-green-400 text-sm">
                    Application Date:  {j.application_date}
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs bg-yellow-400/20 text-yellow-300">
                    {j.approval_status || "Pending"}
                  </span>

                  {/* EXPAND */}
                  <button
                    onClick={() => toggleExpand(i)}
                    className="p-2 rounded-md hover:bg-[var(--bg-secondary)]"
                  >
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </button>

                  {/* EDIT */}
                  <button
                    onClick={() => openEditModal(j)}
                    className="p-2 rounded-md hover:bg-[var(--bg-secondary)]"
                  >
                    <Pencil size={16} />
                  </button>

                </div>
              </div>

              {/* EXPANDED */}
              {isExpanded && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm border-t pt-4 animate-fade-in">

                  <div>
                    <p className="text-gray-400">Applied Via</p>
                    <p>{j.applied_via}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Employment</p>
                    <p>{j.employment_type}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Experience</p>
                    <p>{j.experience}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">ATS Score</p>
                    <p>{j.ats_score}</p>
                  </div>

                  <div className="col-span-2 flex gap-3 mt-3">

                    <button
                      onClick={() =>
                        window.open(j.application_link, "_blank")
                      }
                      className="px-4 py-2 rounded text-white btn-blue flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      View Application
                    </button>

                    <button
                      onClick={() =>
                        window.open(j.resume_s3_url, "_blank")
                      }
                      className="px-4 py-2 rounded text-white btn-green flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download Resume
                    </button>

                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] w-full max-w-2xl rounded-2xl p-6 shadow-xl animate-fade-in relative">
            <div className="p-6 border-b border-gray-700 flex justify-between">
              <h2 className="text-xl">{editJob ? "Edit Job Application" : "Add Job Application"}</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4">

              {/* COMPANY */}
              <div>
                <label className="text-sm">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="input"
                />
              </div>

              {/* ROLE */}
              <div>
                <label className="text-sm">
                  Job Role <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input"
                />
              </div>

              {/* APPLIED VIA */}
              <div>
                <label className="text-sm">
                  Applied Via <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.applied_via}
                  onChange={(e) => setForm({ ...form, applied_via: e.target.value })}
                  className="input"
                />
              </div>

              {/* EMPLOYMENT TYPE */}
              <div>
                <label className="text-sm">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.employment_type || "Full-time"}
                  onChange={(e) =>
                    setForm({ ...form, employment_type: e.target.value })
                  }
                  className="input"
                />
              </div>

              {/* EXPERIENCE */}
              <div>
                <label className="text-sm">
                  Experience <span className="text-red-500">*</span>
                </label>

                {form.experience !== "Other" ? (
                  <select
                    value={form.experience}
                    onChange={(e) =>
                      setForm({ ...form, experience: e.target.value })
                    }
                    className="input"
                  >
                    <option value="">Select</option>
                    <option>0-1</option>
                    <option>1-2</option>
                    <option>2-3</option>
                    <option>3-4</option>
                    <option>4-5</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <input
                    placeholder="Enter experience"
                    value={form.experience_other || ""}
                    onChange={(e) =>
                      setForm({ ...form, experience_other: e.target.value })
                    }
                    className="input"
                  />
                )}
              </div>

              {/* ATS */}
              <div>
                <label className="text-sm">
                  ATS Score (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.ats_score}
                  onChange={(e) =>
                    setForm({ ...form, ats_score: e.target.value })
                  }
                  className="input"
                />
              </div>

              {/* LINK */}
              <div className="col-span-2">
                <label className="text-sm">
                  Job Link <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.job_link}
                  onChange={(e) => setForm({ ...form, job_link: e.target.value })}
                  className="input"
                />
              </div>

            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-500 text-white"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (
                    !form.company ||
                    !form.role ||
                    !form.job_link ||
                    !form.applied_via ||
                    !form.employment_type ||
                    !(form.experience === "Other"
                      ? form.experience_other
                      : form.experience) ||
                    !form.ats_score
                  ) {
                    showToast("Please fill all mandatory fields ⚠️");
                    return;
                  }

                  handleSubmit();
                }}
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                {editJob ? "Update" : "Submit"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}