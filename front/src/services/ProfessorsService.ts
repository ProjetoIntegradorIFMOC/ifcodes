import type { Professor } from "@/types";
import axios from "axios";
import Cookies from "js-cookie";

// Função auxiliar para obter headers autenticados
function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
  };
}

// Função auxiliar para tratamento de erros de autenticação
function handleAuthError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  throw error;
}

/**
 * Busca todos os professores cadastrados
 * @returns Promise<Professor[]>
 */
export async function getAllProfessors(): Promise<Professor[]> {
  try {
    const response = await axios.get(`/api/professores`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    // A API retorna os dados dentro de response.data.data (formato paginado do Laravel)
    const data = response.data.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    handleAuthError(error);
    return [];
  }
}

/**
 * Busca um professor específico pelo ID
 * @param id - ID do professor
 * @returns Promise<Professor | undefined>
 */
export async function getProfessorById(id: number): Promise<Professor | undefined> {
  try {
    const response = await axios.get(`/api/professores/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    // A API retorna o professor dentro de response.data.data
    return response.data.data;
  } catch (error) {
    handleAuthError(error);
    return undefined;
  }
}

/**
 * Cria um novo professor
 * @param professor - Dados do professor (sem ID)
 * @returns Promise<Professor>
 */
export async function createProfessor(professor: Omit<Professor, "id">): Promise<Professor> {
  try {
    // Obter CSRF token antes de criar
    await axios.get(`/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    const response = await axios.post(
      `/api/professores`,
      professor,
      {
        headers: getAuthHeaders(),
        withCredentials: true,
      }
    );
    return response.data.data || response.data;
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

/**
 * Atualiza um professor existente
 * @param id - ID do professor
 * @param professor - Dados parciais do professor para atualizar
 * @returns Promise<Professor>
 */
export async function updateProfessor(id: number, professor: Partial<Professor>): Promise<Professor> {
  try {
    // Obter CSRF token antes de atualizar
    await axios.get(`/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    const response = await axios.put(
      `/api/professores/${id}`,
      professor,
      {
        headers: getAuthHeaders(),
        withCredentials: true,
      }
    );
    return response.data.data || response.data;
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

/**
 * Remove um professor
 * @param id - ID do professor a ser removido
 * @returns Promise<void>
 */
export async function deleteProfessor(id: number): Promise<void> {
  try {
    // Obter CSRF token antes de deletar
    await axios.get(`/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    await axios.delete(`/api/professores/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}
