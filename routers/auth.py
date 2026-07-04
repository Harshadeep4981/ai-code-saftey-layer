from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr
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

# --- SIGNUP SCHEMAS ---
class OTPRequest(BaseModel):
    email: EmailStr
    username: str

class FinalizeSignup(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

# --- NEW: PASSWORD RESET SCHEMAS ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordVerify(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordFinal(BaseModel):
    email: EmailStr
    new_password: str
    confirm_password: str


# ==========================================
#             SIGNUP FLOW
# ==========================================

# STEP 1: REQUEST OTP (Name & Email)
@router.post("/request-otp")
def request_otp(user: OTPRequest, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered.")

    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username is already taken. Please choose another.")

    old_request = db.query(EmailOTP).filter(EmailOTP.email == user.email).first()
    if old_request:
        db.delete(old_request)
        db.commit()

    otp = generate_otp()
    
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


# ==========================================
#          PASSWORD RESET FLOW
# ==========================================

# STEP 1: REQUEST RESET OTP
@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Forgot password requested for email: '{request.email}'")
    
    user = db.query(User).filter(User.email == request.email).first()
    
    # TEMPORARY DEBUGGING: Throw an actual error instead of the decoy
    if not user:
        print("DEBUG: FAILED! User NOT FOUND in the database.")
        raise HTTPException(status_code=404, detail="DEBUG ERROR: This email is not in the users table. Check your spelling.")

    print(f"DEBUG: SUCCESS! User found: {user.username}. Generating OTP...")

    old_request = db.query(EmailOTP).filter(EmailOTP.email == request.email).first()
    if old_request:
        db.delete(old_request)
        db.commit()

    otp = generate_otp()
    
    reset_request = EmailOTP(
        username=user.username,
        email=user.email,
        password_hash="", 
        otp_hash=hash_otp(otp),
        expires_at=otp_expiry(),
        attempts=0
    )

    try:
        db.add(reset_request)
        db.commit()
        print("DEBUG: OTP saved to database. Handing off to Brevo...")
        
        send_otp_email(user.email, otp)
        print("DEBUG: Brevo accepted the email and sent it!")
        
    except Exception as e:
        db.rollback()
        print(f"DEBUG: CRASH during Brevo handoff! Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Email failed to send: {str(e)}")

    return {"message": "Reset code sent successfully!"}

# STEP 2: VERIFY RESET OTP
@router.post("/verify-reset-otp")
def verify_reset_otp(request: ResetPasswordVerify, db: Session = Depends(get_db)):
    pending_reset = db.query(EmailOTP).filter(EmailOTP.email == request.email).first()
    
    if not pending_reset:
        raise HTTPException(status_code=404, detail="No pending reset found.")
    
    if datetime.now(timezone.utc) > pending_reset.expires_at:
        db.delete(pending_reset)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Please start over.")

    if pending_reset.attempts >= MAX_OTP_ATTEMPTS:
        db.delete(pending_reset)
        db.commit()
        raise HTTPException(status_code=400, detail="Max attempts exceeded. Start over.")

    if not verify_otp(request.otp, pending_reset.otp_hash):
        pending_reset.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    pending_reset.otp_hash = "RESET_VERIFIED"
    db.commit()
    return {"message": "OTP verified successfully. You may now reset your password."}

# STEP 3: FINALIZE NEW PASSWORD
@router.post("/reset-password")
def reset_password(request: ResetPasswordFinal, db: Session = Depends(get_db)):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    
    if not is_strong_password(request.new_password):
        raise HTTPException(status_code=400, detail="Password is too weak.")

    pending_reset = db.query(EmailOTP).filter(EmailOTP.email == request.email).first()
    
    if not pending_reset or pending_reset.otp_hash != "RESET_VERIFIED":
        raise HTTPException(status_code=400, detail="Reset request not verified.")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(request.new_password)
    db.delete(pending_reset)
    db.commit()
    
    return {"message": "Password has been reset successfully."}


# ==========================================
#             LOGIN & USER INFO
# ==========================================

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user is None or not verify_password(user.password, existing_user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    access_token = create_access_token({
        "sub": str(existing_user.id),
        "username": existing_user.username,
        "email": existing_user.email
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

@router.get("/admin/users")
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # SECURITY CHECK: Restrict access strictly to the admin account
    if current_user.email != "harshadeepm63@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    
    all_users = db.query(User).all()
    
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