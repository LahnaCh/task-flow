export const validateDescription = (description) =>
    description &&
    typeof description === "string" &&
    description.length >= 5 &&
    description.length <= 10;
