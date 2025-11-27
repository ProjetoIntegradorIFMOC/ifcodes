import { useState } from "react";
import ifCodes from "@/assets/icons/if-codes.png";
import { useNavigate } from "react-router";
import axios from "axios";
import Notification from "@/components/Notification";
import { sendForgotPasswordEmail } from "@/services/ForgotPasswordService";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function validateEmail(email: string) {
        if (!email) return "O email é obrigatório.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Digite um email válido.";
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailErr = validateEmail(email);
        setEmailError(emailErr);

        if (emailErr) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await sendForgotPasswordEmail(email);
            setSuccess("Se o e-mail estiver cadastrado, você receberá uma senha temporária em breve.");
            setEmail("");
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setError("Erro de validação. Verifique o e-mail.");
            } else {
                const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
                setError(`Um erro inesperado ocorreu: ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
            {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}
            
            <div className="w-full h-screen flex items-center justify-center bg-gray-100">
                <form className="bg-white p-6 rounded shadow-md w-full max-w-md"
                    onSubmit={handleSubmit}
                >
                    <div className="mb-4">
                        <button 
                            type="button" 
                            onClick={() => navigate("/login")}
                            className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
                        >
                            <ArrowLeft size={20} className="mr-1" />
                            Voltar para Login
                        </button>
                    </div>

                    <div className="flex justify-center mb-2">
                        <img src={ifCodes} alt="IF Codes" width={200} height={200} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Recuperar Senha</h2>
                    
                    <p className="text-gray-600 text-center mb-6">
                        Digite seu e-mail abaixo e enviaremos uma senha temporária para você.
                    </p>

                    <div className="mb-6">
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
                            placeholder="seu@email.com"
                        />
                        {emailError && (
                            <span className="text-red-600 text-sm mt-1 block animate-pulse">{emailError}</span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full rounded-lg text-white p-2 transition duration-300
                            ${loading 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 cursor-pointer"
                            }
                        `}
                    >
                        {loading ? "Enviando..." : "Enviar Senha Temporária"}
                    </button>
                </form>
            </div>
        </>
    )
}
