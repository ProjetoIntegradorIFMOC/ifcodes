import axios from "axios";
import Cookies from "js-cookie";
import type { JamSession, CreateJamSessionDTO, JamParticipant } from "@/types/jam";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3002";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
  };
}

export const JamSessionService = {
  getByTurma: async (turmaId: number): Promise<JamSession[]> => {
    const response = await api.get(`api/jam-sessions?turma_id=${turmaId}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  },

  getById: async (id: number): Promise<JamSession> => {
    const response = await api.get(`api/jam-sessions/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  },

  create: async (data: CreateJamSessionDTO): Promise<JamSession> => {
    const response = await api.post("api/jam-sessions", data, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  },

  start: async (id: number): Promise<JamSession> => {
    const response = await api.post(`api/jam-sessions/${id}/start`, {}, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  },

  finish: async (id: number): Promise<JamSession> => {
    const response = await api.post(`api/jam-sessions/${id}/finish`, {}, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  },

  join: async (id: number): Promise<JamParticipant> => {
    const response = await api.post(`api/jam-sessions/${id}/join`, {}, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  },

  getActiveForTurma: async (turmaId: number): Promise<JamSession | null> => {
    const response = await api.get(`api/turmas/${turmaId}/jam-session/active`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data && response.data.id ? response.data : null;
  },

  connectWebSocket: (_jamId: number): WebSocket => {
    const ws = new WebSocket(WS_URL);
    return ws;
  },

  getAuthToken: (): string => {
    return localStorage.getItem("auth_token") || "";
  },
};

export default JamSessionService;
