
import { loginUser } from '../providers/auth.provider';

let loginForm: HTMLFormElement;
let loginIdentifier: HTMLInputElement;
let loginPassword: HTMLInputElement;
let loginGeneralMessage: HTMLDivElement;

const NUM_EYES = 7;

// Crea los ojos decorativos del fondo (compartido)
function spawnEyes(num: number) {
  const forestEyes = document.querySelector(".forest-eyes");
  if (!forestEyes) return;

  for (let i = 1; i <= num; i++) {
    const eye = document.createElement("div");
    eye.classList.add("eye", `eye${i}`);
    forestEyes.appendChild(eye);
  }
}

// Preparo el formulario de login
export function initLoginForm() {
  loginForm = document.getElementById('login-form') as HTMLFormElement;
  loginIdentifier = document.getElementById('login-identifier') as HTMLInputElement;
  loginPassword = document.getElementById('login-password') as HTMLInputElement;
  loginGeneralMessage = document.getElementById('login-general-message') as HTMLDivElement;

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  clearLoginErrors();
  spawnEyes(NUM_EYES);

  // Activar los botones de mostrar/ocultar contraseña (compartido)
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

// Maneja todo el proceso cuando se envía el formulario de login
async function handleLoginSubmit(event: Event) {
  event.preventDefault();
  clearLoginErrors();

  const identifier = loginIdentifier.value.trim();
  const password = loginPassword.value;

  // Validaciones básicas
  if (!identifier) {
    loginIdentifier.classList.add("input-error");
    showLoginErrorMessage('El email o usuario es requerido');
    return;
  }

  if (!password) {
    loginPassword.classList.add("input-error");
    showLoginErrorMessage('La contraseña es requerida');
    return;
  }

  if (identifier.length < 3) {
    loginIdentifier.classList.add("input-error");
    showLoginErrorMessage('El identificador debe tener al menos 3 caracteres');
    return;
  }

  if (password.length < 8) {
    loginPassword.classList.add("input-error");
    showLoginErrorMessage('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  // Validación de espacios (siguiendo el patrón del registro)
  if (/\s/.test(identifier)) {
    loginIdentifier.classList.add("input-error");
    showLoginErrorMessage('El identificador no puede contener espacios');
    return;
  }

  if (/\s/.test(password)) {
    loginPassword.classList.add("input-error");
    showLoginErrorMessage('La contraseña no puede contener espacios');
    return;
  }

  // Si parece ser un email, validar formato básico
  if (identifier.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      loginIdentifier.classList.add("input-error");
      showLoginErrorMessage('Formato de email inválido');
      return;
    }
  }

  // Datos que envío al backend
  const formData = {
    identifier: identifier,
    password: password
  };

  try {
    type LoginResponse = {
      message?: string;
      data: {
        token: string;
        id: number | string;
        nickname?: string;
        rol?: string;
        abilities?: any;
        profile_photo?: string | null;
      };
    };

    const result = (await loginUser(formData)) as unknown as LoginResponse;

    console.log('¡Login exitoso!', result);

    showLoginSuccessMessage(result.message || '¡Inicio de sesión exitoso! Redirigiendo...');

    loginForm.reset();

    // Guardar token y usuario completo (mismo formato que el registro)
    localStorage.setItem('access_token', result.data.token);

    localStorage.setItem('user', JSON.stringify({
      id: result.data.id,
      nickname: result.data.nickname,
      rol: result.data.rol,
      abilities: result.data.abilities,
      profile_photo: result.data.profile_photo
    }));

    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1500);

  } catch (errorData: any) {
    console.error('Error en el login:', errorData);
    const validationErrors = errorData.response?.data || errorData;
    handleLoginApiErrors(validationErrors);
  }
}

// Muestra un mensaje de éxito en pantalla
function showLoginSuccessMessage(message: string) {
  loginGeneralMessage.classList.remove('error-message');
  loginGeneralMessage.classList.add('success-message');
  loginGeneralMessage.textContent = message;
}

// Muestra un mensaje de error en pantalla
function showLoginErrorMessage(message: string) {
  loginGeneralMessage.classList.remove('success-message');
  loginGeneralMessage.classList.add('error-message');
  loginGeneralMessage.textContent = message;
}

// Se encarga de mostrar los errores que devuelve la API
function handleLoginApiErrors(errorData: any) {
  loginGeneralMessage.classList.remove('success-message');
  loginGeneralMessage.classList.add('error-message');

  const errors = errorData.errors || errorData;
  let firstErrorMessage = '';

  if (errors.identifier) {
    loginIdentifier.classList.add('input-error');
    firstErrorMessage ||= errors.identifier[0];
  }

  if (errors.email) {
    loginIdentifier.classList.add('input-error');
    firstErrorMessage ||= errors.email[0];
  }

  if (errors.password) {
    loginPassword.classList.add('input-error');
    firstErrorMessage ||= errors.password[0];
  }

  // Manejar errores de credenciales
  if (errorData.message) {
    firstErrorMessage ||= errorData.message;
  }

  loginGeneralMessage.textContent = firstErrorMessage || 'Error en el inicio de sesión.';
}

// Limpia los errores visuales del formulario de login
export function clearLoginErrors(): void {
  if (loginGeneralMessage) {
    loginGeneralMessage.textContent = '';
    loginGeneralMessage.classList.remove('success-message', 'error-message');
  }

  if (loginIdentifier) {
    loginIdentifier.classList.remove('input-error');
  }

  if (loginPassword) {
    loginPassword.classList.remove('input-error');
  }
}

// Limpia completamente el formulario de login (valores y errores)
export function clearLoginForm(): void {
  clearLoginErrors();
  
  if (loginForm) {
    loginForm.reset();
  }
  
  // Resetear visibilidad de contraseñas
  resetPasswordVisibility();
}

// Función auxiliar para resetear visibilidad de contraseñas
function resetPasswordVisibility(): void {
  const passwordInputs = document.querySelectorAll('input[type="text"][id*="password"]');
  passwordInputs.forEach(input => {
    (input as HTMLInputElement).type = 'password';
  });
  
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(btn => {
    btn.classList.remove('open');
  });
}