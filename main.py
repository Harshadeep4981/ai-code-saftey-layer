import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database.database import Base, engine
import database.models
from validator.retry_fix import generate_validated_secure_code
from analyzer.analyzer import analyze_file
from Reporting.summarize import generate_summary
from scanner.repo_scanner import run_scan
from ai.explain_issues import explain_issue
from routers.auth import router as auth_router
from groq import Groq

app = FastAPI(title="AI Safety Layer API")

# Initialize Groq client (Assumes GROQ_API_KEY is in your .env)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins="https://ai-code-saftey-layer(-.*)?\.vercel\.app", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
Base.metadata.create_all(bind=engine)

@app.get("/scan", response_class=JSONResponse)
async def scan():
    results = run_scan()
    severity_order = {"high": 0, "medium": 1, "low": 2}
    
    results["issues"] = sorted(
        results["issues"],
        key=lambda issue: severity_order.get(issue["severity"], 3)
    )
    return {"issues": results["issues"], "summary": results["summary"]}


@app.post("/analyze", response_class=JSONResponse)
async def analyze(request: Request):
    data = await request.json() 
    code = data.get("code", "")
    lines = code.splitlines()
    issues = []

    analyze_file(lines, "user_code.py", issues)
    summary = generate_summary(issues, 1)

    severity_order = {"high": 0, "medium": 1, "low": 2}
    issues = sorted(
        issues,
        key=lambda issue: severity_order.get(issue["severity"], 3)
    )

    return {
        "issues": issues,
        "summary": summary,
        "original_code": code
    }

@app.post("/explain_issue", response_class=JSONResponse)
async def explain_issue_route(request: Request):
    try:
        data = await request.json()
        issue = data.get("issue")
        details = data.get("details")
        explanation = explain_issue(issue, details)
        return {"explanation": explanation}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/generate_secure_code", response_class=JSONResponse)
async def secure_code_route(request: Request):
    try:
        data = await request.json()
        code = data.get("code")
        issues = data.get("issues")
        result = generate_validated_secure_code(code, issues)
        return {"secure_code": result}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# --- NEW: AI CHAT ENDPOINT ---
@app.post("/chat", response_class=JSONResponse)
async def ai_chat_route(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message")
        history = data.get("history", [])
        code_context = data.get("code", "")
        
        # 1. System Prompt: Give the AI its personality and context
        messages = [
            {
                "role": "system", 
                "content": f"""You are a Senior Security Architect defending a code patch you just wrote. 
                Be concise, highly technical, and helpful. Do not use markdown backticks for normal text.
                Explain your security decisions clearly.
                
                Here is the current secure code you are discussing:
                {code_context}
                """
            }
        ]
        
        # 2. Load previous chat history
        for msg in history:
            role = "assistant" if msg.get("role") == "ai" else "user"
            messages.append({"role": role, "content": msg.get("content")})
            
        # 3. Add the new user message
        messages.append({"role": "user", "content": user_message})
        
        # 4. Call Groq LLaMA-3
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3, # Keep it low for factual security responses
            max_tokens=300   # Keep responses snappy for chat UI
        )
        
        ai_reply = response.choices[0].message.content
        
        return {"reply": ai_reply}
    
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)