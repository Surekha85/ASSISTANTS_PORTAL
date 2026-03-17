import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ResumeFormatNotice from "../components/ResumeFormatNotice";
import ResumeRewriteNotice from "../components/ResumeRewriteNotice";
import ResumeSection from "../components/ResumeSection";
import { getCurrentUser, isEmailVerified } from "../utils/auth";
import TemplateCard from "../components/TemplateCard";
import ClassicTemplate from "../components/templates/ClassicTemplate";
import ModernTemplate from "../components/templates/ModernTemplate";
import MinimalTemplate from "../components/templates/MinimalTemplate";
import ProfessionalTemplate from "../components/templates/ProfessionalTemplate";
import CreativeTemplate from "../components/templates/CreativeTemplate";

const TEMPLATE_CONFIG = [
  {
    name: "Classic",
    component: ClassicTemplate,
    previewSrc: "/base_resume_blue_one.jpg",
  },
  {
    name: "Modern",
    component: ModernTemplate,
    previewSrc: "/base_resume_black_three.png",
  },
  {
    name: "Minimal",
    component: MinimalTemplate,
    previewSrc: "/base_resume_dark_blue_two.png",
  },
  {
    name: "Professional",
    component: ProfessionalTemplate,
    previewSrc: "/base_resume_center_four.png",
  },
  {
    name: "Creative",
    component: CreativeTemplate,
    previewSrc: "/base_resume_gold_five.png",
  },
];

