/**
 * Set verification code to expire in 30 minutes.
 * Do this by converting the current date to millisecond to it and adding 1 hour.
 * Note to account for offset so time is accurate
 */
export function getVerificationCodeExpiryDate() {
	const currentDate = new Date();
	const offset = currentDate.getTimezoneOffset() * 60 * 1000;
	const correctedDateWithoutOffset = currentDate.getTime() - offset;

	// convert 30 minutes to milliseconds
	const oneHourInMilliseconds = 30 * 60 * 1000;

	const expiryDateInMilliseconds =
		correctedDateWithoutOffset + oneHourInMilliseconds;

	// Return the expiry date in ISOString format
	const expiryDateInIsoStringFormat = new Date(
		expiryDateInMilliseconds,
	).toISOString();

	// Convert to Date type
	return new Date(expiryDateInIsoStringFormat);
}
