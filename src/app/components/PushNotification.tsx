"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PushNotification() {
  const { data: session } = useSession();

  useEffect(() => {

    const subscribe = async (userId : string) => {

      try {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.register("/service-worker.js");

		  const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
		  });

          await fetch("/api/notification/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, subscription }),
          });
        }
      } catch (error) {
        console.error("Push Notification Subscription Failed:", error);
      }
    };

    if (session) subscribe(session.user.id);
  }, [session]); // Dependency array agar tidak berjalan setiap render

  return null;
}
