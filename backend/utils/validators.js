const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const VALID_SPORTS = ['cricket', 'tennis', 'kabaddi'];

module.exports = {
    NAME_REGEX,
    EMAIL_REGEX,
    STRONG_PASSWORD_REGEX,
    VALID_SPORTS,
};