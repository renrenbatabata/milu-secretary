import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store, claimGreeting } from './store';
import { settingsPatch } from './domain';
app.setName('Milu');
let window: BrowserWindow | null=null;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',()=>{ if(window){if(window.isMinimized())window.restore();window.show();window.focus();} });
  app.whenReady().then(()=>{
    if(process.platform!=='win32'){dialog.showErrorBox('Milu','このMVPはWindows専用です。');app.quit();return;}
    let store: Store;
    try {store=new Store(path.join(app.getPath('userData'),'milu.json'));}
    catch {dialog.showErrorBox('Milu','保存ファイルを読み込めません。データを保護するため起動を停止しました。%APPDATA%\\Milu の milu.json を確認してください。');app.quit();return;}
    const loginOptions={path:process.execPath,args:['--login-start']};
    const loginStatus=()=>{
      if(!app.isPackaged)return false;
      const status=app.getLoginItemSettings(loginOptions);
      return status.openAtLogin && status.launchItems.some(item=>item.name==='Milu'&&item.enabled);
    };
    const snapshot=()=>({...store.state,login:{available:app.isPackaged,enabled:loginStatus()},loginLaunch:process.argv.includes('--login-start')});
    const handle=(channel: string,fn: (arg: any)=>unknown)=>ipcMain.handle(channel,(event,arg)=>{
      if(!window || event.sender!==window.webContents || event.senderFrame!==window.webContents.mainFrame)throw Error('許可されていない操作です');
      return fn(arg);
    });
    handle('load',()=>snapshot());
    handle('settings',(value)=>{
      const patch=settingsPatch(value);
      const previous=loginStatus();
      if(patch.autoStart!==undefined){
        if(!app.isPackaged && patch.autoStart)throw Error('自動起動はインストール版で有効にできます');
        app.setLoginItemSettings({...loginOptions,openAtLogin:patch.autoStart,enabled:patch.autoStart,name:'Milu'});
        if(loginStatus()!==patch.autoStart)throw Error('Windowsの自動起動設定を変更できませんでした');
      }
      try{store.save({...store.state,settings:{...store.state.settings,...patch}});}
      catch(error){if(patch.autoStart!==undefined)app.setLoginItemSettings({...loginOptions,openAtLogin:previous,name:'Milu'});throw error;}
      return snapshot();
    });
    handle('task-add',(text)=>{
      if(typeof text!=='string'||!text.trim()||text.trim().length>500||store.state.tasks.length>=1000)throw Error('タスクは1〜500文字、最大1000件です');
      store.save({...store.state,tasks:[...store.state.tasks,{id:randomUUID(),text:text.trim(),done:false}]});return snapshot();
    });
    for(const operation of ['toggle','delete'])handle(`task-${operation}`,(id)=>{
      if(typeof id!=='string'||!store.state.tasks.some(t=>t.id===id))throw Error('タスクが見つかりません');
      store.save({...store.state,tasks:operation==='delete'?store.state.tasks.filter(t=>t.id!==id):store.state.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)});return snapshot();
    });
    handle('greeting-claim',()=>{
      // Persist before returning so reloads, crashes and concurrent IPC cannot replay today.
      return claimGreeting(store,new Date());
    });
    window=new BrowserWindow({width:1120,height:820,minWidth:800,minHeight:650,backgroundColor:'#f2faff',title:'Milu',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
    window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    window.webContents.on('will-navigate',event=>event.preventDefault());
    window.on('closed',()=>{window=null;});
    window.loadFile(path.join(__dirname,'../dist/index.html'));
  });
  app.on('window-all-closed',()=>app.quit());
}
