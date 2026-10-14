export interface Settings { onboardingDone: boolean; autoStart: boolean; muted: boolean; greeting: boolean; voiceName: string }
export interface Task { id: string; text: string; done: boolean }
export interface State { settings: Settings; tasks: Task[]; lastGreetingDate: string | null }
export function initialState(): State { return {settings:{onboardingDone:false,autoStart:false,muted:false,greeting:true,voiceName:''},tasks:[],lastGreetingDate:null}; }
export function localDate(now: Date): string { return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
export function canGreet(state: State, now: Date): boolean {return state.settings.onboardingDone && state.settings.greeting && !state.settings.muted && now.getHours()>=6 && now.getHours()<12 && state.lastGreetingDate!==localDate(now);}
export function settingsPatch(value: unknown): Partial<Settings> {
  if (!value || typeof value!=='object' || Array.isArray(value)) throw Error('設定が不正です');
  const result: Partial<Settings>={};
  for (const [key,item] of Object.entries(value)) {
    if (['onboardingDone','autoStart','muted','greeting'].includes(key) && typeof item==='boolean') Object.assign(result,{[key]:item});
    else if (key==='voiceName' && typeof item==='string' && item.length<=200) result.voiceName=item;
    else throw Error('設定が不正です');
  }
  return result;
}
