import secrets
from datetime import timedelta,timezone,datetime
from passlib.context import CryptContext

from authentication.constants import (
    OTP_LENGTH,
    OTP_EXPIRY_MINUTES
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def generate_otp():

    minimum = 10 ** (OTP_LENGTH - 1)
    maximum = (10 ** OTP_LENGTH) - minimum

    return str(
        secrets.randbelow(maximum) + minimum
    )


def hash_otp(otp: str):

    return pwd_context.hash(otp)


def verify_otp(
    plain_otp: str,
    hashed_otp: str
):

    return pwd_context.verify(
        plain_otp,
        hashed_otp
    )


def otp_expiry():

    return datetime.now(timezone.utc) + timedelta(
        minutes=OTP_EXPIRY_MINUTES
    )