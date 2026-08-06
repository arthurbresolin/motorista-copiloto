from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class LearnerRegister(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str | None = None


class LearnerLogin(BaseModel):
    email: str
    password: str


class LearnerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LearnerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None
    username: str | None
    display_name: str | None
    avatar_url: str | None
    theme_preference: str | None
    notifications_enabled: bool


class LearnerUpdate(BaseModel):
    name: str | None = None
    username: str | None = None
    display_name: str | None = None
    theme_preference: Literal["light", "dark", "system"] | None = None
    notifications_enabled: bool | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class MessageResponse(BaseModel):
    message: str
