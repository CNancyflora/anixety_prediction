"use client";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loadProfile, saveProfile } from "@/lib/storage";
import type { UserProfile } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const p = await loadProfile(u.uid);
        setProfile(p);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <AppLayout><div className="page-wrap"><div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><div className="spinner spinner-lg" /></div></div></AppLayout>;

  if (!profile) return <AppLayout><div className="page-wrap">Error loading profile.</div></AppLayout>;

  const set = (k: keyof UserProfile, v: string) => setProfile(p => ({ ...p!, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: "", type: "" });
    try {
      await saveProfile(profile.uid, profile);
      setMsg({ text: "Profile updated successfully.", type: "success" });
    } catch {
      setMsg({ text: "Failed to save profile.", type: "error" });
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account and interview goals.</p>
        </div>

        {msg.text && (
          <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-danger"}`} style={{ marginBottom: 20 }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profile.fullName || ""} onChange={e => set("fullName", e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email (Read-only)</label>
              <input className="form-input" value={profile.email || ""} disabled style={{ background: "var(--bg)", color: "var(--text-2)" }} />
            </div>

            <div className="divider" />
            <div className="label-cap" style={{ marginBottom: 16 }}>Education & Career</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Education</label>
                <select className="form-select" value={profile.education || ""} onChange={e => set("education", e.target.value)} required>
                  <option value="">Select...</option>
                  <option>High School</option>
                  <option>Diploma</option>
                  <option>Bachelor's Degree</option>
                  <option>Master's Degree</option>
                  <option>PhD</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">College / University</label>
                <input className="form-input" value={profile.college || ""} onChange={e => set("college", e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Job Role</label>
                <input className="form-input" value={profile.targetRole || ""} onChange={e => set("targetRole", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-select" value={profile.experienceLevel || "fresher"} onChange={e => set("experienceLevel", e.target.value)} required>
                  <option value="fresher">Fresher (0 years)</option>
                  <option value="junior">Junior (1–2 years)</option>
                  <option value="mid">Mid-level (3–5 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Interview Goal</label>
              <textarea className="form-textarea" value={profile.interviewGoal || ""} onChange={e => set("interviewGoal", e.target.value)} rows={2} />
            </div>
          </div>
          <div className="card-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
