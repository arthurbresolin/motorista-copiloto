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
