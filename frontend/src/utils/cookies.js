// Centralized cookie utilities
export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  let cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;

  if (window.location.protocol === 'https:') {
    cookieString += ';Secure';
  }

  document.cookie = cookieString;
};

export const setCookieWithOptions = (name, value, options = {}) => {
  const {
    days = 7,
    sameSite = 'Strict',
    secure = window.location.protocol === 'https:',
    httpOnly = false
  } = options;

  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));

  let cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/`;

  if (sameSite) {
    cookieString += `;SameSite=${sameSite}`;
  }

  if (secure) {
    cookieString += ';Secure';
  }

  if (httpOnly) {
    cookieString += ';HttpOnly';
  }

  document.cookie = cookieString;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};
