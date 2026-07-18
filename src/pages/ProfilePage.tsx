import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, formatDate } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ProgressionList } from "../components/ProgressionList";
import type { Profile } from "../types";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile =
    user?.username.toLowerCase() === username?.toLowerCase();

  const load = useCallback(() => {
    if (!username) return;
    api.profile(username).then(({ ok, data }) => {
      if (ok) setProfile(data);
      else setNotFound(true);
    });
  }, [username]);

  useEffect(load, [load]);

  const toggleFavorite = (id: number, favorite: boolean) => {
    // optimistic update; favorites are derived from progressions
    setProfile((prev) => {
      if (!prev) return prev;
      const progressions = prev.progressions.map((p) =>
        p.id === id ? { ...p, is_favorite: favorite } : p
      );
      return {
        ...prev,
        progressions,
        favorites: progressions.filter((p) => p.is_favorite),
      };
    });
    api.favorite(id, favorite).then(({ ok }) => {
      if (!ok) load(); // revert on failure
    });
  };

  if (notFound) {
    return (
      <main className="info">
        <p className="loading">researcher not found</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="info">
        <p className="loading">loading...</p>
      </main>
    );
  }

  return (
    <main className="info">
      <div className="profile-header">
        <div className="profile-name">@{profile.user.username}</div>
        <div className="stats-sub">
          researching since {formatDate(profile.user.created_at)} &middot;{" "}
          {profile.total}{" "}
          {profile.total === 1 ? "progression" : "progressions"} discovered
        </div>
      </div>

      {isOwnProfile && profile.favorites.length > 0 && (
        <section className="stats-section">
          <div className="stats-label">favorite discoveries</div>
          <ProgressionList
            progressions={profile.favorites}
            canFavorite
            onToggleFavorite={toggleFavorite}
          />
        </section>
      )}

      <section className="stats-section">
        <div className="stats-label">
          {isOwnProfile ? "your discoveries" : "discoveries"}
        </div>
        <ProgressionList
          progressions={profile.progressions}
          canFavorite={isOwnProfile}
          onToggleFavorite={toggleFavorite}
          emptyMessage={
            isOwnProfile
              ? "you haven't researched any progressions yet"
              : "no discoveries yet"
          }
        />
      </section>
    </main>
  );
}
