"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      if (res.ok) {
        await update({ name: profile.name });
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm.toLowerCase() !== "delete") {
      alert('Please type "DELETE" to confirm.');
      return;
    }
    const res = await fetch("/api/account/profile", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/";
    } else {
      alert("Failed to delete account.");
    }
    setShowDeleteConfirm(false);
    setDeleteConfirm("");
  };

  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider">
        Account Settings
      </h1>

      <form
        onSubmit={handleProfileSubmit}
        className="rounded-xl border border-white/5 bg-card p-6 space-y-4"
      >
        <h2 className="font-display text-sm uppercase tracking-wider text-white/80">
          Profile
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (passwords.newPassword !== passwords.confirm) {
            alert("New passwords do not match.");
            return;
          }
          if (passwords.newPassword.length < 8) {
            alert("New password must be at least 8 characters.");
            return;
          }
          setChangingPassword(true);
          try {
            const res = await fetch("/api/account/change-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentPassword: passwords.current,
                newPassword: passwords.newPassword,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error || "Failed to change password.");
              return;
            }
            alert("Password updated successfully!");
            setPasswords({ current: "", newPassword: "", confirm: "" });
          } catch {
            alert("Failed to change password.");
          } finally {
            setChangingPassword(false);
          }
        }}
        className="rounded-xl border border-white/5 bg-card p-6 space-y-4"
      >
        <h2 className="font-display text-sm uppercase tracking-wider text-white/80">
          Change Password
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/50 mb-1">Current password</label>
            <input
              type="password"
              required
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Confirm new password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={changingPassword}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {changingPassword ? "Changing..." : "Change password"}
        </button>
      </form>

      <div className="rounded-xl border border-white/5 bg-card p-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-destructive/90 mb-2">
          Delete account
        </h2>
        <p className="text-sm text-white/60 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs text-white/50 mb-1">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-destructive"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium text-sm hover:bg-destructive/90 transition-colors"
              >
                Delete account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirm("");
                }}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
