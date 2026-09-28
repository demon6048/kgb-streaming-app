// src/utils/helpers.js

export const getToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const parseDateString = (dateString) => {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('T')[0].split('-');
  return new Date(y, m - 1, d);
};

export const formatDateToLocal = (dateString) => {
  if (!dateString) return '-';
  const d = parseDateString(dateString);
  if (!d) return '-';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getDaysRemaining = (expiryDateString) => {
  if (!expiryDateString) return 0;
  const today = getToday();
  const expDate = parseDateString(expiryDateString);
  return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
};

export const addMonthsToDate = (dateString, months) => {
  const d = parseDateString(dateString) || getToday();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

export const parseLicenseText = (text) => {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) return null;

  const data = {};
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('código de la suscripción')) data.codigo = line.split(':')[1]?.trim();
    else if (lowerLine.includes('nombre de usuario')) data.usuario = line.split(':')[1]?.trim();
    else if (lowerLine.includes('nombre del dispositivo')) data.dispositivo = line.split(':')[1]?.trim();
    else if (lowerLine.includes('máquina')) data.maquina = line.split(':')[1]?.trim();
  });
  return Object.keys(data).length > 0 ? data : null;
};