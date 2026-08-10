import {useEffect, useMemo, useRef, useState} from 'react'
import {buildPreviewScenario} from '../../data/scenarioTypes'
import type {IScenario} from '../../data/scenarios'
import './WidgetPreview.scss'

interface IWidgetPreview {
  scenario: IScenario
}

const widgetUrl = import.meta.env.VITE_WIDGET_URL ?? 'http://localhost:8082/widget.js'

function safeInlineJson(value: string) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function createFrameHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;font-family:Inter,Arial,sans-serif;color:#70757f;background:#eef1f4}
    .shell{height:100%;display:grid;grid-template-columns:72px 1fr;grid-template-rows:44px 1fr;gap:0}
    .top{grid-column:1/-1;display:flex;align-items:center;gap:12px;padding:0 16px;background:#fff;border-bottom:1px solid #e1e5e9}
    .logo{width:42px;height:9px;border-radius:9px;background:#cbd2d9}.search{width:min(34%,180px);height:16px;border-radius:8px;background:#edf0f2}
    .side{padding:15px 12px;background:#f8f9fa;border-right:1px solid #e1e5e9}.side i{display:block;height:8px;margin-bottom:13px;border-radius:8px;background:#d9dee3}
    .main{position:relative;padding:18px;overflow:hidden}.line{height:9px;margin-bottom:10px;border-radius:8px;background:#d7dde2}.line--title{width:34%;height:13px;background:#c8d0d7}.line--short{width:58%}
    .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px}.card{height:72px;border:1px solid #e0e4e8;border-radius:9px;background:#fff}
    .target{position:absolute;right:12%;bottom:18%;min-width:108px;padding:10px 14px;color:#fff;background:#0090de;border:0;border-radius:8px;font-weight:700}
    @media(max-width:480px){.shell{grid-template-columns:46px 1fr}.cards{grid-template-columns:1fr}.card:nth-child(n+2){display:none}.target{right:8%;bottom:12%}}
  </style>
</head>
<body>
  <div class="shell" aria-hidden="true">
    <div class="top"><span class="logo"></span><span class="search"></span></div>
    <div class="side"><i></i><i></i><i></i><i></i></div>
    <main class="main"><div class="line line--title"></div><div class="line line--short"></div><div class="cards"><div class="card"></div><div class="card"></div><div class="card"></div></div><button class="target" data-onboarding-id="preview-target">Элемент</button></main>
  </div>
  <script>
    const parentOrigin=${safeInlineJson(window.location.origin)};
    window.addEventListener('message',(event)=>{
      if(event.source!==parent||event.origin!==parentOrigin||event.data?.type!=='avito-widget-preview-render')return;
      window.AvitoOnboarding?.preview(event.data.scenario);
    });
    const script=document.createElement('script');
    script.src=${safeInlineJson(widgetUrl)};
    script.onload=()=>parent.postMessage({type:window.AvitoOnboarding?.preview?'avito-widget-preview-ready':'avito-widget-preview-error'},parentOrigin);
    script.onerror=()=>parent.postMessage({type:'avito-widget-preview-error'},parentOrigin);
    document.head.append(script);
  </script>
</body>
</html>`
}

const frameHtml = createFrameHtml()

export function WidgetPreview({scenario}: IWidgetPreview) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const previewScenario = useMemo(() => buildPreviewScenario(scenario), [scenario])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.source !== frameRef.current?.contentWindow ||
        event.origin !== window.location.origin
      ) return

      if (event.data?.type === 'avito-widget-preview-ready') {
        setStatus('ready')
      } else if (event.data?.type === 'avito-widget-preview-error') {
        setStatus('error')
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    frameRef.current?.contentWindow?.postMessage(
      {type: 'avito-widget-preview-render', scenario: previewScenario},
      window.location.origin,
    )
  }, [previewScenario, status])

  return (
    <section className="widget-preview" aria-labelledby="widget-preview-title">
      <div className="widget-preview__heading">
        <span>Предпросмотр</span>
        <p id="widget-preview-title">Так виджет будет выглядеть на странице</p>
      </div>
      <div className="widget-preview__viewport">
        <iframe
          ref={frameRef}
          sandbox="allow-same-origin allow-scripts"
          srcDoc={frameHtml}
          title="Предпросмотр виджета"
        />
        {status === 'loading' && (
          <span className="widget-preview__state" role="status">Загружаем виджет…</span>
        )}
        {status === 'error' && (
          <span className="widget-preview__state widget-preview__state--error" role="status">
            Предпросмотр недоступен. Запустите сборку widget на порту 8082.
          </span>
        )}
      </div>
    </section>
  )
}
