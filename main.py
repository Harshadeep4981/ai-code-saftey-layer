import os
from fastapi import FastAPI, Request, HTTPException
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

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-code-saftey-layer-.*\.vercel\.app", "https://ai-code-saftey-layer.vercel.app"], 
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
    try:
        data = await request.json() 
        files = data.get("files", [])
        
        all_issues = []
        
        for f in files:
            filename = f.get("name", "unknown_file.py")
            content = f.get("content", "")
            lines = content.splitlines()
            
            file_issues = []
            analyze_file(lines, filename, file_issues) 
            all_issues.extend(file_issues)

        summary = generate_summary(all_issues, len(files))
        severity_order = {"high": 0, "medium": 1, "low": 2}
        all_issues = sorted(
            all_issues,
            key=lambda issue: severity_order.get(issue.get("severity", "low").lower(), 3)
        )

        return {
            "issues": all_issues,
            "summary": summary,
            "analyzed_file_count": len(files)
        }
    except Exception as e:
        print(f"🔥 CRITICAL ANALYZE ERROR: {str(e)}")
        # Return a 429 (Too Many Requests) so the frontend knows it was an overload, not a code bug
        return JSONResponse(
            {"error": "Analysis Failed: Payload too large or API Limit Reached.", "details": str(e)}, 
            status_code=429
        )

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
        
        # Short-circuit if there is no code to process
        if not code:
            return {"secure_code": ""}
            
        result = generate_validated_secure_code(code, issues)
        return {"secure_code": result}
        
    except Exception as e:
        print(f"🔥 CRITICAL GENERATION ERROR: {str(e)}")
        # Return 429 instead of 500 when Groq/OpenAI blocks the heavy request
        return JSONResponse(
            {"error": "AI API Limit Reached or Model Overloaded. Please try again.", "details": str(e)}, 
            status_code=429
        )

@app.post("/chat", response_class=JSONResponse)
async def ai_chat_route(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message")
        history = data.get("history", [])
        code_context = data.get("code", "")
        
        # 1. NEW: Grab the actual vulnerabilities to give the AI context!
        issues = data.get("issues", [])
        issues_text = "\n".join([f"- {i.get('issue')} (Severity: {i.get('severity')})" for i in issues]) if issues else "No active vulnerabilities."

        # 2. UPGRADED SYSTEM PROMPT: Give it a strict personality and context
        messages = [
            {
                "role": "system", 
                "content": f"""You are an elite Application Security Architect helping a developer understand a code patch.

                CONTEXT:
                The following security vulnerabilities were found in the user's original code:
                {issues_text}

                Here is the SECURE PATCHED CODE you are currently discussing:
                {code_context}

                CRITICAL RULES:
                1. Be highly specific to the code and vulnerabilities provided above. Do not give generic advice.
                2. Keep your answers concise, conversational, and easy to read. 
                3. If the user asks why something was changed, explicitly reference the vulnerabilities listed above.
                4. Do not use markdown backticks (```) for normal conversational text, only use them for actual code blocks.
                """
            }
        ]
        
      
        for msg in history:
            role = "assistant" if msg.get("role") == "ai" else "user"
            messages.append({"role": role, "content": msg.get("content")})
            
      
        messages.append({"role": "user", "content": user_message})
        
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.4,
            max_tokens=400   
        )
        
        ai_reply = response.choices[0].message.content
        return {"reply": ai_reply}
    
    except Exception as e:
        print(f"🔥 CHAT ERROR: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)