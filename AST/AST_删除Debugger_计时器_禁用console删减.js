const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Delete_(js_code) {
    ast_code = parse(js_code);

    try {
        function DelConsole_one(path) {
            // 删除console
            let node = path.parentPath.node;//获取路径节点
            if (!types.isCallExpression(node)) return;//不是回调表达式，退出
            if (node.arguments.length !== 2) return;//形参不等于2个
            if (!types.isThisExpression(node.arguments[0])) return;//this表达式
            if (!types.isFunctionExpression(node.arguments[1])) return;//Func表达式
            if (node.arguments[1].params.length !== 0) return;//func表达式存在参数
            let thisname = path.node.name;
            del_scope_path(path, thisname)

        }

        function DelConsole_two(path) {
            // 删除console遗留下列未使用的定义变量
            let node = path.node;//获取路径节点
            if (node.init != null) return;
            let thisname = node.id.name;//节点名称
            let scope = path.scope;//获取路径的作用域
            let binding = scope.getBinding(thisname);//获取绑定
            if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
                return;
            }
            let paths = binding.referencePaths;//绑定引用的路径

            if (paths.length !== 1) return;
            del_scope_path(path, thisname)
            // path.remove();//删除路径
        }

        traverse(ast_code, {Identifier: {exit: [DelConsole_one]}});
        traverse(ast_code, {VariableDeclarator: {exit: [DelConsole_two]}});
    } catch (e) {
        function DelThis(path) {
            // 删除符合指定条件的节点
            let node = path.parentPath.node;//获取路径节点
            if (!types.isCallExpression(node)) return;//不是回调表达式，退出
            if (node.arguments.length !== 2) return;//形参不等于2个
            if (!types.isThisExpression(node.arguments[0])) return;//this表达式
            if (!types.isFunctionExpression(node.arguments[1])) return;//Func表达式
            if (node.arguments[1].params.length !== 0) return;//func表达式存在参数
            if (path.parentPath.parentPath.type === 'AssignmentExpression') {
                if (!types.isIdentifier(path.parentPath.parentPath.node.left)) return;//
                path.parentPath.parentPath.node.right = types.FunctionExpression(null, [], types.BlockStatement([]))

            }
            if (path.parentPath.parentPath.type === 'VariableDeclarator') {
                if (!types.isIdentifier(path.parentPath.parentPath.node.id)) return;//
                path.parentPath.parentPath.node.init = types.FunctionExpression(null, [], types.BlockStatement([]))
            }


        }

        traverse(ast_code, {Identifier: {exit: [DelThis]}});
    }

    try {
        function del_setInterval(path) {
            // 将对象进行替换
            var node = path.node;//获取路径节点
            if (types.isIdentifier(node.callee)) {//是标识符
                if (!types.isIdentifier(node.callee))//不是标识符则退出
                    return;
                if (node.callee.name !== 'setInterval') return;//不是定时器退出
                if (node.arguments.length !== 2) return;
                if (!types.isFunctionExpression(node.arguments[0]) || node.arguments[0].params.length !== 0) return;
                let InterNode = node.arguments[0].body.body[0];
                if (!types.isExpressionStatement(InterNode)) return;
                if (!types.isCallExpression(InterNode.expression)) return;
                if (!types.isIdentifier(InterNode.expression.callee)) return;
                let InterName = InterNode.expression.callee.name;
                del_scope_path(path, InterName)
            } else {
                if (types.isMemberExpression(node.callee)) {
                    let node1 = node.callee;//获取路径节点
                    if (node.arguments.length !== 2) return;//回调表达式参数不是2则退出
                    if (!types.isStringLiteral(node1.property)) return;//不是字符串类型，退出
                    if (node1.property.value !== 'setInterval') return;//不是定时器退出

                    if (!types.isIdentifier(node.arguments[0])) return;//不是标识符则退出
                    del_scope_path(path, node.arguments[0].name)
                }

            }

        }

        traverse(ast_code, {CallExpression: {exit: [del_setInterval]}});
    } catch (e) {

    }

    try {
        function DelDebuger_one(path) {
            // 将对象进行替换
            var node = path.node;//获取路径节点

            if (!types.isCallExpression(node.init)) return;//回调表达式过滤
            if (node.init.arguments.length !== 0) return;//实参个数为0
            if (!types.isFunctionExpression(node.init.callee)) return;//函数表达式过滤
            if (node.init.callee.params.length !== 0) return;//形参个数过滤
            let varName = node.id.name;//定义的变量名称

            let scope = path.scope;//获取路径的作用域

            let binding = scope.getBinding(varName);//

            if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
                return;
            }

            let paths = binding.referencePaths;//绑定引用的路径
            // if(paths.length===0)return;//引用路径必须等于1
            let paths_sums = 0;//路径计数

            paths.map(function (refer_path) {
                let bindpath = refer_path.parentPath;//父路径
                let BinNode = bindpath.node;//获取路径节点
                if (!types.isCallExpression(BinNode)) return;//不是回调表达式，退出
                if (BinNode.arguments.length !== 2) return;//形参不等于2个
                if (!types.isThisExpression(BinNode.arguments[0])) return;//this表达式
                let thisname = BinNode.callee.name;//节点名称
                if (thisname !== varName) return;//二次确认，名称不等退出
                let break_sign = true;//while循环控制

                while (break_sign) {
                    try {
                        bindpath.remove();//路径删除
                        paths_sums += 1;//处理数+1
                        break_sign = false;//while循环终止
                    } catch (e) {
                        bindpath = bindpath.parentPath;
                    }


                }
            });
            if (paths_sums === paths.length) {//若绑定的每个路径都已处理 ，则移除当前路径
                path.remove();//删除路径
            }
        }

        function DelDebuger_two(path) {
            //删减deugger未引用的函数
            var node = path.node;//获取路径节点

            let varName = node.id.name;//定义的变量名称

            let scope = path.scope;//获取路径的作用域
            let binding = scope.getBinding(varName);//

            if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
                return;
            }
            let paths = binding.referencePaths;//绑定引用的路径
            if (paths.length !== 0) return;//引用路径必须等于1

            path.remove();//删除路径


        }

        traverse(ast_code, {VariableDeclarator: {exit: [DelDebuger_one]}});  //禁用debugger删减
        traverse(ast_code, {FunctionDeclaration: {enter: [DelDebuger_two]}});
    } catch (e) {

    }

    return generator(ast_code).code
}