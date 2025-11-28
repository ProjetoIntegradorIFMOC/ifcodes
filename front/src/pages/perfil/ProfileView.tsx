import { useUser } from "@/context/UserContext";
import type { User } from "@/types";
import { User as UserIcon, Mail, Zap, Loader2, Key, Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import axios from "axios";
import { updateName } from "@/services/ProfileService";
import Notification from "@/components/Notification";

/**
 * Componente Principal: ProfileView
 * Orquestra os estados de loading, erro e sucesso.
 */
export default function ProfileView() {
  const { user, loading, setUser } = useUser();
  const [notification, setNotification] = useState<
    | { type: "success" | "error" | "warning"; message: string }
    | null
  >(null);
  const navigate = useNavigate();

  // 1. Estado de Carregamento
  if (loading) {
    return <LoadingState />;
  }

  // 2. Estado de Erro / Utilizador Não Encontrado
  if (!user) {
    return <ErrorState onNavigateLogin={() => navigate("/login")} />;
  }

  // 3. Estado de Sucesso
  return (
    <div className="px-4 md:px-8 min-h-screen">
      <div className="w-full mx-auto max-w-full sm:max-w-3xl bg-white shadow-2xl rounded-2xl p-6 md:p-10 border border-gray-100">
        
        <ProfileHeader user={user} setUser={setUser} setNotification={setNotification} />
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <SecuritySettings onChangePasswordClick={() => navigate("/change-password")} />

      </div>
    </div>
  );
}

// --- Subcomponentes ---

/**
 * Subcomponente: LoadingState
 * Exibe o spinner de carregamento centralizado.
 */
function LoadingState() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <p className="ml-3 text-lg text-gray-600">A carregar perfil...</p>
    </div>
  );
}

/**
 * Subcomponente: ErrorState
 * Exibe a mensagem de erro e um botão para voltar ao login.
 */
interface ErrorStateProps {
  onNavigateLogin: () => void;
}

function ErrorState({ onNavigateLogin }: ErrorStateProps) {
  return (
    <div className="text-center p-10 bg-white rounded-xl shadow-lg m-10">
      <h1 className="text-2xl font-bold text-red-600">
        Erro: Perfil não encontrado
      </h1>
      <p className="mt-2 text-gray-600">
        Ocorreu um problema ao carregar os dados do utilizador. Por favor,
        tente iniciar a sessão novamente.
      </p>
      <button type="button" onClick={onNavigateLogin}
        className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700"
      >
        Ir para Login
      </button>
    </div>
  );
}

/**
 * Subcomponente: ProfileHeader
 * Exibe o avatar, nome, email e roles do utilizador.
 */
interface ProfileHeaderProps {
  user: User;
  setUser: (user: User | null) => void;
  setNotification: (
    value: { type: "success" | "error" | "warning"; message: string } | null
  ) => void;
}

function ProfileHeader({ user, setUser, setNotification }: ProfileHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [name, setNameState] = useState(user.name || "");
  const [saving, setSaving] = useState(false);

  const displayName = editing ? name : user.name || `Usuário #${user.id}`;

  async function onSave() {
    const token = localStorage.getItem("auth_token") || "";
    try {
      setSaving(true);
      const data = await updateName(name, token);
      setUser({ ...user, name: data.name });
      setEditing(false);
      // setNotification é obrigatório pela interface -> chamar diretamente
      setNotification({ type: "success", message: "Nome atualizado com sucesso." });
    } catch (err: unknown) {
      console.error("Failed to update name", err);
      let msg = "Não foi possível atualizar o nome. Verifique e tente novamente.";

      // Se for um erro do Axios, tentar extrair a mensagem retornada pelo servidor
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as unknown;
        if (data && typeof data === "object" && "message" in (data as any) && typeof (data as any).message === "string") {
          msg = (data as any).message;
        } else if (err.message) {
          msg = err.message;
        }
      } else if (err instanceof Error) {
        msg = err.message || msg;
      }

      setNotification({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 border-b pb-6 mb-8">
      {/* Imagem/Avatar */}
      <div className="flex-shrink-0 w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-xl ring-4 ring-purple-100">
          {displayName ? displayName[0].toUpperCase() : <UserIcon className="w-10 h-10" />}
        </div>

      {/* Informações Básicas e Status */}
      <div className="text-center sm:text-left w-full flex-1 min-w-0">
        {/* Use column on small screens to avoid overflow; on sm+ keep row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center sm:justify-start gap-3">
          {editing ? (
            <input
              className="w-full sm:w-auto text-2xl sm:text-2xl font-extrabold text-gray-900 leading-tight border-b px-2 py-1"
              value={name}
              onChange={(e) => setNameState(e.target.value)}
            />
          ) : (
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight break-words">
              {displayName}
            </h1>
          )}

          {!editing ? (
            <div className="w-full sm:w-auto flex justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="ml-0 sm:ml-2 p-2 rounded-full bg-purple-600 text-white flex items-center justify-center"
                aria-label="Editar nome"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || name.trim() === ""}
                className={`w-full sm:w-auto px-3 py-1 text-sm font-medium rounded-md text-white text-center ${
                  saving || name.trim() === "" ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {saving ? "A gravar..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setNameState(user.name || "");
                }}
                className="w-full sm:w-auto px-3 py-1 text-sm font-medium rounded-md bg-gray-200 text-center"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      
        <p className="flex items-center justify-center sm:justify-start text-lg text-gray-600 mt-1">
          <Mail className="w-4 h-4 mr-2 text-purple-600" /> {user.email}
        </p>

        {/* Status (Roles) */}
        <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
          {user.roles.map((role) => (
            <span
              key={role}
              className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 shadow-sm flex items-center"
            >
              <Zap className="w-3 h-3 mr-1" />
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Subcomponente: SecuritySettings
 * Exibe as ações de segurança (como alterar senha) e informações técnicas.
 */
interface SecuritySettingsProps {
  onChangePasswordClick: () => void;
}

function SecuritySettings({ onChangePasswordClick }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
        Configurações e Segurança
      </h2>

      {/* Alterar Senha */}
      <div className="p-4 bg-red-50 rounded-lg shadow-sm border border-red-200">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
          <div className="flex items-start sm:items-center gap-4 flex-1">
            <Key className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-base font-medium text-gray-700">Alterar senha</p>
              <p className="text-sm text-gray-500">
                Mantenha a sua conta segura, atualizando a sua password regularmente.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={onChangePasswordClick}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md"
            >
              Mudar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}