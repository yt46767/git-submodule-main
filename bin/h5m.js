#!/usr/bin/env node
/*
  命令行参数定义：
  process.argv[1]:执行脚本
  process.argv[2]:业务命令
  process.argv[3]:主模块分支
  process.argv[4]:子模块分支
  process.argv[5]:仓库地址
  process.argv[6]:子模块文件夹名
  process.argv[7]:提交文件
*/
//在 commit 之前检查是否有冲突，如果有冲突就 process.exit(1)
const execSync = require('child_process').execSync
require('shelljs/global')
//申明变量
const runCmd = process.argv[2]
const mainBranch = process.argv[3] || "未定义主模块分支"
const subBranch = process.argv[4] || "未定义子模块分支"
const url = process.argv[5] || "未定义仓库地址"
const subModule_folderName = process.argv[6] || "未命名文件夹"
const addFiles = process.argv[7] || "未申明提交文件"
let subModule_url
//字符串前后去空
function trim(str){
  return str.replace(/(^\s*)|(\s*$)/g, "");
}
//命令执行中异常捕获
function runFun(f){
  // git 对所有冲突的地方都会生成下面这种格式的信息，所以写个检测冲突文件的正则
  const isConflictRegular = "^<<<<<<<\\s|^=======$|^>>>>>>>\\s"
  let rs = execSync(f, {encoding: 'utf-8'})
  let results
  let msg = arguments[1] || '没有发现冲突!'
  try {
      // git grep 命令会执行 perl 的正则匹配所有满足冲突条件的文件
      results = execSync(`git grep -n -P "${isConflictRegular}"`, {encoding: 'utf-8'})
  } catch (e) {
      return rs;
      // console.log(msg)
      process.exit(0)
  }
  if(results) {
      console.error('发现冲突，请解决后再提交，冲突文件：')
      console.error(results.trim())
      process.exit(1)
  }
  process.exit(0)
}
//增加新子模块
function addSubFun(){
  subModule_url = url || '未命名子仓库地址'
  let temp = JSON.parse(trim(runFun('cat submodule.json')))
  temp[subModule_folderName] = {}
  temp[subModule_folderName].url = subModule_url
  temp[subModule_folderName].branch = subBranch
  runFun("echo '"+JSON.stringify(temp)+"' > submodule.json ")
  temp = null

  runFun("git submodule add --force --name "+subModule_folderName+" -b "+subBranch+" "+subModule_url+" "+ subModule_folderName )
  // 主模块提交子模块版本信息
  runFun("git add .gitmodules "+subModule_folderName)
  runFun('git commit -m "commit '+subModule_folderName+'"')
  runFun('git submodule init')
  runFun('git push origin '+mainBranch)
}
//删除子模块
function delSubFun(){
  let temp = JSON.parse(trim(runFun('cat submodule.json')))
  let temp1 = trim(runFun('pwd'))
  delete temp[subModule_folderName]
  runFun("echo '"+JSON.stringify(temp)+"' > submodule.json ")
  temp = null

  runFun("git rm "+subModule_folderName+" -f")
  cd('.git')
  //删除带subModule_folderName字符串的某一行以及后面1行
  const gitConfig_file ="config"
  let temp2 = subModule_folderName.replace(/\//g,'\\/')
  startLine=`sed -n '/`+temp2+`/=' `+gitConfig_file //先计算带subModule_folderName字符串行的行号
  startLine = parseInt(runFun(startLine))
  lineAfter = 1
  let endLine = startLine + lineAfter
  runFun("sed -i '' '"+startLine+","+endLine+"d' "+gitConfig_file,'在.git/config文件里，submodule相关配置已删除')
  cd(temp1)
  temp1 = null
  //提交代码
  // runFun("git add .")
  runFun("git commit -a -m 'remove "+subModule_folderName+"'")
  runFun("git push origin "+mainBranch)
}
//更新所有模块
function pullAllFun(){
  let temp = JSON.parse(trim(runFun('cat submodule.json')))
  let temp1 = trim(runFun('pwd'))
  for(var o in temp){
    runFun('git submodule init')
    runFun("git submodule update "+o.split('/')[o.split('/').length-1])
    cd(o)
    runFun('git pull origin '+temp[o].branch)
    cd(temp1)
  }
  temp = null
  temp1 = null
  runFun('git pull origin '+mainBranch)
}
//更新子模块
function pullSubFun(){
  let temp1 = trim(runFun('pwd'))
  runFun('git submodule init')
  runFun("git submodule update "+subModule_folderName)
  console.log("git submodule update "+subModule_folderName)
  cd(subModule_folderName)
  console.log('cd '+subModule_folderName)
  runFun('git pull origin '+subBranch)
  console.log('git pull origin '+subBranch)
  cd(temp1)
  temp1 = null
  // runFun('git pull origin '+mainBranch)
}
//主模块提交代码
function addCommitPushMainFun(){
  let temp = addFiles.split(',').join(' ')
  runFun('git add '+ temp)
  temp = null
  runFun('git commit -m "git commit '+addFiles+'"')
  runFun('git push origin '+mainBranch)
}
//子模块提交 & 主模块提交子模块更新信息
function addCommitPushSubFun(){
  if(addFiles!='未申明提交文件'){
    let temp1 = trim(runFun('pwd'))
    cd(subModule_folderName)
    runFun('git pull origin '+subBranch)
    let temp = addFiles.split(',').join(' ')
    runFun('git add '+ temp)
    temp = null
    runFun('git commit -m "git commit '+addFiles+'"')
    runFun('git push origin '+subBranch)
    cd(temp1)
    temp1 = null
  }
  runFun('git add '+subModule_folderName)
  runFun('git commit -m "git commit '+subModule_folderName+'"')
  runFun('git push origin '+mainBranch)
}
//子模块提交 & 主模块提交子模块更新信息
function rmCommitPushSubFun(){
  if(addFiles != '未申明提交文件' && addFiles != '.'){
    let temp1 = trim(runFun('pwd'))
    cd(subModule_folderName)
    runFun('git pull origin '+subBranch)
    let temp = addFiles.split(',').join(' ')
    runFun('git rm '+ temp)
    temp = null
    runFun('git commit -m "git commit '+addFiles+'"')
    runFun('git push origin '+subBranch)
    cd(temp1)
    temp1 = null
    runFun('git add '+subModule_folderName)
    runFun('git commit -m "git commit '+subModule_folderName+'"')
    runFun('git push origin '+mainBranch)
  }else{
    console.error('报错：请git rm 具体文件')
  }
}
//查询子模块状态
function subStatusFun(){
  let temp1 = trim(runFun('pwd'))
  cd(subModule_folderName)
  console.log(runFun('git status'))
  cd(temp1)
  temp1 = null
}
//查询主模块状态
function mainStatusFun(){
  console.log(runFun('git status'))
}
//业务判断
(function(){
  switch(runCmd){
    case 'addsub':           //例如：h5m addsub temp temp https://github.com/yt46767/subProject1.git subProject99
      addSubFun()            //已验证通过！
      break
    case 'delsub':           //例如：h5m delsub temp - - subProject9
      delSubFun()            //已验证通过！
      break
    case 'pullall':          //例如：h5m pullall temp
      pullAllFun()           //已验证通过！
      break
    case 'pullsub':          //例如：h5m pullsub temp temp - subProject9
      pullSubFun()           //已验证通过！
      break
    case 'addcommitpushmain'://例如：h5m addcommitpushmain temp - - - bin/h5m.js
      addCommitPushMainFun() //已验证通过！
      break
    case 'addcommitpushsub': //例如：h5m addcommitpushsub temp temp - subProject99
      addCommitPushSubFun()  //已验证通过！
      break
    case 'rmcommitpushsub':  //例如：h5m rmcommitpushsub temp temp - subProject99
      rmCommitPushSubFun()   //已验证通过！
      break
    case 'mainstatus':       //例如：h5m mainstatus
      mainStatusFun()        //已验证通过！
      break
    case 'substatus':        //例如：h5m substatus - - - subProject9
      subStatusFun()         //已验证通过！
      break
  }
})()
