import axios from "axios"

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

export const axiosInstance=axios.create({
    baseURL:apiUrl,
    withCredentials:true,
})