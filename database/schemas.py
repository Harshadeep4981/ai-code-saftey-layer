from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):

    username: str = Field(
        min_length=3,
        max_length=50
    )

    email: EmailStr

    password: str

    confirm_password: str


class OTPVerify(BaseModel):

    email: EmailStr

    otp: str


class UserLogin(BaseModel):

    email: EmailStr

    password: str


class UserResponse(BaseModel):

    id: int

    username: str

    email: EmailStr

    is_active: bool

    class Config:

        from_attributes = True