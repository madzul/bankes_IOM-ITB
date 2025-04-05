self.addEventListener("push", (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/logoIOM.png",
    data: {
      url: data.url, // Store the URL in notification data
      notificationId: data.notificationId,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  const { notification } = event;
  const url = notification.data?.url;

  event.notification.close();

  if (url) {
    event.waitUntil(
      (async () => {
        // Attempt to mark notification as read
        const notificationId = notification.data?.notificationId;
        if (notificationId) {
          await fetch(`/api/notification/${notificationId}/read`, {
            method: "PATCH",
          });
        }

        // Focus if tab is open, else open new tab
        const allClients = await clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        const client = allClients.find((c) => c.url === url);

        if (client) {
          client.focus();
        } else {
          await clients.openWindow(url);
        }
      })()
    );
  }
});
