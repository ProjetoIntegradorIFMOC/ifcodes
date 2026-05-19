import { useUser } from "@/context/UserContext";
import type { User } from "@/types";
import {
  User as UserIcon,
  Mail,
  Shield,
  Loader2,
  KeyRound,
  Pencil,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import axios from "axios";
import { updateName } from "@/services/ProfileService";
import Notification from "@/components/Notification";
import { SectionCard } from "@/components/SectionCard";

export default function ProfileView() {
  const { user, loading, setUser } = useUser();
  const [notification, setNotification] = useState<
    | { type: "success" | "error" | "warning"; message: string }
    | null
  >(null);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <p className="text-sm text-stone-500 font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-stone-50 border border-dashed border-stone-200 rounded-xl py-12 text-center">
          <UserIcon className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600 mb-1">Perfil não encontrado</p>
          <p className="text-xs text-stone-400 mb-4">
            Ocorreu um problema ao carregar os dados. Tente fazer login novamente.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ── header ── */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Meu Perfil</h1>
        <p className="text-stone-400 text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* ── profile info ── */}
      <SectionCard title="Informações Pessoais" icon={UserIcon}>
        <div className="p-6">
          <ProfileHeader user={user} setUser={setUser} setNotification={setNotification} />
        </div>
      </SectionCard>

      {/* ── security ── */}
      <SectionCard title="Segurança" icon={Shield}>
        <div className="p-6">
          <SecuritySettings onChangePasswordClick={() => navigate("/change-password")} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── ProfileHeader ───────────────────────────────────── */

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
  const userInitial = displayName.charAt(0).toUpperCase();

  async function onSave() {
    try {
      setSaving(true);
      const data = await updateName(name);
      setUser({ ...user, name: data.name });
      setEditing(false);
      setNotification({ type: "success", message: "Nome atualizado com sucesso." });
    } catch (err: unknown) {
      console.error("Failed to update name", err);
      let msg = "Não foi possível atualizar o nome. Verifique e tente novamente.";

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data?.message === "string") {
          msg = data.message;
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
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      {/* Avatar */}
      <div className="shrink-0 w-20 h-20 rounded-xl bg-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
        {userInitial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
        {/* Name row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                className="flex-1 sm:flex-auto text-lg font-bold text-stone-900 border border-stone-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={name}
                onChange={(e) => setNameState(e.target.value)}
              />
              <button
                onClick={onSave}
                disabled={saving || name.trim() === ""}
                className="p-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Salvar"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setEditing(false); setNameState(user.name || ""); }}
                className="p-2.5 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 break-words">{displayName}</h2>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-stone-100 transition-colors"
                title="Editar nome"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-stone-500 min-w-0">
          <Mail className="w-4 h-4 text-stone-400 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>

        {/* Roles */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {user.roles.map((role) => (
            <span
              key={role}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 capitalize"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── SecuritySettings ────────────────────────────────── */

interface SecuritySettingsProps {
  onChangePasswordClick: () => void;
}

function SecuritySettings({ onChangePasswordClick }: SecuritySettingsProps) {
  return (
    <button
      onClick={onChangePasswordClick}
      className="group w-full flex items-center justify-between gap-4 text-left"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-stone-100 text-stone-500">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-800">Alterar senha</p>
          <p className="text-xs text-stone-400 mt-0.5">
            Mantenha sua conta segura atualizando sua senha regularmente
          </p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}
