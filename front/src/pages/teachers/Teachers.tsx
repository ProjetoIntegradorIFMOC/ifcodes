import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import {
  getAllProfessors,
  createProfessor,
  updateProfessor,
  deleteProfessor,
} from "@/services/ProfessorsService";
import type { Professor } from "@/types";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  UserCircle,
  Briefcase,
} from "lucide-react";
import Notification from "@/components/Notification";
import Loading from "@/components/Loading";

// Skeleton de loading exibido enquanto os professores são carregados
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
interface ProfessorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (professor: Omit<Professor, "id"> | Professor) => void;
  professor: Professor | null;
  mode: "create" | "edit";
}

// Componente de modal de formulário para criar/editar professor
function ProfessorFormModal({
  isOpen,
  onClose,
  onSave,
  professor,
  mode,
}: ProfessorFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    area_atuacao: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Atualiza o formulário quando o professor selecionado muda
  useEffect(() => {
    if (professor && mode === "edit") {
      setFormData({
        name: professor.name,
        email: professor.email,
        area_atuacao: professor.area_atuacao,
        password: "",
        password_confirmation: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        area_atuacao: "",
        password: "",
        password_confirmation: "",
      });
    }
    setErrors({});
  }, [professor, mode, isOpen]);

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

    if (!formData.area_atuacao.trim()) {
      newErrors.area_atuacao = "Área de atuação é obrigatória";
    }

    if (mode === "create") {
      if (!formData.password) {
        newErrors.password = "Senha é obrigatória";
      } else if (formData.password.length < 8) {
        newErrors.password = "Senha deve ter no mínimo 8 caracteres";
      }

      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = "As senhas não coincidem";
      }
    } else if (mode === "edit" && formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Senha deve ter no mínimo 8 caracteres";
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

    const professorData: Partial<Professor> = {
      name: formData.name,
      email: formData.email,
      area_atuacao: formData.area_atuacao,
    };

    // Adiciona senha apenas se foi preenchida
    if (formData.password) {
      professorData.password = formData.password;
      professorData.password_confirmation = formData.password_confirmation;
    }

    // Adiciona ID se for edição
    if (mode === "edit" && professor) {
      professorData.id = professor.id;
    }

    onSave(professorData as Omit<Professor, "id"> | Professor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header do modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            {mode === "create" ? "Novo Professor" : "Editar Professor"}
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
                placeholder="Nome completo do professor"
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

          {/* Área de Atuação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área de Atuação *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.area_atuacao}
                onChange={(e) =>
                  setFormData({ ...formData, area_atuacao: e.target.value })
                }
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.area_atuacao ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: Matemática, Física, Programação"
              />
            </div>
            {errors.area_atuacao && (
              <p className="text-red-500 text-xs mt-1">{errors.area_atuacao}</p>
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
              placeholder="Mínimo 8 caracteres"
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
  professorName: string;
}

// Dialog de confirmação de remoção
function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  professorName,
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
          Tem certeza que deseja remover o professor{" "}
          <span className="font-semibold text-gray-900">{professorName}</span>?
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

// Componente principal da página de gerenciamento de professores
export default function Teachers() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState<Professor | null>(null);

  // Carrega os professores ao montar o componente
  useEffect(() => {
    loadProfessors();
  }, []);

  // Função para carregar todos os professores
  async function loadProfessors() {
    setLoading(true);
    try {
      const data = await getAllProfessors();
      setProfessors(data);
    } catch (error) {
      setNotification({
        message: "Erro ao carregar professores",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  // Abre o modal de criação
  function handleCreate() {
    setSelectedProfessor(null);
    setModalMode("create");
    setIsModalOpen(true);
  }

  // Abre o modal de edição
  function handleEdit(professor: Professor) {
    setSelectedProfessor(professor);
    setModalMode("edit");
    setIsModalOpen(true);
  }

  // Abre o dialog de confirmação de remoção
  function handleDeleteClick(professor: Professor) {
    setProfessorToDelete(professor);
    setIsDeleteDialogOpen(true);
  }

  // Confirma a remoção do professor
  async function confirmDelete() {
    if (!professorToDelete) return;

    try {
      await deleteProfessor(professorToDelete.id);
      setIsDeleteDialogOpen(false);
      setProfessorToDelete(null);

      // Recarrega a lista de professores
      await loadProfessors();

      setNotification({
        message: "Professor removido com sucesso!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Erro ao remover professor",
        type: "error",
      });
      setIsDeleteDialogOpen(false);
      setProfessorToDelete(null);
    }
  }

  // Salva o professor (criação ou edição)
  async function handleSave(professorData: Omit<Professor, "id"> | Professor) {
    try {
      if (modalMode === "create") {
        await createProfessor(professorData as Omit<Professor, "id">);
      } else {
        const { id, ...dataToUpdate } = professorData as Professor;
        await updateProfessor(id, dataToUpdate);
      }

      // Fecha o modal
      setIsModalOpen(false);

      // Recarrega a lista de professores
      await loadProfessors();

      // Mostra notificação de sucesso
      setNotification({
        message: modalMode === "create"
          ? "Professor criado com sucesso!"
          : "Professor atualizado com sucesso!",
        type: "success",
      });
    } catch (error) {
      let errorMessage = "Erro ao salvar professor";
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

  // Filtra professores conforme o termo de busca
  const filteredProfessors = professors.filter((professor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      professor.name.toLowerCase().includes(searchLower) ||
      professor.email.toLowerCase().includes(searchLower) ||
      professor.area_atuacao.toLowerCase().includes(searchLower)
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
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            Gerenciamento de Professores
          </h1>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity shadow-md"
        >
          <Plus className="w-5 h-5" />
          Adicionar Professor
        </button>
      </div>

      {/* Barra de busca */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, área de atuação ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Tabela de professores */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Loading />
          </div>
        ) : filteredProfessors.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "Nenhum professor encontrado"
                : "Nenhum professor cadastrado"}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Tente ajustar o termo de busca"
                : "Clique em 'Adicionar Professor' para começar"}
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
                    <Mail className="w-4 h-4" />
                    E-mail
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Área de Atuação
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900 text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessors.map((professor) => (
                <TableRow
                  key={professor.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <TableCell className="font-medium text-gray-900">
                    {professor.name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {professor.email}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {professor.area_atuacao}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(professor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar professor"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(professor)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover professor"
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

      {/* Contador de professores */}
      {!loading && professors.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <GraduationCap className="w-5 h-5" />
            <span className="font-medium">
              {filteredProfessors.length} professor{filteredProfessors.length !== 1 ? "es" : ""}{" "}
              {searchTerm && `de ${professors.length}`}
            </span>
          </div>
        </div>
      )}

      {/* Modal de formulário */}
      <ProfessorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        professor={selectedProfessor}
        mode={modalMode}
      />

      {/* Dialog de confirmação de remoção */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProfessorToDelete(null);
        }}
        onConfirm={confirmDelete}
        professorName={professorToDelete?.name || ""}
      />
    </div>
  );
}
