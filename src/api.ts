export interface Settings {onboardingDone:boolean;autoStart:boolean;muted:boolean;greeting:boolean;voiceName:string}
export interface Snapshot {settings:Settings;tasks:{id:string;text:string;done:boolean}[];lastGreetingDate:string|null;login:{available:boolean;enabled:boolean};loginLaunch:boolean}
export interface MiluAPI {load():Promise<Snapshot>;settings(patch:Partial<Settings>):Promise<Snapshot>;addTask(text:string):Promise<Snapshot>;toggleTask(id:string):Promise<Snapshot>;deleteTask(id:string):Promise<Snapshot>;claimGreeting():Promise<string|null>}
declare global {interface Window {milu:MiluAPI}}
