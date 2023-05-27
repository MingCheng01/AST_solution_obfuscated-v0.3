const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

// +  -  *  /  !!  []  || &&
function Constant_calculations(js_code) {
    ast_code = parse(js_code);
    traverse(ast_code, {
        "BinaryExpression|UnaryExpression|LogicalExpression": eval_constant,
    });

    function eval_constant(path) {
        // 常量计算

        if (path.type === "UnaryExpression") {//!![]类型的计算
            const {operator, argument} = path.node;
            if (operator !== "!") return;//判断
            if (!types.isUnaryExpression(argument) && !types.isLogicalExpression(argument) && !types.isBinaryExpression(argument) && !types.isArrayExpression(argument) && !types.isNumericLiteral(argument) && !types.isStringLiteral(argument)) return;
        }
        if (path.type === "LogicalExpression") {//true||false && 与或非的运算
            if (!types.isUnaryExpression(path.node.left) && !types.isLogicalExpression(path.node.left) && !types.isBinaryExpression(path.node.left) && !types.isNumericLiteral(path.node.left) && !types.isBooleanLiteral(path.node.left) && !types.isStringLiteral(path.node.left)) return;//逻辑符左侧既不是数字类型也不是布尔类型，返回
            if (!types.isUnaryExpression(path.node.right) && !types.isLogicalExpression(path.node.right) && !types.isBinaryExpression(path.node.right) && !types.isNumericLiteral(path.node.right) && !types.isBooleanLiteral(path.node.right) && !types.isStringLiteral(path.node.left)) return;//逻辑符左侧既不是数字类型也不是布尔类型，返回
        }
        if (path.type === "BinaryExpression") {//+-*/ << >> 计算
            /*不做任何处理，下面的做出了限定，发现存在部分不能计算的问题，因此不在做限制，但是不做限制范围过大，会处理回调表达式*/
            if (!types.isUnaryExpression(path.node.left) && !types.isLogicalExpression(path.node.left) && !types.isBinaryExpression(path.node.left) && !types.isNumericLiteral(path.node.left) && !types.isBooleanLiteral(path.node.left) && !types.isStringLiteral(path.node.left)) return;//逻辑符左侧既不是数字类型也不是布尔类型也不是字符串类型，返回
            if (!types.isUnaryExpression(path.node.right) && !types.isLogicalExpression(path.node.right) && !types.isBinaryExpression(path.node.right) && !types.isNumericLiteral(path.node.right) && !types.isBooleanLiteral(path.node.right) && !types.isStringLiteral(path.node.right)) return;//逻辑符左侧既不是数字类型也不是布尔类型也不是字符串类型，返回
        }

        try {

            let value = eval(path.toString())

            // 无限计算则退出，如1/0与-(1/0)
            if (value === Infinity || value === -Infinity)
                return;
            path.replaceWith(types.valueToNode(value));

        } catch (e) {
            console.log(e)
        }

    }

    return generator(ast_code).code
}