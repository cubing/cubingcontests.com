export const getTitleRegexOpts = (propertyName: string) => ({
  message: `The ${propertyName} must only contain alphanumeric characters or these special characters: - ' : #`,
});

export const getMinLengthOpts = (propertyName: string, length: number) => ({
  message: `The ${propertyName} cannot be shorter than ${length} characters`,
});

export const getMaxLengthOpts = (propertyName: string, length: number) => ({
  message: `The ${propertyName} cannot be longer than ${length} characters`,
});

export const invalidCountryOpts = { message: 'Please select a country' };
