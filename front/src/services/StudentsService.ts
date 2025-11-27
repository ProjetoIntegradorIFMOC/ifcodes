import type { Student } from "@/types";
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
  if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  throw error;
}

/**
 * Busca todos os alunos cadastrados
 * @returns Promise<Student[]>
 */
export async function getAllStudents(): Promise<Student[]> {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/alunos`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    // A API retorna dados paginados com a estrutura: { data: [...] }
    // Como AlunoResource::collection($alunos) é usado, os dados estão em response.data.data
    console.log('Response from API:', response.data);
    
    // Verifica se é uma resposta paginada
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Fallback para resposta não paginada
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    handleAuthError(error);
    return [];
  }
}

/**
 * Busca um aluno específico pelo ID
 * @param id - ID do aluno
 * @returns Promise<Student | undefined>
 */
export async function getStudentById(id: number): Promise<Student | undefined> {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/alunos/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    // A API retorna o aluno dentro de response.data.data
    return response.data.data;
  } catch (error) {
    handleAuthError(error);
    return undefined;
  }
}

/**
 * Cria um novo aluno
 * @param student - Dados do aluno (sem ID)
 * @returns Promise<Student>
 */
export async function createStudent(student: Omit<Student, "id">): Promise<Student> {
  try {
    // Obter CSRF token antes de criar
    await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/alunos`,
      student,
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
 * Atualiza um aluno existente
 * @param id - ID do aluno
 * @param student - Dados parciais do aluno para atualizar
 * @returns Promise<Student>
 */
export async function updateStudent(id: number, student: Partial<Student>): Promise<Student> {
  try {
    // Obter CSRF token antes de atualizar
    await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/alunos/${id}`,
      student,
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
 * Remove um aluno
 * @param id - ID do aluno a ser removido
 * @returns Promise<void>
 */
export async function deleteStudent(id: number): Promise<void> {
  try {
    // Obter CSRF token antes de deletar
    await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    await axios.delete(`${import.meta.env.VITE_API_URL}/api/alunos/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
  } catch (error) {
    handleAuthError(error);
  }
}
