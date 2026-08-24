/**
 * Autenticação e controle de acesso para o Painel Administrativo
 * Criado e desenvolvido por Evolves Tecnologia (Jefferson Campos)
 */

export const ADMIN_PASSWORD = "Microsistec@2026";
const AUTH_KEY = "manual_marca_admin_authenticated";

/**
 * Verifica se o usuário atual possui sessão de administrador ativa
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const isSessionAuth = sessionStorage.getItem(AUTH_KEY) === "true";
    const isLocalAuth = localStorage.getItem(AUTH_KEY) === "true";
    return isSessionAuth || isLocalAuth;
  } catch {
    return false;
  }
}

/**
 * Autentica o administrador se a senha for válida
 */
export function loginAdmin(password: string, remember: boolean = true): boolean {
  if (typeof window === "undefined") return false;
  if (password.trim() === ADMIN_PASSWORD) {
    try {
      if (remember) {
        localStorage.setItem(AUTH_KEY, "true");
      }
      sessionStorage.setItem(AUTH_KEY, "true");
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Encerra a sessão de administrador
 */
export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}
