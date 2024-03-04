tmpFolderBase="$PWD/_temp_"

echo "开始执行安装操作..."
cd $tmpFolderBase
echo "开始解压"
unzip -o mybricks-apaas.zip -d ./
cd ./mybricks-apaas
echo "开始执行覆盖操作"
if [[ -d "./server" ]];
then
  files=$(ls "$tmpFolderBase/mybricks-apaas/server")
  for filename in $files
  do
    cp -rf "./server/$filename" ../../server
  done
fi
if [[ -d "./server-runtime" ]];
then
  files=$(ls "$tmpFolderBase/mybricks-apaas/server-runtime")
  for filename in $files
  do
    cp -rf "./server-runtime/$filename" ../../server-runtime
  done
fi
cp ./upgrade_platform.sh ../../upgrade_platform.sh

echo "覆盖完毕"

echo "开始执行安装依赖操作"
cd $tmpFolderBase
cd "../server"
npm i --registry=https://registry.npmmirror.com
cd "../server-runtime"
npm i --registry=https://registry.npmmirror.com
echo "依赖安装完毕"

echo "开始清除临时文件"
cd $tmpFolderBase
cd ../
if [[ -d "./_temp_" ]];
then
  rm -rf "_temp_"
fi