"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Lock, 
  Eye, 
  Bell, 
  Shield, 
  Video, 
  HelpCircle, 
  Info, 
  LogOut, 
  Camera, 
  Mic, 
  Globe, 
  Type, 
  Moon, 
  Sun,
  ChevronRight,
  UserCircle,
  Mail,
  Phone,
  Monitor,
  Key,
  Database,
  Trash2,
  Settings as SettingsIcon,
  Check,
  Loader2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import LocationSelect from "@/components/ui/LocationSelect";
import { cn } from "@/lib/utils";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "preferences", label: "Preferences", icon: SettingsIcon },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "interview", label: "Interview", icon: Video },
  { id: "help", label: "Help & Support", icon: HelpCircle },
  { id: "about", label: "About", icon: Info },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("profile");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email || "");
        
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.fullName || user.displayName || "");
            setUserPhone(data.phone || "");
            setLocation(data.location || "San Francisco, CA, United States");
            if (data.photoURL) {
              setProfilePhoto(data.photoURL);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userId) {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const base64String = event.target?.result as string;
          
          // Upload to Firebase Storage
          const storageRef = ref(storage, `profiles/${userId}`);
          await uploadString(storageRef, base64String, 'data_url');
          
          // Get the download URL
          const downloadURL = await getDownloadURL(storageRef);
          
          // Update Firestore
          await updateDoc(doc(db, "users", userId), {
            photoURL: downloadURL
          });
          
          setProfilePhoto(downloadURL);
          setSaveStatus("Photo Updated!");
          setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
          console.error("Error uploading photo:", error);
          setSaveStatus("Failed to upload photo");
          setTimeout(() => setSaveStatus(null), 2000);
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaveStatus("Saving...");
    try {
      await updateDoc(doc(db, "users", userId), {
        fullName: userName,
        phone: userPhone,
        location: location,
      });
      setSaveStatus("Saved Successfully");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("Failed to save");
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors duration-300",
        active ? "bg-blue-600" : "bg-white/10"
      )}
    >
      <div className={cn(
        "absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300",
        active ? "left-6" : "left-1"
      )} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />

      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
              <p className="text-slate-400 mt-1">Manage your account preferences and application settings.</p>
            </div>
            {saveStatus && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-500 border border-emerald-500/20"
              >
                <Check size={16} />
                {saveStatus}
              </motion.div>
            )}
          </header>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Settings Navigation */}
            <aside className="w-full lg:w-64 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold transition-all duration-300",
                    activeSection === section.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <section.icon size={20} />
                  {section.label}
                  {activeSection === section.id && (
                    <motion.div layoutId="active-pill" className="ml-auto">
                      <ChevronRight size={16} />
                    </motion.div>
                  )}
                </button>
              ))}
              
              <div className="pt-8 mt-8 border-t border-white/5">
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all duration-300"
                >
                  <LogOut size={20} />
                  Logout Account
                </button>
              </div>
            </aside>

            {/* Settings Content */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="glass rounded-[40px] p-8 lg:p-10 border border-white/5"
                >
                  {activeSection === "profile" && (
                    <div className="space-y-10">
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative group">
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handlePhotoUpload}
                          />
                          <div className="h-28 w-28 rounded-[36px] bg-gradient-to-tr from-blue-600 to-indigo-500 p-1">
                            <div className="h-full w-full rounded-[34px] bg-[#020617] flex items-center justify-center overflow-hidden relative">
                              {isUploadingPhoto ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/80 z-10 backdrop-blur-sm">
                                  <Loader2 className="animate-spin text-white" size={24} />
                                </div>
                              ) : null}
                              {profilePhoto ? (
                                <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                              ) : (
                                <UserCircle size={80} className="text-slate-700" />
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                            className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 transition-transform disabled:opacity-50"
                          >
                            <Camera size={18} />
                          </button>
                        </div>
                        <div className="text-center sm:text-left">
                          <h2 className="text-2xl font-black">{userName || "User"}</h2>
                          <p className="text-slate-500 text-sm">Professional AI Analysis Profile</p>
                          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                            <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-500 uppercase tracking-widest">Premium Plan</span>
                            <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Verified</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                          <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5">
                            <User size={18} className="text-slate-500" />
                            <input 
                              className="bg-transparent text-sm font-medium focus:outline-none w-full" 
                              value={userName} 
                              onChange={(e) => setUserName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                          <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 opacity-50 cursor-not-allowed">
                            <Mail size={18} className="text-slate-500" />
                            <input 
                              className="bg-transparent text-sm font-medium focus:outline-none w-full" 
                              value={userEmail} 
                              disabled 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                          <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5">
                            <Phone size={18} className="text-slate-500" />
                            <input 
                              className="bg-transparent text-sm font-medium focus:outline-none w-full" 
                              value={userPhone} 
                              onChange={(e) => setUserPhone(e.target.value)}
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Location</label>
                          <LocationSelect value={location} onChange={setLocation} />
                        </div>
                      </div>

                      <button 
                        onClick={handleSave}
                        className="w-full rounded-2xl bg-white py-4 font-bold text-black transition-all hover:scale-[1.01] active:scale-95"
                      >
                        Update Profile Information
                      </button>
                    </div>
                  )}

                  {activeSection === "account" && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-bold">Login & Security</h3>
                      
                      <div className="space-y-4">
                        {[
                          { label: "Change Password", desc: "Update your account password", icon: Key },
                          { label: "Two-Factor Auth", desc: "Add extra security to your account", icon: Shield },
                          { label: "Session Manager", desc: "Manage your active logins", icon: Monitor },
                        ].map((item, i) => (
                          <div key={i} className="group flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-400">
                                <item.icon size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-white">{item.label}</h4>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                              </div>
                            </div>
                            <ChevronRight size={20} className="text-slate-600 group-hover:text-white" />
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <button className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-2">
                          <Shield size={16} />
                          Download Security Audit Report
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSection === "preferences" && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-bold">App Preferences</h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                              <Moon size={20} />
                            </div>
                            <div>
                              <p className="font-bold">Dark Mode</p>
                              <p className="text-xs text-slate-500">Enable high-contrast night theme</p>
                            </div>
                          </div>
                          <Toggle active={isDarkMode} onClick={() => setIsDarkMode(!isDarkMode)} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Language</label>
                            <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5">
                              <Globe size={18} className="text-slate-500" />
                              <select className="bg-transparent text-sm font-medium focus:outline-none w-full">
                                <option className="bg-[#020617]">English (US)</option>
                                <option className="bg-[#020617]">German (DE)</option>
                                <option className="bg-[#020617]">Spanish (ES)</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Font Size</label>
                            <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5">
                              <Type size={18} className="text-slate-500" />
                              <select className="bg-transparent text-sm font-medium focus:outline-none w-full">
                                <option className="bg-[#020617]">Small</option>
                                <option className="bg-[#020617]">Standard</option>
                                <option className="bg-[#020617]">Large</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "notifications" && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-bold">Manage Notifications</h3>
                      <div className="space-y-4">
                        {[
                          { id: "int", label: "Interview Reminders", desc: "Alerts for upcoming practice assessments" },
                          { id: "prac", label: "Practice Reminders", desc: "Daily nudges for AI coaching sessions" },
                          { id: "prog", label: "Progress Reports", desc: "Weekly summaries of your improvements" },
                          { id: "ai", label: "AI Tips", desc: "Real-time behavioral improvement advice" },
                        ].map((notif) => (
                          <div key={notif.id} className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5">
                            <div>
                              <p className="font-bold">{notif.label}</p>
                              <p className="text-xs text-slate-500">{notif.desc}</p>
                            </div>
                            <Toggle active={true} onClick={() => {}} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "privacy" && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Privacy & Permissions</h3>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-lg">High Security</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                          <Camera className="mb-4 text-blue-500" size={32} />
                          <div className="flex items-center justify-between">
                            <p className="font-bold">Camera Access</p>
                            <Toggle active={true} onClick={() => {}} />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Needed for facial emotion analysis during interviews.</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                          <Mic className="mb-4 text-purple-500" size={32} />
                          <div className="flex items-center justify-between">
                            <p className="font-bold">Microphone</p>
                            <Toggle active={true} onClick={() => {}} />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Used for voice tone and speech clarity analytics.</p>
                        </div>
                      </div>

                      <div className="pt-10 border-t border-white/5">
                        <h4 className="font-bold text-red-500 mb-4 flex items-center gap-2">
                          <Trash2 size={18} />
                          Danger Zone
                        </h4>
                        <button className="w-full text-left rounded-2xl bg-red-500/10 border border-red-500/20 p-6 group hover:bg-red-500 transition-all duration-500">
                          <p className="font-bold text-red-500 group-hover:text-white transition-colors">Delete Account Permanently</p>
                          <p className="text-xs text-red-500/60 group-hover:text-white/80 mt-1 transition-colors">This action is irreversible. All history and data will be lost.</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSection === "interview" && (
                    <div className="space-y-10">
                      <h3 className="text-xl font-bold">Interview Preferences</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Interview Focus</label>
                          <div className="space-y-2">
                            {["Technical", "Behavioral", "HR Round", "Case Study"].map((t) => (
                              <button key={t} className={cn(
                                "w-full text-left rounded-2xl p-4 text-sm font-bold transition-all border",
                                t === "Technical" ? "bg-blue-600 border-blue-600" : "bg-white/5 border-white/5 hover:border-white/10"
                              )}>
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Difficulty</label>
                            <div className="flex gap-2">
                              {["Easy", "Med", "Hard"].map((d) => (
                                <button key={d} className={cn(
                                  "flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all",
                                  d === "Med" ? "bg-blue-600" : "bg-white/5 hover:bg-white/10"
                                )}>
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Goal</label>
                            <input 
                              type="range" 
                              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-600"
                              defaultValue={45} 
                            />
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>15 MINS</span>
                              <span className="text-white">45 MINS</span>
                              <span>2 HOURS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "help" && (
                    <div className="space-y-8">
                      <h3 className="text-xl font-bold">Help & Support</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          "Common Question: How does AI analyze my voice?",
                          "User Guide: Getting started with CalmHire",
                          "Contact technical support",
                          "Report a visual bug"
                        ].map((q, i) => (
                          <button key={i} className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left">
                            <span className="text-sm font-bold text-slate-300">{q}</span>
                            <ChevronRight size={18} className="text-slate-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "about" && (
                    <div className="space-y-12 text-center py-10">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/20">
                          <SettingsIcon size={40} />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black">CalmHire AI</h3>
                          <p className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Enterprise Behavioral Tech</p>
                        </div>
                      </div>

                      <div className="max-w-md mx-auto space-y-6">
                        <div className="flex justify-between text-sm py-4 border-b border-white/5">
                          <span className="text-slate-500 font-bold">Version</span>
                          <span className="font-black">v4.8.2-stable</span>
                        </div>
                        <div className="flex justify-between text-sm py-4 border-b border-white/5">
                          <span className="text-slate-500 font-bold">Last Updated</span>
                          <span className="font-black">May 12, 2026</span>
                        </div>
                        <div className="flex justify-between text-sm py-4 border-b border-white/5">
                          <span className="text-slate-500 font-bold">Terms of Service</span>
                          <button className="text-blue-500 font-black hover:underline">View</button>
                        </div>
                        <div className="flex justify-between text-sm py-4 border-b border-white/5">
                          <span className="text-slate-500 font-bold">Privacy Policy</span>
                          <button className="text-blue-500 font-black hover:underline">View</button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                        © 2026 CalmHire Analysis Systems Inc.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-sm w-full rounded-[40px] p-10 border border-white/10 text-center shadow-2xl"
            >
              <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500">
                <LogOut size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2">Sign Out?</h3>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed">
                Are you sure you want to end your session? Your progress is already synced.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogout}
                  className="w-full rounded-2xl bg-red-500 py-4 font-bold text-white shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Yes, Log Me Out
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full rounded-2xl bg-white/5 py-4 font-bold text-slate-400 hover:bg-white/10 transition-all"
                >
                  Stay Signed In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
