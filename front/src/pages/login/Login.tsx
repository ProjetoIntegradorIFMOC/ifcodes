import { login } from "@/services/LoginService";
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import Notification from "@/components/Notification";
import { Eye, EyeOff, Terminal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUser();
  const navigate = useNavigate();

  function validateEmail(email: string) {
    if (!email) return "O email é obrigatório.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Digite um email válido.";
    return null;
  }

  function validatePassword(password: string) {
    if (!password) return "A senha é obrigatória.";
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    setIsLoading(true);
    try {
      const token = await login({ email, password });
      localStorage.setItem("auth_token", token);

      const [userRes, rolesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/user/roles`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      ]);

      const roles = rolesRes.data.roles || rolesRes.data || [];

      setUser({
        ...userRes.data,
        roles: roles,
      });

      if (userRes.data.must_change_password) {
        navigate("/change-password");
      } else {
        navigate("/home");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setError("Email ou Senha inválidos");
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        setError(`Um erro inesperado ocorreu: ${errorMessage}`);
        console.log("erro: ", error);
      }
    } finally {
      setIsLoading(false);
    }
    setEmail("");
    setPassword("");
  };

  return (
    <>
      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      <div className="min-h-screen flex">
        {/* Left panel — brand */}
        <div className="hidden lg:flex lg:w-[45%] bg-stone-900 relative overflow-hidden flex-col justify-between p-12">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Decorative terminal lines */}
          <div className="absolute bottom-0 left-0 right-0 p-12 opacity-[0.06] font-mono text-sm text-white leading-relaxed select-none pointer-events-none">
            <p>$ gcc solution.c -o solution</p>
            <p>$ ./solution &lt; input.txt</p>
            <p className="text-teal-400/40">All test cases passed.</p>
            <p>$ python3 main.py --test</p>
            <p className="text-teal-400/40">OK (12 tests)</p>
            <p>$ javac Main.java && java Main</p>
            <p className="text-teal-400/40">Accepted</p>
          </div>

          {/* Logo + tagline */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-2xl font-bold tracking-tight">
                IFCodes
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-white/90 text-3xl font-bold tracking-tight leading-tight max-w-sm">
              Pratique, submeta
              <br />e evolua.
            </h2>
            <p className="text-stone-400 text-sm mt-4 max-w-xs leading-relaxed">
              Plataforma de programação para submissão e avaliação automática de
              código.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden">
              <div className="w-8 h-8 rounded-md bg-stone-900 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <span className="text-stone-900 text-lg font-bold tracking-tight">
                IFCodes
              </span>
            </div>

            <div className="mb-8">
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                Entrar na sua conta
              </h1>
              <p className="text-sm text-stone-400 mt-1.5">
                Insira suas credenciais para acessar a plataforma.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="mb-1.5 text-stone-700">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="seu@email.com"
                  className={
                    emailError
                      ? "border-red-400 ring-2 ring-red-100"
                      : ""
                  }
                  aria-invalid={emailError ? true : undefined}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                />
                {emailError && (
                  <p className="text-sm text-red-600 mt-1.5">{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-stone-700">
                    Senha
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Sua senha"
                    className={`pr-10 ${
                      passwordError
                        ? "border-red-400 ring-2 ring-red-100"
                        : ""
                    }`}
                    aria-invalid={passwordError ? true : undefined}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={(e) =>
                      setPasswordError(validatePassword(e.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1.5">{passwordError}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
