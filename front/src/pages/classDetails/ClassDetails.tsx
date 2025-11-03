import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import type { Class, ClassStudent } from "@/types/classes";
import type { Student, Activity, Problem } from "@/types";
import ClassesService from "@/services/ClassesService";
import { getAllStudents } from "@/services/StudentsService";
import { getActivitiesByClass, createActivity, updateActivity, deleteActivity } from "@/services/ActivitiesService";
import { getAllProblems } from "@/services/ProblemsServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import Loading from "@/components/Loading";
import Notification from "@/components/Notification";
import { ArrowLeft, UserPlus, UserMinus, Users, Search, BookOpen, Plus, X, Codesandbox, Clock, HardDrive, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProblemViewModal from "@/components/ProblemViewModal";
import { RichTextViewer } from "@/components/RichTextEditor";

export default function ClassDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasAnyRole } = useUserRole();

  const defaultTab = searchParams.get("tab") || "activities";

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [viewProblem, setViewProblem] = useState<Problem | null>(null);
  const [viewActivity, setViewActivity] = useState<Activity | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadClassData();
      loadClassStudents();
      loadAllStudents();
      loadClassActivities();
      loadProblems();
    }
  }, [id]);

  useEffect(() => {
    filterAvailableStudents();
  }, [searchTerm, allStudents, students]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.activity-menu')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const loadClassData = async () => {
    try {
      const data = await ClassesService.getClassById(Number(id));
      setClassData(data);
    } catch (error) {
      console.error("Erro ao carregar turma:", error);
      showNotification("Erro ao carregar turma", "error");
    }
  };

  const loadClassStudents = async () => {
    try {
      const data = await ClassesService.getClassStudents(Number(id));
      setStudents(data);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      showNotification("Erro ao carregar alunos", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadAllStudents = async () => {
    try {
      const data = await getAllStudents();
      setAllStudents(data);
    } catch (error) {
      console.error("Erro ao carregar lista de alunos:", error);
    }
  };

  const loadClassActivities = async () => {
    try {
      const data = await getActivitiesByClass(Number(id));
      setActivities(data);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    }
  };

  const loadProblems = async () => {
    try {
      const data = await getAllProblems();
      setAllProblems(data);
    } catch (error) {
      console.error("Erro ao carregar problemas:", error);
    }
  };

  const filterAvailableStudents = () => {
    const enrolledIds = students.map((s) => s.studentId);
    let available = allStudents.filter((s) => !enrolledIds.includes(s.id));

    if (searchTerm.trim()) {
      available = available.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(available);
  };

  const handleAddStudent = async (studentId: number) => {
    try {
      await ClassesService.addStudentToClass(Number(id), { studentId });
      showNotification("Aluno adicionado com sucesso!", "success");
      loadClassStudents();
      setSearchTerm("");
    } catch (error) {
      console.error("Erro ao adicionar aluno:", error);
      showNotification("Erro ao adicionar aluno", "error");
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm("Tem certeza que deseja remover este aluno da turma?")) return;

    try {
      await ClassesService.removeStudentFromClass(Number(id), studentId);
      showNotification("Aluno removido com sucesso!", "success");
      loadClassStudents();
    } catch (error) {
      console.error("Erro ao remover aluno:", error);
      showNotification("Erro ao remover aluno", "error");
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateActivity = async (formData: { problema_id: number; data_entrega: string }) => {
    try {
      const result = await createActivity({
        ...formData,
        turma_id: Number(id),
      });

      if (result) {
        showNotification("Atividade criada com sucesso!", "success");
        setShowNewActivity(false);
        setSelectedProblem(null);
        loadClassActivities();
      } else {
        showNotification("Erro ao criar atividade", "error");
      }
    } catch (error) {
      console.error("Erro ao criar atividade:", error);
      showNotification("Erro ao criar atividade", "error");
    }
  };

  const handleUpdateActivity = async (formData: { problema_id: number; data_entrega: string }) => {
    if (!editingActivity) return;
    
    try {
      const result = await updateActivity(editingActivity.id, {
        ...formData,
        turma_id: Number(id),
      });

      if (result) {
        showNotification("Atividade atualizada com sucesso!", "success");
        setEditingActivity(null);
        setSelectedProblem(null);
        loadClassActivities();
      } else {
        showNotification("Erro ao atualizar atividade", "error");
      }
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      showNotification("Erro ao atualizar atividade", "error");
    }
  };

  const handleDeleteActivity = async () => {
    if (!deletingActivity) return;

    try {
      const success = await deleteActivity(deletingActivity.id);

      if (success) {
        showNotification("Atividade deletada com sucesso!", "success");
        setDeletingActivity(null);
        loadClassActivities();
      } else {
        showNotification("Erro ao deletar atividade", "error");
      }
    } catch (error) {
      console.error("Erro ao deletar atividade:", error);
      showNotification("Erro ao deletar atividade", "error");
    }
  };

  if (loading) return <Loading />;

  if (!classData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Turma não encontrada</p>
          <Button onClick={() => navigate("/classes")} className="mt-4">
            Voltar para Turmas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/classes")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-2">{classData.nome}</h1>
          {classData.teacherName && (
            <p className="mt-2 text-gray-700">
              Professor: {classData.teacherName}
            </p>
          )}
        </div>
      </div>

      {/* Tabs: Atividades e Alunos */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Atividades ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Alunos ({students.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba de Atividades */}
        <TabsContent value="activities">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Atividades da Turma</h2>
              {hasAnyRole(["professor", "admin"]) && (
                <Button onClick={() => setShowNewActivity(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Atividade
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma atividade cadastrada para esta turma
                </p>
              ) : (
                activities.map((activity) => {
                  const dueDate = new Date(activity.dueDate);
                  const now = new Date();
                  const isOverdue = dueDate < now;
                  const isPending = !isOverdue;
                  const problem = allProblems.find(p => p.id === activity.problemId);

                  return (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-lg border-l-4 transition-colors cursor-pointer hover:shadow-md ${
                        isOverdue
                          ? "bg-red-50 border-red-500"
                          : isPending
                          ? "bg-yellow-50 border-yellow-500"
                          : "bg-green-50 border-green-500"
                      }`}
                      onClick={() => setViewActivity(activity)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {problem?.title || "Atividade"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Prazo: {dueDate.toLocaleDateString("pt-BR")} às{" "}
                            {dueDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <span
                            className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                              isOverdue
                                ? "bg-red-100 text-red-700"
                                : isPending
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isOverdue
                              ? "Atrasada"
                              : isPending
                              ? "Pendente"
                              : "Concluída"}
                          </span>
                        </div>
                        {hasAnyRole(["professor", "admin"]) && (
                          <div className="relative ml-4 activity-menu">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === activity.id ? null : activity.id);
                              }}
                              className="p-2 rounded-full hover:bg-gray-100"
                            >
                              <MoreVertical size={20} />
                            </button>

                            {openMenuId === activity.id && (
                              <div
                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingActivity(activity);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingActivity(activity);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Apagar</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* Aba de Alunos */}
        <TabsContent value="students">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Alunos Matriculados</h2>
              {hasAnyRole(["professor", "admin"]) && (
                <Button onClick={() => setShowAddStudent(!showAddStudent)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Aluno
                </Button>
              )}
            </div>

            {/* Formulário de adicionar aluno */}
            {showAddStudent && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar alunos disponíveis..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredStudents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {searchTerm
                        ? "Nenhum aluno encontrado"
                        : "Todos os alunos já estão matriculados"}
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex justify-between items-center p-3 bg-white rounded border hover:border-blue-300 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600">
                            {student.email}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddStudent(student.id)}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Lista de alunos matriculados */}
            <div className="space-y-2">
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum aluno matriculado nesta turma
                </p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-gray-600">
                        {student.studentEmail}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Matriculado em:{" "}
                        {new Date(student.enrolledAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                    {hasAnyRole(["professor", "admin"]) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveStudent(student.studentId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showNewActivity && (
        <NewActivityModal
          isOpen={showNewActivity}
          onClose={() => {
            setShowNewActivity(false);
            setSelectedProblem(null);
          }}
          onSave={handleCreateActivity}
          problems={allProblems}
          onViewProblem={(problem) => setViewProblem(problem)}
        />
      )}


      {viewActivity && (
        <ActivityViewModal
          isOpen={!!viewActivity}
          activity={viewActivity}
          problem={allProblems.find(p => p.id === viewActivity.problemId) || null}
          onClose={() => setViewActivity(null)}
        />
      )}

      {editingActivity && (
        <EditActivityModal
          isOpen={!!editingActivity}
          onClose={() => {
            setEditingActivity(null);
            setSelectedProblem(null);
          }}
          onSave={handleUpdateActivity}
          activity={editingActivity}
          problems={allProblems}
          onViewProblem={(problem) => setViewProblem(problem)}
        />
      )}

      {deletingActivity && (
        <DeleteActivityModal
          isOpen={!!deletingActivity}
          onClose={() => setDeletingActivity(null)}
          onConfirm={handleDeleteActivity}
          activityTitle={allProblems.find(p => p.id === deletingActivity.problemId)?.title || "Atividade"}
        />
      )}

      <ProblemViewModal
        isOpen={!!viewProblem}
        problem={viewProblem}
        onClose={() => setViewProblem(null)}
      />
      
    </div>
  );
}

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { problema_id: number; data_entrega: string }) => void;
  problems: Problem[];
  onViewProblem: (problem: Problem) => void;
}

function NewActivityModal({ isOpen, onClose, onSave, problems, onViewProblem }: NewActivityModalProps) {
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProblems = problems.filter(problem => 
    problem.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProblem = problems.find(p => p.id === selectedProblemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblemId || !dueDate) {
      return;
    }
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const hours = String(dueDate.getHours()).padStart(2, '0');
    const minutes = String(dueDate.getMinutes()).padStart(2, '0');
    const seconds = String(dueDate.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    onSave({
      problema_id: selectedProblemId,
      data_entrega: formattedDate,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedProblem ? selectedProblem.title : "Nova Atividade"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <Label htmlFor="search-problem">Selecione um Problema *</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search-problem"
                  placeholder="Buscar problemas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProblems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum problema encontrado</p>
                ) : (
                  filteredProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedProblemId === problem.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                      }`}
                      onClick={() => setSelectedProblemId(problem.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center flex-1">
                          <div className="flex-shrink-0 mr-3">
                            <Codesandbox size={24} className="text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{problem.title}</h4>
                            <div className="flex gap-3 mt-1 text-xs text-gray-600">
                              <span>Tempo: {problem.timeLimitMs}ms</span>
                              <span>Memória: {problem.memoryLimitKb}KB</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProblem(problem);
                          }}
                          className="ml-2"
                        >
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedProblem && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Problema selecionado:</strong> {selectedProblem.title}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="due-date">Data de Entrega *</Label>
              <DateTimePicker
                selected={dueDate}
                onChange={setDueDate}
                placeholderText="dd/mm/aaaa às hh:mm"
                required
                className="mt-2"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedProblemId || !dueDate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Atividade
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ActivityViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  problem: Problem | null;
}

function ActivityViewModal({ isOpen, onClose, activity, problem }: ActivityViewModalProps) {
  if (!isOpen || !problem) return null;

  const dueDate = new Date(activity.dueDate);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Codesandbox className="w-6 h-6 mr-3 text-gray-600" />
              {problem.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center text-blue-900">
                <Calendar className="w-5 h-5 mr-2" />
                Data de Entrega
              </h3>
              <p className="text-lg font-medium text-blue-900">
                {dueDate.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })} às {dueDate.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Enunciado</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <RichTextViewer value={problem.statement} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Tempo Limite</h3>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{problem.timeLimitMs} milissegundos</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Memória Limite</h3>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span>{problem.memoryLimitKb} KB</span>
                </div>
              </div>
            </div>
            
            {problem.testCases && problem.testCases.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Casos de Teste</h3>
                <div className="space-y-4">
                  {problem.testCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Caso {index + 1}</h4>
                        {testCase.private && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            Privado
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium">Entrada</Label>
                          <div className="bg-gray-50 p-3 rounded mt-1">
                            <pre className="text-sm">{testCase.input}</pre>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Saída Esperada</Label>
                          <div className="bg-gray-50 p-3 rounded mt-1">
                            <pre className="text-sm">{testCase.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { problema_id: number; data_entrega: string }) => void;
  activity: Activity;
  problems: Problem[];
  onViewProblem: (problem: Problem) => void;
}

function EditActivityModal({ isOpen, onClose, onSave, activity, problems, onViewProblem }: EditActivityModalProps) {
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(activity.problemId);
  const [dueDate, setDueDate] = useState<Date | null>(new Date(activity.dueDate.replace(' ', 'T')));
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSelectedProblemId(activity.problemId);
    const parsedDate = new Date(activity.dueDate.replace(' ', 'T'));
    setDueDate(parsedDate);
    setSearchTerm("");
  }, [activity, isOpen]);

  const filteredProblems = problems.filter(problem => 
    problem.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProblem = problems.find(p => p.id === selectedProblemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblemId || !dueDate) {
      return;
    }
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const hours = String(dueDate.getHours()).padStart(2, '0');
    const minutes = String(dueDate.getMinutes()).padStart(2, '0');
    const seconds = String(dueDate.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    onSave({
      problema_id: selectedProblemId,
      data_entrega: formattedDate,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Editar Atividade</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <Label htmlFor="search-problem-edit">Selecione um Problema *</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search-problem-edit"
                  placeholder="Buscar problemas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProblems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum problema encontrado</p>
                ) : (
                  filteredProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedProblemId === problem.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                      }`}
                      onClick={() => setSelectedProblemId(problem.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center flex-1">
                          <div className="flex-shrink-0 mr-3">
                            <Codesandbox size={24} className="text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{problem.title}</h4>
                            <div className="flex gap-3 mt-1 text-xs text-gray-600">
                              <span>Tempo: {problem.timeLimitMs}ms</span>
                              <span>Memória: {problem.memoryLimitKb}KB</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProblem(problem);
                          }}
                          className="ml-2"
                        >
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedProblem && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Problema selecionado:</strong> {selectedProblem.title}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="due-date-edit">Data de Entrega *</Label>
              <DateTimePicker
                selected={dueDate}
                onChange={setDueDate}
                placeholderText="dd/mm/aaaa às hh:mm"
                required
                className="mt-2"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedProblemId || !dueDate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Atualizar Atividade
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface DeleteActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activityTitle: string;
}

function DeleteActivityModal({ isOpen, onClose, onConfirm, activityTitle }: DeleteActivityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Confirmar Exclusão</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir a atividade{" "}
          <span className="font-semibold text-gray-900">"{activityTitle}"</span>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}
