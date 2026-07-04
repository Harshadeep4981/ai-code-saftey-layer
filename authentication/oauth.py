from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import User

from authentication.JWT_handler import verify_access_token
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

security = HTTPBearer()


def get_current_user(

    credentials: HTTPAuthorizationCredentials = Depends(security),

    db: Session = Depends(get_db)

):
    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:

        raise HTTPException(

            status_code=401,

            detail="Invalid or expired token."

        )

    user = db.query(User).filter(

        User.id == int(payload["sub"])

    ).first()

    if user is None:

        raise HTTPException(

            status_code=401,

            detail="User not found."

        )

    return user