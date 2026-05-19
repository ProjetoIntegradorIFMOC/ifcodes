/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Activity, ActivityStatus, Page } from "../types";
import { fakePageActivities } from "../mocks";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL;

function getHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function getCsrfCookie() {
  await axios.get(`${API_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}

function mapAtividade(atividade: any): Activity {
  return {
    id: atividade.id,
    problemId: atividade.problema_id,
    dueDate: atividade.data_entrega,
    status: (atividade.status as ActivityStatus) || "pending",
    tempoLimite: atividade.tempo_limite ?? null,
    memoriaLimite: atividade.memoria_limite ?? null,
    compilerOptions: atividade.compiler_options ?? null,
    commandLineArguments: atividade.command_line_arguments ?? null,
    redirectStderrToStdout: atividade.redirect_stderr_to_stdout ?? null,
    wallTimeLimit: atividade.wall_time_limit ?? null,
    stackLimit: atividade.stack_limit ?? null,
    maxFileSize: atividade.max_file_size ?? null,
    maxProcessesAndOrThreads: atividade.max_processes_and_or_threads ?? null,
  };
}

/**
 * Simula uma chamada de API para buscar uma atividade pelo id.
 * @param activityId id da atividade
 * @returns Promise<Activity | undefined>
 */
export async function getActivityById(
  activityId: string
): Promise<Activity | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return fakePageActivities.items.find((a) => a.id === Number(activityId));
}

/**
 * Busca todas as atividades do servidor (com status calculado server-side).
 * @returns Promise<Page<Activity>>
 */
export async function getAllActivities(): Promise<Page<Activity>> {
  try {
    const response = await axios.get(`${API_URL}/api/atividades`, {
      headers: getHeaders(),
      withCredentials: true,
    });

    const activities: Array<Activity> = response.data.map(mapAtividade);

    return {
      items: activities,
      page: 1,
      totalPages: 1,
      total: activities.length,
      pageSize: activities.length,
    } as Page<Activity>;
  } catch (error) {
    console.error("Erro ao buscar atividades:", error);
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
    }
  }
  return {
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
    pageSize: 0,
  } as Page<Activity>;
}

export async function getActivitiesByClass(turmaId: number): Promise<Activity[]> {
  try {
    const response = await axios.get(`${API_URL}/api/atividades?turma_id=${turmaId}`, {
      headers: getHeaders(),
      withCredentials: true,
    });

    return response.data.map(mapAtividade);
  } catch (error) {
    console.error("Erro ao carregar atividades da turma:", error);
    return [];
  }
}

export async function createActivity(activityData: {
  problema_id: number;
  data_entrega: string;
  turma_id: number;
  tempo_limite?: number | null;
  memoria_limite?: number | null;
  compiler_options?: string | null;
  command_line_arguments?: string | null;
  redirect_stderr_to_stdout?: boolean | null;
  wall_time_limit?: number | null;
  stack_limit?: number | null;
  max_file_size?: number | null;
  max_processes_and_or_threads?: number | null;
}): Promise<Activity | null> {
  try {
    await getCsrfCookie();

    const response = await axios.post(`${API_URL}/api/atividades`, activityData, {
      headers: getHeaders(),
      withCredentials: true,
    });

    return mapAtividade(response.data);
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    return null;
  }
}

export async function updateActivity(id: number, activityData: {
  problema_id: number;
  data_entrega: string;
  turma_id: number;
  tempo_limite?: number | null;
  memoria_limite?: number | null;
  compiler_options?: string | null;
  command_line_arguments?: string | null;
  redirect_stderr_to_stdout?: boolean | null;
  wall_time_limit?: number | null;
  stack_limit?: number | null;
  max_file_size?: number | null;
  max_processes_and_or_threads?: number | null;
}): Promise<Activity | null> {
  try {
    await getCsrfCookie();

    const response = await axios.put(`${API_URL}/api/atividades/${id}`, activityData, {
      headers: getHeaders(),
      withCredentials: true,
    });

    return mapAtividade(response.data);
  } catch (error) {
    console.error("Erro ao atualizar atividade:", error);
    return null;
  }
}

export async function deleteActivity(id: number): Promise<boolean> {
  try {
    await getCsrfCookie();

    await axios.delete(`${API_URL}/api/atividades/${id}`, {
      headers: getHeaders(),
      withCredentials: true,
    });
    return true;
  } catch (error) {
    console.error("Erro ao deletar atividade:", error);
    return false;
  }
}

export async function getActivitySubmissions(turmaId: number, atividadeId: number): Promise<any[]> {
  try {
    const response = await axios.get(
      `${API_URL}/api/turmas/${turmaId}/atividades/${atividadeId}/submissoes`,
      {
        headers: getHeaders(),
        withCredentials: true,
      }
    );

    return response.data.submissoes || [];
  } catch (error) {
    console.error("Erro ao buscar submissões da atividade:", error);
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
    }
    return [];
  }
}
