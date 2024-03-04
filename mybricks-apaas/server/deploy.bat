@echo on
call deploy_dep.bat
call deploy_app.bat
call deploy_inst.bat
echo "install succeed!"
pause