import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/services/StudentsService";
import type { Student } from "@/types";
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  UserCircle,
  BookOpen,
  IdCard,
} from "lucide-react";
import Notification from "@/components/Notification";
import Loading from "@/components/Loading";

// Skeleton de loading exibido enquanto os alunos são carregados
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

// Interface para props do modal de formulário
interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, "id"> | Student) => void;
  student: Student | null;
  mode: "create" | "edit";
}

// Componente de modal de formulário para criar/editar aluno
function StudentFormModal({
  isOpen,
  onClose,
  onSave,
  student,
  mode,
}: StudentFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    matricula: "",
    curso_id: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Atualiza o formulário quando o aluno selecionado muda
  useEffect(() => {
    if (student && mode === "edit") {
      const cursoId = student.curso_id || student.curso?.id || "";
      setFormData({
        name: student.name,
        email: student.email,
        matricula: student.matricula?.toString() || "",
        curso_id: cursoId.toString(),
        password: "",
        password_confirmation: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        matricula: "",
        curso_id: "",
        password: "",
        password_confirmation: "",
      });
    }
    setErrors({});
  }, [student, mode, isOpen]);

  // Valida o email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Valida o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!formData.matricula.trim()) {
      newErrors.matricula = "Matrícula é obrigatória";
    }

    if (!formData.curso_id.trim()) {
      newErrors.curso_id = "Curso ID é obrigatório";
    }

    if (mode === "create") {
      if (!formData.password) {
        newErrors.password = "Senha é obrigatória";
      } else if (formData.password.length < 6) {
        newErrors.password = "Senha deve ter no mínimo 6 caracteres";
      }

      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = "As senhas não coincidem";
      }
    } else if (mode === "edit" && formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = "Senha deve ter no mínimo 6 caracteres";
      }

      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = "As senhas não coincidem";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submete o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const studentData: Partial<Student> = {
      name: formData.name,
      email: formData.email,
      matricula: formData.matricula,
      curso_id: parseInt(formData.curso_id),
    };

    // Adiciona senha apenas se foi preenchida
    if (formData.password) {
      studentData.password = formData.password;
      studentData.password_confirmation = formData.password_confirmation;
    }

    // Adiciona ID se for edição
    if (mode === "edit" && student) {
      studentData.id = student.id;
    }

    onSave(studentData as Omit<Student, "id"> | Student);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header do modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {mode === "create" ? "Novo Aluno" : "Editar Aluno"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nome completo do aluno"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="email@exemplo.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Matrícula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matrícula *
            </label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) =>
                  setFormData({ ...formData, matricula: e.target.value })
                }
                disabled={mode === "edit"}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  mode === "edit" ? "bg-gray-100 cursor-not-allowed" : ""
                } ${errors.matricula ? "border-red-500" : "border-gray-300"}`}
                placeholder="202501001"
              />
            </div>
            {errors.matricula && (
              <p className="text-red-500 text-xs mt-1">{errors.matricula}</p>
            )}
          </div>

          {/* Curso ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso ID *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={formData.curso_id}
                onChange={(e) =>
                  setFormData({ ...formData, curso_id: e.target.value })
                }
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.curso_id ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="1"
                min="1"
              />
            </div>
            {errors.curso_id && (
              <p className="text-red-500 text-xs mt-1">{errors.curso_id}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha {mode === "create" ? "*" : "(opcional)"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha {mode === "create" ? "*" : "(opcional)"}
            </label>
            <input
              type="password"
              value={formData.password_confirmation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password_confirmation: e.target.value,
                })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password_confirmation
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Repita a senha"
            />
            {errors.password_confirmation && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password_confirmation}
              </p>
            )}
          </div>

          {/* Botões */}
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity"
            >
              {mode === "create" ? "Criar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Interface para props do dialog de confirmação
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
}

// Dialog de confirmação de remoção
function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  studentName,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Confirmar Remoção</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Tem certeza que deseja remover o aluno{" "}
          <span className="font-semibold text-gray-900">{studentName}</span>?
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
            Confirmar Remoção
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal da página de gerenciamento de alunos
export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Carrega os alunos ao montar o componente
  useEffect(() => {
    loadStudents();
  }, []);

  // Função para carregar todos os alunos
  async function loadStudents() {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      setNotification({
        message: "Erro ao carregar alunos",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  // Abre o modal de criação
  function handleCreate() {
    setSelectedStudent(null);
    setModalMode("create");
    setIsModalOpen(true);
  }

  // Abre o modal de edição
  function handleEdit(student: Student) {
    setSelectedStudent(student);
    setModalMode("edit");
    setIsModalOpen(true);
  }

  // Abre o dialog de confirmação de remoção
  function handleDeleteClick(student: Student) {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  }

  // Confirma a remoção do aluno
  async function confirmDelete() {
    if (!studentToDelete) return;

    try {
      await deleteStudent(studentToDelete.id);
      setNotification({
        message: "Aluno removido com sucesso!",
        type: "success",
      });
      loadStudents();
    } catch (error) {
      console.error("Erro ao remover aluno:", error);
      setNotification({
        message: "Erro ao remover aluno",
        type: "error",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  }

  // Salva o aluno (criação ou edição)
  async function handleSave(studentData: Omit<Student, "id"> | Student) {
    try {
      if (modalMode === "create") {
        await createStudent(studentData as Omit<Student, "id">);
        setNotification({
          message: "Aluno criado com sucesso!",
          type: "success",
        });
      } else {
        const { id, ...dataToUpdate } = studentData as Student;
        await updateStudent(id, dataToUpdate);
        setNotification({
          message: "Aluno atualizado com sucesso!",
          type: "success",
        });
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);
      let errorMessage = "Erro ao salvar aluno";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      setNotification({
        message: errorMessage,
        type: "error",
      });
    }
  }

  // Filtra alunos conforme o termo de busca
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    const matriculaStr = student.matricula?.toString() || "";
    return (
      student.name.toLowerCase().includes(searchLower) ||
      matriculaStr.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.curso?.nome.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Notificação */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            Gerenciamento de Alunos
          </h1>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity shadow-md"
        >
          <Plus className="w-5 h-5" />
          Adicionar Aluno
        </button>
      </div>

      {/* Barra de busca */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Tabela de alunos */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Loading />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "Nenhum aluno encontrado"
                : "Nenhum aluno cadastrado"}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Tente ajustar o termo de busca"
                : "Clique em 'Adicionar Aluno' para começar"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Nome
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4" />
                    Matrícula
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Curso
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900 text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <TableCell className="font-medium text-gray-900">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {student.matricula}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {student.curso?.nome || (student.curso_id ? `Curso ${student.curso_id}` : "N/A")}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {student.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar aluno"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(student)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover aluno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Contador de alunos */}
      {!loading && students.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="font-medium">
              {filteredStudents.length} aluno{filteredStudents.length !== 1 ? "s" : ""}{" "}
              {searchTerm && `de ${students.length}`}
            </span>
          </div>
        </div>
      )}

      {/* Modal de formulário */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        student={selectedStudent}
        mode={modalMode}
      />

      {/* Dialog de confirmação de remoção */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={confirmDelete}
        studentName={studentToDelete?.name || ""}
      />
    </div>
  );
}
