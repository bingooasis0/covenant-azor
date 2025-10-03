import Axios from "axios";
const baseURL = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const http = Axios.create({
  baseURL,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});
export default http;
