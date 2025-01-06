document.getElementById('sreda-button').addEventListener('click', function() {
    document.querySelector('.grid').style.transform = 'translateY(-100%)';
    document.getElementById('sreda-button').style.display = 'none';
    setTimeout(() => {
        document.getElementById('page1').style.display = 'none';
        document.getElementById('page2').style.display = 'flex';
        document.getElementById('page2').style.opacity = '1';
    }, 1000); // Ждем 1 секунду, чтобы анимация завершилась
});

document.getElementById('block1').addEventListener('click', function() {
    showModal('Среда Android', 'Описание мобильной версии "Среды".', 'sreda_android.apk');
});

document.getElementById('block2').addEventListener('click', function() {
    showModal('Среда Windows 10', 'Описание компьютерной версии "Среды".', 'sreda_windows.exe');
});

document.getElementById('block3').addEventListener('click', function() {
    showModal('Среда в очках', 'Описание очков "Среда".', 'Заказать @BasantroVI');
});

document.querySelector('.close-button').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
});

function showModal(title, description, link) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <h2>${title}</h2>
        <p>${description}</p>
        <a href="${link}" target="_blank">${link}</a>
    `;
    document.getElementById('modal').style.display = 'block';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        alert('Скопировано: ' + text);
    }, function(err) {
        console.error('Ошибка копирования: ', err);
    });
}
