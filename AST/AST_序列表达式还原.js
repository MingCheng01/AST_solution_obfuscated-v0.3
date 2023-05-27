const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Sequence_expression_restoration(js_code) {
    ast_code = parse(js_code)

    // 去除逗号表达式
    function remove_comma(path) {
        let {expression} = path.node
        if (!types.isSequenceExpression(expression))
            return;
        let body = []
        expression.expressions.forEach(
            express => {
                body.push(types.expressionStatement(express))
            }
        )
        path.replaceInline(body)
    }
    traverse(ast_code, {ExpressionStatement: remove_comma});

    return generator(ast_code).code
}