// Template mapping function to convert frontend names to backend identifiers
const getBackendTemplateType = (frontendTemplate) => {
  const templateMap = {
    "Classic": "blue_one",
    "Modern": "black_three",
    "Minimal": "dark_blue_two",
    "Professional": "center_four",
    "Creative": "gold_five"
  };
  return templateMap[frontendTemplate] || "blue_one"; // default fallback to Classic
};
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedService, setSelectedService] = useState("AI Resume Builder");

  const [activeMode, setActiveMode] = useState("rewrite"); // or "enhance"
  
  // Separate job description and resume file for each mode
  const [enhanceJobDescription, setEnhanceJobDescription] = useState("");
  const [enhanceResumeFile, setEnhanceResumeFile] = useState(null);
  const [rewriteJobDescription, setRewriteJobDescription] = useState("");
  const [rewriteResumeFile, setRewriteResumeFile] = useState(null);
  const [workExperiencePreference, setWorkExperiencePreference] = useState("");
  
  // Enhance mode specific state
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceCurrentStatus, setEnhanceCurrentStatus] = useState("Waiting...");
  const [enhanceProfileSummary, setEnhanceProfileSummary] = useState([]);
  const [enhanceWorkExperience, setEnhanceWorkExperience] = useState([]);
  const [enhanceTechnicalSkills, setEnhanceTechnicalSkills] = useState({ existing: {}, not_existing: {} });
  const [enhanceSkillsAdded, setEnhanceSkillsAdded] = useState({ profile: [], workExperience: [], technical: [] });
  const [enhanceDownloadLink, setEnhanceDownloadLink] = useState("");
  const [enhanceTechnicalSkillsError, setEnhanceTechnicalSkillsError] = useState("");
  
  // Rewrite mode specific state
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteCurrentStatus, setRewriteCurrentStatus] = useState("Waiting...");
  const [rewriteProfileSummary, setRewriteProfileSummary] = useState([]);
  const [rewriteWorkExperience, setRewriteWorkExperience] = useState([]);
  const [rewriteTechnicalSkills, setRewriteTechnicalSkills] = useState({ existing: {}, not_existing: {} });
  const [rewriteSkillsAdded, setRewriteSkillsAdded] = useState({ profile: [], workExperience: [], technical: [] });
  const [rewriteDownloadLink, setRewriteDownloadLink] = useState("");
  
  // Shared state
  const [showResumeNotice, setShowResumeNotice] = useState(false);
  const [showRewriteNotice, setShowRewriteNotice] = useState(false);
  const [showDelayBanner, setShowDelayBanner] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showUploadInfoModal, setShowUploadInfoModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showAllTemplatesModal, setShowAllTemplatesModal] = useState(false);
  const [modalPreviewSrc, setModalPreviewSrc] = useState("");
  const [modalPreviewTitle, setModalPreviewTitle] = useState("");
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [favoriteTemplates, setFavoriteTemplates] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('jobsymeFavoriteTemplates')) || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const orderedTemplates = useMemo(() => {
    const favoriteSet = new Set(favoriteTemplates);
    const favoritesFirst = TEMPLATE_CONFIG.filter((template) => favoriteSet.has(template.name));
    const nonFavorites = TEMPLATE_CONFIG.filter((template) => !favoriteSet.has(template.name));
    // Ensure favorites maintain the order in which they were favorited (favoriteTemplates array order)
    const favoritesSorted = favoriteTemplates
      .map((favName) => favoritesFirst.find((template) => template.name === favName))
      .filter(Boolean);
    return [...favoritesSorted, ...nonFavorites];
  }, [favoriteTemplates]);

  const selectedTemplateConfig = useMemo(
    () => orderedTemplates.find((template) => template.name === selectedTemplate) || null,
    [orderedTemplates, selectedTemplate]
  );

  const visibleTemplates = useMemo(() => {
    if (!selectedTemplateConfig) {
      return orderedTemplates.slice(0, 4);
    }

    const templatesWithoutSelected = orderedTemplates.filter(
      (template) => template.name !== selectedTemplateConfig.name
    );

    return [selectedTemplateConfig, ...templatesWithoutSelected].slice(0, 4);
  }, [orderedTemplates, selectedTemplateConfig]);

  // Preference management functions
  const saveUserPreference = (preferredMode) => {
    try {
      localStorage.setItem('jobsymeDefaultView', preferredMode);
      toast.success(`✅ Default view set to ${preferredMode === 'rewrite' ? 'Rewrite Resume' : 'Enhance Resume'}!`, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          color: '#16A34A',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
    } catch (error) {
      console.error('Failed to save user preference:', error);
      toast.error('Failed to save preference. Please try again.', {
        duration: 3000,
        position: 'top-center'
      });
    }
  };

  const loadUserPreference = () => {
    try {
      const savedPreference = localStorage.getItem('jobsymeDefaultView');
      return savedPreference || 'rewrite'; // default to 'rewrite' if no preference saved
    } catch (error) {
      console.error('Failed to load user preference:', error);
      return 'rewrite'; // fallback to default
    }
  };

  const handlePreferenceSave = (preferredMode) => {
    saveUserPreference(preferredMode);
    setActiveMode(preferredMode);
    setShowPreferencesModal(false);
    
    // Show appropriate notice for the new mode if not acknowledged
    if (preferredMode === "rewrite") {
      const rewriteAcknowledged = localStorage.getItem("fullTimeMarketingAcknowledged");
      if (!rewriteAcknowledged) {
        setTimeout(() => setShowRewriteNotice(true), 100);
      }
    } else if (preferredMode === "enhance") {
      const enhanceAcknowledged = localStorage.getItem("resumeFormatAcknowledged");
      if (!enhanceAcknowledged) {
        setTimeout(() => setShowResumeNotice(true), 100);
      }
    }
  };

  useEffect(() => {
    // Load user's preferred default view
    const preferredMode = loadUserPreference();
    setActiveMode(preferredMode);
    
    // Show appropriate notice based on the loaded mode
    if (preferredMode === "rewrite") {
      const rewriteAcknowledged = localStorage.getItem("fullTimeMarketingAcknowledged");
      if (!rewriteAcknowledged) setShowRewriteNotice(true);
    } else if (preferredMode === "enhance") {
      const enhanceAcknowledged = localStorage.getItem("resumeFormatAcknowledged");
      if (!enhanceAcknowledged) setShowResumeNotice(true);
    }
    
    // Check authentication using JWT
    const currentUser = getCurrentUser();
    if (currentUser && isEmailVerified(currentUser)) {
      // Redirect vendors to their dashboard
      if (currentUser.user_type === 'vendor') {
        router.push("/vendor-dashboard");
        return;
      }
      setUser(currentUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    try {
      // Save favorites to localStorage
      localStorage.setItem('jobsymeFavoriteTemplates', JSON.stringify(favoriteTemplates));
    } catch {}
  }, [favoriteTemplates]);


  const handleGenerate = async () => {
    const traceId = `trace-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Comprehensive validation for enhance mode
    const missingFields = [];
    
    if (!enhanceJobDescription) {
      missingFields.push("Job Description");
    }
    if (!enhanceResumeFile) {
      missingFields.push("Resume File");
    }
    
    if (missingFields.length > 0) {
      const message = `Please complete the following:\n• ${missingFields.join('\n• ')}`;
      toast.error(message, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500',
          whiteSpace: 'pre-line'
        }
      });
      return;
    }

    // Validate file extension for enhance mode
    const allowedExtensions = ['.docx'];
    const fileExtension = enhanceResumeFile.name.toLowerCase().substring(enhanceResumeFile.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error("📄 Please upload only .docx files!", {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (enhanceResumeFile.size > maxSizeInBytes) {
      toast.error("📦 File size should not exceed 10MB!", {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
      return;
    }
    setEnhanceLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", enhanceResumeFile);
      formData.append("jobDescription", enhanceJobDescription);
      const baseURL = "https://hh2jxsm65l.execute-api.us-east-1.amazonaws.com/dev";

      // Step 1: Get presigned S3 upload URL
      const uploadRes = await fetch(`${baseURL}/api/get-upload-url?filename=${encodeURIComponent(enhanceResumeFile.name)}&traceId=${traceId}`);

      const { uploadUrl, key } = await uploadRes.json();

      if (!uploadUrl || !key) {
        toast.error("❌ Failed to get upload URL. Please try again.", {
          duration: 4000,
          position: 'top-center'
        });
        setEnhanceLoading(false);
        return;
      }

      // Step 2: Upload to S3 directly
      const s3Upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream"
        },
        body: enhanceResumeFile
      });

      if (!s3Upload.ok) {
        toast.error("☁️ Failed to upload resume. Please try again.", {
          duration: 4000,
          position: 'top-center'
        });
        setEnhanceLoading(false);
        return;
      }

      // Step 3: Notify backend with uploaded key
      const submitResponse = await fetch(`${baseURL}/api/submit-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          upload_key: key,
          jobDescription: enhanceJobDescription,
          traceId
        })
      });

      const submitData = await submitResponse.json();
      const resultKey = submitData.result_key;
      let retries = 0;
      const retryInterval = 500; // Original interval from working code
      const maxDuration = 5 * 60 * 1000;
      const maxRetries = maxDuration / retryInterval;
      let mappingUrl = null;

      // Restore original polling logic that looks for download_url
      while (retries < maxRetries) {
        try {
          const statusRes = await fetch(`${baseURL}/api/check-status?result_key=${encodeURIComponent(resultKey)}&traceId=${traceId}`);
          
          if (!statusRes.ok) {
            console.error(`Status check failed: ${statusRes.status} ${statusRes.statusText}`);
            throw new Error(`Status check failed: ${statusRes.status}`);
          }
          
          const statusData = await statusRes.json();
          setEnhanceCurrentStatus(statusData.status || "Processing...");
          
          // Original logic: look for download_url directly
          if (statusData.download_url) {
            mappingUrl = statusData.download_url;
            break;
          }
          
          await new Promise((r) => setTimeout(r, retryInterval));
          retries++;
        } catch (statusError) {
          console.error(`Error during status check ${retries + 1}:`, statusError);
          retries++;
          if (retries < maxRetries) {
            await new Promise((r) => setTimeout(r, retryInterval));
          }
        }
      }

      if (!mappingUrl) {
        toast.error("⏱️ Resume processing took too long. Please try again later.", {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            fontSize: '14px',
            fontWeight: '500'
          }
        });
        setEnhanceLoading(false);
        return;
      }

      // Use original generate-resume endpoint with FormData (as in working old code)
      const generateFormData = new FormData();
      generateFormData.append("resumeKey", key);
      generateFormData.append("mappingUrl", mappingUrl);
  generateFormData.append("applyATS", "false");
      generateFormData.append("resultKey", resultKey);
      generateFormData.append("traceId", traceId);

      const generateResponse = await fetch(`${baseURL}/api/generate-resume`, {
        method: "POST",
        body: generateFormData,
      });
      const generateData = await generateResponse.json();
      if (generateResponse.ok) {
        // Restore original data handling from working code
        setEnhanceProfileSummary(
          (generateData.insights?.profileSummaryPoints || [])
            .map((point) => ({
              original: "",
              additions: Array.isArray(point) ? point : [point],
            }))
        );

        setEnhanceWorkExperience(
          (generateData.insights?.enhancedExperienceDisplay || []).map((exp) => ({
            title: exp.title || "",
            company: exp.company || "",
            missingSkills: exp.missingSkills || [],
            additions: Array.isArray(exp.enhancedPoints)
              ? exp.enhancedPoints.flat() // flatten nested bullets
              : [],
          }))
        );
        
        setEnhanceTechnicalSkills(generateData.insights?.technicalSkills || { existing: {}, not_existing: {} });
        setEnhanceSkillsAdded(generateData.skillsAdded || { profile: [], workExperience: [], technical: [] });
        setEnhanceDownloadLink(generateData.downloadLink || "");
        setEnhanceTechnicalSkillsError(generateData.technicalSkillsError || "");
      } else {
        toast.error(`❌ ${generateData.error || "Resume generation failed. Please try again."}`, {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            fontSize: '14px',
            fontWeight: '500'
          }
        });
        setEnhanceDownloadLink("");
      }
    } catch (err) {
      console.error("❌ Error generating resume:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        traceId: traceId
      });
      
      // More specific error messages
      let errorMessage = "⚠️ Something went wrong. Please try again.";
      if (err.message.includes('fetch')) {
        errorMessage = "🌐 Network error. Please check your connection and try again.";
      } else if (err.message.includes('timeout')) {
        errorMessage = "⏱️ Request timed out. Please try again.";
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
    } finally {
      setEnhanceLoading(false);
      setEnhanceCurrentStatus("Waiting...");
    }
  };

  const handleGenerateFullTime = async () => {
    const traceId = `trace-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Comprehensive validation for rewrite mode
    const missingFields = [];
    
    if (!rewriteJobDescription) {
      missingFields.push("Job Description");
    }
    if (!selectedTemplate) {
      missingFields.push("Template Selection");
    }
    if (!rewriteResumeFile) {
      missingFields.push("Resume File");
    }
    if (!workExperiencePreference) {
      missingFields.push("Work Experience Preference");
    }
    
    if (missingFields.length > 0) {
      const message = `Please complete the following:\n• ${missingFields.join('\n• ')}`;
      toast.error(message, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500',
          whiteSpace: 'pre-line'
        }
      });
      return;
    }

    // Validate file extension
    const allowedExtensions = ['.docx'];
    const fileExtension = rewriteResumeFile.name.toLowerCase().substring(rewriteResumeFile.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error("📄 Please upload only .docx files!", {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (rewriteResumeFile.size > maxSizeInBytes) {
      toast.error("📦 File size should not exceed 10MB!", {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
      return;
    }

    setRewriteLoading(true);
    setRewriteCurrentStatus("Initializing resume rewrite...");

    try {
      const baseURL = "https://y1xteozbjd.execute-api.us-east-1.amazonaws.com/beta"; // Beta endpoint for rewrite

      // STEP 1: Get presigned S3 upload URL
      setRewriteCurrentStatus("Getting upload URL...");
      const uploadRes = await fetch(`${baseURL}/api/get-upload-url?filename=${encodeURIComponent(rewriteResumeFile.name)}&traceId=${traceId}`);
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { uploadUrl, key, bucket, expiresIn } = await uploadRes.json();

      if (!uploadUrl || !key) {
        throw new Error("Invalid response from upload URL service");
      }

      // STEP 2: Upload file directly to S3 using presigned URL
      setRewriteCurrentStatus("Uploading your resume...");
      const s3Upload = await fetch(uploadUrl, {
        method: "PUT",
        body: rewriteResumeFile,
        headers: {
          "Content-Type": "application/octet-stream"
        }
      });

      if (!s3Upload.ok) {
        throw new Error("Failed to upload resume to S3");
      }

      // STEP 3: Submit the resume for processing
      setRewriteCurrentStatus("Processing your resume...");
      const submitResponse = await fetch(`${baseURL}/api/submit-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          upload_key: key,
          jobDescription: rewriteJobDescription,
          workExperiencePreference: workExperiencePreference,
          traceId
        })
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || "Failed to submit resume for processing");
      }

      const submitData = await submitResponse.json();
      const resultKey = submitData.result_key;

      // STEP 4: Poll for processing status
      setRewriteCurrentStatus("Processing your resume rewrite...");
      let retries = 0;
      const retryInterval = 1000; // Check every second for rewrite
      const maxDuration = 10 * 60 * 1000; // 10 minutes max for rewrite
      const maxRetries = maxDuration / retryInterval;
      let processedData = null;

      while (retries < maxRetries) {
        const statusRes = await fetch(`${baseURL}/api/check-status?result_key=${encodeURIComponent(resultKey)}&traceId=${traceId}`);
        
        if (!statusRes.ok) {
          throw new Error("Failed to check processing status");
        }

        const statusData = await statusRes.json();
        setRewriteCurrentStatus(statusData.status || "Processing...");
        
        // Backend returns step: "complete_resume_ready" when complete
        if (statusData.step === "complete_resume_ready") {
          processedData = statusData;
          break;
        }
        
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
        retries++;
      }

      if (!processedData) {
        throw new Error("⏱ Resume rewrite took too long. Please try again later.");
      }

      // STEP 5: Generate the final rewritten resume
      setRewriteCurrentStatus("Generating your new resume...");
      const rewriteResponse = await fetch(`${baseURL}/api/rewrite-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resultKey: resultKey,
          traceId: traceId,
          templateType: getBackendTemplateType(selectedTemplate)
        })
      });

      if (!rewriteResponse.ok) {
        const errorData = await rewriteResponse.json();
        throw new Error(errorData.error || "Failed to generate rewritten resume");
      }

      const generateData = await rewriteResponse.json();

      // Update UI with rewrite results - backend returns complete_resume_data
      const completeResumeData = generateData.complete_resume_data;
      
      if (completeResumeData) {
        // Extract profile summary from complete resume data
        const profileSummaryPoints = completeResumeData.profile_summary || [];
        setRewriteProfileSummary(
          profileSummaryPoints.map((point) => ({
            original: "",
            additions: Array.isArray(point) ? [point] : [point], // Each point is a string
          }))
        );

        // Extract work experience from complete resume data
        const workExperiences = completeResumeData.work_experience || [];
        setRewriteWorkExperience(
          workExperiences.map((exp) => ({
            title: exp.title || "",
            company: exp.company || "",
            location: exp.location || "",
            startDate: exp.start_date || "",
            endDate: exp.end_date || "",
            isCurrentJob: exp.is_current_job || false,
            missingSkills: [], // This would come from enhancement analysis
            additions: exp.responsibilities || [], // Backend uses 'responsibilities' array
          }))
        );

        // Extract technical skills from complete resume data
        const techSkills = completeResumeData.technical_skills || {};
        setRewriteTechnicalSkills({ 
          existing: techSkills, 
          not_existing: {} 
        });
        
        // Extract projects if available
        if (completeResumeData.projects) {
          const projects = completeResumeData.projects.map((project) => ({
            name: project.project_name || "",
            startDate: project.start_date || "",
            endDate: project.end_date || "",
            description: project.enhanced_points || [], // Backend uses 'enhanced_points' array
          }));
          // Set projects if you have a setProjects state function
          // setProjects(projects);
        }

        // Extract education if available
        if (completeResumeData.education) {
          const education = completeResumeData.education.map((edu) => ({
            university: edu.university_name || "",
            degree: edu.degree || "",
            field: edu.field_of_study || "",
            location: edu.location || "",
            startDate: edu.start_date || "",
            endDate: edu.end_date || "",
            gpa: edu.gpa || null,
          }));
          // Set education if you have a setEducation state function
          // setEducation(education);
        }

        // Extract contact info if available
        if (completeResumeData.contact_info) {
          const contactInfo = completeResumeData.contact_info;
          // Set contact info if you have state functions for these
          // setFullName(contactInfo.full_name || "");
          // setEmail(contactInfo.email || "");
          // setPhone(contactInfo.phone_number || "");
          // setLocation(contactInfo.location || "");
          // setLinkedIn(contactInfo.linkedin_url || "");
        }
        
        // For rewrite mode, we don't have "added skills" - everything is rewritten
        setRewriteSkillsAdded({ profile: [], workExperience: [], technical: [] });
      }

      setRewriteDownloadLink(generateData.download_url || "");
      setRewriteCurrentStatus("Resume rewrite completed successfully!");
      
      toast.success("🎉 Your resume has been completely rewritten and optimized!");

    } catch (error) {
      console.error("❌ Error in resume rewrite:", error);
      setRewriteCurrentStatus("Failed to rewrite resume");
      toast.error(`❌ ${error.message || "Failed to rewrite resume. Please try again."}`, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleGuidelinesDownload = async () => {
    try {
      const baseURL = "https://hh2jxsm65l.execute-api.us-east-1.amazonaws.com/dev";
      const res = await fetch(`${baseURL}/api/guidelines-download`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("📄 Failed to fetch the guideline link. Please try again.", {
          duration: 4000,
          position: 'top-center'
        });
      }
    } catch (error) {
      toast.error("📄 Failed to fetch the guideline link. Please try again.", {
        duration: 4000,
        position: 'top-center'
      });
    }
  };

  const renderAddedSkillsSummary = () => {
    const currentSkillsAdded = activeMode === "enhance" ? enhanceSkillsAdded : rewriteSkillsAdded;
    const { profile, workExperience, technical } = currentSkillsAdded;
    const hasAny = profile.length || workExperience.length || technical.length;

    if (!hasAny) return null;

    return (
      <div className="mb-5 sm:mb-7">
        <h2 className="font-bold text-2xl mb-5">Skills Added to Match the Job</h2>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm space-y-4">
          {/* Responsive Row for Profile + Technical */}
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
            {/* 🧠 Profile Summary */}
            {profile.length > 0 && (
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                  🧠 Profile Summary
                </p>
                <ul className="list-disc pl-5 text-sm text-green-700 dark:text-green-400">
                  {profile.map((s, i) => <li key={`p-${i}`}>{s}</li>)}
                </ul>
              </div>
            )}

            {/* 🛠️ Technical Skills */}
            {technical.length > 0 && (
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                  🛠️ Technical Skills
                </p>
                <ul className="list-disc pl-5 text-sm text-green-700 dark:text-green-400">
                  {technical.map((s, i) => (
                    <li key={`t-${i}`}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 📁 Work Experience - Full Width */}
          {workExperience.length > 0 && (
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1">
                📁 Work Experience
              </p>
              <ul className="list-disc pl-5 text-sm text-green-700 dark:text-green-400">
                {workExperience.map((s, i) => <li key={`w-${i}`}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>

        <p className="text-sm text-blue-500 dark:text-blue-500 mt-3 mb-4 sm:mb-5">
          We've updated your Profile Summary, Work Experience, and Technical Skills. Review the details below.
        </p>

        <div
          role="separator"
          aria-hidden="true"
          className="h-px bg-gray-400 dark:bg-white/15 rounded"
        ></div>
      </div>
    );
  };

  // Clear data when switching modes to ensure clean separation
  const clearModeData = (mode) => {
    if (mode === "enhance") {
      setEnhanceProfileSummary([]);
      setEnhanceWorkExperience([]);
      setEnhanceTechnicalSkills({ existing: {}, not_existing: {} });
      setEnhanceSkillsAdded({ profile: [], workExperience: [], technical: [] });
      setEnhanceDownloadLink("");
      setEnhanceJobDescription("");
      setEnhanceResumeFile(null);
      setEnhanceLoading(false);
      setEnhanceCurrentStatus("Waiting...");
      setEnhanceTechnicalSkillsError("");
    } else if (mode === "rewrite") {
      setRewriteProfileSummary([]);
      setRewriteWorkExperience([]);
      setRewriteTechnicalSkills({ existing: {}, not_existing: {} });
      setRewriteSkillsAdded({ profile: [], workExperience: [], technical: [] });
      setRewriteDownloadLink("");
      setRewriteJobDescription("");
      setRewriteResumeFile(null);
      setRewriteLoading(false);
      setRewriteCurrentStatus("Waiting...");
    }
  };

  const handleModeChange = (newMode) => {
    setActiveMode(newMode);
    
    // First, close any existing notices
    // Clear data for the mode we're switching into to avoid showing stale results
    clearModeData(newMode);
    
    // Then show appropriate notice when switching modes
    if (newMode === "rewrite") {
      const rewriteAcknowledged = localStorage.getItem("fullTimeMarketingAcknowledged");
      if (!rewriteAcknowledged) {
        // Small delay to ensure the previous notice is closed first
        setTimeout(() => setShowRewriteNotice(true), 100);
      }
    } else if (newMode === "enhance") {
      const enhanceAcknowledged = localStorage.getItem("resumeFormatAcknowledged");
      if (!enhanceAcknowledged) {
        // Small delay to ensure the previous notice is closed first
        setTimeout(() => setShowResumeNotice(true), 100);
      }
    }
    
  };

  const renderTechnicalSkills = () => {
    const currentTechnicalSkills = activeMode === "enhance" ? enhanceTechnicalSkills : rewriteTechnicalSkills;
    const currentTechnicalSkillsError = activeMode === "enhance" ? enhanceTechnicalSkillsError : "";
    const hasExistingSkills = currentTechnicalSkills.existing && Object.keys(currentTechnicalSkills.existing).length > 0;
    const hasNewSections = currentTechnicalSkills.not_existing && Object.keys(currentTechnicalSkills.not_existing).length > 0;
    
    // Show technical skills section if there are skills OR if there's an error
    if (!hasExistingSkills && !hasNewSections && !currentTechnicalSkillsError) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3"> Technical Skills </h3>
        
        {/* Display technical skills error in red if it exists */}
        {currentTechnicalSkillsError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg w-fit max-w-full">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">
              ⚠️ {currentTechnicalSkillsError}
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm">
              📄 Download our{" "}
              <button
                onClick={handleGuidelinesDownload}
                className="underline font-semibold hover:text-red-700 dark:hover:text-red-300 transition-colors"
                type="button"
              >
                Resume Formatting Guideline
              </button>
              .
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasExistingSkills && (
            <div>
              <h4 className="text-base font-medium text-green-400 mb-2">Newly Added Skills</h4>
              {Object.entries(currentTechnicalSkills.existing).map(([key, values]) => (
                <div key={key} className="mb-2">
                  <p className="text-sm font-medium">{key}</p>
                  <ul className="list-disc ml-5 text-sm text-gray-800 dark:text-white">
                    {values.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {hasNewSections && (
            <div>
              <h4 className="text-base font-medium text-green-400 mb-2">Newly Added Sections</h4>
              {Object.entries(currentTechnicalSkills.not_existing).map(([key, values]) => (
                <div key={key} className="mb-2">
                  <p className="text-sm font-medium">{key}</p>
                  <ul className="list-disc ml-5 text-sm text-gray-800 dark:text-white">
                    {values.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!user) return <div>Loading...</div>;

  return (
    <>
      {/* Upload Info Modal */}
      {showUploadInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowUploadInfoModal(false)}
        >
          <div
            className="relative w-[90vw] max-w-lg mx-auto rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">ℹ️</span>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Resume Upload Info</h3>
              </div>
              <button
                aria-label="Close info"
                className="rounded-md px-3 py-1.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
                onClick={() => setShowUploadInfoModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Your resume helps us extract your details (personal details, education, work experience, skills, certifications, etc..). 
                No manual input needed — just upload and click Rewrite Resume.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowUploadInfoModal(false)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Preferences Modal */}
      {showPreferencesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowPreferencesModal(false)}
        >
          <div
            className="relative w-[90vw] max-w-md mx-auto rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">⚙️</span>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Default Dashboard View</h3>
              </div>
              <button
                aria-label="Close preferences"
                className="rounded-md px-3 py-1.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
                onClick={() => setShowPreferencesModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Choose which view you'd like to see by default when you open the dashboard. You can always switch between them later.
              </p>
              
              <div className="space-y-4">
                <div 
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    activeMode === 'rewrite' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handlePreferenceSave('rewrite')}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      activeMode === 'rewrite'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {activeMode === 'rewrite' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                        Rewrite Resume (Full-Time Focused)
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
                          <span className="text-xs">🔥</span>
                          <span className="tracking-wide">LIVE</span>
                        </div>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Creates a brand new resume tailored to job descriptions. Perfect for full-time roles with high ATS match.
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    activeMode === 'enhance' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handlePreferenceSave('enhance')}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      activeMode === 'enhance'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {activeMode === 'enhance' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        Enhance Resume (Contract / Full-Time)
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Intelligently adds missing skills from job descriptions to your existing resume. Best for contract and full-time roles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Your preference is saved automatically and will be applied on your next visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResumeNotice && <ResumeFormatNotice onClose={() => setShowResumeNotice(false)} />}
      {showRewriteNotice && <ResumeRewriteNotice onClose={() => setShowRewriteNotice(false)} />}

      {/* {showDelayBanner && (...) } */}
      {showDelayBanner && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 text-sm flex justify-between items-start shadow-md mb-4">
          <div>
            <p className="mb-1">
              ⚠️ <strong>Note:</strong> This is a <strong>Beta</strong> tool. We're working behind the scenes to improve its efficiency and save you time editing resumes.
            </p>
            <p className="mb-1">
              💡 Have a feature request like "Jobsyme should support this style"? Or facing any issue?
              Please email us at <a href="mailto:support@jobsyme.com" className="underline font-medium text-blue-700">support@jobsyme.com</a>.
            </p>
            <p>
              📄 Download our 
              <button
                onClick={handleGuidelinesDownload}
                className="ml-1 text-blue-700 underline font-semibold hover:text-blue-900"
              >
                Resume Formatting Guidelines
              </button>
              .
            </p>
          </div>
          <button
            onClick={() => setShowDelayBanner(false)}
            className="ml-6 text-yellow-700 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="min-h-screen pt-8 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-all">
        <div className="flex flex-col md:flex-row md:items-start px-4 sm:px-6 pb-12 gap-6">
          <div className="w-full md:w-64 md:flex-none md:shrink-0 self-start md:sticky md:top-6 max-h-[calc(100vh-6rem)] overflow-auto bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 px-5 py-6 border border-gray-200/50 dark:border-gray-700/50 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-5 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 text-transparent bg-clip-text">Services</h2>
              <div className="space-y-3">
                {["AI Resume Builder", "More Tools Coming Soon"].map((item) => (
                  <div
                    key={item}
                    className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 ease-out ${
                      selectedService === item
                        ? "bg-gradient-to-br from-blue-50 via-blue-100 to-purple-50 dark:from-blue-900/40 dark:via-blue-800/30 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 font-semibold shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 ring-1 ring-blue-200/50 dark:ring-blue-700/50 scale-[1.02]"
                        : "hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:shadow-md hover:scale-[1.01] text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => setSelectedService(item)}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {item === "AI Resume Builder" && "🤖"}
                      {item === "More Tools Coming Soon" && "🚀"}
                      {item}
                    </span>
                    {selectedService === item && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-xl"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 border-gray-300/50 dark:border-gray-600/50">
              <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 dark:from-gray-700/40 dark:to-gray-600/30 rounded-xl p-4 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm flex items-center gap-2">
                  🚀 <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">More features coming soon</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 leading-relaxed">
                  Stay tuned for our next big update.
                </p>
                <div className="space-y-2 mt-4">
                  <a
                    href="https://www.instagram.com/jobsyme/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-all duration-200 hover:scale-105 p-2 rounded-lg hover:bg-pink-50/50 dark:hover:bg-pink-900/20"
                  >
                    <img src="/instagram.png" alt="Instagram" className="w-4 h-4 transition-transform hover:scale-110" />
                    <span className="font-medium">Follow us on Instagram</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/jobsyme/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:scale-105 p-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  >
                    <img src="/linkedin.png" alt="LinkedIn" className="w-4 h-4 transition-transform hover:scale-110" />
                    <span className="font-medium">Follow us on LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 dark:border dark:border-blue-500/10">
            {selectedService === "AI Resume Builder" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    AI Resume Builder
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold tracking-wide shadow-sm">
                      Beta
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-medium tracking-wide bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full border border-gray-300 dark:border-white/20">
                      v1.0
                    </span>
                  </h2>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {/* Info Button - Link to AI Resume Builder Page */}
                    <button
                      onClick={() => router.push('/ai-resume-builder')}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800/40 dark:hover:to-purple-800/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-600 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium self-start sm:self-center"
                      title="Learn more about AI Resume Builder features"
                    >
                      <span className="text-base">ℹ️</span>
                      <span>Learn More</span>
                    </button>
                    
                    {/* Settings Button */}
                    <button
                      onClick={() => setShowPreferencesModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium self-start sm:self-center"
                      title="Set your default dashboard view"
                    >
                      <span className="text-base">⚙️</span>
                      <span>Preferences</span>
                    </button>
                  </div>
                </div>
                
                {/* Premium Tab Switcher - Mobile Responsive */}
                <div className="relative flex flex-col sm:flex-row w-full sm:w-fit bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-1.5 mt-6 shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 gap-1 sm:gap-0">
                  <button
                    onClick={() => handleModeChange("enhance")}
                    className={`relative px-4 sm:px-6 py-3 sm:py-3 text-sm sm:text-sm font-semibold rounded-xl transition-all duration-500 ease-out w-full sm:w-auto
                      ${activeMode === "enhance"
                        ? "bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white shadow-2xl shadow-blue-500/30 scale-[1.02] ring-2 ring-blue-400/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg hover:scale-[1.01]"
                      }`}
                  >
                    <span className="relative z-10">Enhance Resume (Contract / Full-Time)</span>
                    {activeMode === "enhance" && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl blur-sm"></div>
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-3/4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-80 shadow-lg shadow-blue-400/50"></span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleModeChange("rewrite")}
                    className={`relative px-4 sm:px-6 py-3 sm:py-3 text-sm sm:text-sm font-semibold rounded-xl transition-all duration-500 ease-out w-full sm:w-auto
                      ${activeMode === "rewrite"
                        ? "bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white shadow-2xl shadow-blue-500/30 scale-[1.02] ring-2 ring-blue-400/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg hover:scale-[1.01]"
                      }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Rewrite Resume (Full-Time Focused)
                      <div className="relative flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        <span className="animate-bounce">🔥</span>
                        <span className="tracking-wide">LIVE</span>
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></div>
                      </div>
                    </span>
                    {activeMode === "rewrite" && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl blur-sm"></div>
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-3/4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-80 shadow-lg shadow-blue-400/50"></span>
                      </>
                    )}
                  </button>
                </div>

                {/* Note under Tabs - Left Aligned */}
                <div className="mt-5 mb-6 text-left">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {activeMode === "enhance" ? (
                      <>
                        We'll use your uploaded resume and intelligently add any{" "}
                        <span className="font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                          missing skills
                        </span>{" "}
                        from the job description. Best for{" "}
                        <span className="font-semibold">contract</span> and full-time roles —{" "}
                        <span className="font-semibold">ATS-ready</span>.
                      </>
                    ) : (
                      <>
                        We'll create a{" "}
                        <span className="font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                          brand new resume
                        </span>{" "}
                        tailored to this job description. Perfect for{" "}
                        <span className="font-semibold">full-time roles</span> with high{" "}
                        <span className="font-semibold">ATS match</span>.
                      </>
                    )}
                  </p>
                </div>



                {selectedService === "AI Resume Builder" && activeMode === "enhance" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-800 dark:text-gray-300 tracking-wide uppercase">
                        Paste Job Description
                      </label>
                      <textarea
                        rows="6"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Paste the job description here..."
                        value={enhanceJobDescription}
                        onChange={(e) => setEnhanceJobDescription(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="space-y-2">
                      <label className="block mb-2 text-sm font-semibold text-gray-800 dark:text-gray-300 tracking-wide uppercase">
                        Upload Your Resume (DOCX)
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4">
                        <label className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow cursor-pointer transition text-sm sm:text-base font-medium w-full sm:w-auto text-center">
                          Choose File
                          <input type="file" accept=".docx" className="hidden" onChange={(e) => setEnhanceResumeFile(e.target.files[0])} />
                        </label>
                        <span className="text-sm text-gray-700 dark:text-gray-400">
                          {enhanceResumeFile ? enhanceResumeFile.name : "No file chosen"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <button
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition text-sm sm:text-base shadow-lg"
                        onClick={handleGenerate}
                        disabled={enhanceLoading}
                      >
                        {enhanceLoading ? "Generating..." : "Generate Resume"}
                      </button>
                      {enhanceLoading && (
                        <p className="text-sm mt-2 text-green-600 dark:text-green-400 italic text-center">
                          {enhanceCurrentStatus}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedService === "AI Resume Builder" && activeMode === "enhance" && (enhanceProfileSummary.length > 0 || enhanceWorkExperience.length > 0) && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-left">
                    {/* NEW summary section above insights */}
                    {renderAddedSkillsSummary()}

                    <h2 className="font-bold text-2xl mb-5">Generated Resume Insights</h2>
                    <ResumeSection title=" Profile Summary " data={enhanceProfileSummary} titleClassName="text-lg font-semibold mb-3" />
                    <ResumeSection title=" Work Experience " data={enhanceWorkExperience} titleClassName="text-lg font-semibold mb-3" />
                    {renderTechnicalSkills()}

                    {enhanceDownloadLink && (
                      <>
                        <p className="text-center mt-4 text-green-600 text-sm font-medium italic">
                          🎉 You're all set — your resume is optimized and ready to go!
                        </p>
                        <a
                          href={enhanceDownloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-2.5 px-4 sm:px-6 text-sm sm:text-base rounded transition w-full sm:w-auto text-center"
                        >
                          Download Updated Resume
                        </a>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {selectedService === "More Tools Coming Soon" && (
                            <div className="flex flex-col items-center text-center py-16 px-8">
                {/* Premium Header with Gradient */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg">
                        <span className="text-2xl animate-bounce">🚀</span>
                      </div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text drop-shadow-sm">
                        More Tools Coming Soon
                      </h2>
                    </div>
                    
                    {/* Premium Description */}
                    <div className="space-y-4 max-w-2xl">
                      <p className="text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                        We're building a comprehensive platform that seamlessly connects
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Candidates</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30 shadow-sm">
                          <div className="w-2 h-2 bg-purple-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Employees</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 rounded-lg border border-pink-100 dark:border-pink-800/30 shadow-sm">
                          <div className="w-2 h-2 bg-pink-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Managers</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-100 dark:border-red-800/30 shadow-sm">
                          <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Recruiters</span>
                        </div>
                      </div>
                      <p className="text-base text-gray-700 dark:text-gray-300 italic mt-6">
                        In one unified, powerful ecosystem.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedService === "AI Resume Builder" && activeMode === "rewrite" && (
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-800 dark:text-gray-300 tracking-wide uppercase">
                    Paste Job Description
                  </label>
                  <textarea
                    rows="6"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Paste the job description here..."
                    value={rewriteJobDescription}
                    onChange={(e) => setRewriteJobDescription(e.target.value)}
                  ></textarea>
                </div>
                <div className="space-y-3">
                                   <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 uppercase">
                    Choose Template
                  </label>
                  <div className="flex flex-col lg:flex-row lg:flex-wrap items-start gap-4">
                    {/* Only show the first 4 main templates: Classic, Modern, Minimal, Professional */}
                    {visibleTemplates.map((template) => (
                      <TemplateCard
                        key={template.name}
                        templateName={template.name}
                        templateComponent={template.component}
                        previewSrc={template.previewSrc}
                        selectedTemplate={selectedTemplate}
                        favoriteTemplates={favoriteTemplates}
                        setSelectedTemplate={setSelectedTemplate}
                        setFavoriteTemplates={setFavoriteTemplates}
                        setModalPreviewSrc={setModalPreviewSrc}
                        setModalPreviewTitle={setModalPreviewTitle}
                        setIsModalPreviewOpen={setIsModalPreviewOpen}
                      />
                    ))}

                  </div> {/* four template buttons/flex row ends */}
                  <div className="mt-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      type="button"
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                      onClick={() => setShowAllTemplatesModal(true)}
                    >
                      See More Templates
                    </button>

                    {selectedTemplateConfig && (
                      <div className="w-full sm:w-auto flex items-center gap-3 rounded-xl border border-blue-200/60 dark:border-blue-500/30 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm">
                        <div className="hidden sm:block">
                          <img
                            src={selectedTemplateConfig.previewSrc}
                            alt={`${selectedTemplateConfig.name} template preview`}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-300">Selected Template</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {selectedTemplateConfig.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                          onClick={() => {
                            setModalPreviewSrc(selectedTemplateConfig.previewSrc);
                            setModalPreviewTitle(`${selectedTemplateConfig.name} Template`);
                            setIsModalPreviewOpen(true);
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                

                <div className="space-y-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-800 dark:text-gray-300 tracking-wide uppercase">
                    Upload Your Existing Resume (DOCX only)
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                    Upload your resume (.docx, up to 10MB). We'll rewrite it into the selected template.{" "}
                    <button 
                      onClick={() => setShowUploadInfoModal(true)}
                      className="cursor-pointer text-blue-500 hover:text-blue-700 transition-colors bg-transparent border-none p-0 inline"
                      type="button"
                      aria-label="More information about resume upload"
                    >
                      ℹ️
                    </button>
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4">
                    <label className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow cursor-pointer transition text-sm sm:text-base font-medium w-full sm:w-auto text-center">
                      Choose File
                      <input type="file" accept=".docx" className="hidden" onChange={(e) => setRewriteResumeFile(e.target.files[0])} />
                    </label>
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                      {rewriteResumeFile ? rewriteResumeFile.name : "No file chosen"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Only .docx files are supported
                  </p>
                </div>

                {/* Work Experience Preference Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300 tracking-wide uppercase">
                    Work Experience Points Preference
                  </label>
                  <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          id="enhance-existing"
                          name="workExperiencePreference"
                          value="enhance-existing"
                          checked={workExperiencePreference === "enhance-existing"}
                          onChange={(e) => setWorkExperiencePreference(e.target.value)}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
                        />
                        <div className="flex-1">
                          <label htmlFor="enhance-existing" className="block text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                            🔧 Enhance existing work experience points
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Keep your current work points and add relevant skills from the job description
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          id="generate-new"
                          name="workExperiencePreference"
                          value="generate-new"
                          checked={workExperiencePreference === "generate-new"}
                          onChange={(e) => setWorkExperiencePreference(e.target.value)}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
                        />
                        <div className="flex-1">
                          <label htmlFor="generate-new" className="block text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                            ✨ Generate completely new points based on job description
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Create fresh, optimized work experience points tailored to the job requirements
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition text-sm sm:text-base shadow-lg"
                    onClick={handleGenerateFullTime}
                    disabled={rewriteLoading}
                  >
                    {rewriteLoading ? "Rewriting Resume..." : "Rewrite Resume"}
                  </button>
                  {rewriteLoading && (
                    <p className="text-sm mt-2 text-purple-600 dark:text-purple-400 italic text-center">
                      {rewriteCurrentStatus}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedService === "AI Resume Builder" && activeMode === "rewrite" && rewriteDownloadLink && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-left">
                <h2 className="font-bold text-2xl mb-5 text-center">
                  🎉 Your brand new resume is ready for download!
                </h2>

                <p className="text-center mt-4 text-purple-600 dark:text-purple-400 text-sm font-medium">
                  📋 Use this resume for the above job description only.
                </p>
                <div className="flex justify-center mt-3">
                  <a
                    href={rewriteDownloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 sm:py-2.5 px-4 sm:px-6 text-sm sm:text-base rounded transition text-center"
                  >
                    Download Rewritten Resume
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Templates Modal */}
      {showAllTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70" role="dialog" aria-modal="true" onClick={() => setShowAllTemplatesModal(false)}>
          <div className="relative w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">Select a Resume Template</h2>
              <button
                aria-label="Close templates modal"
                className="rounded-md px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                onClick={() => setShowAllTemplatesModal(false)}
              >
                Close
              </button>
            </div>
            {/* Templates Grid: Responsive grid for 5 templates, same JSX for each template */}
            <div className="p-2 sm:p-4 md:p-8 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 justify-items-center">
                {/* All templates in modal */}
                {orderedTemplates.map((template) => (
                  <TemplateCard
                    key={template.name}
                    templateName={template.name}
                    templateComponent={template.component}
                    previewSrc={template.previewSrc}
                    selectedTemplate={selectedTemplate}
                    favoriteTemplates={favoriteTemplates}
                    setSelectedTemplate={setSelectedTemplate}
                    setFavoriteTemplates={setFavoriteTemplates}
                    setModalPreviewSrc={setModalPreviewSrc}
                    setModalPreviewTitle={setModalPreviewTitle}
                    setIsModalPreviewOpen={setIsModalPreviewOpen}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {isModalPreviewOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80" role="dialog" aria-modal="true" onClick={() => setIsModalPreviewOpen(false)}>
          <div className="relative w-full max-w-[1200px] mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{modalPreviewTitle}</p>
              <button className="rounded-md px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100" onClick={()=>setIsModalPreviewOpen(false)}>
                Close
              </button>
            </div>
            {/* Scrollable content area so tall resumes scroll inside modal */}
            <div className="p-3 sm:p-6 flex justify-center items-start overflow-auto max-h-[80vh]">
              <div className="w-full max-w-[1100px] bg-white">
                <img
                  src={modalPreviewSrc}
                  alt={modalPreviewTitle}
                  loading="eager"
                  decoding="async"
                  style={{ imageRendering: 'auto' }}
                  className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-800 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
