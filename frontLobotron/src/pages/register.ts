//import "../styles/index.css";

import { registerUser } from '../providers/auth.provider';

let registerForm: HTMLFormElement;
let nicknameInput: HTMLInputElement;
let emailInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let confirmPasswordInput: HTMLInputElement;
let generalMessage: HTMLDivElement;

const NUM_EYES = 7;

// Crea los ojos decorativos del fondo
function spawnEyes(num: number) {
  const forestEyes = document.querySelector(".forest-eyes");
  if (!forestEyes) return;

  for (let i = 1; i <= num; i++) {
    const eye = document.createElement("div");
    eye.classList.add("eye", `eye${i}`);
    forestEyes.appendChild(eye);
  }
}

// Preparo el formulario y dejo todo listo para usar
export function initRegisterForm() {
  registerForm = document.getElementById('register-form') as HTMLFormElement;
  nicknameInput = document.getElementById('nickname') as HTMLInputElement;
  emailInput = document.getElementById('email') as HTMLInputElement;
  passwordInput = document.getElementById('password') as HTMLInputElement;
  confirmPasswordInput = document.getElementById('passwordConfirm') as HTMLInputElement;
  generalMessage = document.getElementById('general-message') as HTMLDivElement;

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }

  clearErrors();
  spawnEyes(NUM_EYES);

  // Activar los botones de mostrar/ocultar contraseña
  const toggleButtons = document.querySelectorAll(".toggle-password");

  toggleButtons.forEach(btn => {
    btn.addEventListener("click", () => {

      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId!) as HTMLInputElement;

      if (!input) return;

      const isHidden = input.type === "password";

      input.type = isHidden ? "text" : "password";

      btn.classList.toggle("open", isHidden);
    });
  });
}

// Maneja todo el proceso cuando se envía el formulario
async function handleRegisterSubmit(event: Event) {
  event.preventDefault();
  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const nickname = nicknameInput.value.trim();

  const nicknameRegex = /^[a-zA-Z0-9._-]+$/;

  if (!nicknameRegex.test(nickname)) {
    nicknameInput.classList.add("input-error");
    generalMessage.classList.add("error-message");
    generalMessage.textContent =
      "El nombre de usuario solo puede contener letras, números y los símbolos . _ -";
    return;
  }

  // Compruebo que el email solo tenga caracteres permitidos
  const allowedChars = /^[a-zA-Z0-9._%+\-@]+$/;
  if (!allowedChars.test(email)) {
    emailInput.classList.add("input-error");
    generalMessage.classList.add("error-message");
    generalMessage.textContent =
      "El correo contiene caracteres no permitidos. Solo se permiten letras, números y . _ % + -";
    return;
  }

  // Verifico que el correo tenga dominio válido
  const domain = email.split("@")[1];
  if (!domain.includes(".")) {
    emailInput.classList.add("input-error");
    generalMessage.classList.add("error-message");
    generalMessage.textContent =
      "El dominio debe contener al menos un punto. Ejemplo: correo@ejemplo.com";
    return;
  }

  // Compruebo que el TLD es válido
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    emailInput.classList.add("input-error");
    generalMessage.classList.add("error-message");
    generalMessage.textContent =
      "El dominio debe terminar con un TLD válido (.com, .es, .net...).";
    return;
  }

  // Contraseña fuerte
  const strongPasswordRegex =
    /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[!@#$%^&*.,:;?(){}\[\]\-_+]).{8,}$/;

  if (!strongPasswordRegex.test(password)) {
    passwordInput.classList.add("input-error");
    generalMessage.classList.add("error-message");
    generalMessage.textContent =
      "La contraseña debe tener mayúsculas, minúsculas, números y un carácter especial.";
    return;
  }

  // Contraseñas iguales
  if (password !== confirmPassword) {
    passwordInput.classList.add("input-error");
    confirmPasswordInput.classList.add("input-error");
    generalMessage.classList.add("error-message");
    generalMessage.textContent = "Las contraseñas no coinciden.";
    return;
  }

  // Datos que envío al backend
  const formData = {
    nickname: nicknameInput.value,
    email: emailInput.value,
    password: passwordInput.value,
    password_confirmation: confirmPasswordInput.value
  };

  try {
    const result = await registerUser(formData);

    console.log('¡Registro + login exitoso!', result);

    showSuccessMessage(result.message || '¡Registro completado! Iniciando sesión...');

    registerForm.reset();

    // Guardar token y usuario completo
    localStorage.setItem('access_token', result.data.token);

    localStorage.setItem('user', JSON.stringify({
      id: result.data.id,
      nickname: result.data.nickname,
      rol: result.data.rol,
      abilities: result.data.abilities,
      profile_photo: result.data.profile_photo
    }));

    setTimeout(() => {
      window.location.href = '/indexUI.html';
    }, 1500);

  } catch (errorData: any) {
    console.error('Error en el registro:', errorData);
    const validationErrors = errorData.response?.data || errorData;
    handleApiErrors(validationErrors);
  }
}

// Muestra un mensaje de éxito en pantalla
function showSuccessMessage(message: string) {
  generalMessage.classList.remove('error-message');
  generalMessage.classList.add('success-message');
  generalMessage.textContent = message;
}

// Se encarga de mostrar los errores que devuelve la API
const handleApiErrors = function (errorData: any) {
  generalMessage.classList.remove('success-message');
  generalMessage.classList.add('error-message');

  const errors = errorData.errors || errorData;
  let firstErrorMessage = '';

  if (errors.nickname) {
    nicknameInput.classList.add('input-error');
    firstErrorMessage ||= errors.nickname[0];
  }

  if (errors.email) {
    emailInput.classList.add('input-error');
    firstErrorMessage ||= errors.email[0];
  }

  if (errors.password) {
    passwordInput.classList.add('input-error');
    confirmPasswordInput.classList.add('input-error');
    firstErrorMessage ||= errors.password[0];
  }

  if (errors.password_confirmation) {
    confirmPasswordInput.classList.add('input-error');
    firstErrorMessage ||= errors.password_confirmation[0];
  }

  generalMessage.textContent = firstErrorMessage || 'Error de validación.';
}

// Limpia los errores visuales del formulario
const clearErrors = function () {
  generalMessage.textContent = '';
  generalMessage.classList.remove('success-message', 'error-message');

  nicknameInput.classList.remove('input-error');
  emailInput.classList.remove('input-error');
  passwordInput.classList.remove('input-error');
  confirmPasswordInput.classList.remove('input-error');
}

/* ➕ NUEVO → Limpieza completa para el flip */
export const clearRegisterForm = function(): void {
  clearErrors();
  registerForm?.reset();

  const passwordInputs = document.querySelectorAll<HTMLInputElement>(
    '#password, #passwordConfirm'
  );

  passwordInputs.forEach(input => {
    if (input.type === 'text') input.type = 'password';
  });

  document.querySelectorAll<HTMLElement>('.toggle-password')
    .forEach(btn => btn.classList.remove('open'));
}