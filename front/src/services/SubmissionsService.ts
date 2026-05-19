/* eslint-disable @typescript-eslint/no-explicit-any */
import { fakeSubmissionReports } from "../mocks";
import type { SubmissionReport, TestCaseResult, Submission, SubmissionStatus, Language } from "../types";

/**
 * Simula uma chamada de API para buscar o relatório de submissão pelo submissionId.
 * @param submissionId id da submissão
 * @returns Promise<SubmissionReport | undefined>
 */
export async function getSubmissionReportBySubmissionId(
  submissionId: string
): Promise<SubmissionReport | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return fakeSubmissionReports.find((r) => r.submissionId === Number(submissionId));
}
/**
 * Simula uma chamada de API para buscar uma submissão pelo id.
 * @param submissionId id da submissão
 * @returns Promise<Submission | undefined>
 */
export async function getSubmissionById(
  submissionId: string
): Promise<Submission | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return fakeSubmissions.find((s) => s.id === Number(submissionId));
}
import { fakeSubmissions } from "../mocks";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

/**
 * Mapeia language_id do Judge0 para slug usado no frontend
 */
const JUDGE0_LANG_MAP: Record<number, Language> = {
  50: "c",
  54: "cpp",
  62: "java",
  71: "python",
};

function mapLanguage(linguagem: number | string): Language {
  if (typeof linguagem === "number") {
    return JUDGE0_LANG_MAP[linguagem] ?? "c";
  }
  return (linguagem as Language) || "c";
}

/**
 * Simula uma chamada de API para buscar todas as submissões.
 * @returns Promise<Submission[]>
 */
export async function getAllSubmissions(): Promise<Submission[]> {
  try {
    const response = await axios.get(`${API_URL}/api/submissoes`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    });

    return response.data.map((submissao: any) => {
      const mappedStatus = submissao.status ? mapBackendStatusToFrontend(submissao.status) : "pending";
      
      return {
        id: submissao.id,
        activityId: submissao.atividade_id,
        dateSubmitted: submissao.data_submissao,
        language: mapLanguage(submissao.linguagem),
        status: mappedStatus,
        problemTitle: submissao.problema_titulo || null,
      };
    });
  } catch (error) {
    console.log("erro", error);
  }

  return [];
}

/**
 * Mapeia os status do backend (português) para os status esperados pelo frontend
 */
function mapBackendStatusToFrontend(backendStatus: string): string {
  const statusMap: Record<string, string> = {
    'Aceita': 'passed',
    'Na Fila': 'pending',
    'Em Processamento': 'processing',
    'Resposta Errada': 'failed',
    'Tempo Limite Excedido': 'timeout',
    'Erro de Compilação': 'compile-error',
    'Erro de Execução (SIGSEGV)': 'runtime-error',
    'Erro de Execução (SIGXFSZ)': 'runtime-error',
    'Erro de Execução (SIGFPE)': 'runtime-error',
    'Erro de Execução (SIGABRT)': 'runtime-error',
    'Erro de Execução (NZEC)': 'runtime-error',
    'Erro de Execução': 'runtime-error',
    'Erro Interno': 'internal-error',
    'Erro no Formato de Execução': 'runtime-error',
  };
  
  return statusMap[backendStatus] || 'unknown';
}

export async function getResultBySubmissionId(
  submissionId: number
): Promise<TestCaseResult[]> {
  try {
    const response = await axios.get(
      `${API_URL}/api/correcao/busca-por-submissao/${submissionId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: true,
      }
    );
    
    return response.data.map((item: any) => ({
      id: item.id,
      testCaseId: item.caso_teste_id,
      status: mapBackendStatusToFrontend(item.status),
      submissionId: item.submissao_id,
      stdout: item.stdout || null,
      stderr: item.stderr || null,
      compileOutput: item.compile_output || null,
      message: item.message || null,
    }));
  } catch (error) {
    console.log("erro ao buscar resultados", error);
  }
  return [];
}

export async function postSubmission({
  code,
  activityId,
}: {
  code: string;
  activityId: number;
}): Promise<Submission | undefined> {
  try {
    await axios.get(`${API_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });

    const response = await axios.post(`${API_URL}/api/submissoes`, {
      codigo: code,
      atividade_id: activityId,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN"),
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.log("erro", error);
    throw error;
  }
  return undefined;
}

/**
 * Simula uma chamada de API para buscar submissões por activityId.
 * @param activityId id da atividade
 * @returns Promise<Submission[]>
 */
export async function getSubmissionsByActivityId(
  activityId: string
): Promise<Submission[]> {
  try {
    const response = await axios.get(
      `${API_URL}/api/submissoes/atividades/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: true,
      }
    );

    const submissions = response.data?.submissoes || [];

    const mapped = submissions.map((submissao: any) => ({
      id: submissao.id,
      activityId: submissao.atividade_id,
      dateSubmitted: submissao.data_submissao,
      language: mapLanguage(submissao.linguagem),
      status: submissao.status ? mapBackendStatusToFrontend(submissao.status) : "pending",
    }));

    return mapped;
  } catch (error) {
    console.log("erro ao buscar submissões por atividade", error);
  }

  return [];
}

/**
 * Busca uma submissão específica com seu código
 * @param submissionId id da submissão
 * @returns Promise com a submissão incluindo o código
 */
export async function getSubmissionWithCode(
  submissionId: number
): Promise<{ code: string; submission: Submission } | null> {
  try {
    const response = await axios.get(
      `${API_URL}/api/submissoes/${submissionId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: true,
      }
    );

    const data = response.data;
    
    return {
      code: data.codigo || "",
      submission: {
        id: data.id,
        activityId: data.atividade_id,
        dateSubmitted: data.data_submissao,
        language: mapLanguage(data.linguagem),
        status: (data.status ? mapBackendStatusToFrontend(data.status) : "pending") as SubmissionStatus,
        problemTitle: data.problema_titulo || null,
      }
    };
  } catch (error) {
    console.log("erro ao buscar submissão com código", error);
    return null;
  }
}
