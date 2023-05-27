const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Delete_fake(js_code) {
    ast_code = parse(js_code)

    function delete_false(path) {
        try {
            let Ifnode = path.node;//路径的节点
            if (!types.isBooleanLiteral(Ifnode.test) && !types.isNumericLiteral(Ifnode.test)) {//布尔类型判断
                return;
            }

            if (Ifnode.test.value) {//布尔值为真
                if (types.isReturnStatement(Ifnode.consequent)) {
                    path.replaceInline(Ifnode.consequent);
                } else {
                    path.replaceInline(Ifnode.consequent.body);
                }
            } else {//布尔值为假

                if (Ifnode.alternate) {
                    if (types.isReturnStatement(Ifnode.alternate)) {
                        path.replaceInline(Ifnode.alternate);
                    } else {
                        path.replaceInline(Ifnode.alternate.body);
                    }

                } else {
                    path.remove()
                }

            }
        } catch (e) {

        }
    }

    traverse(ast_code, {IfStatement: {exit: [delete_false]}});

    return generator(ast_code).code
}

