// Descomentar essa linha quando não for mais simulação
// import { useUser } from "@/context/UserContext";
import type { User } from "@/types";
import { User as UserIcon, Mail, Zap, Loader2, Key } from "lucide-react";
// Remover essa linha quando não for mais simulação
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

// --- Simulação de Usuário (Remover posteriormente) ---
const mockUser: User = {
  id: 12345,
  name: "João Silva",
  email: "joao.silva@exemplo.com",
  roles: ["Administrador"],
};

function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simula sucesso
      setUser(mockUser);
      setLoading(false);

      // Para simular erro, comente as duas linhas acima e descomente as duas abaixo
      // setUser(null);
      // setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { user, loading };
}
// --- Fim da Simulação ---

/**
 * Componente Principal: ProfileView
 * Orquestra os estados de loading, erro e sucesso.
 */
export default function ProfileView() {
  // A chamada ao useUser agora funciona com a simulação local, remover essa linha posteriormente
  const { user, loading } = useUser();
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
    <div className="container mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl p-6 md:p-10 border border-gray-100">
        
        <ProfileHeader user={user} />

        <SecuritySettings
          user={user}
          onChangePasswordClick={() => navigate("/change-password")}
        />

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
}

function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 border-b pb-6 mb-8">
      {/* Imagem/Avatar */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-xl ring-4 ring-purple-100">
        {user.name ? (
          user.name[0].toUpperCase()
        ) : (
          <UserIcon className="w-10 h-10" />
        )}
      </div>

      {/* Informações Básicas e Status */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          {user.name || `Usuário #${user.id}`}
        </h1>
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
  user: User;
  onChangePasswordClick: () => void;
}

function SecuritySettings({ user, onChangePasswordClick }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
        Configurações e Segurança
      </h2>

      {/* Alterar Senha */}
      <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg shadow-sm border border-red-200">
        <div className="flex items-center">
          <Key className="w-5 h-5 text-red-600 mr-4" />
          <div>
            <p className="text-base font-medium text-gray-700">Alterar senha</p>
            <p className="text-sm text-gray-500">
              Mantenha a sua conta segura, atualizando a sua password
              regularmente.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangePasswordClick}
          className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md"
        >
          Mudar
        </button>
      </div>

      {/* Detalhes Técnicos */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Informação Técnica
        </h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <strong>ID Interno:</strong> {user.id}
          </p>
          <p>
            <strong>Data de Criação:</strong> Não disponível
          </p>
        </div>
      </div>
    </div>
  );
}