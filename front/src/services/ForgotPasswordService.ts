import axios from "axios";
import Cookies from "js-cookie";

export async function sendForgotPasswordEmail(email: string): Promise<void> {
    await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true
    });

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/forgot-password-temp`, {
            email
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN')
            }
        });
    } catch (error) {
        throw error;
    }
}

export async function resetPassword(data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}): Promise<void> {
    await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true
    });

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/reset-password`, data, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN')
            }
        });
    } catch (error) {
        throw error;
    }
}
