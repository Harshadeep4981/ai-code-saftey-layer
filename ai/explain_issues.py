from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def explain_issue(issue_name, details):
    prompt = f"""
    You are a Senior Application Security Architect auditing a Python codebase. 
    Your goal is to explain a detected vulnerability to a developer clearly and professionally.

    VULNERABILITY DETECTED:
    Issue: {issue_name}
    Context: {details}

    Provide a detailed security briefing using EXACTLY the following three headers. 
    DO NOT use markdown, asterisks (**), hashtags, bullet points, or numbering. Use plain text only.

    VULNERABILITY MECHANISM:
    (Explain exactly what this vulnerability is, why it occurs in Python, and the technical flaw behind it.)

    ATTACK SCENARIO:
    (Describe a realistic, real-world scenario of how a malicious hacker could exploit this specific flaw. What is the worst-case impact on the system or data?)

    REMEDIATION STRATEGY:
    (Explain the conceptual strategy to fix this issue securely. Do not write actual code, just explain the industry-standard best practice for mitigating this risk.)

    CONSTRAINTS:
    - Keep the total response between 150 and 250 words.
    - Maintain an authoritative, educational, and professional tone.
    - Ensure the output is strictly plain text with double spacing between sections.
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        # Slightly increased temperature allows the AI to be more descriptive and less robotic
        temperature=0.4 
    )

    return response.choices[0].message.content.strip()