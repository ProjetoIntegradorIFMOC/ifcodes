import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Code2,
  BookOpen,
  ArrowRight,
  Plus,
  Timer,
  Flame,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllActivities } from "@/services/ActivitiesService";
import { getAllSubmissions } from "@/services/SubmissionsService";
import type { Activity, Submission } from "@/types";
import { useData } from "@/context/DataContext";
import Loading from "@/components/Loading";

interface QuickStatsProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  description?: string;
}

function QuickStatsCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  description,
}: QuickStatsProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

interface ActivityCardProps {
  activity: Activity;
  problemTitle?: string;
  onViewActivity: (activity: Activity) => void;
}

function ActivityCard({ activity, problemTitle, onViewActivity }: ActivityCardProps) {
  // Calcula o prazo de entrega e o status da atividade (atrasada, urgente, etc)
  const dueDate = new Date(activity.dueDate);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays <= 3 && diffDays >= 0;

  // Formata a data de entrega para exibição
  const dueDateFormatted = dueDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Define o badge de status conforme a situação da atividade
  const getStatusBadge = () => {
    if (activity.status === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3" />
          Concluída
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="w-3 h-3" />
          Atrasada
        </span>
      );
    }
    if (isDueSoon) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
          <Timer className="w-3 h-3" />
          Urgente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
        <Clock className="w-3 h-3" />
        Pendente
      </span>
    );
  };

  return (
    <div
      className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => onViewActivity(activity)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {problemTitle || `Atividade #${activity.id}`}
          </h3>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors ml-2" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{dueDateFormatted}</span>
        </div>
        {getStatusBadge()}
      </div>

      {(isOverdue || isDueSoon) && (
        <div
          className={`mt-3 text-xs ${
            isOverdue ? "text-red-600" : "text-yellow-600"
          }`}
        >
          {isOverdue
            ? `Atrasada há ${Math.abs(diffDays)} dia${
                Math.abs(diffDays) !== 1 ? "s" : ""
              }`
            : `Vence em ${diffDays} dia${diffDays !== 1 ? "s" : ""}`}
        </div>
      )}
    </div>
  );
}

function LoadingDashboard() {
  return (
    <Loading />
  );
}

export default function Home() {
  const [userName, setUserName] = useState("Usuário");
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { mapProblems } = useData();

  useEffect(() => {
    // Carrega as atividades e submissões ao montar o componente
    const fetchData = async () => {
      setLoading(true);
      try {
        // Busca atividades e submissões em paralelo
        const [activitiesData, submissionsData] = await Promise.all([
          getAllActivities(),
          getAllSubmissions(),
        ]);
        setActivities(activitiesData.items || []);
        setSubmissions(submissionsData || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingDashboard />;
  }

  // Filtra as atividades em diferentes categorias para exibição nos cards
  const now = new Date();
  const pendingActivities = activities.filter(
    (a) => a.status !== "completed" && new Date(a.dueDate) >= now
  );
  const overdueActivities = activities.filter(
    (a) => a.status !== "completed" && new Date(a.dueDate) < now
  );
  const completedActivities = activities.filter(
    (a) => a.status === "completed"
  );

  // Seleciona as atividades mais urgentes (próximas do prazo)
  const urgentActivities = activities
    .filter((a) => a.status !== "completed")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 4);

  // Data/hora atual formatada para exibir no dashboard
  const currentTime = new Date().toLocaleString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bem-vindo de volta, {userName}! 👋
            </h1>

            <p className="text-blue-200 text-sm mt-2">{currentTime}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => navigate("/activities")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ver Atividades
            </Button>
            <Button
              className="border-white text-white bg-transparent border hover:bg-white hover:text-blue-600"
              onClick={() => navigate("/submissions")}
            >
              <Code2 className="w-4 h-4 mr-2" />
              Minhas Submissões
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickStatsCard
          title="Atividades Pendentes"
          value={pendingActivities.length}
          icon={BookOpen}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          description="Para fazer"
        />

        <QuickStatsCard
          title="Atividades Atrasadas"
          value={overdueActivities.length}
          icon={AlertCircle}
          color="bg-gradient-to-r from-red-500 to-red-600"
          description="Precisam de atenção"
        />
        <QuickStatsCard
          title="Concluídas"
          value={completedActivities.length}
          icon={Award}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          description="Atividades finalizadas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Urgent Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Atividades Urgentes
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/activities")}
            >
              Ver todas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {urgentActivities.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tudo em dia! 🎉
              </h3>
              <p className="text-gray-500">
                Você não tem atividades urgentes no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urgentActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onViewActivity={(activity) =>
                    navigate(`/activities/${activity.id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
