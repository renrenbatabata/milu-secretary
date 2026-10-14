import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import type {Snapshot,Settings} from './api';
import './style.css';
function App(){
  const [data,setData]=useState<Snapshot|null>(null),[error,setError]=useState(''),[text,setText]=useState(''),[busy,setBusy]=useState(false),[voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[speech,setSpeech]=useState(''),[speaking,setSpeaking]=useState(false),[tab,setTab]=useState('today');
  const latest=useRef<Snapshot|null>(null),claimed=useRef(false),active=useRef(true);
  const synth=window.speechSynthesis;
  function accept(next:Snapshot){latest.current=next;setData(next);}
  useEffect(()=>{
    active.current=true;
    if(!window.milu){setError('Electronから起動してください。npm start を使用できます。');return;}
    window.milu.load().then(accept).catch(e=>setError(String(e)));
    const update=()=>setVoices(synth?synth.getVoices().filter(v=>v.localService&&v.lang.toLowerCase().startsWith('ja')):[]);
    update();synth?.addEventListener('voiceschanged',update);
    return()=>{active.current=false;synth?.removeEventListener('voiceschanged',update);synth?.cancel();};
  },[]);
  const selectedVoice=voices.find(v=>v.name===data?.settings.voiceName)??voices[0];
  function say(message:string,voice=selectedVoice){
    if(latest.current?.settings.muted)return;
    if(!synth||!voice){setSpeech('日本語のオフライン音声がありません。Windowsの音声設定から追加してください。');return;}
    synth.cancel();const utterance=new SpeechSynthesisUtterance(message);utterance.voice=voice;utterance.lang='ja-JP';utterance.rate=.9;utterance.pitch=1;
    utterance.onstart=()=>{if(active.current)setSpeaking(true);};utterance.onend=()=>{if(active.current)setSpeaking(false);};utterance.onerror=()=>{if(active.current){setSpeaking(false);setSpeech('読み上げできませんでした。音声設定を確認してください。');}};
    setSpeech(message);synth.speak(utterance);
  }
  useEffect(()=>{
    if(!data?.settings.onboardingDone||!selectedVoice||claimed.current)return;
    claimed.current=true;
    window.milu.claimGreeting().then(message=>{
      // Check again after IPC: mute may have changed while awaiting the claim.
      if(message&&active.current&&!latest.current?.settings.muted)say(message,selectedVoice);
    }).catch(e=>setError(String(e)));
  },[data,selectedVoice]);
  async function run(action:()=>Promise<Snapshot>){if(busy)return;setBusy(true);setError('');try{accept(await action());return true;}catch(e){setError(String(e));return false;}finally{setBusy(false);}}
  function change(patch:Partial<Settings>){if(patch.muted){synth?.cancel();setSpeaking(false);}return run(()=>window.milu.settings(patch));}
  const pending=data?.tasks.filter(t=>!t.done)??[];
  const briefing=`今日のブリーフィングだよ。予定はデモとして午前10時に一日の計画。TOEICは単語を15分、リスニングを20分やってみよう。天気と金融情報はサンプル表示なので、実際の情報を確認してね。${pending.length?`残っているタスクは、${pending.map(t=>t.text).join('、')}。`:'今日のタスクはまだないよ。'}無理せず、ひとつずつ進めよう。`;
  if(!data)return <main><h1>Milu</h1><p>{error||'今日の準備をしています…'}</p></main>;
  return <div className="layout"><aside><div className="brand">milu<span>YOUR DAILY COMPANION</span></div><button className={tab==='today'?'nav selected':'nav'} onClick={()=>setTab('today')}>☀ 今日のダッシュボード</button><button className={tab==='settings'?'nav selected':'nav'} onClick={()=>setTab('settings')}>⚙ Miluの設定</button><div className="side-note">あなたのペースで、<br/>ひとつずつ。<small>オフラインで利用できます</small></div></aside><main>
    <header><div><small>MY LITTLE ASSISTANT</small><h1>{tab==='today'?'今日も、いっしょに。':'Miluの設定'}</h1></div><span className="pill">ローカル保存</span></header>
    {error&&<p role="alert" className="error">{error}</p>}
    {!selectedVoice&&<p role="status" className="voice-notice">日本語のオフライン音声が見つかりません。Windowsに音声を追加すると読み上げを使えます。タスク管理はそのまま利用できます。</p>}
    {!data.settings.onboardingDone&&<section className="welcome"><h2>はじめまして、Miluだよ。</h2><p>Windowsにログインしたら起動して、朝6時〜12時に一度だけ挨拶するよ。自動起動を使うか選んでね。</p><div className="actions"><button disabled={busy||!data.login.available} onClick={()=>change({autoStart:true,onboardingDone:true})}>自動起動を有効にして始める</button><button className="secondary" disabled={busy} onClick={()=>change({autoStart:false,onboardingDone:true})}>自動起動なしで始める</button></div>{!data.login.available&&<small>自動起動はインストール版で設定できます。</small>}</section>}
    {tab==='today'?<><section className="hero"><div><span className="eyebrow">HELLO, I'M MILU</span><h2>今日をちょっと、<br/>軽やかに。</h2><p>予定も、勉強も、小さな一歩から。<br/>わたしがそばでお手伝いするね。</p><button disabled={data.settings.muted||!selectedVoice} onClick={()=>say(briefing)}>▶ 今日のブリーフィングを聴く</button></div><div className={'character '+(speaking?'talking':'')} role="img" aria-label="水色と白のふわふわなMilu"><div className="ear left"/><div className="ear right"/><div className="face"><i className="eye left"/><i className="eye right"/><i className="cheek left"/><i className="cheek right"/><i className="mouth"/></div><div className="body"/><div className="star">✦</div></div></section>
    <div className="cards"><section><span className="card-icon">◷</span><h3>今日の予定 <em>デモ</em></h3><p>10:00 一日の計画</p><small>実際のカレンダーには未接続</small></section><section><span className="card-icon">☁</span><h3>天気・金融 <em>デモ</em></h3><p>晴れ / 24°C · 市場情報のサンプル</p><small>現在の天気・相場ではありません</small></section><section><span className="card-icon">✎</span><h3>TOEICの小さな一歩</h3><p>単語15分 + リスニング20分</p><small>今日のおすすめ学習プラン</small></section></div>
    <section className="tasks"><div className="section-title"><h2>今日やること</h2><span>{pending.length} 件残っています</span></div><form onSubmit={async e=>{e.preventDefault();if(await run(()=>window.milu.addTask(text)))setText('');}}><input aria-label="新しいタスク" placeholder="今日の小さな一歩を追加…" value={text} maxLength={500} onChange={e=>setText(e.target.value)}/><button disabled={busy||!text.trim()}>追加</button></form>{data.tasks.length?data.tasks.map(task=><div className="task" key={task.id}><label><input type="checkbox" checked={task.done} disabled={busy} onChange={()=>run(()=>window.milu.toggleTask(task.id))}/><span className={task.done?'done':''}>{task.text}</span></label><button className="delete" disabled={busy} onClick={()=>run(()=>window.milu.deleteTask(task.id))} aria-label={`${task.text}を削除`}>削除</button></div>):<p className="empty">まだタスクはありません。ひとつから始めよう。</p>}</section></>:<section className="settings">
      <label className="setting"><span><strong>Windowsログイン時に自動起動</strong><small>初期状態はOFF。インストール版で利用できます。</small></span><input type="checkbox" disabled={busy||!data.login.available} checked={data.login.enabled} onChange={e=>change({autoStart:e.target.checked})}/></label>
      <label className="setting"><span><strong>朝の挨拶</strong><small>起動時の午前6:00〜11:59、1日1回。夜間は読み上げません。</small></span><input type="checkbox" disabled={busy} checked={data.settings.greeting} onChange={e=>change({greeting:e.target.checked})}/></label>
      <label className="setting"><span><strong>音声をミュート</strong><small>すべての読み上げを停止します。</small></span><input type="checkbox" disabled={busy} checked={data.settings.muted} onChange={e=>change({muted:e.target.checked})}/></label>
      <label className="voice-label">読み上げの声<select disabled={busy} value={selectedVoice?.name??''} onChange={e=>change({voiceName:e.target.value})}>{voices.length?voices.map(v=><option key={v.voiceURI} value={v.name}>{v.name}</option>):<option value="">日本語のローカル音声がありません</option>}</select></label><p>ゆっくりめの穏やかな話し方です。声の印象はWindowsに入っている音声によって変わります。</p><button disabled={data.settings.muted||!selectedVoice} onClick={()=>say('こんにちは、Miluだよ。今日もあなたのペースで、いっしょに進めよう。')}>声を試す</button>
    </section>}
    <footer><span role="status">{speech||'Miluはいつでも、ここにいるよ。'}</span>{speaking&&<button className="secondary" onClick={()=>{synth.cancel();setSpeaking(false);}}>読み上げ停止</button>}</footer>
  </main></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
