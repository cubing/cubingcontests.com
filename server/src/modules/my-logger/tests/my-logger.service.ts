export const MyLoggerMock = () => ({
  log(message: string) {
    console.log(message);
  },
  warn(message: string) {
    console.warn(message);
  },
  error(message: string) {
    console.error(message);
  },
  logAndSave(message: string) {
    console.log(message);
  },
});
