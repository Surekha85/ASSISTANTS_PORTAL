"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";
import { useSortableData } from "../hooks/sortableData";
import { ChevronDown, ChevronUp, Pencil, Target, Zap } from "lucide-react";
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
  const [atsScore, setAtsScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [showAlert, setShowAlert] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modalHeight, setModalHeight] = useState("auto");
  const [showQA, setShowQA] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [qaList, setQaList] = useState([
    { question: "", answer: "" }
  ]);

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

  useEffect(() => {
    const calculateHeight = () => {
      const navbar = document.getElementById("app-navbar");
      const navbarHeight = navbar?.offsetHeight || 0;

      const screenHeight = window.innerHeight;

      const finalHeight =
        screenHeight - navbarHeight - screenHeight * 0.05;

      setModalHeight(finalHeight);
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const getColor = (score) => {
    if (score < 70) return "text-red-400 bg-red-400/20";
    if (score < 85) return "text-yellow-400 bg-yellow-400/20";
    return "text-green-400 bg-green-400/20";
  };
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

  const addQA = () => {
    setQaList([...qaList, { question: "", answer: "" }]);
  };

  const removeQA = (index) => {
    const updated = qaList.filter((_, i) => i !== index);
    setQaList(updated);
  };

  const updateQA = (index, field, value) => {
    const updated = [...qaList];
    updated[index][field] = value;
    setQaList(updated);
  };

  const week = getWeekRange(date);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  /* ================= SUBMIT ================= */
  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      // ✅ GET FILE EXTENSION FROM URL
      const fileExt = url.split(".").pop().split("?")[0]; // pdf / docx
      const candidateName = `${selectedCandidate?.first_name || "candidate"}_${selectedCandidate?.last_name || ""}`.trim();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${candidateName}_resume.${fileExt}`
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (e) {
      console.error(e);
      showToast("Download failed ❌");
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true)

      const fileExt = resumeFile?.name.endsWith(".pdf")
        ? ".pdf"
        : ".docx";

      const payload = {
        jaa_candidate_id: String(candidateId),
        company_name: form.company,
        job_title: form.role,
        application_link: form.job_link,
        applied_via: form.applied_via,
        employment_type: form.employment_type || "Full-time",
        experience: form.experience,
        ats_score: Number(form.ats_score),
        ai_detection_score: Number(form.ai_detection_score),
        resume_file_extension: fileExt,
        questionsAndAnswers: qaList
      };

      // 🔥 STEP 1: CREATE JOB
      const res = await authAPI.createJobApplication(payload);

      const parsed =
        typeof res.body === "string" ? JSON.parse(res.body) : res;

      const uploadUrl = parsed.resume_upload_url;

      // 🔥 STEP 2: UPLOAD RESUME
      if (uploadUrl && resumeFile) {
        await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": fileExt === ".pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          },
          body: resumeFile
        });
      }

      showToast("Job Application added successfully ✅", "success");

    } catch (e) {
      console.error(e);
      showToast("Something went wrong ❌");
    } finally {
      setUploading(false);
      setShowModal(false);
      fetchData();
    }
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
      ats_score: "",
      ai_detection_score: "",
    });
    // 🔥 RESET Q&A HERE
    setQaList([{ question: "", answer: "" }]);

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
      ats_score: job.ats_score || "",
      ai_detection_score: job.ai_detection_score || ""
    });

    setQaList(
      job.questionsAndAnswers && job.questionsAndAnswers.length > 0
        ? job.questionsAndAnswers
        : [{ question: "", answer: "" }]
    );

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

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-2 px-4 py-2 rounded-lg bg-blue-600 text-white btn-blue"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-semibold">
              Job Applications of {candidateId}
            </h1>
            <p className="text-sm text-gray-400">
              {week.start} → {week.end}
            </p>
          </div>
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

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-3 flex-wrap">

                  {/* ATS SCORE */}
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${getColor(j.ats_score)}`}>
                    <Target size={14} />
                    {j.ats_score || 0}%
                  </span>

                  {/* AI SCORE */}
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${getColor(100 - j.ai_detection_score)}`}>
                    <Zap size={14} />
                    AI {j.ai_detection_score || 0}%
                  </span>

                  {/* STATUS */}
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

                  {/* DETAILS */}
                  <div>
                    <p className="text-gray-400">Applied Via</p>
                    <p>{j.applied_via || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Employment</p>
                    <p>{j.employment_type || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Experience</p>
                    <p>{j.experience || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">ATS Score</p>
                    <p>{j.ats_score || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">AI Detection</p>
                    <p>{j.ai_detection_score || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Status</p>
                    <p>{j.approval_status || "Pending"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Application Date</p>
                    <p>{j.application_date || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Created At</p>
                    <p>{j.created_at ? j.created_at.split("T")[0] : "-"}</p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="col-span-2 flex gap-3 mt-3">

                    <button
                      onClick={() => window.open(j.application_link, "_blank")}
                      className="px-4 py-2 rounded text-white btn-blue flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      View Application
                    </button>

                    <button
                      onClick={() => handleDownload(j.resume_s3_url)}
                      className="px-4 py-2 rounded text-white btn-green flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download Resume
                    </button>

                  </div>

                  {/* 🔥 QUESTIONS & ANSWERS SECTION */}
                  {j.questionsAndAnswers && j.questionsAndAnswers.length > 0 && (
                    <div className="col-span-2 mt-4">

                      <div className="flex justify-between items-center mb-2">
                        <p className="text-gray-400 text-sm">
                          Screening Questions & Answers
                        </p>

                        <button
                          onClick={() => setShowQA(!showQA)}
                          className="text-xs px-3 py-1 rounded-md 
                                    bg-gray-200 text-gray-700 hover:bg-gray-300
                                    dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
                                    transition"
                        >
                          {showQA ? "Hide" : "Show"}
                        </button>
                      </div>
                      {showQA && (
                          <div className="space-y-3">
                            {j.questionsAndAnswers.map((qa, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-gray-700"
                              >

                                <p className="text-xs text-gray-400 mb-1">
                                  Question {idx + 1}
                                </p>
                                <p className="font-medium mb-2">
                                  {qa.question}
                                </p>

                                <p className="text-xs text-gray-400 mb-1">
                                  Answer
                                </p>
                                <p className="text-sm text-gray-300">
                                  {qa.answer}
                                </p>

                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            style={{ height: modalHeight, padding: "10px" }}
            className="bg-[var(--card)] w-full max-w-2xl rounded-2xl shadow-xl animate-fade-in relative flex flex-col"
          >
            <div className="p-6 border-b border-gray-700 flex justify-between sticky top-0 bg-[var(--card)] z-10">
              <h2 className="text-xl">{editJob ? "Edit Job Application" : "Add Job Application"}</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4 overflow-y-auto">

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

              {/* 🔥 RESUME UPLOAD */}
              <div className="col-span-2">
                <label className="text-sm">
                  Upload Resume (PDF/DOC) <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="input"
                />

                {uploading && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Uploading & analyzing...
                  </p>
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

              <div>
                <label className="text-sm">
                  AI Detection Score (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.ai_detection_score}
                  onChange={(e) =>
                    setForm({ ...form, ai_detection_score: e.target.value })
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

              {/* 🔥 QUESTIONS & ANSWERS */}
              <div className="col-span-2 mt-2">
                <label className="text-sm">
                  Questions & Answers
                </label>

                <div className="space-y-3 mt-2">

                  {qaList.map((qa, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl border border-gray-700 bg-[var(--bg-secondary)]"
                    >

                      {/* QUESTION */}
                      <input
                        placeholder={`Question ${index + 1}`}
                        value={qa.question}
                        onChange={(e) =>
                          updateQA(index, "question", e.target.value)
                        }
                        className="input mb-2"
                      />

                      {/* ANSWER */}
                      <textarea
                        placeholder="Write answer..."
                        value={qa.answer}
                        onChange={(e) =>
                          updateQA(index, "answer", e.target.value)
                        }
                        className="input"
                      />

                      {/* REMOVE BUTTON */}
                      {qaList.length > 1 && (
                        <button
                          onClick={() => removeQA(index)}
                          className="text-red-400 text-xs mt-2 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  {/* ADD BUTTON */}
                  <button
                    type="button"
                    onClick={addQA}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm"
                  >
                    + Add Question
                  </button>

                </div>
              </div>

            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6 flex justify-end gap-3 sticky bottom-0 bg-[var(--card)]">

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-500 text-white"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const ats = Number(form.ats_score);
                  const ai = Number(form.ai_detection_score);

                  if (
                    !form.company ||
                    !form.role ||
                    !form.job_link ||
                    !form.applied_via ||
                    !form.employment_type ||
                    !(form.experience === "Other"
                      ? form.experience_other
                      : form.experience) ||
                    !form.ats_score ||
                    !form.ai_detection_score
                  ) {
                    showToast("Please fill all mandatory fields ⚠️");
                    return;
                  }

                  // 🔴 ATS VALIDATION
                  if (ats < 85) {
                    showToast("ATS score must be ≥ 85%. Please update resume ⚠️");
                    return;
                  }

                  // 🔴 AI VALIDATION
                  if (ai > 25) {
                    showToast("AI detection too high (>25%). Make resume more human ⚠️");
                    return;
                  }

                  // ✅ SUCCESS
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