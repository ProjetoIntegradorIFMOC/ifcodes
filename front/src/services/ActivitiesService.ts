/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Activity, Page } from "../types";
import { fakePageActivities } from "../mocks";
import axios from "axios";

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
 * Simula uma chamada de API para buscar todas as atividades (paginadas).
 * @returns Promise<Page<Activity>>
 */
export async function getAllActivities(): Promise<Page<Activity>> {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/atividades`, {
    headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });


    const activities: Array<Activity> = [];

    response.data.forEach((atividade: any) => {
      activities.push({
        id: atividade.id,
        problemId: atividade.problema_id,
        dueDate: atividade.data_entrega,
        status: "pending",
      });
    });

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
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/atividades?turma_id=${turmaId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const activities: Array<Activity> = [];

    response.data.forEach((atividade: any) => {
      activities.push({
        id: atividade.id,
        problemId: atividade.problema_id,
        dueDate: atividade.data_entrega,
        status: "pending",
      });
    });

    return activities;
  } catch (error) {
    console.error("Erro ao carregar atividades da turma:", error);
    return [];
  }
}

export async function createActivity(activityData: {
  problema_id: number;
  data_entrega: string;
  turma_id: number;
}): Promise<Activity | null> {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/atividades`, activityData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const atividade = response.data;
    return {
      id: atividade.id,
      problemId: atividade.problema_id,
      dueDate: atividade.data_entrega,
      status: "pending",
    };
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    return null;
  }
}

export async function updateActivity(id: number, activityData: {
  problema_id: number;
  data_entrega: string;
  turma_id: number;
}): Promise<Activity | null> {
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/atividades/${id}`, activityData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const atividade = response.data;
    return {
      id: atividade.id,
      problemId: atividade.problema_id,
      dueDate: atividade.data_entrega,
      status: "pending",
    };
  } catch (error) {
    console.error("Erro ao atualizar atividade:", error);
    return null;
  }
}

export async function deleteActivity(id: number): Promise<boolean> {
  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/atividades/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return true;
  } catch (error) {
    console.error("Erro ao deletar atividade:", error);
    return false;
  }
}
