import type { LoginRequest } from "@/types";
import axios from "axios";
import Cookies from "js-cookie";

export async function login({ email, password }: LoginRequest): Promise<string>{

    await axios.get(`/sanctum/csrf-cookie`, {
        withCredentials: true
    });


    const res = await axios.post(`/login`, {
        email,
        password
    }, {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN')
        }
    })
    return res.data.token;
}
