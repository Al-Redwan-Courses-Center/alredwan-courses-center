export const ARABIC_NAME_PATTERN = /^[\u0621-\u064A ]+$/;
export const ARABIC_ONLY_MESSAGE = "مسموح بالحروف العربية فقط";
export const MINIMUM_ALLOWED_AGE = 5;

export function getMaxDobForAge(minimumAgeYears = MINIMUM_ALLOWED_AGE) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - minimumAgeYears);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function validateMinimumAge(
  dob: string,
  minimumAgeYears = MINIMUM_ALLOWED_AGE,
) {
  if (!dob) return "تاريخ الميلاد مطلوب.";

  const [yearText, monthText, dayText] = dob.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) return "تاريخ الميلاد غير صحيح.";

  const birthDate = new Date(year, month - 1, day);

  if (Number.isNaN(birthDate.getTime())) return "تاريخ الميلاد غير صحيح.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  if (age < minimumAgeYears) {
    return `يجب ألا يقل العمر عن ${minimumAgeYears} سنوات.`;
  }

  return true;
}
