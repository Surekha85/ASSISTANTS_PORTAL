import { useState, useEffect } from "react";
import { Calendar, Plus, ArrowLeft } from "lucide-react";
import { authAPI } from "../services/authAPI";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { ExternalLink } from "lucide-react";

const taskTypeStyles = {
  PROFILE: "bg-[var(--profile)]/10 text-[var(--profile)]",
  POST: "bg-[var(--post)]/10 text-[var(--post)]",
  OUTREACH: "bg-[var(--outreach)]/10 text-[var(--outreach)]",
  TIPS: "bg-[var(--tips)]/10 text-[var(--tips)]",
};

export default function LinkedInActivities() {
  const router = useRouter();
  const { candidateId } = router.query;
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHeight, setModalHeight] = useState("auto");
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [linkedinTasks, setLinkedinTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  const getTaskIcon = (type) => {
    switch (type) {
      case "TIPS":
        return "💡";
      case "PROFILE":
        return "👤";
      case "POST":
        return "✍️";
      case "OUTREACH":
        return "📩";
      default:
        return "📌";
    }
  };

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

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);

    if (candidateId) {
      fetchLinkedinTasks(selectedDate); // 🔥 call API
    }
  };

  useEffect(() => {
    if (!candidateId) return;

    const today = new Date().toISOString().split("T")[0];
    fetchLinkedinTasks(today);
  }, [candidateId]);

  const fetchLinkedinTasks = async (date) => {
    try {
      setLoading(true);

      // ✅ CLEAR OLD DATA FIRST
      setLinkedinTasks([]);

      const res = await authAPI.getLinkedinActivities(candidateId, date);

      const parsed =
        typeof res.body === "string" ? JSON.parse(res.body) : res;

      // ✅ HANDLE NO DATA RESPONSE
      if (!parsed.activities || parsed.activities.length === 0) {
        setLinkedinTasks([]); // force empty
        return;
      }

      setLinkedinTasks(parsed.activities);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);

      setLinkedinTasks([]); // ✅ clear on error also

      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        JSON.stringify(err);

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ================= KPI ================= */
  const total = linkedinTasks.length;

  const dueToday = linkedinTasks.filter(
    (t) => t.due_date === today && t.status === "DUE"
  ).length;

  const inProgress = linkedinTasks.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;

  const completed = linkedinTasks.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  /* ================= GROUP ================= */
  const getDayIndex = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const groupedTasks = Array(7)
    .fill(null)
    .map(() => []);

  linkedinTasks.forEach((task) => {
    if (!task.due_date) return;
    const index = getDayIndex(task.due_date);
    groupedTasks[index].push(task);
  });

  return (
    <div className="min-h-screen p-6 bg-[var(--bg)] text-[var(--text)] p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 sticky top-[64px] z-10 bg-[var(--bg-primary)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            ⬅ Back
          </button>

          <div>
            <h1 className="text-2xl font-semibold">
              LinkedIn Activities of {candidateId}
            </h1>
            <p className="text-sm text-gray-400">
              {week.start} → {week.end}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="p-2 rounded border"
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: total },
          { label: "Due Today", value: dueToday },
          { label: "In Progress", value: inProgress },
          { label: "Completed", value: completed },
        ].map((item) => (
          <div className="bg-[var(--bg-secondary)] p-5 rounded-xl border border-[var(--border-color)]">
            <p className="text-gray-400 text-sm">{item.label}</p>
            <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
          </div>
        ))}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center mt-20 text-gray-400">
          Loading activities...
        </div>
      )}

      {/* EMPTY STATE (PRO UI) */}
      {!loading && linkedinTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-24">

          {/* ICON */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 animate-float">
            <span className="text-3xl">📭</span>
          </div>

          {/* TITLE */}
          <h2 className="text-2xl font-semibold mb-2">
            No LinkedIn Activities Found
          </h2>

          {/* SUBTEXT */}
          <p className="text-gray-400 text-sm max-w-md text-center">
            There are no activities scheduled for this selected date or week.
          </p>
        </div>
      )}

      {/* LIST VIEW (PRO UI) */}
      {/* LIST VIEW */}
      {!loading && linkedinTasks.length > 0 && (
        <div className="space-y-4">
          {linkedinTasks.map((task, i) => {
            const isExpanded = expandedId === i;

            return (
              <div
                key={task.task_id}
                className="p-5 rounded-2xl bg-[var(--card)] card-hover"
              >

                {/* TOP */}
                <div className="flex justify-between items-center">

                  {/* LEFT */}
                  <div>
                    <p className="font-semibold text-lg">{task.title}</p>
                    <p className="text-sm text-gray-400">
                      {task.task_type}
                    </p>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-3">

                    {/* STATUS */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${task.status === "COMPLETED"
                          ? "bg-green-400/20 text-green-300"
                          : task.status === "IN_PROGRESS"
                            ? "bg-blue-400/20 text-blue-300"
                            : "bg-yellow-400/20 text-yellow-300"
                        }`}
                    >
                      {task.status}
                    </span>

                    {/* EXPAND BUTTON */}
                    <button
                      onClick={() => toggleExpand(i)}
                      className="p-2 rounded-md hover:bg-[var(--bg-secondary)]"
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>
                </div>

                {/* EXPANDED SECTION */}
                {isExpanded && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm border-t pt-4">

                    <div>
                      <p className="text-gray-400">Due Date</p>
                      <p>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("en-GB")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Created At</p>
                      <p>
                        {task.created_at
                          ? new Date(task.created_at).toLocaleDateString("en-GB")
                          : "-"}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-gray-400">What to do</p>
                      <p className="leading-relaxed">
                        {task.what_to_do || "-"}
                      </p>
                    </div>

                    {/* TYPE BASED CONTENT */}

                    {task.task_type === "TIPS" && (
                      <div className="col-span-2">
                        <p className="text-gray-400">Tips</p>
                        <p>{task.tips_content}</p>
                      </div>
                    )}

                    {task.task_type === "POST" && (
                      <div className="col-span-2">
                        <p className="text-gray-400">Post Content</p>
                        <p>{task.copy_paste_content}</p>
                      </div>
                    )}

                    {task.task_type === "PROFILE" && (
                      <div className="col-span-2">
                        <p className="text-gray-400">Profile Content</p>
                        <p>{task.copy_paste_content}</p>
                      </div>
                    )}

                    {task.task_type === "OUTREACH" && (
                      <div className="col-span-2">
                        <p className="text-gray-400">Message</p>
                        <p>{task.copy_paste_content}</p>

                        {task.linkedin_profile_url && (
                          <button
                            onClick={() =>
                              window.open(task.linkedin_profile_url, "_blank")
                            }
                            className="px-4 py-2 rounded text-white btn-blue flex items-center gap-2"
                          >
                            <ExternalLink size={16} />
                            View on LinkedIn
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP (UNCHANGED) */}
      {isModalOpen && (
        <TaskPopup
          candidateId={candidateId}
          modalHeight={modalHeight}
          onClose={() => setIsModalOpen(false)}
          onSave={(task) => {
            setLinkedinTasks((prev) => [...prev, task]);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ================= POPUP ================= */

function TaskPopup({ onClose, onSave, candidateId , modalHeight  }) {
  const [taskType, setTaskType] = useState("PROFILE");

  const [form, setForm] = useState({
    title: "",
    due_date: "",
    what_to_do: "",
    copy_paste_content: "",
    section: "",
    linkedin_profile_url: "",
    recipient_name: "",
    recipient_title: "",
    tips_content: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  const handleSubmit = async () => {
    try {
      const payload = {
        jaa_candidate_id: candidateId,
        task_type: taskType,
        title: form.title,
        due_date: form.due_date,
        what_to_do: form.what_to_do,

        ...(taskType === "PROFILE" && {
          copy_paste_content: form.copy_paste_content,
          section: form.section,
        }),

        ...(taskType === "POST" && {
          copy_paste_content: form.copy_paste_content,
        }),

        ...(taskType === "OUTREACH" && {
          copy_paste_content: form.copy_paste_content,
          linkedin_profile_url: form.linkedin_profile_url,
          recipient_name: form.recipient_name,
          recipient_title: form.recipient_title,
        }),

        ...(taskType === "TIPS" && {
          tips_content: form.tips_content,
        }),
      };

      console.log("🚀 PAYLOAD:", payload);

      await authAPI.createLinkedinActivity(payload);

      // ✅ SUCCESS TOAST
      toast.success("Task created successfully ✅");

      onSave(payload);

    } catch (err) {
      console.error("❌ ERROR:", err);

      // ❌ ERROR TOAST
      toast.error(err?.message || "Failed to create task ❌");
    }
  };

  const types = ["PROFILE", "POST", "OUTREACH", "TIPS"];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div
        className="bg-[var(--bg)] text-[var(--text)] w-[500px] rounded-xl border border-gray-700 flex flex-col"
        style={{ height: modalHeight }}
      >

        {/* HEADER (FIXED) */}
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold mb-4">Create Task</h2>

          <div className="grid grid-cols-4 gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setTaskType(type)}
                className={`p-2 rounded-lg text-xs ${taskType === type
                    ? "bg-blue-600"
                    : "border border-gray-600 text-gray-400"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* BODY (SCROLL ONLY HERE) */}
        <div className="px-6 overflow-y-auto flex-1">

          <div className="mb-4">
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Title *
            </label>
            <input
              name="title"
              onChange={handleChange}
              className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Due Date *
            </label>
            <input
              name="due_date"
              type="date"
              onChange={handleChange}
              className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              What to do *
            </label>
            <textarea
              name="what_to_do"
              onChange={handleChange}
              className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
            />
          </div>

          {/* PROFILE */}
          {taskType === "PROFILE" && (
            <>
              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Section *
                </label>
                <input
                  name="section"
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Content *
                </label>
                <textarea
                  name="copy_paste_content"
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
                />
              </div>
            </>
          )}

          {/* POST */}
          {taskType === "POST" && (
            <div className="mb-4">
              <label className="block text-sm text-[var(--text-secondary)] mb-1">
                Post Content *
              </label>
              <textarea
                name="copy_paste_content"
                onChange={handleChange}
                className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
              />
            </div>
          )}

          {/* OUTREACH */}
          {taskType === "OUTREACH" && (
            <>
              <div className="mb-4">
                <label className="block text-sm mb-1">Recipient Name *</label>
                <input
                  name="recipient_name"
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-1">Recipient Title</label>
                <input
                  name="recipient_title"
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-1">LinkedIn Profile URL *</label>
                <input
                  name="linkedin_profile_url"
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-1">Message *</label>
                <textarea
                  name="copy_paste_content"
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
                />
              </div>
            </>
          )}

          {/* TIPS */}
          {taskType === "TIPS" && (
            <div className="mb-4">
              <label className="block text-sm mb-1">Tips Content *</label>
              <textarea
                name="tips_content"
                onChange={handleChange}
                className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
              />
            </div>
          )}

        </div>

        {/* FOOTER (FIXED) */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 rounded"
          >
            Save Task
          </button>
        </div>

      </div>
    </div>
  );
}