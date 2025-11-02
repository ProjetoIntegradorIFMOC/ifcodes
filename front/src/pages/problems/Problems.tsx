import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, Clock, HardDrive, X, BookOpen, Search, Codesandbox } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAllProblems, createProblem, updateProblem, deleteProblem, getProblemById } from "@/services/ProblemsServices";
import type { Problem } from "@/types";
import Notification from "@/components/Notification";
import { ProblemCard } from "@/components/ProblemCard";
import { useUser } from "@/context/UserContext";
import ProblemViewModal from "@/components/ProblemViewModal";

interface TestCase {
  entrada: string;
  saida: string;
  privado: boolean;
}

interface ProblemFormData {
  titulo: string;
  enunciado: string;
  tempo_limite: number;
  memoria_limite: number;
  casos_teste: TestCase[];
  created_by?: number;
}

// Modal simples para formulário
interface ProblemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProblemFormData) => void;
  problem: Problem | null;
  mode: "create" | "edit";
}

function ProblemFormModal({ isOpen, onClose, onSave, problem, mode }: ProblemFormModalProps) {
  const [formData, setFormData] = useState<ProblemFormData>({
    titulo: "",
    enunciado: "",
    tempo_limite: 1,
    memoria_limite: 512,
    casos_teste: [{ entrada: "", saida: "", privado: false }]
  });
  
  const [errors, setErrors] = useState<{
    titulo?: string;
    enunciado?: string;
    tempo_limite?: string;
    memoria_limite?: string;
  }>({});
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (problem && mode === "edit") {
      setFormData({
        titulo: problem.title,
        enunciado: problem.statement,
        tempo_limite: problem.timeLimitMs,
        memoria_limite: problem.memoryLimitKb,
        casos_teste: problem.testCases?.map(tc => ({
          entrada: tc.input,
          saida: tc.expectedOutput,
          privado: tc.private
        })) || [{ entrada: "", saida: "", privado: false }]
      });
    } else {
      setFormData({
        titulo: "",
        enunciado: "",
        tempo_limite: 1000,
        memoria_limite: 512,
        casos_teste: [{ entrada: "", saida: "", privado: false }]
      });
    }
    // Resetar erros quando o modal abrir
    setErrors({});
    setNotification(null);
  }, [problem, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Validar título
    if (!formData.titulo.trim()) {
      newErrors.titulo = "O título é obrigatório";
    } else if (formData.titulo.length < 3) {
      newErrors.titulo = "O título deve ter pelo menos 3 caracteres";
    } else if (formData.titulo.length > 200) {
      newErrors.titulo = "O título não pode ter mais de 200 caracteres";
    }
    
    // Validar enunciado
    let plainText = '';
    try {
      if (formData.enunciado) {
        const parsed = JSON.parse(formData.enunciado);
        plainText = parsed.blocks?.map((b: any) => b.text).join('').trim() || '';
      }
    } catch (e) {
      plainText = formData.enunciado.trim();
    }
    
    if (!plainText) {
      newErrors.enunciado = "O enunciado é obrigatório";
    } else if (plainText.length < 10) {
      newErrors.enunciado = "O enunciado deve ter pelo menos 10 caracteres";
    } else if (plainText.length > 10000) {
      newErrors.enunciado = "O enunciado não pode ter mais de 10000 caracteres";
    }
    
    // Validar tempo limite
    if (!formData.tempo_limite || formData.tempo_limite < 100) {
      newErrors.tempo_limite = "O tempo limite deve ser no mínimo 100ms";
    } else if (formData.tempo_limite > 30000) {
      newErrors.tempo_limite = "O tempo limite não pode ser maior que 30000ms (30s)";
    }
    
    // Validar memória limite
    if (!formData.memoria_limite || formData.memoria_limite < 128) {
      newErrors.memoria_limite = "A memória limite deve ser no mínimo 128KB";
    } else if (formData.memoria_limite > 1048576) {
      newErrors.memoria_limite = "A memória limite não pode ser maior que 1048576KB (1GB)";
    }
    
    // Validar casos de teste
    for (let i = 0; i < formData.casos_teste.length; i++) {
      const tc = formData.casos_teste[i];
      if (!tc.entrada.trim() || !tc.saida.trim()) {
        setNotification({ 
          type: 'error', 
          message: `Caso de teste ${i + 1}: entrada e saída são obrigatórias` 
        });
        return false;
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      setNotification({ type: 'error', message: firstError });
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setErrors({});
    setNotification(null);
    onSave(formData);
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      casos_teste: [...prev.casos_teste, { entrada: "", saida: "", privado: false }]
    }));
  };

  const removeTestCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      casos_teste: prev.casos_teste.filter((_, i) => i !== index)
    }));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      casos_teste: prev.casos_teste.map((tc, i) => 
        i === index ? { ...tc, [field]: value } : tc
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === "edit" ? "Editar Problema" : "Novo Problema"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, titulo: e.target.value }));
                  if (errors.titulo) setErrors(prev => ({ ...prev, titulo: undefined }));
                }}
                className={errors.titulo ? "border-red-500" : ""}
                required
              />
              {errors.titulo && (
                <p className="text-sm text-red-600 mt-1">{errors.titulo}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="enunciado">Enunciado *</Label>
              <RichTextEditor
                value={formData.enunciado}
                onChange={(content) => {
                  setFormData(prev => ({ ...prev, enunciado: content }));
                  if (errors.enunciado) setErrors(prev => ({ ...prev, enunciado: undefined }));
                }}
                className="mt-2"
                maxLength={10000}
                onError={(error) => {
                  if (error) {
                    setNotification({ type: 'error', message: error });
                  }
                }}
                error={errors.enunciado}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tempo_limite">Tempo Limite (ms) *</Label>
                <Input
                  id="tempo_limite"
                  type="number"
                  min="100"
                  max="30000"
                  value={formData.tempo_limite}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, tempo_limite: parseInt(e.target.value) || 0 }));
                    if (errors.tempo_limite) setErrors(prev => ({ ...prev, tempo_limite: undefined }));
                  }}
                  className={errors.tempo_limite ? "border-red-500" : ""}
                  required
                />
                {errors.tempo_limite && (
                  <p className="text-sm text-red-600 mt-1">{errors.tempo_limite}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="memoria_limite">Memória Limite (KB) *</Label>
                <Input
                  id="memoria_limite"
                  type="number"
                  min="128"
                  max="1048576"
                  value={formData.memoria_limite}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, memoria_limite: parseInt(e.target.value) || 0 }));
                    if (errors.memoria_limite) setErrors(prev => ({ ...prev, memoria_limite: undefined }));
                  }}
                  className={errors.memoria_limite ? "border-red-500" : ""}
                  required
                />
                {errors.memoria_limite && (
                  <p className="text-sm text-red-600 mt-1">{errors.memoria_limite}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <Label>Casos de Teste *</Label>
                <Button type="button" onClick={addTestCase} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Caso
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.casos_teste.map((testCase, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Caso de Teste {index + 1}</h4>
                      {formData.casos_teste.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Entrada</Label>
                        <Textarea
                          value={testCase.entrada}
                          onChange={(e) => updateTestCase(index, 'entrada', e.target.value)}
                          rows={3}
                          required
                        />
                      </div>
                      <div>
                        <Label>Saída Esperada</Label>
                        <Textarea
                          value={testCase.saida}
                          onChange={(e) => updateTestCase(index, 'saida', e.target.value)}
                          rows={3}
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`privado-${index}`}
                          checked={testCase.privado}
                          onChange={(e) => updateTestCase(index, 'privado', e.target.checked)}
                        />
                        <Label htmlFor={`privado-${index}`}>Caso de teste privado</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity"
              >
                {mode === "edit" ? "Atualizar" : "Criar"} Problema
              </button>
            </div>
          </form>
          
          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}



// Modal de confirmação de exclusão
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  problemTitle: string;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, problemTitle }: DeleteConfirmModalProps) {
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
          Tem certeza que deseja excluir o problema{" "}
          <span className="font-semibold text-gray-900">"{problemTitle}"</span>?
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

export default function Problems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [viewingProblem, setViewingProblem] = useState<Problem | null>(null);
  const [deletingProblem, setDeletingProblem] = useState<Problem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const { user } = useUser();

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const data = await getAllProblems();
      setProblems(data);
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao carregar problemas' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSave = async (data: ProblemFormData) => {
    try {
      if (editingProblem) {
        const result = await updateProblem(editingProblem.id, data);
        if (result) {
          setNotification({ type: 'success', message: 'Problema atualizado com sucesso!' });
          loadProblems();
        } else {
          setNotification({ type: 'error', message: 'Erro ao atualizar problema' });
        }
      } else {
        const result = await createProblem({ ...data, created_by: user?.id });
        if (result) {
          setNotification({ type: 'success', message: 'Problema criado com sucesso!' });
          loadProblems();
        } else {
          setNotification({ type: 'error', message: 'Erro ao criar problema' });
        }
      }
      
      setIsFormModalOpen(false);
      setEditingProblem(null);
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao salvar problema' });
    }
  };

  const handleEdit = async (problem: Problem) => {
    try {
      const fullProblem = await getProblemById(problem.id.toString());
      if (fullProblem) {
        setEditingProblem(fullProblem);
        setIsFormModalOpen(true);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao carregar dados do problema' });
    }
  };

  const handleView = async (problem: Problem) => {
    try {
      const fullProblem = await getProblemById(problem.id.toString());
      if (fullProblem) {
        setViewingProblem(fullProblem);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao carregar problema' });
    }
  };

  const handleDeleteClick = (problem: Problem) => {
    setDeletingProblem(problem);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingProblem) {
      try {
        const success = await deleteProblem(deletingProblem.id);
        if (success) {
          setNotification({ type: 'success', message: 'Problema excluído com sucesso!' });
          loadProblems();
        } else {
          setNotification({ type: 'error', message: 'Erro ao excluir problema' });
        }
      } catch (error) {
        setNotification({ type: 'error', message: 'Erro ao excluir problema' });
      }
    }
    setIsDeleteModalOpen(false);
    setDeletingProblem(null);
  };

  // Filtra problemas conforme o termo de busca
  const filteredProblems = problems.filter((problem) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      problem.title.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Codesandbox className="w-6 h-6 text-white" />
            </div>
            Gerenciamento de Problemas
          </h1>
        </div>

        <button
          onClick={() => {
            setEditingProblem(null);
            setIsFormModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity shadow-md"
        >
          <Plus className="w-5 h-5" />
          Adicionar Problema
        </button>
      </div>

      {/* Barra de busca */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título do problema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Lista de Problemas */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <Codesandbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "Nenhum problema encontrado"
                : "Nenhum problema cadastrado"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "Tente ajustar o termo de busca"
                : "Clique em 'Adicionar Problema' para começar"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contador de problemas */}
      {!loading && problems.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Codesandbox className="w-5 h-5" />
            <span className="font-medium">
              {filteredProblems.length} problema{filteredProblems.length !== 1 ? "s" : ""}{" "}
              {searchTerm && `de ${problems.length}`}
            </span>
          </div>
        </div>
      )}

      {/* Modais */}
      <ProblemFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProblem(null);
        }}
        onSave={handleFormSave}
        problem={editingProblem}
        mode={editingProblem ? "edit" : "create"}
      />

      <ProblemViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingProblem(null);
        }}
        problem={viewingProblem}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingProblem(null);
        }}
        onConfirm={handleDeleteConfirm}
        problemTitle={deletingProblem?.title || ""}
      />
    </div>
  );
}
