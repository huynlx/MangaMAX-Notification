import { Slide, ToastOptions } from "react-toastify";

export const toastifyDefaultConfig = {
  position: "top-right",
  autoClose: 2000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  progress: undefined,
  theme: "dark",
  transition: Slide,
} as ToastOptions<{}>;

export const SERVICE_WORKER = "serviceWorker";

export const PUSH_MANAGER = "PushManager";

export const PUBLIC_VALID_KEY = import.meta.env.VITE_VAPID_KEY;

export const PUBLIC_SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const AXIOS_REQUEST_METHOD = {
  POST: 'post',
  GET: 'get',
  PATCH: 'patch',
  PUT: 'put',
  DELETE: 'delete',
};

