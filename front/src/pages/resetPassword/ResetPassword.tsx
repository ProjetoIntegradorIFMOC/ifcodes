import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { resetPassword } from "@/services/ForgotPasswordService";
import Notification from "@/components/Notification";
import ifCodes from "@/assets/icons/if-codes.png";
import showIcon from "@/assets/icons/password-show.svg";
import hideIcon from "@/assets/icons/password-hide.svg";
import axios from "axios";

export default function ResetPassword() {
    console.log("ResetPassword component rendering");
    const params = useParams();
    const token = params.token || params["*"];
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!token || !email) {
            setError("Link de redefinição inválido.");
            return;
        }

        if (password !== passwordConfirmation) {
            setError("As senhas não conferem.");
            return;
        }

        if (password.length < 8) {
            setError("A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await resetPassword({
                email,
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            setSuccess("Senha redefinida com sucesso! Redirecionando para o login...");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error) {
            console.error("Erro ao redefinir senha:", error);
            if (axios.isAxiosError(error)) {
                const data = error.response?.data;
                console.error("Status:", error.response?.status);
                console.error("Data:", data);

                if (data?.message) {
                    setError(data.message);
                } else if (data?.errors?.email) {
                    setError(data.errors.email[0]);
                } else if (data?.errors?.password) {
                    setError(data.errors.password[0]);
                } else if (data?.email) {
                    setError(Array.isArray(data.email) ? data.email[0] : data.email);
                } else {
                    setError("Ocorreu um erro ao redefinir a senha. Tente novamente.");
                }
            } else {
                setError("Ocorreu um erro inesperado.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
            {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}
            
            <div className="w-full h-screen flex items-center justify-center bg-gray-100">
                <form className="bg-white p-6 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
                    <div className="flex justify-center mb-6">
                        <img src={ifCodes} alt="IF Codes" width={200} height={200} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Redefinir Senha</h2>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-2.5"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <img src={showPassword ? hideIcon : showIcon} alt="Toggle password visibility" width={20} height={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? "Redefinindo..." : "Redefinir Senha"}
                    </button>
                </form>
            </div>
        </>
    );
}
