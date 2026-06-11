#!/usr/bin/env python3
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None