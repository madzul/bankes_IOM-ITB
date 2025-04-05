import { useState, useEffect } from "react";
import {Bell} from "lucide-react";
import Link from "next/link";

interface IOM_Notification {
  notification_id: number;
  user_id: number;
  header: string;
  body: string;
  url: string | null;
  has_read: boolean;
  created_at: Date;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<IOM_Notification[]>([]);
  const [open, setOpen] = useState(false);
  const hasUnread = notifications.some((n) => !n.has_read);

  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch("/api/notification/get?userId=1");
      const data = (await res.json()) as { notifications: IOM_Notification[] };
      setNotifications(data.notifications); 
    }
    fetchNotifications();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-700 hover:text-black hover:cursor-pointer">
        <Bell className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
        )}
      </button>
      {open && (
        <div className="absolute -right-10 mt-2 w-80 max-h-100 overflow-y-auto bg-gray-50 shadow-lg rounded-lg p-4">
          <h2 className="text-lg font-bold text-main border-b pb-1">Notifikasi</h2>
          <div className="mt-2 space-y-2">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link
                  href={notif.url || "/#"}
                  key={notif.notification_id}
                  className="p-3 border-b last:border-none flex gap-2 items-start"
                  onClick={async () => {
                    setOpen(false);
                    await fetch(`/api/notification/${notif.notification_id}/read`, {
                      method: "PATCH",
                    });
                    setNotifications((prev) =>
                      prev.map((n: IOM_Notification) =>
                        n.notification_id === notif.notification_id
                          ? { ...n, has_read: true }
                          : n
                      )
                    );
                  }}
                >
                  <div className={`translate-y-2 min-w-2 min-h-2 rounded-full ${notif.has_read ? "bg-gray-400" : "bg-green-500"}`}/>
                  <div>
                    <p className="font-semibold text-gray-800">{notif.header}</p>
                    <p className="text-gray-600 text-sm">{notif.body}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Tidak ada notifikasi</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
