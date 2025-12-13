import axios from "axios";
import Cookies from "js-cookie";

export type Curso = {
  id: number;
  nome: string;
};

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
  if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  throw error;
}

/**
 * Busca todos os cursos cadastrados
 * @returns Promise<Curso[]>
 */
export async function getAllCourses(): Promise<Curso[]> {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/cursos`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error) {
    handleAuthError(error);
    return [];
  }
}
