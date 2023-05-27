const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Ternary_expression(js_code) {
    ast_code = parse(js_code)

    function conditionVarToIf(path) {
        //三元表达式转if-else
        try {
            if (path.type === "VariableDeclarator") {
                let {id, init} = path.node;
                if (!types.isConditionalExpression(init)) return;
                const ParentPath = path.parentPath;
                const ParentNode = path.parent;
                if (!types.isVariableDeclaration(ParentNode)) return;
                if (types.isForStatement(ParentPath.parentPath)) return;
                let kind = ParentNode.kind;
                if (kind === "const") {//因为const特性，会涉及到初始化必须赋值问题，将其修改为let
                    kind = 'let';
                }
                let {test, consequent, alternate} = init;
                ParentPath.replaceInline([
                    types.variableDeclaration(kind, [types.variableDeclarator(id,)]),
                    types.ifStatement(
                        test,
                        types.blockStatement([types.ExpressionStatement(types.AssignmentExpression('=', id, consequent)),]),
                        types.blockStatement([types.ExpressionStatement(types.AssignmentExpression('=', id, alternate)),])
                    ),
                ])
            }
            if (path.type === "ExpressionStatement") {
                if (!types.isConditionalExpression(path.node.expression)) return;
                let {test, consequent, alternate} = path.node.expression;
                path.replaceWith(types.ifStatement(
                    test,
                    types.blockStatement([types.expressionStatement(consequent)],),
                    types.blockStatement([types.expressionStatement(alternate)],),
                ));
            }
        } catch (e) {
        }
    }
    traverse(ast_code, {"VariableDeclarator|ExpressionStatement": conditionVarToIf});

    return generator(ast_code).code
}