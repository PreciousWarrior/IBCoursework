import axios from "axios";

const baseURL = "http://127.0.0.1:3000";

export const raw = axios.create({
  baseURL,
});

export let authenticated = null;

export function getImage(id) {
  return `${baseURL}/static/${id}.png`;
}

export function buildAuthenticated() {
  authenticated = axios.create({
    baseURL,
    headers: { passkey: localStorage.getItem("passkey") },
  });
}
