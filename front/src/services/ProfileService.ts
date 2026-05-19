import axios from "axios";

export async function updateName(name: string) {
    const token = localStorage.getItem("auth_token");
    const res = await axios.patch(
        `/api/user`,
        { name },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            withCredentials: true,
        }
    );

    return res.data;
}
