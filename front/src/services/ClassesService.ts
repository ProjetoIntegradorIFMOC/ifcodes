import axios from "axios";
import Cookies from "js-cookie";
import type {
  Class,
  CreateClassDTO,
  UpdateClassDTO,
  ClassStudent,
  AddStudentToClassDTO,
} from "@/types/classes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

// Interceptor para adicionar token se necessário
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ClassesService = {
  // Listar todas as turmas
  getAllClasses: async (): Promise<Class[]> => {
    const response = await api.get("api/turmas", {
      headers:getAuthHeaders(),
      withCredentials:true
    });
    return response.data.data || response.data;
  },

  // Buscar turma por ID
  getClassById: async (id: number): Promise<Class> => {
    const response = await api.get(`api/turmas/${id}`, {
      headers:getAuthHeaders(),
      withCredentials:true
    });
    return response.data.data || response.data;
  },

  // Criar nova turma
  createClass: async (data: CreateClassDTO): Promise<Class> => {
    const response = await api.post("api/turmas", data, {
      headers:getAuthHeaders(),
      withCredentials:true
    });
    return response.data.data || response.data;
  },

  // Atualizar turma
  updateClass: async (id: number, data: UpdateClassDTO): Promise<Class> => {
    const response = await api.put(`api/turmas/${id}`, data, {
      headers:getAuthHeaders(),
      withCredentials:true
    });
    return response.data.data || response.data;
  },

  // Deletar turma
  deleteClass: async (id: number): Promise<void> => {
    await api.delete(`api/turmas/${id}`, {
      headers:getAuthHeaders(),
      withCredentials:true
    });
  },

  // Buscar turmas de um professor
  getClassesByTeacher: async (): Promise<Class[]> => {
    const response = await api.get(`api/turmas`, {
      headers:getAuthHeaders(),
      withCredentials:true
    });
    return response.data.data || response.data;
  },

  // Buscar turmas de um aluno
  getClassesByStudent: async (): Promise<Class[]> => {
    const response = await api.get(`api/turmas`, {
      headers:getAuthHeaders(),
      withCredentials:true
    });
    return response.data.data || response.data;
  },

  // Buscar alunos de uma turma
  getClassStudents: async (id: number): Promise<ClassStudent[]> => {
    try {
      const response = await api.get(`api/turmas/${id}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      
      const classData = response.data.data || response.data;
      const alunos = classData.alunos || [];
      
      // Mapear os dados da API para o formato esperado pelo componente
      return alunos.map((aluno: any) => ({
        id: aluno.id,
        classId: classData.id,
        studentId: aluno.id,
        studentName: aluno.name,
        studentEmail: aluno.email,
        enrolledAt: aluno.created_at || new Date().toISOString()
      }));
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  },
};

export default ClassesService;
