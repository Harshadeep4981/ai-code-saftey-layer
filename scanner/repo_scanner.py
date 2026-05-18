import requests
import time
from analyzer.analyzer import analyze_file
from Reporting.summarize import generate_summary

# ⚠️ REMOVE TOKEN BEFORE GITHUB PUSH
token = "YOUR_GITHUB_TOKEN"

user = {
    "Authorization": f"token {token}"
}

issues = []
count = 0
MAX_FILES = 20

# Change mode when needed
MODE = "local"


# ---------------- GITHUB SCANNER ---------------- #
def get_contents(owner, repo, path=""):

    global count
    global issues

    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    try:
        response = requests.get(url, headers=user, timeout=10)

        if response.status_code != 200:
            return

        data = response.json()

        for item in data:

            if count >= MAX_FILES:
                return

            # 🔹 Scan only desired files
            if item["type"] == "file":

                if item["name"].endswith((".py", ".js", ".java", ".cpp")):

                    count += 1

                    file_url = item["download_url"]

                    try:
                        file_response = requests.get(file_url, headers=user)

                        if file_response.status_code == 200:

                            file_data = file_response.text

                            lines = file_data.splitlines()

                            analyze_file(
                                lines,
                                item["path"],
                                issues
                            )

                    except Exception as e:
                        print("File error:", e)

            # 🔹 Recursive folder traversal
            elif item["type"] == "dir":

                time.sleep(0.2)

                get_contents(
                    owner,
                    repo,
                    item["path"]
                )

    except Exception as e:
        print("Main error:", e)


# ---------------- LOCAL SCANNER ---------------- #
def scan_local_file(file_path):

    global count
    global issues

    try:
        with open(file_path, "r", encoding="utf-8") as f:

            file_data = f.read()

            lines = file_data.splitlines()

            count += 1

            analyze_file(
                lines,
                file_path,
                issues
            )

    except Exception as e:
        print("Local file error:", e)


# ---------------- MAIN SCAN FUNCTION ---------------- #
def run_scan():

    global issues
    global count

    # 🔹 Reset previous scan data
    issues = []
    count = 0

    # 🔹 Run selected mode
    if MODE == "github":

        get_contents(
            "Harshadeep4981",
            "ai-code-saftey-layer"
        )

    elif MODE == "local":

        scan_local_file("scanner/test.py")

    # 🔹 Generate summary
    summary = generate_summary(
        issues,
        count
    )

    # 🔹 Return results to Flask
    return {
        "issues": issues,
        "summary": summary
    }