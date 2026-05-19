import axios from "axios";

export async function updateName(name: string, token: string) {
    const res = await axios.patch(
        `/api/user`,
        { name },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        }
    );

    return res.data;
}
