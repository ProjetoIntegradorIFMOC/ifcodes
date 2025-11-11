import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { getProblemById } from "@/services/ProblemsServices";
import {
  getSubmissionsByActivityId,
  postSubmission,
} from "@/services/SubmissionsService";
import type { Activity, Problem, Submission } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ArrowLeft,
  RefreshCw,
  User,
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { CodeSubmissionComponent } from "../../components/CodeSubmission";
import { useData } from "@/context/DataContext";
import Loading from "@/components/Loading";

// Configuração dos possíveis status das submissões (exibição e estilização)
const statusConfig = {
  passed: {
    label: "Aceito",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
  },
  failed: {
    label: "Resposta Errada",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dotColor: "bg-yellow-500",
  },
  processing: {
    label: "Processando",
    icon: PlayCircle,
    className: "bg-blue-100 text-blue-800 border-blue-200",
    dotColor: "bg-blue-500",
  },
  "compile-error": {
    label: "Erro de Compilação",
    icon: AlertCircle,
    className: "bg-orange-100 text-orange-800 border-orange-200",
    dotColor: "bg-orange-500",
  },
  timeout: {
    label: "Tempo Limite",
    icon: Clock,
    className: "bg-purple-100 text-purple-800 border-purple-200",
    dotColor: "bg-purple-500",
  },
  "runtime-error": {
    label: "Erro de Execução",
    icon: AlertCircle,
    className: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500",
  },
  "internal-error": {
    label: "Erro Interno",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    dotColor: "bg-gray-500",
  },
  unknown: {
    label: "Desconhecido",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    dotColor: "bg-gray-500",
  },
} as const;

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
}

// Componente que exibe o badge de status da submissão
function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Função utilitária para formatar datas e indicar se está atrasada, hoje, etc
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

const formatted = date.toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

  let relative = "";
  let isOverdue = false;

  if (diffDays < 0) {
    relative = `${Math.abs(diffDays)} dias atrás`;
    isOverdue = true;
  } else if (diffDays === 0) {
    relative = "Hoje";
  } else if (diffDays === 1) {
    relative = "Amanhã";
  } else {
    relative = `Em ${diffDays} dias`;
  }

  return { formatted, relative, isOverdue };
}

// Spinner de loading exibido enquanto carrega os detalhes
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loading />
      </div>
    </div>
  );
}

