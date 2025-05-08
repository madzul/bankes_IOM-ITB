import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PushNotification() {
  const { data: session } = useSession();

  useEffect(() => {
    async function subscribe() {
      try {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.register("/service-worker.js");

          // Check for existing subscription before subscribing
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            return; // Avoid redundant subscriptions
          }

          // Subscribe the user to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });

          // Send subscription to the backend
          const response = await fetch("/api/notification/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription }),
          });

          if (!response.ok) throw new Error("Failed to subscribe");
        }
      } catch (error) {
        console.error("Push Notification Subscription Failed:", error);
      }
    }

    if (session) {
      subscribe();
    }
  }, [session]); // Runs when session updates (on login/logout)

  return null;
}