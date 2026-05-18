from flask import Flask, render_template,request
from analyzer.analyzer import analyze_file
from Reporting.summarize import generate_summary
from scanner.repo_scanner import run_scan

app = Flask(__name__)
@app.route("/")
def home():

    return render_template("index.html")
@app.route("/scan")
def scan():

    results = run_scan()
    severity_order = {
        "high": 0,
        "medium": 1,
        "low": 2
    }

    results["issues"] = sorted(
        results["issues"],
        key=lambda issue: severity_order.get(issue["severity"], 3)
    )

    return render_template(
        "report.html",
        issues=results["issues"],
        summary=results["summary"]
    )
@app.route("/analyze", methods=["POST"])
def analyze():

    code = request.form["code"]

    lines = code.splitlines()

    issues = []

    analyze_file(lines, "user_code.py", issues)

    summary = generate_summary(issues, 1)

    severity_order = {
        "high": 0,
        "medium": 1,
        "low": 2
    }

    issues = sorted(
        issues,
        key=lambda issue: severity_order.get(issue["severity"], 3)
    )

    return render_template(
        "report.html",
        issues=issues,
        summary=summary
    )

if __name__ == "__main__":

    app.run(debug=True)