import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";

export default function LinkedinTasks() {

    const router = useRouter();

    const { candidateId } = router.query;

    const [data, setData] = useState(null);

    const [date, setDate] = useState("");

    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [editMode, setEditMode] = useState(false);

    const [editingTaskId, setEditingTaskId] = useState(null);

    const [form, setForm] = useState({

        task_type: "",
        title: "",
        due_date: "",
        what_to_do: "",
        copy_paste_content: "",
        section: "",
        linkedin_profile_url: "",
        recipient_name: "",
        recipient_title: "",
        tips_content: ""

    });


    useEffect(() => {

        setDate(new Date().toISOString().split("T")[0]);

    }, []);



    const isFormValid = () => {

        return (

            form.task_type &&
            form.title &&
            form.due_date &&
            form.what_to_do &&
            form.copy_paste_content &&
            form.section &&
            form.linkedin_profile_url &&
            form.recipient_name &&
            form.recipient_title &&
            form.tips_content

        );

    };



    const fetchData = async () => {

        if (!candidateId || !date) return;

        setLoading(true);

        try {

            const res =
                await authAPI.getLinkedinActivities(
                    candidateId,
                    date
                );

            const parsed =
                typeof res.body === "string"
                    ? JSON.parse(res.body)
                    : res;

            setData(parsed);

        }
        catch (err) {

            console.log(err);

        }
        finally {

            setLoading(false);

        }

    };



    useEffect(() => {

        if (!router.isReady) return;

        fetchData();

    }, [router.isReady, candidateId, date]);



    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };



    const resetForm = () => {

        setForm({

            task_type: "",
            title: "",
            due_date: "",
            what_to_do: "",
            copy_paste_content: "",
            section: "",
            linkedin_profile_url: "",
            recipient_name: "",
            recipient_title: "",
            tips_content: ""

        });

    };



    const openAddModal = () => {

        resetForm();

        setEditMode(false);

        setShowModal(true);

    };



    const handleEdit = (task) => {

        setEditMode(true);

        setEditingTaskId(task.linkedin_activity_id);

        setForm({

            task_type: task.task_type || "",

            title: task.title || "",

            due_date: task.due_date || "",

            what_to_do: task.what_to_do || "",

            copy_paste_content: task.copy_paste_content || "",

            section: task.section || "",

            linkedin_profile_url: task.linkedin_profile_url || "",

            recipient_name: task.recipient_name || "",

            recipient_title: task.recipient_title || "",

            tips_content: task.tips_content || ""

        });

        setShowModal(true);

    };



    const handleSubmit = async () => {

        try {

            setSubmitting(true);

            const payload = {

                jaa_candidate_id: String(candidateId || "cand1"),

                task_type: form.task_type,

                title: form.title,

                due_date: form.due_date,

                what_to_do: form.what_to_do,

                status: "DUE",

                copy_paste_content: form.copy_paste_content,

                section: form.section,

                linkedin_profile_url: form.linkedin_profile_url,

                recipient_name: form.recipient_name,

                recipient_title: form.recipient_title,

                tips_content: form.tips_content

            };


            if (editMode) {

                await authAPI.updateLinkedinActivity(
                    editingTaskId,
                    payload
                );

            } else {

                await authAPI.createLinkedinActivity(
                    payload
                );

            }


            setShowModal(false);

            resetForm();

            fetchData();

        }
        catch (err) {

            console.log(err);

            alert("Error saving");

        }
        finally {

            setSubmitting(false);

        }

    };



    return (

        <div className="min-h-screen bg-[#0f172a] text-white p-10">

            <div className="flex justify-between mb-8">

                <button

                    onClick={() => router.push("/dashboard")}

                    className="bg-blue-600 px-6 py-2 rounded"

                >

                    ← Back

                </button>


                <div className="flex gap-4">

                    <input

                        type="date"

                        value={date}

                        onChange={(e) => setDate(e.target.value)}

                        className="bg-[#1e293b] p-2 rounded border border-gray-600"

                    />


                    <button

                        onClick={openAddModal}

                        className="bg-green-600 px-6 py-2 rounded"

                    >

                        + Add Task

                    </button>

                </div>

            </div>



            <h1 className="text-3xl mb-6">

                LinkedIn Activities

            </h1>



            {data?.tasks?.length > 0 && (

                <div className="bg-[#1e293b] rounded-xl overflow-hidden">

                    <table className="w-full">

                        <thead className="bg-black">

                            <tr>

                                <th className="p-4 text-left">Title</th>

                                <th>Type</th>

                                <th>Due Date</th>

                                <th>Status</th>

                                <th>Edit</th>

                            </tr>

                        </thead>

                        <tbody>

                            {data.tasks.map((t) => (

                                <tr
                                    key={t.linkedin_activity_id}
                                    className="border-t border-gray-700"
                                >

                                    <td className="p-4">{t.title}</td>

                                    <td>{t.task_type}</td>

                                    <td>{t.due_date}</td>

                                    <td>{t.status}</td>

                                    <td>

                                        <button
                                            onClick={() => handleEdit(t)}
                                            className="text-blue-400"
                                        >

                                            ✏️

                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}



            {showModal && (

                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

                    <div className="bg-[#1e293b] w-[900px] h-[calc(100vh-120px)] rounded-xl flex flex-col">



                        {/* HEADER */}

                        <div className="p-6 border-b border-gray-700 flex justify-between">

                            <h2 className="text-xl">

                                {editMode ? "Update Task" : "Create Task"}

                            </h2>

                            <button onClick={() => setShowModal(false)}>
                                ✕
                            </button>

                        </div>



                        {/* BODY */}

                        <div className="p-6 flex-1 overflow-y-auto">

                            <div className="grid grid-cols-2 gap-6">

                                <Select label="Task Type" required name="task_type" value={form.task_type} onChange={handleChange} options={["PROFILE", "POST", "OUTREACH", "TIPS"]} />

                                <Input label="Title" required name="title" value={form.title} onChange={handleChange} />

                                <Input type="date" label="Due Date" required name="due_date" value={form.due_date} onChange={handleChange} />

                                <div className="col-span-2">

                                    <TextArea label="Instructions" required name="what_to_do" value={form.what_to_do} onChange={handleChange} />

                                </div>

                                <div className="col-span-2">

                                    <TextArea label="Copy Paste Content" required name="copy_paste_content" value={form.copy_paste_content} onChange={handleChange} />

                                </div>

                                <Input label="Section" required name="section" value={form.section} onChange={handleChange} />

                                <Input label="LinkedIn URL" required name="linkedin_profile_url" value={form.linkedin_profile_url} onChange={handleChange} />

                                <Input label="Recipient Name" required name="recipient_name" value={form.recipient_name} onChange={handleChange} />

                                <Input label="Recipient Title" required name="recipient_title" value={form.recipient_title} onChange={handleChange} />

                                <div className="col-span-2">

                                    <TextArea label="Tips Content" required name="tips_content" value={form.tips_content} onChange={handleChange} />

                                </div>

                            </div>

                        </div>



                        {/* FOOTER */}

                        <div className="p-6 border-t border-gray-700 flex justify-end gap-4">

                            <button
                                onClick={() => setShowModal(false)}
                                className="border px-6 py-2 rounded"
                            >

                                Cancel

                            </button>

                            <button

                                disabled={!isFormValid() || submitting}

                                onClick={handleSubmit}

                                className={`px-8 py-2 rounded ${isFormValid()
                                        ? "bg-green-600"
                                        : "bg-gray-600 cursor-not-allowed"
                                    }`}

                            >

                                {submitting ? "Saving..." : editMode ? "Update" : "Create"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}



function Input({ label, required, ...props }) {

    return (

        <div>

            <label className="text-sm text-gray-300">

                {label}

                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}

            </label>

            <input

                {...props}

                className="w-full p-2 mt-1 bg-[#020617] border border-gray-600 rounded"

            />

        </div>

    );

}



function TextArea({ label, required, ...props }) {

    return (

        <div>

            <label className="text-sm text-gray-300">

                {label}

                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}

            </label>

            <textarea

                rows={4}

                {...props}

                className="w-full p-2 mt-1 bg-[#020617] border border-gray-600 rounded"

            />

        </div>

    );

}



function Select({ label, required, options = [], ...props }) {

    return (

        <div>

            <label className="text-sm text-gray-300">

                {label}

                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}

            </label>

            <select

                {...props}

                className="w-full p-2 mt-1 bg-[#020617] border border-gray-600 rounded"

            >

                <option value="">Select</option>

                {options.map(o => (

                    <option key={o}>
                        {o}
                    </option>

                ))}

            </select>

        </div>

    );
}