const sanitizeUserInput = (input: string) =>
  input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();

export default sanitizeUserInput;
