// Пример JavaScript для переключения активных кнопок в нижней навигации
const listItems = document.querySelectorAll('.list');

listItems.forEach(item => {
    item.addEventListener('click', function() {
        listItems.forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        // Перемещаем индикатор
        const indicator = document.querySelector('.indicator');
        indicator.style.left = `${this.offsetLeft}px`;
    });
});
 