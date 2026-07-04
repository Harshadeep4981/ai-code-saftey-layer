import ast
class DangerousFunctionVisitor(ast.NodeVisitor):

    def __init__(self, file_path, issues):

        self.file_path = file_path
        self.issues = issues

    def visit_Call(self, node):

        if isinstance(node.func, ast.Name):

            dangerous_functions = [
                "eval",
                "exec",
                "compile"
            ]

            if node.func.id in dangerous_functions:

                self.issues.append({
                    "file": self.file_path,
                    "line": node.lineno,
                    "issue": "Dangerous function usage",
                    "details": f"{node.func.id}() detected",
                    "severity": "high"
                })

        self.generic_visit(node)


def check_dangerous_functions(
    file_data,
    file_path,
    issues
):

    try:

        tree = ast.parse(file_data)

        visitor = DangerousFunctionVisitor(
            file_path,
            issues
        )

        visitor.visit(tree)

    except:

        pass