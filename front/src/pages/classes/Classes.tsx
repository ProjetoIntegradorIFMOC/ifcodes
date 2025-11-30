import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Class, CreateClassDTO } from "@/types/classes";
import ClassesService from "@/services/ClassesService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loading from "@/components/Loading";
import Notification from "@/components/Notification";
import { Plus, Edit, Trash2, Users, Search, ArrowRight, UserPlus, GraduationCap } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/context/UserContext";

export default function Classes() {
  const navigate = useNavigate();
  const { hasAnyRole } = useUserRole();
  const { user } = useUser();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState<CreateClassDTO>({
    nome: "",
    professor_id: 0, // Será preenchido com o ID do professor logado
  });

  useEffect(() => {
    loadClasses();
    // Define o professor_id se o usuário logado for professor
    if (user && user.roles?.includes("professor")) {
      setFormData((prev) => ({ ...prev, professor_id: user.id }));
    }
  }, [user]);

  useEffect(() => {
    filterClasses();
  }, [searchTerm, classes]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      // Se o usuário logado for estudante, buscar apenas suas turmas
      if (user && user.roles && user.roles.includes("student")) {
        const data = await ClassesService.getClassesByStudent();
        setClasses(data);
        setFilteredClasses(data);
      } else {
        const data = await ClassesService.getAllClasses();
        setClasses(data);
        setFilteredClasses(data);
      }
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      showNotification("Erro ao carregar turmas", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    if (!searchTerm.trim()) {
      setFilteredClasses(classes);
      return;
    }

    const filtered = classes.filter((cls) =>
      cls.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClasses(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClass) {
        await ClassesService.updateClass(editingClass.id, formData);
        showNotification("Turma atualizada com sucesso!", "success");
      } else {
        await ClassesService.createClass(formData);
        showNotification("Turma criada com sucesso!", "success");
      }

      resetForm();
      loadClasses();
    } catch (error) {
      console.error("Erro ao salvar turma:", error);
      showNotification("Erro ao salvar turma", "error");
    }
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      nome: cls.nome,
      professor_id: cls.professor_id,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;

    try {
      await ClassesService.deleteClass(id);
      showNotification("Turma excluída com sucesso!", "success");
      loadClasses();
    } catch (error) {
      console.error("Erro ao excluir turma:", error);
      showNotification("Erro ao excluir turma", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      professor_id: user?.id || 0,
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          Turmas
          </h1>
        {hasAnyRole(["professor", "admin"]) && (
          <Button onClick={() => setShowForm(!showForm)} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Button>
        )}
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingClass ? "Editar Turma" : "Nova Turma"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="mb-2 block">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                  placeholder="Ex: Programação I"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-opacity shadow-md"
              >
                {editingClass ? "Atualizar" : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:bg-red-600 hover:text-white"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Turmas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchTerm
              ? "Nenhuma turma encontrada"
              : "Nenhuma turma cadastrada"}
          </div>
        ) : (
          filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{cls.nome}</h3>
                </div>
                {hasAnyRole(["professor", "admin"]) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hover:bg-blue-600 hover:text-white"
                      onClick={() => handleEdit(cls)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:bg-red-600 hover:text-white"
                      onClick={() => handleDelete(cls.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {cls.teacherName && (
                  <p>
                    <span className="font-semibold">Professor:</span>{" "}
                    {cls.teacherName}
                  </p>
                )}
                <div className="flex items-center gap-2 text-gray-600 pt-2">
                  <Users className="w-4 h-4" />
                  <span>{cls.studentsCount || 0} alunos</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/classes/${cls.id}`)}
                  className="w-full border border-blue-600 
                    text-blue-600 
                    rounded-lg 
                    transition-all 
                    duration-300 
                    hover:text-white 
                    hover:border-transparent 
                    hover:bg-gradient-to-r 
                    hover:from-blue-500 
                    hover:to-purple-500"
                >
                  Ver Detalhes
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {hasAnyRole(["professor", "admin"]) && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/classes/${cls.id}?tab=students`)}
                    className="w-full
                    bg-black 
                    text-white 
                    rounded-lg 
                    transition-all 
                    duration-300 
                    hover:bg-white 
                    hover:text-black 
                    border 
                    border-black"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Gerenciar Alunos
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
