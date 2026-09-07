"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";
import { isCustomAvatarUrl } from "@/lib/profile-avatar-shared";

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim() || "?";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfilePhotoForm({
  initialImage,
  name,
  email,
}: {
  initialImage: string | null;
  name: string;
  email: string;
}) {
  const { update } = useSession();
  const { showFeedback } = useSettingsFeedback();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(initialImage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = getInitials(name, email);
  const hasCustomAvatar = isCustomAvatarUrl(image);

  const syncSessionImage = useCallback(
    async (nextImage: string | null) => {
      await update({ image: nextImage });
    },
    [update],
  );

  async function onFileSelected(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { error?: string; image?: string };
      if (!res.ok) {
        setError(data.error || "Could not upload photo.");
        return;
      }
      const nextImage = data.image ?? null;
      setImage(nextImage);
      await syncSessionImage(nextImage);
      showFeedback("Profile photo updated.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not remove photo.");
        return;
      }
      setImage(null);
      await syncSessionImage(null);
      showFeedback("Profile photo removed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-profile__photo">
      <div className="settings-profile__avatar" aria-hidden={busy}>
        {image ? (
          <img
            src={image}
            alt=""
            width={96}
            height={96}
            className="settings-profile__avatar-img"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="settings-profile__avatar-initials">{initials}</span>
        )}
      </div>

      <div className="settings-profile__photo-copy">
        <div className="settings-profile__photo-actions">
          <label className="settings-btn settings-btn--secondary settings-profile__upload-btn">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="settings-profile__file-input"
              disabled={busy}
              onChange={(e) => void onFileSelected(e.target.files?.[0] ?? null)}
            />
            {busy ? "Uploading…" : hasCustomAvatar ? "Change photo" : "Upload photo"}
          </label>
          {hasCustomAvatar ? (
            <button
              type="button"
              className="settings-btn settings-btn--ghost settings-profile__remove-btn"
              disabled={busy}
              onClick={() => void onRemove()}
            >
              Remove
            </button>
          ) : null}
        </div>

        <p className="settings-profile__photo-hint">
          JPG, PNG, or WebP · 2 MB max · Square images work best
        </p>
        {error ? <p className="auth-form__error">{error}</p> : null}
      </div>
    </div>
  );
}
