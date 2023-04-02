console.log("Service Worker Loaded...");

self.addEventListener("push", function (event) {
  console.log("Received notification...");

  const { title, ...options } = event.data.json();

  event.waitUntil(registation.showNotification(title, options));
});

self.addEventListener("notificationClick", function (event) {
  const { url } = event.notification.data;

  event.notification.close();

  event.waitUntil(clients.openWindow(url));
});
