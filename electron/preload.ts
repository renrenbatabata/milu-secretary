import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('milu', {
  load:()=>ipcRenderer.invoke('load'),
  settings:(patch: unknown)=>ipcRenderer.invoke('settings',patch),
  addTask:(text: string)=>ipcRenderer.invoke('task-add',text),
  toggleTask:(id: string)=>ipcRenderer.invoke('task-toggle',id),
  deleteTask:(id: string)=>ipcRenderer.invoke('task-delete',id),
  claimGreeting:()=>ipcRenderer.invoke('greeting-claim')
});
