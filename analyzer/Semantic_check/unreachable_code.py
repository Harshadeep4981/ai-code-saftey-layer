import ast

class UnreachableCodeVisitor(ast.NodeVisitor):

    def __init__(self, file_path, issues):

        self.file_path = file_path
        self.issues = issues

    def visit_FunctionDef(self, node):

        found_return = False

        for statement in node.body:

            if found_return:

                self.issues.append({
                    "file": self.file_path,
                    "line": statement.lineno,
                    "issue": "Unreachable code detected",
                    "details": "Code exists after return statement",
                    "severity": "medium"
                })

            if isinstance(statement, ast.Return):
                found_return = True

        self.generic_visit(node)


def check_unreachable_code(file_data, file_path, issues):

    try:

        tree = ast.parse(file_data)

        visitor = UnreachableCodeVisitor(
            file_path,
            issues
        )

        visitor.visit(tree)

    except SyntaxError:
        pass