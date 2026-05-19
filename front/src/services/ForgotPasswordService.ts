import axios from "axios";
import Cookies from "js-cookie";

export async function sendForgotPasswordEmail(email: string): Promise<void> {
    await axios.get(`/sanctum/csrf-cookie`, {
        withCredentials: true
    });

    await axios.post(`/api/forgot-password-temp`, {
        email
    }, {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN')
        }
    });
}

export async function resetPassword(data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}): Promise<void> {
    await axios.get(`/sanctum/csrf-cookie`, {
        withCredentials: true
    });

    await axios.post(`/reset-password`, data, {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN')
        }
    });
}
