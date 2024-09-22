// Сообщение о загрузке личного кабинета
console.log("Личный кабинет загружен!");

// Логика для открытия и закрытия модального окна

// Открыть модальное окно
function openModal() {
    const modal = document.getElementById("profileModal");
    if (modal) {
        modal.style.display = "flex"; // Открыть модальное окно
    }
}

// Закрыть модальное окно
function closeModal() {
    const modal = document.getElementById("profileModal");
    if (modal) {
        modal.style.display = "none"; // Закрыть модальное окно
    }
}

// Обработка кнопки "Сменить профиль"
const changeProfileBtn = document.querySelector('.change-profile-btn');
if (changeProfileBtn) {
    changeProfileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openModal();
    });
}

// Закрытие модального окна при клике на кнопку "Отмена"
const closeBtn = document.querySelector('.btn-close');
if (closeBtn) {
    closeBtn.addEventListener('click', function() {
        closeModal();
    });
}

// Отправка данных профиля через AJAX
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch('/update-profile', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            // Проверка и обновление имени
            if (data.name) {
                const nameElement = document.querySelector('.profile .info p:nth-of-type(1) strong');
                if (nameElement) {
                    nameElement.innerText = '@' + data.name.replace(/^@/, ''); // Убедиться, что имя начинается с '@'
                }
            }

            // Проверка и обновление биографии
            if (data.bio) {
                const bioElement = document.querySelector('.profile .info p:nth-of-type(2)');
                if (bioElement) {
                    bioElement.innerText = data.bio;
                }
            }

            // Проверка и обновление ссылки
            if (data.link) {
                let linkElement = document.querySelector('.profile-link');
                if (linkElement) {
                    // Обновляем существующую ссылку
                    linkElement.setAttribute('href', data.link);
                    linkElement.innerText = data.link; // Отображаем полный URL
                } else {
                    // Если ссылка была пустой, создаем новый элемент
                    const linkContainer = document.createElement('p');
                    linkContainer.innerHTML = `<strong>Ссылка:</strong> <a href="${data.link}" target="_blank" class="profile-link">${data.link}</a>`;
                    document.querySelector('.profile .info').appendChild(linkContainer);
                }
            }

            // Проверка и обновление изображения профиля
            if (data.profileImage) {
                let profileImage = document.querySelector('.profile-image img');
                if (!profileImage) {
                    // Если нет изображения профиля, создаем его в блоке profile-image
                    profileImage = document.createElement('img');
                    profileImage.classList.add('profile-image');
                    document.querySelector('.profile .profile-image').appendChild(profileImage);
                }
                profileImage.setAttribute('src', data.profileImage);
            }

            // Закрываем модальное окно после обновления данных
            closeModal();
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при обновлении профиля.');
        });
    });
}

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован с областью:', registration.scope);
            })
            .catch(error => {
                console.log('Регистрация Service Worker не удалась:', error);
            });
    });
}





