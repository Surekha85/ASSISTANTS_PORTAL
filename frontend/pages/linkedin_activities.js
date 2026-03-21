import { useState, useEffect  } from "react";
import { Calendar, Plus, ArrowLeft } from "lucide-react";
import { authAPI } from "../services/authAPI";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

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

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 sticky top-[64px] z-10 bg-[var(--bg-primary)] pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
             ⬅ Back
          </button>
          <h1 className="text-2xl font-semibold">LinkedIn Activities</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-[var(--border-color)] px-4 py-2 rounded-lg">
            <Calendar size={16} />
            <span>21 Mar 2026</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-green px-4 py-2 rounded-lg  px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {["Total", "Due Today", "In Progress", "Completed"].map((item) => (
          <div key={item} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)] text-sm">{item}</p>
            <h2 className="text-2xl font-bold mt-2">{tasks.length}</h2>
          </div>
        ))}
      </div>

      {/* WEEK GRID */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-3 min-h-[260px]"
          >
            <h3 className="text-sm text-[var(--text-secondary)] mb-3">{day}</h3>

            {tasks.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] text-xs mt-10">
                📭 No tasks
              </div>
            ) : (
              tasks.map((task, i) => (
                <div key={i} className="p-3 rounded-lg border border-[var(--border-color)] mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${taskTypeStyles[task.task_type]}`}>
                    {task.task_type}
                  </span>
                  <h4 className="text-sm mt-2 font-medium">{task.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)]">{task.what_to_do}</p>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* POPUP */}
      {isModalOpen && (
        <TaskPopup
          candidateId={candidateId} 
          modalHeight={modalHeight} 
          onClose={() => setIsModalOpen(false)}
          onSave={(task) => {
            setTasks([...tasks, task]);
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
      className="bg-[#121826] w-[500px] rounded-xl border border-gray-700 flex flex-col"
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
              className={`p-2 rounded-lg text-xs ${
                taskType === type
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