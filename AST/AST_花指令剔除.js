const {parse} = require('@babel/parser')
const generator = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const types = require('@babel/types')


function Flower_instructions(js_code) {
    ast_code = parse(js_code)

    // 拆分对象合并
    function merge_object(path) {
        // 将拆分的对象重新合并
        const {id, init} = path.node;//提取节点指定的值
        if (!types.isObjectExpression(init))//如果指定属性不是对象表达式，退出
            return;

        let name = id.name;//获取id的名称
        let properties = init.properties;//获取初始属性数组
        let scope = path.scope;//获取路径的作用域
        let binding = scope.getBinding(name);//

        if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
            return;
        }
        let paths = binding.referencePaths;//绑定引用的路径
        paths.map(function (refer_path) {

            let bindpath = refer_path.parentPath;//父路径
            if (!types.isVariableDeclarator(bindpath.node)) return;//变量声明
            let bindname = bindpath.node.id.name;//获取变量节点声明的值

            let tmpbinding = scope.getBinding(bindname);//

            if (!tmpbinding || tmpbinding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
                return;
            }
            bindpath.scope.rename(bindname, name, bindpath.scope.block);//变量名重命名，传作用域参数
            bindpath.remove();//删除节点
        });
        let dict_key = [];//存在字典的key值，避免字典中出现相同的值，重复声明

        scope.traverse(scope.block, {

            AssignmentExpression: function (_path) {//赋值表达式

                const left = _path.get("left");//节点路径左侧信息
                const right = _path.get("right");//节点路径右侧信息
                if (!left.isMemberExpression())//左侧是否为成员表达式
                    return;
                const object = left.get("object");//获取左侧信息的对象
                const property = left.get("property");//获取左侧信息的属性
                //a={},a['b']=5；合并后a={'b':5}
                if (dict_key.indexOf(property.node.value) > -1) {
                    _path.remove();
                    return;//如果已存在，则跳过
                }
                if (object.isIdentifier({name: name}) && property.isStringLiteral() && _path.scope === scope) {
                    properties.push(types.ObjectProperty(types.valueToNode(property.node.value), right.node));
                    _path.remove();
                    dict_key.push(property.node.value)
                }
                //a={},a.b=5；合并后a={'b':5}
                if (object.isIdentifier({name: name}) && property.isIdentifier() && _path.scope === scope) {
                    properties.push(types.ObjectProperty(types.valueToNode(property.node.name), right.node));
                    _path.remove();
                    dict_key.push(property.node.value)
                }
            }
        })
    }

    traverse(ast_code, {VariableDeclarator: {exit: [merge_object]}});
    ast_code = parse(generator(ast_code).code)
    // 对象表达式字符串合并

    function AddObjPro(path) {

        if (types.isBinaryExpression(path.node.value)) {
            let BinNode = path.node.value;//属性节点
            if (!types.isBinaryExpression(BinNode)) return;//二相式表达式验证
            try {
                path.node.value = types.StringLiteral(eval(generator(BinNode).code));      // 值替换节点
            } catch (e) {
            }
        }
    }

    traverse(ast_code, {ObjectProperty: {exit: [AddObjPro]}});
    ast_code = parse(generator(ast_code).code)

    // 花指令剔除
    function callToStr(path) {
    // 将对象进行替换
    try {
        var node = path.node;//获取路径节点

        if (!types.isObjectExpression(node.init))//不是对象表达式则退出
            return;

        var objPropertiesList = node.init.properties;    // 获取对象内所有属性
        if (objPropertiesList.length === 0) // 对象内属性列表为0则退出
            return;
        var objName = node.id.name;   // 对象名

        let scope = path.scope;//获取路径的作用域
        let binding = scope.getBinding(objName);//

        if (!binding || binding.constantViolations.length > 0) {//检查该变量的值是否被修改--一致性检测
            return;
        }

        let paths = binding.referencePaths;//绑定引用的路径
        let paths_sums = 0;//路径计数

        objPropertiesList.forEach(prop => {
            var key = prop.key.value;//属性名

            if (types.isFunctionExpression(prop.value))//属性值为函数表达式
            {
                var retStmt = prop.value.body.body[0];//定位到ReturnStatement


                path.scope.traverse(path.scope.block, {

                    CallExpression: function (_path) {//调用表达式匹配

                        let _path_binding = _path.scope.getBinding(objName);//当前作用域获取绑定
                        if (_path_binding !== binding) return;//两者绑定对比


                        if (!types.isMemberExpression(_path.node.callee))//成员表达式判定
                            return;
                        var _node = _path.node.callee;//回调函数节点
                        if (!types.isIdentifier(_node.object) || _node.object.name !== objName)//非标识符检测||节点对象名全等验证
                            return;

                        if (!(types.isStringLiteral(_node.property) || types.isIdentifier(_node.property)))//节点属性非可迭代字符验证||节点属性标识符验证
                            return;

                        if (!(_node.property.value === key || _node.property.name === key))//节点属性值与名称等于指定值验证
                            return;

                        // if (!types.isStringLiteral(_node.property) || _node.property.value != key)//节点属性可迭代字符验证与节点属性值与指定值等于验证
                        //     return;

                        var args = _path.node.arguments;//获取节点的参数

                        // 二元运算
                        if (types.isBinaryExpression(retStmt.argument) && args.length === 2)//二进制表达式判定且参数为两个
                        {
                            _path.replaceWith(types.binaryExpression(retStmt.argument.operator, args[0], args[1]));//二进制表达式替换当前节点
                        }
                        // 逻辑运算
                        else if (types.isLogicalExpression(retStmt.argument) && args.length === 2)//与二元运算一样
                        {
                            _path.replaceWith(types.logicalExpression(retStmt.argument.operator, args[0], args[1]));
                        }
                        // 函数调用
                        else if (types.isCallExpression(retStmt.argument) && types.isIdentifier(retStmt.argument.callee))//回调函数表达式判定及回调参数部分判定
                        {
                            _path.replaceWith(types.callExpression(args[0], args.slice(1)))
                        }
                        paths_sums += 1;//删除计数标志
                    }
                })
            } else if (types.isStringLiteral(prop.value)) {//属性值为可迭代字符类型
                retStmt = prop.value.value;//属性值的值即A:B中的B部分
                path.scope.traverse(path.scope.block, {
                    MemberExpression: function (_path) {//成员表达式

                        let _path_binding = _path.scope.getBinding(objName);//当前作用域获取绑定
                        if (_path_binding !== binding) return;//两者绑定对比
                        var _node = _path.node;
                        if (!types.isIdentifier(_node.object) || _node.object.name !== objName)//节点对象标识符验证|节点对象名验证
                            return;
                        if (!(types.isStringLiteral(_node.property) || types.isIdentifier(_node.property)))//节点属性可迭代字符验证|标识符验证
                            return;
                        if (!(_node.property.value === key || _node.property.name === key))//节点属性值与名称等于指定值验证
                            return;
                        // if (!types.isStringLiteral(_node.property) || _node.property.value != key)//节点属性可迭代字符判定|节点属性值等于指定值验证
                        //     return;
                        _path.replaceWith(types.stringLiteral(retStmt))//节点替换
                        paths_sums += 1;//删除计数标志
                    }
                })
            }
        });
        if (paths_sums === paths.length) {//若绑定的每个路径都已处理 ，则移除当前路径
            path.remove();//删除路径
        }
    } catch (e) {
        console.log(path.toString());
    }


}

    traverse(ast_code, {VariableDeclarator: {exit: [callToStr]}});

    return generator(ast_code).code
}