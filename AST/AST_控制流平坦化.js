const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Control_leveling(js_code) {
    ast_code = parse(js_code)

    function replaceWhile(path) {
        // 反控制流平坦化
        try {
            var node = path.node;//路径节点
            // 判断是否是目标节点
            if (!(types.isBooleanLiteral(node.test) || types.isUnaryExpression(node.test)))
                // 如果while中不为true或!![]
                return;
            if (!(node.test.prefix || node.test.value))
                // 如果while中的值不为true
                return;
            if (!types.isBlockStatement(node.body))
                return;
            var body = node.body.body;
            if (!types.isSwitchStatement(body[0]) || !types.isMemberExpression(body[0].discriminant) || !types.isBreakStatement(body[1]))
                return;

            // 获取数组名及自增变量名
            var swithStm = body[0];
            var arrName = swithStm.discriminant.object.name;
            var argName = swithStm.discriminant.property.argument.name
            let arr = [];

            // 找到path节点的前一个兄弟节点，即数组所在的节点，然后获取数组
            let all_presibling = path.getAllPrevSiblings();
            all_presibling.forEach(pre_path => {
                const {declarations} = pre_path.node;
                let {id, init} = declarations[0]
                if (arrName === id.name) {
                    // 数组节点
                    arr = init.callee.object.value.split('|');
                    pre_path.remove()
                }
                if (argName === id.name) {
                    // 自增变量节点
                    pre_path.remove()
                }
            })

            // SwitchCase节点集合
            var caseList = swithStm.cases;
            // 存放按正确顺序取出的case节点
            var resultBody = [];
            arr.map(targetIdx => {
                var targetBody = caseList[targetIdx].consequent;
                // 删除ContinueStatement块(continue语句)
                if (types.isContinueStatement(targetBody[targetBody.length - 1]))
                    targetBody.pop();
                resultBody = resultBody.concat(targetBody)
            });
            path.replaceInline(resultBody);
        } catch (e) {
            console.log('控制流平坦化-失败')
        }

    }
    traverse(ast_code, {WhileStatement: {exit: [replaceWhile]}});

    return generator(ast_code).code
}