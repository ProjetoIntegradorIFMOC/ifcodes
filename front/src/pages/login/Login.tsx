import { login } from "@/services/LoginService";
import { useState } from "react";
import showIcon from "@/assets/icons/password-show.svg";
import hideIcon from "@/assets/icons/password-hide.svg";
import ifCodes from "@/assets/icons/if-codes.png";
import { useNavigate, Link } from "react-router";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import Notification from "@/components/Notification";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
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

        try {
            const token = await login({ email, password });
            localStorage.setItem("auth_token", token);
            
            // Buscar dados do usuário e roles
            const [userRes, rolesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/api/user/roles`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                })
            ]);
            
            // Extrair roles da resposta
            const roles = rolesRes.data.roles || rolesRes.data || [];
            
            // Setar usuário com roles
            setUser({
                ...userRes.data,
                roles: roles
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
                const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
                setError(`Um erro inesperado ocorreu: ${errorMessage}`);
                console.log('erro: ', error);
            }
        }
        setEmail("");
        setPassword("");
    }

    return (
        <>
            {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
            <div className="w-full h-screen flex items-center justify-center bg-gray-100">
                <form className="bg-white p-6 rounded shadow-md w-full max-w-md"
                    onSubmit={handleSubmit}
                >
                    <div className="flex justify-center mb-2">
                        <img src={ifCodes} alt="IF Codes" width={200} height={200} />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            className={`mt-1 block w-full border rounded-md p-2 transition-all
                                ${emailError ? "border-red-500 ring-2 ring-red-400" : "border-gray-300"}
                            `}
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={e => setEmailError(validateEmail(e.target.value))}
                        />
                        {emailError && (
                            <span className="text-red-600 text-sm mt-1 block animate-pulse">{emailError}</span>
                        )}
                    </div>
                    <div className="mb-4 relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            className={`mt-1 block w-full border rounded-md p-2 pr-10 transition-all
                                ${passwordError ? "border-red-500 ring-2 ring-red-400" : "border-gray-300"}
                            `}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onBlur={e => setPasswordError(validatePassword(e.target.value))}
                        />
                        <span
                            className="absolute right-3 top-9 cursor-pointer select-none text-gray-500"
                            onClick={() => setShowPassword(v => !v)}
                            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                            <img
                                src={showPassword ? hideIcon : showIcon}
                                alt={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                width={20}
                                height={20}
                            />
                        </span>
                        {passwordError && (
                            <span className="text-red-600 text-sm mt-1 block animate-pulse">{passwordError}</span>
                        )}
                    </div>
                    <div className="mb-4 text-right">
                        <Link to="/forgot-password" className="text-sm text-purple-600 hover:underline">Esqueceu sua senha?</Link>
                    </div>
                    <button type="submit" className="w-full
                        bg-gradient-to-r from-purple-600 to-pink-600
                        rounded-lg
                        text-white
                        cursor-pointer
                        hover:from-purple-700 hover:to-pink-700
                        transition
                        duration-300
                        p-2"
                        >Login</button>
                </form>
            </div>
        </>
    )
}