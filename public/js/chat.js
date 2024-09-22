const socket = io();

// Функция для отправки сообщения
function sendMessage() {
    const message = document.getElementById("message").value;
    if (message.trim() !== "") {
        socket.emit("sendMessage", message);
        document.getElementById("message").value = "";  // Очищаем поле ввода
    }
}

// Получение сообщений от сервера
socket.on("message", (message) => {
    const messages = document.getElementById("messages");
    const newMessage = document.createElement("li");
    newMessage.textContent = message;
    messages.appendChild(newMessage);
});

 