import { loginUser } from '../providers/auth.provider';

let loginForm: HTMLFormElement | null = null;
let loginIdentifier: HTMLInputElement | null = null;
let loginPassword: HTMLInputElement | null = null;
let loginGeneralMessage: HTMLDivElement | null = null;

const NUM_EYES = 7;

/* ============================================================
   CREA OJOS EN EL FONDO (evita duplicados)
============================================================ */
function spawnEyes(num: number) {
  const forestEyes = document.querySelector(".forest-eyes") as HTMLElement | null;
  if (!forestEyes) return;

  if (forestEyes.childElementCount >= num) return;

  for (let i = 1; i <= num; i++) {
    const eye = document.createElement("div");
    eye.classList.add("eye", `eye${i}`);
    forestEyes.appendChild(eye);
  }
}

/* ============================================================
   INICIALIZACIÓN DEL FORMULARIO LOGIN
============================================================ */
export function initLoginForm(): void {

  loginForm = document.getElementById('login-form') as HTMLFormElement | null;
  loginIdentifier = document.getElementById('login-identifier') as HTMLInputElement | null;
  loginPassword = document.getElementById('login-password') as HTMLInputElement | null;
  loginGeneralMessage = document.getElementById('login-general-message') as HTMLDivElement | null;

  // Evita registrar múltiples listeners
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit, { once: true });
  }

  spawnEyes(NUM_EYES);

  // REACTIVA EL OJO SIEMPRE QUE SE CARGA EL LOGIN
  setupPasswordToggles();
}

/* ============================================================
   TOGGLE MOSTRAR/OCULTAR CONTRASEÑA
============================================================ */
function setupPasswordToggles(): void {

  const toggleButtons = document.querySelectorAll<HTMLElement>(".toggle-password");

  toggleButtons.forEach(btn => {

    // Limpia listeners previos para evitar duplicados
    const newBtn = btn.cloneNode(true) as HTMLElement;
    btn.replaceWith(newBtn);

    newBtn.addEventListener("click", () => {
      const targetId = newBtn.getAttribute("data-target");
      if (!targetId) return;

      const input = document.getElementById(targetId) as HTMLInputElement | null;
      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";

      newBtn.classList.toggle("open", isHidden);
    });
  });
}

/* ============================================================
   SUBMIT DEL LOGIN
============================================================ */
async function handleLoginSubmit(event: Event) {
  event.preventDefault();
  clearLoginErrors();

  const identifier = loginIdentifier?.value.trim() ?? "";
  const password = loginPassword?.value ?? "";

  if (!identifier) {
    loginIdentifier?.classList.add("input-error");
    showLoginErrorMessage('El email o usuario es requerido');
    return resetSubmitListener();
  }

  if (!password) {
    loginPassword?.classList.add("input-error");
    showLoginErrorMessage('La contraseña es requerida');
    return resetSubmitListener();
  }

  if (identifier.length < 3) {
    loginIdentifier?.classList.add("input-error");
    showLoginErrorMessage('El identificador debe tener al menos 3 caracteres');
    return resetSubmitListener();
  }

  if (password.length < 8) {
    loginPassword?.classList.add("input-error");
    showLoginErrorMessage('La contraseña debe tener al menos 8 caracteres');
    return resetSubmitListener();
  }

  if (/\s/.test(identifier)) {
    loginIdentifier?.classList.add("input-error");
    showLoginErrorMessage('El identificador no puede contener espacios');
    return resetSubmitListener();
  }

  if (/\s/.test(password)) {
    loginPassword?.classList.add("input-error");
    showLoginErrorMessage('La contraseña no puede contener espacios');
    return resetSubmitListener();
  }

  const formData = { identifier, password };

  try {
    const result = await loginUser(formData);

    if (!result || !result.data) {
      throw new Error('Respuesta inválida del servidor.');
    }

    localStorage.setItem('access_token', result.data.token);
    localStorage.setItem('user', JSON.stringify({
      id: result.data.id,
      nickname: result.data.nickname,
      rol: result.data.rol,
      abilities: result.data.abilities,
      profile_photo: result.data.profile_photo
    }));

    showLoginSuccessMessage(result.message || '¡Inicio de sesión correcto!');

    setTimeout(() => {
      window.location.href = '/indexUI.html';
    }, 900);

  } catch (err: any) {
    console.error('Error en login:', err);
    const message = err?.message || err?.errors?.[0] || 'Error en el inicio de sesión';
    showLoginErrorMessage(message);
  }

  resetSubmitListener();
}

/* ============================================================
   Reinicia listener del form para evitar bloqueo
============================================================ */
function resetSubmitListener() {
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit, { once: true });
  }
}

/* ============================================================
   MENSAJES
============================================================ */
function showLoginSuccessMessage(text: string) {
  if (!loginGeneralMessage) return;
  loginGeneralMessage.classList.remove('error-message');
  loginGeneralMessage.classList.add('success-message');
  loginGeneralMessage.textContent = text;
}

function showLoginErrorMessage(text: string) {
  if (!loginGeneralMessage) return;
  loginGeneralMessage.classList.remove('success-message');
  loginGeneralMessage.classList.add('error-message');
  loginGeneralMessage.textContent = text;
}

/* ============================================================
   LIMPIEZA (usado por el FLIP)
============================================================ */
export function clearLoginErrors(): void {
  if (loginGeneralMessage) {
    loginGeneralMessage.textContent = '';
    loginGeneralMessage.classList.remove('success-message', 'error-message');
  }
  loginIdentifier?.classList.remove('input-error');
  loginPassword?.classList.remove('input-error');
}

export function clearLoginForm(): void {
  clearLoginErrors();
  loginForm?.reset();

  const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[id*="password"]');
  passwordInputs.forEach(i => {
    if (i.type === 'text') i.type = 'password';
  });

  document.querySelectorAll<HTMLElement>('.toggle-password')
    .forEach(btn => btn.classList.remove('open'));
}