export default function ActivitiesDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const {
    mapActivities,
    mapProblems,
    loading,
    updateSubmissions,
  } = useData();

  const [activitySubmissions, setActivitySubmissions] = useState<Submission[]>([]);
  const [fetchedProblem, setFetchedProblem] = useState<Problem | undefined>(undefined);

  const activityId = params.id;

  const [localLoading, setLocalLoading] = useState(false);

  const selectedActivity = useMemo(() => {
    return activityId ? mapActivities.get(Number(activityId)) : undefined;
  }, [activityId, mapActivities]);

  const selectedProblem = useMemo(() => {
    // Primeiro tenta buscar do mapa (cache)
    const problemFromMap = selectedActivity
      ? mapProblems.get(selectedActivity.problemId)
      : undefined;
    
    // Se não encontrou no mapa, usa o problema buscado da API
    return problemFromMap || fetchedProblem;
  }, [selectedActivity, mapProblems, fetchedProblem]);

  // Busca as submissões da atividade
  const fetchSubmissions = async (activity: Activity) => {
    try {
      setLocalLoading(true);
      const data = await getSubmissionsByActivityId(String(activity.id));
      
      // Busca o problema se não estiver no cache
      if (!mapProblems.get(activity.problemId)) {
        const problem = await getProblemById(`${activity.problemId}`);
        setFetchedProblem(problem);
      }
      
      setActivitySubmissions(data);
    } catch (error) {
      console.error("Erro ao buscar submissões da atividade:", error);
      setActivitySubmissions([]); // limpa em caso de erro
    } finally {
      setLocalLoading(false);
    }
  };

  // Quando a atividade selecionada muda, busca o problema e as submissões
  useEffect(() => {
    if (selectedActivity) {
      fetchSubmissions(selectedActivity);
    }
  }, [selectedActivity]);

  // Redireciona para o detalhe da submissão ao clicar na linha da tabela
  function redirectToSubmission(submission: Submission) {
    navigate(`/submissions/${submission.activityId}/${submission.id}`);
  }

  async function handleSubmit(code: string, activityId: number) {
    try {
      setLocalLoading(true);
      await postSubmission({
        code: code,
        activityId: activityId,
      });
      await updateSubmissions();
      // refresh local activity submissions as well
      if (selectedActivity) {
        await fetchSubmissions(selectedActivity);
      }
      navigate(`/submissions`);
    } catch (error) {
      alert("Erro ao submeter o código. Tente novamente.");
      console.error("Error submitting code:", error);
    } finally {
      setLocalLoading(false);
    }
  }

  // Mostra loading enquanto carrega dados globais ou o problema específico
  if (loading || (selectedActivity && !selectedProblem && localLoading)) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Loading />
      </div>
    );
  }

  // Se não encontrar atividade, mostra mensagem de erro
  if (selectedActivity === undefined) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Atividade não encontrada
          </h3>
          <p className="text-gray-500 mb-4">
            A atividade que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => navigate("/activities")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Atividades
          </Button>
        </div>
      </div>
    );
  }

  // Se não encontrar problema, mostra mensagem de erro
  if (selectedProblem === undefined) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Problema não encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            O problema associado a esta atividade não foi encontrado.
          </p>
          <Button onClick={() => navigate("/activities")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Atividades
          </Button>
        </div>
      </div>
    );
  }

  const dueDate = formatDate(selectedActivity.dueDate);
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Botão de voltar */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/activities")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Header da atividade */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{selectedProblem.title}</h1>
            <p className="text-blue-100 text-lg">{selectedProblem.statement}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">Prazo</div>
              <div className="text-lg font-bold">{dueDate.formatted}</div>
              <div
                className={`text-xs ${
                  dueDate.isOverdue ? "text-red-200" : "text-blue-200"
                }`}
              >
                {dueDate.relative}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <User className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">Submissões</div>
              {localLoading ? (
                <div className="text-lg font-bold flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ...
                </div>
              ) : (
                <div className="text-lg font-bold">{activitySubmissions.length}</div>
              )}
              <div className="text-xs text-blue-200">tentativas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enunciado do problema */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedProblem.title}
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedProblem.statement}
            </p>
          </div>
        </div>
      </div>

      {/* Área de submissão de código */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Nova Submissão</h2>
          </div>
        </div>
        {/* Componente responsável pela caixa de texto e submissão do código*/}
        <CodeSubmissionComponent
          onSubmit={(code) => handleSubmit(code, selectedActivity.id)}
        />
      </div>

      {/* Histórico de submissões */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Histórico de Submissões
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedActivity && fetchSubmissions(selectedActivity)}
              disabled={localLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${localLoading ? 'animate-spin' : ''}`} />
              {localLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {localLoading ? (
            <div className="text-center py-8">
              <Loading />
            </div>
          ) : activitySubmissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma submissão para esta atividade
              </h3>
              <p className="text-gray-500">
                Use o editor acima para enviar seu código. Após enviar, suas submissões aparecerão aqui.
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Ir para o editor
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Data de Submissão
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activitySubmissions.map((submission: Submission) => {
                    const submissionDate = formatDate(submission.dateSubmitted);
                    return (
                      <TableRow
                        key={submission.id}
                        onClick={() => redirectToSubmission(submission)}
                        className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 group"
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">
                              {submissionDate.formatted}
                            </span>
                            <span className="text-xs text-gray-500">
                              {submissionDate.relative}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              submission.status as keyof typeof statusConfig
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
