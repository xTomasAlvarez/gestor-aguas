import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from "@/core/http/api";


/**
 * @typedef {object} SessionState
 * @property {string|null} token
 * @property {object|null} user
 * @property {boolean} isAuthenticated
 * @property {(token: string, user: object) => void} login
 * @property {() => void} logout
 */

/**
 * Zustand store for session management.
 *
 * @returns {SessionState}
 */
const useSessionStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => {
        // En una aplicación real, el token debería ser guardado en una cookie httpOnly por seguridad.
        // Para este caso, localStorage es suficiente para demostrar el concepto.
        set({ token, user, isAuthenticated: true });
      },
      logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Error al cerrar sesión en el servidor:", error);
        } finally {
            set({ token: null, user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'session-storage', // Nombre para el item en localStorage
    }
  )
);

export default useSessionStore;
