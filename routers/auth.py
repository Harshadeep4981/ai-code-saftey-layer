from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr # Added for the new flow
from database.schemas import UserLogin, OTPVerify
from authentication.password import verify_password, hash_password, is_strong_password
from authentication.JWT_handler import create_access_token
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import User, EmailOTP
from authentication.oauth import get_current_user
from authentication.constants import MAX_OTP_ATTEMPTS
from authentication.otp import generate_otp, hash_otp, verify_otp, otp_expiry
from authentication.email_service import send_otp_email

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# --- NEW SCHEMAS FOR 3-STEP FLOW ---
class OTPRequest(BaseModel):
    email: EmailStr
    username: str

class FinalizeSignup(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

# STEP 1: REQUEST OTP (Name & Email)
@router.post("/request-otp")
def request_otp(user: OTPRequest, db: Session = Depends(get_db)):
    # 1. Check if EMAIL is taken
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # 2. NEW: Check if USERNAME is taken
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username is already taken. Please choose another.")

    # Remove any previous pending signup
    old_request = db.query(EmailOTP).filter(EmailOTP.email == user.email).first()
    if old_request:
        db.delete(old_request)
        db.commit()

    otp = generate_otp()
    
    # Store request
    pending_user = EmailOTP(
        username=user.username,
        email=user.email,
        password_hash="", 
        otp_hash=hash_otp(otp),
        expires_at=otp_expiry(),
        attempts=0
    )

    try:
        db.add(pending_user)
        db.commit()
        send_otp_email(user.email, otp)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to send verification email.")

    return {"message": "OTP sent successfully."}

# STEP 2: VERIFY OTP

@router.post("/verify-otp")
def verify_email_otp(request: OTPVerify, db: Session = Depends(get_db)):
    pending_user = db.query(EmailOTP).filter(EmailOTP.email == request.email).first()
    
    if not pending_user:
        raise HTTPException(status_code=404, detail="No pending verification found.")
    
    if datetime.now(timezone.utc) > pending_user.expires_at:
        db.delete(pending_user)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Please start over.")

    if pending_user.attempts >= MAX_OTP_ATTEMPTS:
        db.delete(pending_user)
        db.commit()
        raise HTTPException(status_code=400, detail="Max attempts exceeded. Start over.")

    if not verify_otp(request.otp, pending_user.otp_hash):
        pending_user.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # MARK AS VERIFIED (Allows Step 3 to proceed)
    pending_user.otp_hash = "VERIFIED"
    db.commit()
    return {"message": "OTP verified successfully."}

# STEP 3: FINALIZE SIGNUP (Password)

@router.post("/finalize-signup")
def finalize_signup(request: FinalizeSignup, db: Session = Depends(get_db)):
    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    if not is_strong_password(request.password):
        raise HTTPException(status_code=400, detail="Password is too weak.")

    pending_user = db.query(EmailOTP).filter(EmailOTP.email == request.email).first()
    
    # Ensure they actually passed the OTP step!
    if not pending_user or pending_user.otp_hash != "VERIFIED":
        raise HTTPException(status_code=400, detail="Email not verified.")

    new_user = User(
        username=pending_user.username,
        email=pending_user.email,
        password_hash=hash_password(request.password)
    )
    db.add(new_user)
    db.delete(pending_user) 
    db.commit()
    
    return {"message": "Account created successfully."}


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    access_token = create_access_token(

        {
            "sub": str(existing_user.id),
            "username": existing_user.username,
            "email": existing_user.email
        }

    )

    return {

        "access_token": access_token,

        "token_type": "bearer"

    }

@router.get("/me")
def get_me(

    current_user: User = Depends(get_current_user)

):

    return {

        "id": current_user.id,

        "username": current_user.username,

        "email": current_user.email

    }

# --- SECURE ADMIN ROUTE ---
@router.get("/admin/users")
def get_all_users(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # SECURITY CHECK: Restrict access strictly to the admin account
    if current_user.email != "harshadeepm63@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    
    all_users = db.query(User).all()
    
    # Safely format data (stripping out password hashes)
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": getattr(user, "is_active", True),
            "created_at": getattr(user, "created_at", None)
        } 
        for user in all_users
    ]