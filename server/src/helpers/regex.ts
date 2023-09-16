export { titleRegex } from '@sh/regex';
export const getTitleRegexOpts = (propertyName: string) => ({
  message: `The ${propertyName} must begin with a capital letter or number and only contain alphanumeric characters or these special characters: - ' :`,
});
