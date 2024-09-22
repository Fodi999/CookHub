const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");
const multer = require("multer"); // Для загрузки файлов
const { check, validationResult } = require("express-validator");
const User = require("./models/user");
const Message = require("./models/message"); // Модель сообщений
const Koa = require("koa");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Подключение к MongoDB
mongoose.connect("mongodb://localhost/chat_app")

    .then(() => console.log("Успешное подключение к MongoDB"))
    .catch((err) => console.error("Ошибка подключения к MongoDB:", err));

// Настройка middleware для Express
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Папка для статики

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Папка для EJS шаблонов

// Генерация уникального ключа
function generateUniqueKey() {
    return crypto.randomBytes(16).toString("hex");
}

// Middleware для передачи данных пользователя в шаблоны
app.use((req, res, next) => {
    res.locals.user = req.cookies.userKey ? { uniqueKey: req.cookies.userKey } : null;
    next();
});

// Middleware для авторизации
function isAuthenticated(req, res, next) {
    if (req.cookies.userKey) {
        return next();
    }
    res.redirect("/login");
}

// Middleware для проверки роли администратора
function isAdmin(req, res, next) {
    if (req.cookies.userKey) {
        User.findOne({ uniqueKey: req.cookies.userKey })
            .then(user => {
                if (user && user.role === 'admin') {
                    return next();
                } else {
                    return res.status(403).send("Доступ запрещен");
                }
            })
            .catch(err => res.status(500).send("Ошибка сервера"));
    } else {
        res.redirect("/login");
    }
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/'); // Папка для сохранения файлов
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Маршрут для страницы регистрации (GET)
app.get("/register", (req, res) => {
    res.render("register/register"); // Рендеринг шаблона register.ejs
});

// Маршрут регистрации (POST) с валидацией
app.post("/register", [
    check('name').notEmpty().withMessage('Имя обязательно.'),
    check('role').isIn(['user', 'admin', 'moderator']).withMessage('Недопустимая роль.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let { name, role } = req.body;

        // Добавляем символ @ в начало, если его нет
        if (!name.startsWith('@')) {
            name = '@' + name;
        }

        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).send("Пользователь с таким именем уже существует.");
        }

        const uniqueKey = generateUniqueKey();
        const newUser = new User({ name, uniqueKey, role });
        await newUser.save();

        const welcomeMessage = new Message({
            username: name,
            message: `${name} присоединился к чату!`
        });
        await welcomeMessage.save();

        res.cookie("userKey", uniqueKey, { httpOnly: true });
        res.redirect(`/dashboard/${uniqueKey}`);
    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        res.status(500).send("Произошла ошибка при регистрации.");
    }
});

// Маршрут для главной страницы
app.get("/", async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.render("home", { messages });
    } catch (error) {
        res.status(500).send("Ошибка загрузки сообщений.");
    }
});

// Маршрут для страницы входа (GET)
app.get("/login", (req, res) => {
    res.render("login/login");
});

app.post("/login", async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await User.findOne({ uniqueKey });

        if (!user) {
            return res.status(404).send("Пользователь не найден");
        }

        res.cookie("userKey", uniqueKey, { httpOnly: true });
        res.redirect(`/dashboard/${user.uniqueKey}`);
    } catch (error) {
        console.error("Ошибка при входе:", error);
        res.status(500).send("Произошла ошибка при входе.");
    }
});

// Личный кабинет пользователя
app.get("/dashboard/:key", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ uniqueKey: req.params.key });

        // Получаем посты для ленты (замени на нужную логику для постов)
        const posts = await Message.find().sort({ createdAt: -1 }); // Здесь ты можешь фильтровать посты по пользователю

        if (user.role === "admin") {
            const allUsers = await User.find();
            res.render("admin/adminDashboard", { user, allUsers, posts });
        } else {
            res.render("dashboard/dashboard", { user, posts }); // Передаем `posts` в шаблон
        }
    } catch (error) {
        console.error("Ошибка при загрузке личного кабинета:", error);
        res.status(500).send("Ошибка при загрузке личного кабинета.");
    }
});


// Маршрут для обновления профиля через AJAX или форму
app.post('/update-profile', upload.single('profile-image'), async (req, res) => {
    try {
        const { name, bio, link } = req.body;
        const profileImage = req.file ? '/uploads/' + req.file.filename : null;

        const user = await User.findOne({ uniqueKey: req.cookies.userKey });

        if (user) {
            user.name = name;
            user.bio = bio;
            user.link = link;
            if (profileImage) {
                user.profileImage = profileImage;
            }
            await user.save();

            // Возвращаем обновлённые данные в формате JSON
            res.json({
                name: user.name,
                bio: user.bio,
                link: user.link,
                profileImage: user.profileImage
            });
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        res.status(500).json({ error: 'Ошибка при обновлении профиля' });
    }
});




// Администраторская панель
app.get("/admin", isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.render("admin/adminDashboard", { users });
    } catch (error) {
        res.status(500).send("Ошибка загрузки администраторской панели.");
    }
});

// Маршрут для страницы чата
app.get("/chat", isAuthenticated, (req, res) => {
    res.render("chat/chat");
});

// Подключение Socket.io для чата
io.on("connection", (socket) => {
    console.log("Новый пользователь подключился");

    socket.on("sendMessage", (message) => {
        io.emit("message", message); // Отправляем сообщение всем подключённым клиентам
    });

    socket.on("disconnect", () => {
        console.log("Пользователь отключился");
    });
});

// Запуск сервера Express
server.listen(3000, () => {
    console.log("Express сервер запущен на http://localhost:3000");
});

// Дополнительный Koa сервер
const koaApp = new Koa();
koaApp.use(async (ctx) => {
    ctx.body = "Привет от Koa!";
});
koaApp.listen(4000, () => {
    console.log("Koa сервер запущен на http://localhost:4000");
});



