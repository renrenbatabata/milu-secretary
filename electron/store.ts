import fs from 'node:fs';
import path from 'node:path';
import { initialState, State, settingsPatch, canGreet, localDate } from './domain';
export class Store {
  state: State;
  constructor(private file: string) {
    this.state=initialState();
    if (!fs.existsSync(file)) return;
    const raw=JSON.parse(fs.readFileSync(file,'utf8'));
    const settings={...this.state.settings,...settingsPatch(raw.settings)};
    if (!Array.isArray(raw.tasks) || raw.tasks.some((t: any)=>typeof t.id!=='string'||typeof t.text!=='string'||typeof t.done!=='boolean'||t.text.length>500)) throw Error('保存データが不正です');
    if(raw.lastGreetingDate!==null && (typeof raw.lastGreetingDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(raw.lastGreetingDate))) throw Error('再生日が不正です');
    this.state={settings,tasks:raw.tasks,lastGreetingDate:raw.lastGreetingDate};
  }
  save(next: State) {
    fs.mkdirSync(path.dirname(this.file),{recursive:true});
    const temp=this.file+'.tmp';
    fs.writeFileSync(temp,JSON.stringify(next,null,2),'utf8');
    fs.renameSync(temp,this.file);
    this.state=next;
  }
}
export function claimGreeting(store: Store, now: Date): string | null {
  if(!canGreet(store.state,now))return null;
  store.save({...store.state,lastGreetingDate:localDate(now)});
  const count=store.state.tasks.filter(t=>!t.done).length;
  return `おはよう。Miluだよ。今日も自分のペースでいこうね。${count?`今日のタスクは${count}件あるよ。`:'まずは今日やりたいことをひとつ決めよう。'}`;
}
