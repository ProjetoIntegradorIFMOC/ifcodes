import type { ChangePasswordRequest } from "@/types";
import axios from "axios";
import Cookies from "js-cookie";

export async function changePassword({ 
    currentPassword, 
    newPassword, 
    newPasswordConfirmation 
}: ChangePasswordRequest): Promise<void> {
    
    await axios.get(`/sanctum/csrf-cookie`, {
        withCredentials: true
    });

    await axios.post(`/api/user/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation
    }, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN')
        }
    });
}
