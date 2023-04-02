import { toast } from "react-toastify";

// constants
import { PUBLIC_VALID_KEY, toastifyDefaultConfig } from "~/constants";

// types
import { Subscription } from "~/shared/types";

export const register = async () => {
  try {
    const register = await navigator.serviceWorker.register("/worker.js");

    let subscription = await register.pushManager.getSubscription();

    if (!subscription) {
      subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: PUBLIC_VALID_KEY,
      });
    }

    console.log("Registered service worker");

    return subscription;
  } catch (error) {
    console.log("Register service worker failed:", error);
  }
};

export const handleRegistration = async (): Promise<Subscription> => {
  try {
    const subscription = await register();
    const parsed = JSON.parse(JSON.stringify(subscription));
    const { expirationTime, ...rest } = parsed;

    return rest;
  } catch (error) {
    toast.error(
      "Có lỗi xảy ra khi yêu cầu quyền thông báo",
      toastifyDefaultConfig
    );

    throw new Error("Something went wrong");
  }
};
