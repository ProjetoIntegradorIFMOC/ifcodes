import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { getActivityById } from "@/services/ActivitiesService";
import { getProblemById } from "@/services/ProblemsServices";
import {
  getResultBySubmissionId,
  getSubmissionById,
  getSubmissionReportBySubmissionId,
} from "@/services/SubmissionsService";
import type {
  Activity,
  Submission,
  SubmissionReport,
  TestCaseResult,
  Problem,
} from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  User,
  Target,
  Activity as ActivityIcon,
  TestTube,
  Eye,
  EyeOff,
  Copy,
  Loader2,
  TrendingUp,
  Hash,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import Loading from "@/components/Loading";

// Configurações de status de testes e submissões
const statusConfig = {
  passed: {
    label: "Aceito",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dotColor: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  processing: {
    label: "Processando",
    icon: Loader2,
    className: "bg-blue-100 text-blue-800 border-blue-200",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  failed: {
    label: "Resposta Errada",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  "compile-error": {
    label: "Erro de Compilação",
    icon: AlertCircle,
    className: "bg-orange-100 text-orange-800 border-orange-200",
    dotColor: "bg-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  timeout: {
    label: "Tempo Limite",
    icon: Clock,
    className: "bg-purple-100 text-purple-800 border-purple-200",
    dotColor: "bg-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  "runtime-error": {
    label: "Erro de Execução",
    icon: AlertCircle,
    className: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  "internal-error": {
    label: "Erro Interno",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    dotColor: "bg-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  unknown: {
    label: "Desconhecido",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    dotColor: "bg-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
} as const;

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
  size?: "sm" | "md" | "lg";
}

// Badge de status do teste/submissão
function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.className} ${sizeClasses[size]}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Formata a data e retorna também string relativa (ex: "2h atrás")
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  const formatted = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let relative = "";

  if (diffMinutes < 1) {
    relative = "Agora mesmo";
  } else if (diffMinutes < 60) {
    relative = `${diffMinutes}min atrás`;
  } else if (diffHours < 24) {
    relative = `${diffHours}h atrás`;
  } else if (diffDays === 1) {
    relative = "Ontem";
  } else if (diffDays < 7) {
    relative = `${diffDays} dias atrás`;
  } else {
    relative = `${Math.floor(diffDays / 7)} semanas atrás`;
  }

  return { formatted, relative };
}

interface TestCaseRowProps {
  testCase: any;
  result: TestCaseResult | undefined;
  index: number;
}

// Linha da tabela de casos de teste, com exibição/ocultação de saída e copiar para clipboard
function TestCaseRow({ testCase, index, result }: TestCaseRowProps) {
  const [showOutput, setShowOutput] = useState(false);
  
  // Determina a saída real: stdout se passou, stderr se falhou
  const actualOutput = result?.stdout || result?.stderr || "Sem saída";
  const expectedOutput = testCase.expectedOutput || "Sem saída esperada";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <TableRow className="hover:bg-gray-50 transition-colors duration-200">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-400" />
          <span>Teste {index + 1}</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge
          status={result?.status as keyof typeof statusConfig || 'pending'}
          size="sm"
        />
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOutput(!showOutput)}
              className="h-6 px-2 text-xs"
            >
              {showOutput ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {showOutput ? "Ocultar" : "Mostrar"}
            </Button>
            {actualOutput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(actualOutput)}
                className="h-6 px-2 text-xs"
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
          </div>
          {showOutput && (
            <div className="bg-gray-900 rounded p-2 max-w-xs">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-20">
                {actualOutput}
              </pre>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(expectedOutput)}
              className="h-6 px-2 text-xs"
            >
              <Copy className="w-3 h-3" />
              Copiar
            </Button>
          </div>
          <div className="bg-gray-900 rounded p-2 max-w-xs">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-20">
              {expectedOutput}
            </pre>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}

// Card de estatística para métricas rápidas da submissão
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: StatsCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function SubmissionsDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const submissionId = params.submissionId;
  const activityId = params.activityId;

  const { mapActivities, mapProblems, mapSubmissions } = useData();

  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedProblem, setFetchedProblem] = useState<Problem | null>(null);

  const mapResultByTestId = useMemo(() => {
    const map = new Map<number, TestCaseResult>();
    results.forEach((result) => {
      map.set(result.testCaseId, result);
    });
    return map;
  }, [results]);

  const selectedActivity = useMemo(() => {
    return mapActivities.get(Number(activityId));
  }, [activityId, mapActivities]);

  const submission = useMemo(() => {
    return mapSubmissions.get(Number(submissionId));
  }, [submissionId, mapSubmissions]);

  // Tenta pegar do cache primeiro, senão usa o fetchedProblem
  const selectedProblem = useMemo(() => {
    const fromCache = mapProblems.get(Number(selectedActivity?.problemId));
    return fromCache || fetchedProblem;
  }, [selectedActivity, mapProblems, fetchedProblem]);

  // Cálculo de estatísticas dos casos de teste baseado nos resultados reais
  // IMPORTANTE: Este useMemo deve estar ANTES de qualquer return condicional (regras dos Hooks)
  const testStats = useMemo(() => {
    if (!selectedProblem?.testCases || selectedProblem.testCases.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
      };
    }

    const total = selectedProblem.testCases.length;
    const passed = selectedProblem.testCases.filter((tc) => {
      const result = mapResultByTestId.get(tc.id);
      return result?.status === 'passed';
    }).length;
    const failed = total - passed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, successRate };
  }, [selectedProblem, mapResultByTestId]);

  useEffect(() => {
    // Busca detalhes da submissão, relatório e atividade relacionada
    const fetchData = async () => {
      if (!submissionId) return;

      setLoading(true);
      try {
        const submissionResultCall = getResultBySubmissionId(
          Number(submissionId)
        );

        const [submissionResult] = await Promise.all([submissionResultCall]);

        setResults(submissionResult);

        // Se o problema não estiver no cache e temos a atividade, busca diretamente
        if (selectedActivity && !mapProblems.get(selectedActivity.problemId)) {
          const problem = await getProblemById(String(selectedActivity.problemId));
          if (problem) {
            setFetchedProblem(problem);
          }
        }
      } catch (error) {
        console.error("Failed to fetch submission details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId, selectedActivity, mapProblems]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Loading />
      </div>
    );
  }

  // Exibe mensagem caso algum dado essencial não seja encontrado
  if (!selectedActivity || !submission) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Submissão não encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            A submissão solicitada não existe ou não pôde ser carregada.
          </p>
          <Button onClick={() => navigate("/submissions")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às submissões
          </Button>
        </div>
      </div>
    );
  }

  const dueDate = formatDate(selectedActivity.dueDate);
  // mostra apenas a data (sem horário) no cartão de detalhes
  const formattedSubmissionDateOnly = new Date(
    submission.dateSubmitted
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header de navegação */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/submissions")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Header da submissão */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6" />
              <span className="text-blue-100 text-sm font-medium">
                Detalhes da Submissão
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {selectedProblem?.title || "Problema não encontrado"}
            </h1>
            <div className="flex items-center gap-4 text-blue-100">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Usuário</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                <span>ID: {submission.id}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">Enviado em</div>
              <div className="text-lg font-bold">
                {formattedSubmissionDateOnly}
              </div>
              {/* relativa removida - não exibir 'Agora mesmo' nem '7h atrás' */}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas rápidas (casos de teste) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Casos de Teste"
          value={testStats.total}
          icon={TestTube}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          description="Total de testes"
        />
        <StatsCard
          title="Testes Aprovados"
          value={testStats.passed}
          icon={CheckCircle2}
          color="bg-gradient-to-r from-green-500 to-green-600"
          description={`${testStats.passed}/${testStats.total} passaram`}
        />
        <StatsCard
          title="Taxa de Sucesso"
          value={`${testStats.successRate}%`}
          icon={TrendingUp}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          description="Aprovação dos testes"
        />
        <StatsCard
          title="Testes Falharam"
          value={testStats.failed}
          icon={XCircle}
          color="bg-gradient-to-r from-red-500 to-red-600"
          description={`${testStats.failed} falharam`}
        />
      </div>

      {/* Informações da atividade */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Informações da Atividade
            </h2>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Titulo</label>
            <div className="mt-1">
              <div className="text-lg font-semibold text-gray-900">
                {selectedProblem?.title || "Título não encontrado"}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Prazo de Entrega
            </label>
            <div className="mt-1">
                <div className="text-lg font-semibold text-gray-900">
                  {dueDate.formatted}
                </div>
              </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              ID da Atividade
            </label>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {selectedActivity.id}
            </div>
          </div>
        </div>
      </div>

      {/* Casos de teste da submissão */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TestTube className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Casos de Teste
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          {selectedProblem?.testCases?.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum caso de teste
              </h3>
              <p className="text-gray-500">
                Esta submissão não possui casos de teste para exibir
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Teste
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="w-4 h-4" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Saída Atual
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Saída Esperada
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProblem?.testCases?.map((testCase, index) => (
                    <TestCaseRow
                      key={testCase.id}
                      testCase={testCase}
                      result={mapResultByTestId.get(testCase.id)}
                      index={index}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
