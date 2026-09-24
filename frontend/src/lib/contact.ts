/**
 * Public contact details for the center, shared by the landing footer,
 * the call-to-action section and the public course pages.
 */
export const CONTACT_EMAIL = "info@alredwan.edu";

/** E.164 phone number, used for `tel:` links. */
export const CONTACT_PHONE = "+201234567890";

/** Digits-only international number, as `wa.me` expects it. */
export const CONTACT_WHATSAPP = "201234567890";

export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE}`;
export const CONTACT_WHATSAPP_HREF = `https://wa.me/${CONTACT_WHATSAPP}`;
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
