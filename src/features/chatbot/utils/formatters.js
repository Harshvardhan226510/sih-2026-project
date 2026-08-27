export const formatTime = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(new Date(date));
};
