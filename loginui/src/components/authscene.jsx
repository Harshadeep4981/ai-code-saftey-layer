import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Shield, Volume2, VolumeX, CheckCircle } from "lucide-react";
import { authService } from "../services/auth"; // <-- NEW: Backend connection
import "./authscene.css";

// ============================================================
// AUDIO SYNTHESIS ENGINE
// ============================================================
function useLampAudio(isMuted) {
  const ctxRef = useRef(null);
  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const playBeadClick = () => {
    if (isMuted) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.015);
    gain.gain.setValueAtTime(0.08, now); 
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  };

  const playSwitchClick = () => {
    if (isMuted) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  };

  const playTungstenFlicker = () => {
    if (isMuted) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 60;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    const gain = ctx.createGain();
    
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.27); 
    gain.gain.linearRampToValueAtTime(0.0, now + 0.36); 
    gain.gain.setValueAtTime(0.0, now + 0.72);          
    gain.gain.linearRampToValueAtTime(0.1, now + 0.81); 
    gain.gain.linearRampToValueAtTime(0.05, now + 1.08); 
    gain.gain.linearRampToValueAtTime(0.02, now + 1.8); 
    gain.gain.setValueAtTime(0.02, now + 5.0); 
    gain.gain.exponentialRampToValueAtTime(0.001, now + 6.0); 

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 6.1);
  };

  return { playBeadClick, playSwitchClick, playTungstenFlicker };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AuthScene({ onSubmit, onGoogleSignIn }) {
  const [phase, setPhase] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const timeouts = useRef([]);

  // Workflow States
  const [authMode, setAuthMode] = useState("signIn");
  const [isFormTransitioning, setIsFormTransitioning] = useState(false);
  const [initialRevealDone, setInitialRevealDone] = useState(false); 

  // Form Data States
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  
  const emailRef = useRef(null);
  const otpRefs = useRef([]);

  const { playBeadClick, playSwitchClick, playTungstenFlicker } = useLampAudio(isMuted);

  // Drag states
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const lastBeadClickY = useRef(0); 
  const PULL_THRESHOLD = 45;
  const MAX_PULL = 60;

  useEffect(() => {
    return () => timeouts.current.forEach(clearTimeout);
  }, []);

  const dustMotes = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i, left: 20 + Math.random() * 60, top: 30 + Math.random() * 40,
    size: 1.5 + Math.random() * 2, delay: Math.random() * 5, duration: 8 + Math.random() * 7,
  })), []);

  const handlePointerDown = (e) => {
    if (phase !== "idle") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    startYRef.current = e.clientY;
    lastBeadClickY.current = 0; 
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    const clampedY = Math.max(0, Math.min(deltaY, MAX_PULL));
    setDragY(clampedY);

    if (Math.abs(clampedY - lastBeadClickY.current) > 6) {
      playBeadClick();
      lastBeadClickY.current = clampedY;
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (dragY >= PULL_THRESHOLD) {
      setDragY(0); 
      playSwitchClick(); 
      
      const t1 = setTimeout(() => {
        setPhase("swinging");
        
        const t2 = setTimeout(() => {
          setPhase("flickering");
          playTungstenFlicker(); 
          
          const t3 = setTimeout(() => {
            setPhase("on");
            
            const t4 = setTimeout(() => {
              emailRef.current?.focus();
              setInitialRevealDone(true); 
            }, 1800);
            timeouts.current.push(t4);
          }, 500); 
          timeouts.current.push(t3);
        }, 300); 
        timeouts.current.push(t2);
      }, 300); 
      timeouts.current.push(t1);
    } else {
      setDragY(0); 
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = (newMode) => {
    setIsFormTransitioning(true);
    setTimeout(() => {
      setAuthMode(newMode);
      setOtp(["", "", "", "", "", ""]); 
      setIsFormTransitioning(false);
    }, 250); 
  };

  // ============================================================
  // BACKEND API CONNECTION MODIFICATION HERE
  // ============================================================
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      switch (authMode) {
        case "signIn":
          const loginRes = await authService.login({ email: formData.email, password: formData.password });
          if (loginRes.access_token) {
            localStorage.setItem("access_token", loginRes.access_token);
            triggerSuccess({ action: 'login', ...formData });
          }
          break;
        
        // NEW: STEP 1 - Send the email
        case "signUp_step1":
          await authService.requestOtp({ username: formData.fullName, email: formData.email });
          switchMode("signUp_step2_otp"); // Only switches if API succeeds!
          break;
          
        // NEW: STEP 2 - Verify the code
        case "signUp_step2_otp":
          const otpString = otp.join(""); // Convert array to "123456"
          await authService.verifyOtp({ email: formData.email, otp: otpString });
          switchMode("signUp_step3_pwd");
          break;
          
        // NEW: STEP 3 - Finalize Account
        case "signUp_step3_pwd":
          await authService.finalizeSignup({ 
            email: formData.email, 
            password: formData.password,
            confirm_password: formData.confirmPassword
          });
          switchMode("success_screen");
          setTimeout(() => triggerSuccess({ action: 'signup', ...formData }), 1500);
          break;

        // FORGOT PASSWORD FLOW
        case "forgot_step1":
          switchMode("forgot_step2_otp");
          break;
        case "forgot_step2_otp":
          switchMode("forgot_step3_pwd");
          break;
        case "forgot_step3_pwd":
          switchMode("reset_success_screen");
          setTimeout(() => triggerSuccess({ action: 'reset_password', ...formData }), 1500);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Auth Error:", err);
      alert(err.message || "An unexpected error occurred."); 
    }
  };

  const triggerSuccess = (payload) => {
    setPhase("success");
    setTimeout(() => {
      if (onSubmit) onSubmit(payload);
    }, 2000);
  };

  // --- OTP Verification Logic ---
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pasteData.length > 0) {
      const newOtp = [...otp];
      pasteData.forEach((char, i) => {
        if (/^[0-9]$/.test(char) && i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(pasteData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  const sceneClass = [ 
    "scene", 
    `phase-${phase}`,
    initialRevealDone ? "no-delay" : "" 
  ].filter(Boolean).join(" ");

  // ============================================================
  // RENDER HELPERS FOR WORKFLOW
  // ============================================================
  const renderFormContent = () => {
    switch (authMode) {
      case "signIn":
        return (
          <>
            <div className="panel-head reveal-item" style={{ "--reveal-delay": "500ms" }}>
              <h1>Sign In</h1>
              <p>Authenticate to access the core.</p>
            </div>
            <div className="input-group reveal-item" style={{ "--reveal-delay": "700ms" }}>
              <input ref={emailRef} type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email address" required />
            </div>
            <div className="input-group reveal-item" style={{ "--reveal-delay": "900ms" }}>
              <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleFormChange} placeholder="Password" required />
              <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="reveal-item" style={{ "--reveal-delay": "1000ms" }}>
              <a href="#forgot" className="forgot-link" onClick={(e) => { e.preventDefault(); switchMode('forgot_step1'); }}>Forgot password?</a>
            </div>
            <div className="reveal-item" style={{ "--reveal-delay": "1100ms" }}>
              <button type="submit" className="btn-primary">Sign In</button>
            </div>
            <div className="reveal-item" style={{ "--reveal-delay": "1300ms" }}>
              <button type="button" className="btn-secondary" onClick={onGoogleSignIn}>
                <GoogleIcon /> Continue with Google
              </button>
            </div>
            <div className="reveal-item auth-switch" style={{ "--reveal-delay": "1400ms" }}>
              Don&apos;t have an account? <button type="button" onClick={() => switchMode('signUp_step1')}>Create one</button>
            </div>
          </>
        );

      case "signUp_step1":
        return (
          <>
            <div className="panel-head reveal-item">
              <h1>Create Account</h1>
              <p>Initialize your secure profile.</p>
            </div>
            <div className="input-group reveal-item">
              <input autoFocus type="text" name="fullName" value={formData.fullName} onChange={handleFormChange} placeholder="Full Name" required />
            </div>
            <div className="input-group reveal-item">
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email address" required />
            </div>
            <div className="reveal-item" style={{ marginTop: '48px' }}>
              <button type="submit" className="btn-primary">Continue</button>
            </div>
            <div className="reveal-item auth-switch">
              Already have an account? <button type="button" onClick={() => switchMode('signIn')}>Sign in</button>
            </div>
          </>
        );

      case "signUp_step2_otp":
      case "forgot_step2_otp":
        return (
          <>
            <div className="panel-head reveal-item">
              <h1>Verify Email</h1>
              <p>Enter the 6-digit code sent to your email.</p>
            </div>
            <div className="otp-group reveal-item" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  className="otp-input"
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  autoFocus={index === 0}
                  required
                />
              ))}
            </div>
            <div className="reveal-item">
              <button type="submit" className="btn-primary">Verify Code</button>
            </div>
            <div className="reveal-item auth-switch">
              <button type="button" onClick={() => switchMode('signIn')}>Back to Sign In</button>
            </div>
          </>
        );

      case "signUp_step3_pwd":
        return (
          <>
            <div className="panel-head reveal-item">
              <h1>Secure Account</h1>
              <p>Create a strong master password.</p>
            </div>
            <div className="input-group reveal-item">
              <input autoFocus type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleFormChange} placeholder="Password" required />
              <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="input-group reveal-item">
              <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleFormChange} placeholder="Confirm Password" required />
            </div>
            <div className="reveal-item" style={{ marginTop: '48px' }}>
              <button type="submit" className="btn-primary">Create Account</button>
            </div>
          </>
        );

      case "forgot_step1":
        return (
          <>
            <div className="panel-head reveal-item">
              <h1>Reset Password</h1>
              <p>Enter your email to receive a recovery code.</p>
            </div>
            <div className="input-group reveal-item">
              <input autoFocus type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email address" required />
            </div>
            <div className="reveal-item" style={{ marginTop: '48px' }}>
              <button type="submit" className="btn-primary">Send Code</button>
            </div>
            <div className="reveal-item auth-switch">
              Remember your password? <button type="button" onClick={() => switchMode('signIn')}>Sign in</button>
            </div>
          </>
        );

      case "forgot_step3_pwd":
        return (
          <>
            <div className="panel-head reveal-item">
              <h1>New Password</h1>
              <p>Enter your new credentials below.</p>
            </div>
            <div className="input-group reveal-item">
              <input autoFocus type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleFormChange} placeholder="New Password" required />
              <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="input-group reveal-item">
              <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleFormChange} placeholder="Confirm Password" required />
            </div>
            <div className="reveal-item" style={{ marginTop: '48px' }}>
              <button type="submit" className="btn-primary">Reset & Sign In</button>
            </div>
          </>
        );

      // --- NEW SUCCESS SCREENS ---
      case "success_screen":
        return (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div className="reveal-item" style={{ display: "flex", justifyContent: "center", marginBottom: "24px", color: "#e5a93d" }}>
              <CheckCircle size={56} strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 12px rgba(229, 169, 61, 0.4))" }} />
            </div>
            <div className="panel-head reveal-item" style={{ marginBottom: 0 }}>
              <h1>Registration Complete</h1>
              <p>Welcome to the core. Initializing secure session...</p>
            </div>
          </div>
        );

      case "reset_success_screen":
        return (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div className="reveal-item" style={{ display: "flex", justifyContent: "center", marginBottom: "24px", color: "#e5a93d" }}>
              <CheckCircle size={56} strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 12px rgba(229, 169, 61, 0.4))" }} />
            </div>
            <div className="panel-head reveal-item" style={{ marginBottom: 0 }}>
              <h1>Credentials Restored</h1>
              <p>Your password has been securely reset. Entering core...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={sceneClass}>
      
      <button className="mute-toggle" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute sound" : "Mute sound"}>
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <div className="room-glow" aria-hidden="true" />
      
      <div className="dust-layer" aria-hidden="true">
        {dustMotes.map((mote) => (
          <span key={mote.id} className="mote" style={{ left: `${mote.left}%`, top: `${mote.top}%`, width: mote.size, height: mote.size, "--delay": `${mote.delay}s`, "--duration": `${mote.duration}s` }} />
        ))}
      </div>

      <header className="brand">
        <Shield size={38} strokeWidth={1.5} color="#e5a93d" style={{ filter: "drop-shadow(0 0 10px rgba(229, 169, 61, 0.4))" }} />
        <span>AI <em>Safety Layer</em></span>
      </header>

      <main className="stage">
        
        <div className="lamp-wrapper">
          <div className="lamp">
            <div className="lamp-head">
              <div className="shade-exterior" />
              <div className="shade-interior">
                <div className="bulb" />
                <div className="chain-socket" />
                <div 
                  className="chain-anchor"
                  style={{ transform: `translateX(-50%) translateY(${dragY}px)`, transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                >
                  <div className="chain-sway" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
                    <div className="beads">
                      {Array.from({ length: 8 }).map((_, i) => <span className="bead" key={i} />)}
                    </div>
                    <div className="handle" />
                  </div>
                </div>
              </div>
            </div>
            <div className="pole-assembly">
              <div className="neck" />
              <div className="rod" />
              <div className="base" />
            </div>
          </div>
        </div>

        <div className="card-wrapper">
          <form className="glass-panel" onSubmit={handleFormSubmit}>
            <div className={`form-transition-wrapper ${isFormTransitioning ? 'is-transitioning' : ''}`}>
              {renderFormContent()}
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.4 35.4 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.2 5.4-5.9 6.9l6.3 5.3C38.9 37.2 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}