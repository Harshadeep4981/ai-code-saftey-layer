import ast


class CommandInjectionVisitor(ast.NodeVisitor):

    def __init__(self, file_path, issues):

        self.file_path = file_path
        self.issues = issues

    def visit_Call(self, node):

        # Detect os.system()

        if isinstance(node.func, ast.Attribute):

            if (
                isinstance(node.func.value, ast.Name)
                and node.func.value.id == "os"
                and node.func.attr == "system"
            ):

                self.issues.append({
                    "file": self.file_path,
                    "line": node.lineno,
                    "issue": "Command Injection Risk",
                    "details": "os.system() detected",
                    "severity": "high"
                })

        #Detect subprocess()

        if isinstance(node.func, ast.Attribute):

            if (
                isinstance(node.func.value, ast.Name)
                and node.func.value.id == "subprocess"
                and node.func.attr == "run"
            ):

                for keyword in node.keywords:

                    if (
                        keyword.arg == "shell"
                        and isinstance(keyword.value, ast.Constant)
                        and keyword.value.value is True
                    ):

                        self.issues.append({
                            "file": self.file_path,
                            "line": node.lineno,
                            "issue": "Command Injection Risk",
                            "details": "subprocess.run(..., shell=True) detected",
                            "severity": "high"
                        })

        self.generic_visit(node)


def check_command_injection(
    file_data,
    file_path,
    issues
):

    try:

        tree = ast.parse(file_data)

        visitor = CommandInjectionVisitor(
            file_path,
            issues
        )

        visitor.visit(tree)

    except:

        pass