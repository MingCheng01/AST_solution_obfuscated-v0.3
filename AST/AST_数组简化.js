const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')

function Array_simplification(js_code) {
    ast_code = parse(js_code)

    function NumListReduce(path) {
        // 数组函数简化

        let node = path.node;//获取路径节点
        if (!types.isIdentifier(node.id)) return;//不是标识符则退出
        if (!types.isArrayExpression(node.init)) return;//不是数组表达式则退出
        let name = node.id.name;//数组的名称
        let init_obj = node.init.elements;//数组元素
        if (init_obj.length === 0) return;//数组元素为空则退出

        let scope = path.scope;//获取路径的作用域
        let binding = scope.getBinding(name);//获取绑定

        if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
            return;
        }
        let paths = binding.referencePaths;//绑定引用的路径
        let paths_sums = 0;//路径计数
        paths.map(function (refer_path) {
            let bindpath = refer_path.parentPath;//父路径
            let binnode = bindpath.node;//父路径的节点
            if (!types.isMemberExpression(bindpath.node)) return;//数字表达式判断
            if (binnode.object.name !== name) return;//标识符判定
            if (!types.isNumericLiteral(binnode.property)) return;//数字类型判断
            // console.log(bindpath.parentPath.type)
            // if (types.isAssignmentExpression(bindpath.parentPath)) return;//赋值表达式

            bindpath.replaceInline(init_obj[binnode.property.value])//子节点信息替换
            paths_sums += 1;//路径+1
        });
        if (paths_sums === paths.length) {//若绑定的每个路径都已处理 ，则移除当前路径
            path.remove();//删除路径
        }

    }

    traverse(ast_code, {VariableDeclarator: {exit: [NumListReduce]}});

    return generator(ast_code).code
}