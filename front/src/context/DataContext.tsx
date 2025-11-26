/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import type { Activity, Problem, Submission } from "@/types";
import { getAllActivities } from "@/services/ActivitiesService";
import { getAllProblems } from "@/services/ProblemsServices";
import { getAllSubmissions } from "@/services/SubmissionsService";

interface DataContextType {
  activities: Activity[];
  problems: Problem[];
  submissions: Submission[];
  mapActivities: Map<number, Activity>;
  mapProblems: Map<number, Problem>;
  mapSubmissions: Map<number, Submission>;
  loading: boolean;
  updateSubmissions: () => Promise<void>;
  updateActivities: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  activities: [],
  problems: [],
  submissions: [],
  mapActivities: new Map(),
  mapProblems: new Map(),
  mapSubmissions: new Map(),
  loading: false,
  updateSubmissions: async () => {},
  updateActivities: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const mapProblems = useMemo(() => {
    return new Map(problems.map((problem) => [problem.id, problem]));
  }, [problems]);
  const mapActivities = useMemo(() => {
    return new Map(activities.map((activity) => [activity.id, activity]));
  }, [activities]);

  const mapSubmissions = useMemo(() => {
    return new Map(
      submissions.map((submission) => [submission.id, submission])
    );
  }, [submissions]);

  const updateSubmissions = async () => {
    try {
      const submissions = await getAllSubmissions();
      setSubmissions(submissions);
    } catch (error) {
      console.error("DataContext: Erro ao atualizar submissões:", error);
    }
  };

  const updateActivities = async () => {
    try {
      const activitiesData = await getAllActivities();
      setActivities(activitiesData.items);
    } catch (error) {
      console.error("DataContext: Erro ao atualizar atividades:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [activitiesData, problemsData, submissionsData] =
          await Promise.all([
            getAllActivities(),
            getAllProblems(),
            getAllSubmissions(),
          ]);
        
        setActivities(activitiesData.items);
        setProblems(problemsData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("DataContext: Falha ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Polling para atualizar submissões pendentes/processando a cada 10 segundos
  useEffect(() => {
    const hasPendingSubmissions = submissions.some(
      (s) => s.status === "pending" || s.status === "processing"
    );

    if (!hasPendingSubmissions) {
      return;
    }

    const intervalId = setInterval(async () => {
      await updateSubmissions();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [submissions]);

  // Polling para atualizar atividades pendentes a cada 10 segundos
  useEffect(() => {
    const hasPendingActivities = activities.some(
      (a: Activity) => a.status === "pending"
    );

    if (!hasPendingActivities) {
      return;
    }

    const intervalId = setInterval(async () => {
      await updateActivities();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activities]);

  return (
    <DataContext.Provider
      value={{
        activities,
        problems,
        mapActivities,
        mapProblems,
        loading,
        mapSubmissions,
        submissions,
        updateSubmissions,
        updateActivities,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within an DataProvider");
  }
  return context;
};

export default DataProvider;
