import axios from 'axios'

const api = axios.create({
  baseURL: 'http://172.16.2.23:3111',
})

/* ================= REQUEST ================= */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token')

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

    return config
  },
  (error) =>
    Promise.reject(error)
)

/* ================= RESPONSE ================= */

api.interceptors.response.use(
  (response) =>
    response,

  (error) => {

    if (
      error?.response?.status === 401
    ) {

      /*
       * JWT expired / invalid.
       *
       * Clear authentication-related state so the
       * application does not look logged in while
       * protected endpoints are rejecting requests.
       */
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('activeProfile')

      /*
       * Prevent redirect loops if already on login.
       */
      if (
        !window.location.pathname
          .includes('/login')
      ) {

        sessionStorage.setItem(
          'sessionExpired',
          '1'
        )

        window.location.href = '/'

      }

    }

    return Promise.reject(error)
  }
)

export default api