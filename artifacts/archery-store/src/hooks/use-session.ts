import { create } from "zustand";

interface SessionState {
  sessionId: string;
  setSessionId: (id: string) => void;
}

// Simple store to hold a guest session ID for cart operations
export const useSessionStore = create<SessionState>((set) => {
  // Try to load from localStorage, otherwise generate one
  let initialId = "";
  if (typeof window !== "undefined") {
    initialId = localStorage.getItem("archery_session_id") || "";
    if (!initialId) {
      initialId = crypto.randomUUID();
      localStorage.setItem("archery_session_id", initialId);
    }
  }

  return {
    sessionId: initialId,
    setSessionId: (id) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("archery_session_id", id);
      }
      set({ sessionId: id });
    },
  };
});
