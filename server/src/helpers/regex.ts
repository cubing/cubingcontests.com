export const titleRegex = /^[A-Z0-9][a-zA-Z0-9 -:']*$/;
export const getTitleRegexOpts = (propertyName: string) => ({
  message: `The ${propertyName} must begin with a capital letter or number and only contain alphanumeric characters or these special characters: - ' :`,
});
