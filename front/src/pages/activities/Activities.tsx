import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { getAllActivities } from "@/services/ActivitiesService";
import type { Activity, Problem } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllProblems } from "@/services/ProblemsServices";
import { useData } from "@/context/DataContext";
import Loading from "@/components/Loading";

// Configuração dos possíveis status de atividades para exibição e estilização
const statusConfig = {
  completed: {
    label: "Concluída",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dotColor: "bg-yellow-500",
  },
  overdue: {
    label: "Atrasada",
    icon: AlertCircle,
    className: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500",
  },
  draft: {
    label: "Rascunho",
    icon: XCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    dotColor: "bg-gray-500",
  },
} as const;

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
}

// Componente responsável por mostrar o badge de status da atividade
function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
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

// Função utilitária para formatar datas e indicar se está atrasada, hoje ou em breve
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

  if (diffDays < 0) {
    return {
      formatted,
      relative: `${Math.abs(diffDays)} dias atrás`,
      isOverdue: true,
    };
  } else if (diffDays === 0) {
    return { formatted, relative: "Hoje", isToday: true };
  } else if (diffDays === 1) {
    return { formatted, relative: "Amanhã", isTomorrow: true };
  } else if (diffDays <= 7) {
    return { formatted, relative: `Em ${diffDays} dias`, isSoon: true };
  } else {
    return { formatted, relative: `Em ${diffDays} dias`, isFuture: true };
  }
}

// Skeleton de loading exibido enquanto as atividades são carregadas
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export default function Activities() {
  const navigate = useNavigate();

  const { activities, mapActivities, mapProblems, loading, updateActivities } = useData();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    updateActivities();
  }, []);

  // Atualiza os dados ao clicar em "Atualizar"
  async function refreshData() {
    setRefreshing(true);
    try {
      await updateActivities();
    } finally {
      setRefreshing(false);
    }
  }

  // Redireciona para o detalhe da atividade ao clicar na linha
  function redirectToActivity(activity: Activity) {
    console.log("Redirecting to activity:", activity);
    navigate(`/activities/${activity.id}`);
  }

  // Filtra atividades conforme o texto pesquisado e o filtro de status
  const filteredActivities = activities.filter((activity) => {
    // const matchesSearch = activity.title
    //   .toLowerCase()
    //   .includes(searchTerm.toLowerCase());
    // const matchesStatus =
    //   statusFilter === "all" || activity.status === statusFilter;
    // return matchesSearch && matchesStatus;
    return true;
  });

  // Obtém os status únicos presentes nas atividades para montar os filtros
  const uniqueStatuses = [...new Set(activities.map((a) => a.status))];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            Atividades
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie e acompanhe suas atividades acadêmicas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {activities.length} atividade{activities.length !== 1 ? "s" : ""}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${(loading || refreshing) ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar atividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
          >
            <option value="all">Todos os status</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {statusConfig[status as keyof typeof statusConfig]?.label ||
                  status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de atividades ou mensagens de resultado */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Loading />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all"
                ? "Nenhuma atividade encontrada"
                : "Nenhuma atividade ainda"}
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "As atividades aparecerão aqui quando forem criadas"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                {/* <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Título
                  </div>
                </TableHead> */}
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data de Entrega
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
              {filteredActivities.map((activity) => {
                const dateInfo = formatDate(activity.dueDate);
                return (
                  <TableRow
                    key={activity.id}
                    onClick={() => redirectToActivity(activity)}
                    className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    {/* <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-gray-900 group-hover:text-blue-600 transition-colors">
                          {mapProblems.get(activity.problemId)?.title}
                        </span>
                        {mapProblems.get(activity.problemId)?.statement && (
                          <span className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {mapProblems.get(activity.problemId)?.statement}
                          </span>
                        )}
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">
                          {dateInfo.formatted}
                        </span>
                        <span
                          className={`text-xs ${
                            dateInfo.isOverdue
                              ? "text-red-600"
                              : dateInfo.isToday
                              ? "text-orange-600"
                              : dateInfo.isTomorrow || dateInfo.isSoon
                              ? "text-yellow-600"
                              : "text-gray-500"
                          }`}
                        >
                          {dateInfo.relative}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={activity.status as keyof typeof statusConfig}
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
        )}
      </div>

      {/* Resumo de atividades por status */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = activities.filter((a) => a.status === key).length;
            if (count === 0) return null;

            return (
              <div
                key={key}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
                  <span className="text-sm font-medium text-gray-600">
                    {config.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
