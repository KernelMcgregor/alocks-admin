// Articles: covers, framing, in-article pictures, manual edits and context rewrites.
//
// Pick an article on the left. The editor on the right has the cover (upload, swap for
// a search candidate, reframe by clicking where the subject is), pictures to embed in
// the text, the markdown itself, and a box for background the agent folds into a
// rewrite. Rewrites come back as a draft in the editor; nothing is live until Save.
import { FileText, ImagePlus, Loader2, Sparkles, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Empty, ErrorNote, Input, PageTitle, Select } from '../components/ui'
import { api, apiBase } from '../lib/api'
import { cn } from '../lib/utils'

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = reject
  r.readAsDataURL(file)
})

function UploadButton({ label, onFile, busy, variant = 'outline' }) {
  const ref = useRef(null)
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f) }} />
      <Button variant={variant} size="sm" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}{label}
      </Button>
    </>
  )
}

// ---------------------------------------------------------------------------
// Framing: click or drag on the picture to put the subject there; the previews show
// how the crops on the site will look.
// ---------------------------------------------------------------------------
const CROPS = [
  { label: 'Top story', w: 220, ratio: '16 / 9' },
  { label: 'Card', w: 150, ratio: '3 / 2' },
  { label: 'Thumbnail', w: 96, ratio: '3 / 2' },
  { label: 'In text', w: 120, ratio: '4 / 3' },
]

function Framer({ src, focal, onChange }) {
  const ref = useRef(null)
  const drag = useRef(false)
  const set = (e) => {
    const r = ref.current.getBoundingClientRect()
    onChange({
      focal_x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      focal_y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    })
  }
  const pos = `${focal.focal_x * 100}% ${focal.focal_y * 100}%`
  return (
    <div className="flex flex-wrap gap-4">
      <div ref={ref} className="relative cursor-crosshair select-none overflow-hidden rounded-md border"
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); set(e) }}
        onPointerMove={(e) => drag.current && set(e)}
        onPointerUp={() => { drag.current = false }}>
        <img src={src} alt="" draggable={false} className="block max-h-[280px] max-w-[440px]" />
        <span className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.6)]"
          style={{ left: `${focal.focal_x * 100}%`, top: `${focal.focal_y * 100}%` }} />
      </div>
      <div className="flex flex-wrap content-start gap-3">
        {CROPS.map((c) => (
          <div key={c.label}>
            <div className="mb-1 text-[11px] font-medium text-slate-500">{c.label}</div>
            <img src={src} alt="" className="rounded-md border object-cover" style={{ width: c.w, aspectRatio: c.ratio, objectPosition: pos }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------------
function CoverCard({ article, reload, setError }) {
  const cover = article.cover
  const [focal, setFocal] = useState(cover ? { focal_x: cover.focal_x, focal_y: cover.focal_y } : null)
  const [busy, setBusy] = useState(null)
  useEffect(() => { setFocal(cover ? { focal_x: cover.focal_x, focal_y: cover.focal_y } : null) }, [cover?.v, cover?.focal_x, cover?.focal_y])
  const run = async (key, fn) => {
    setBusy(key); setError(null)
    try { await fn(); await reload() } catch (e) { setError(e) } finally { setBusy(null) }
  }
  const moved = cover && focal && (focal.focal_x !== cover.focal_x || focal.focal_y !== cover.focal_y)
  const src = cover ? `${apiBase()}/ufc/fights/${article.fight_id}/article-image?v=${cover.v}` : null
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Cover image</CardTitle>
        <div className="flex gap-2">
          <UploadButton label="Upload" busy={busy === 'upload'}
            onFile={(f) => run('upload', async () => api(`/admin/articles/${article.fight_id}/cover`, { method: 'POST', body: { data: await fileToDataUrl(f) } }))} />
          {cover && (
            <Button variant="outline" size="sm" disabled={!!busy}
              onClick={() => run('remove', () => api(`/admin/articles/${article.fight_id}/cover`, { method: 'DELETE' }))}>
              <Trash2 className="mr-1.5 h-4 w-4" />Remove
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!cover ? (
          <p className="text-sm text-slate-500">No cover. The site shows the two fighter portraits until one is added.</p>
        ) : (
          <>
            <Framer src={src} focal={focal} onChange={setFocal} />
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={!moved || !!busy}
                onClick={() => run('frame', () => api(`/admin/articles/${article.fight_id}/cover/focal`, { method: 'PUT', body: focal }))}>
                {busy === 'frame' && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save framing
              </Button>
              {moved && <Button size="sm" variant="ghost" onClick={() => setFocal({ focal_x: cover.focal_x, focal_y: cover.focal_y })}>Reset</Button>}
              <span className="text-xs text-slate-500">{cover.phase === 'manual' ? 'Chosen by hand' : `Picked automatically · ${cover.domain || ''}`}</span>
            </div>
          </>
        )}
        {cover?.candidates?.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-500">Other search results</div>
            <div className="flex flex-wrap gap-2">
              {cover.candidates.map((c) => (
                <button key={c.url} title={c.domain} disabled={!!busy}
                  onClick={() => run(c.url, () => api(`/admin/articles/${article.fight_id}/cover/candidate`, { method: 'POST', body: { url: c.url } }))}
                  className="relative h-[72px] w-[108px] overflow-hidden rounded-md border hover:ring-2 hover:ring-primary">
                  <img src={c.url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  {busy === c.url && <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-5 w-5 animate-spin" /></span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// In-article pictures
// ---------------------------------------------------------------------------
function MediaItem({ m, onInsert, reload, setError }) {
  const [align, setAlign] = useState('right')
  const [width, setWidth] = useState('42')
  const [framing, setFraming] = useState(false)
  const [focal, setFocal] = useState({ focal_x: m.focal_x, focal_y: m.focal_y })
  const src = `${apiBase()}/ufc/article-media/${m.id}`
  const act = async (fn) => { setError(null); try { await fn(); await reload() } catch (e) { setError(e) } }
  return (
    <div className="rounded-md border p-2">
      <div className="flex items-center gap-3">
        <img src={src} alt="" className="h-[60px] w-[80px] rounded object-cover" style={{ objectPosition: `${m.focal_x * 100}% ${m.focal_y * 100}%` }} />
        <div className="min-w-0 flex-1 text-sm">
          <div className="truncate font-medium">{m.label || `Picture ${m.id}`}</div>
          <div className="text-xs text-slate-500">{m.width}×{m.height}</div>
        </div>
        <Select value={align} onChange={(e) => setAlign(e.target.value)} className="w-[96px]">
          <option value="right">Right</option><option value="left">Left</option><option value="center">Full width</option>
        </Select>
        {align !== 'center' && (
          <Select value={width} onChange={(e) => setWidth(e.target.value)} className="w-[80px]">
            {['30', '38', '42', '50', '60'].map((w) => <option key={w} value={w}>{w}%</option>)}
          </Select>
        )}
        <Button size="sm" onClick={() => onInsert(`\n\`\`\`chin-image\n${m.id} | ${align} | ${width}\n\`\`\`\n`)}>Insert</Button>
        <Button size="sm" variant="outline" onClick={() => setFraming((x) => !x)}>Frame</Button>
        <Button size="sm" variant="ghost" title="Delete" onClick={() => act(() => api(`/admin/media/${m.id}`, { method: 'DELETE' }))}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {framing && (
        <div className="mt-3 space-y-2">
          <Framer src={src} focal={focal} onChange={setFocal} />
          <Button size="sm" onClick={() => act(async () => { await api(`/admin/media/${m.id}/focal`, { method: 'PUT', body: focal }); setFraming(false) })}>Save framing</Button>
        </div>
      )}
    </div>
  )
}

function MediaCard({ article, onInsert, reload, setError }) {
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const add = async (file) => {
    setBusy(true); setError(null)
    try {
      await api(`/admin/articles/${article.fight_id}/media`, { method: 'POST', body: { data: await fileToDataUrl(file), label: label || file.name.replace(/\.[^.]+$/, '') } })
      setLabel(''); await reload()
    } catch (e) { setError(e) } finally { setBusy(false) }
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Pictures in the article</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className="h-8 w-[180px]" />
          <UploadButton label="Add picture" busy={busy} onFile={add} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!article.media.length
          ? <p className="text-sm text-slate-500">Upload a picture, then Insert it where your cursor is in the article. Text wraps around left and right pictures.</p>
          : article.media.map((m) => <MediaItem key={m.id} m={m} onInsert={onInsert} reload={reload} setError={setError} />)}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Text: editor, preview, rewrite with context
// ---------------------------------------------------------------------------
const SNIPPETS = [
  { label: 'Stat callouts', text: '\n```chin-stats\n66% | Model: Gane wins | red\n64.8% | Market (no vig)\n+1.2 | Model edge, pts | green\n```\n' },
  { label: 'Percentile bars', text: '\n```chin-bars\nTakedowns | 30 | 86\nChin | 80 | 94\n```\n' },
  { label: 'Short version', text: '\n```chin-takeaways\n- First point\n- Second point\n```\n' },
]

// Admin preview: plain markdown, with the site's special blocks shown as labelled boxes.
function Preview({ content, fightId }) {
  return (
    <div className="prose prose-sm max-w-none rounded-md border bg-white p-4 [&_table]:text-xs">
      <Markdown remarkPlugins={[remarkGfm]} components={{
        pre({ children }) {
          const code = Array.isArray(children) ? children[0] : children
          const lang = /language-(chin-[\w-]+)/.exec(code?.props?.className || '')?.[1]
          const src = String(code?.props?.children ?? '').trim()
          if (lang === 'chin-image') {
            const [id, align = 'right', w = '42'] = src.split('|').map((x) => x.trim())
            return (
              <img src={`${apiBase()}/ufc/article-media/${id}`} alt=""
                className={cn('my-2 rounded-md object-cover', align === 'left' ? 'float-left mr-4' : align === 'right' ? 'float-right ml-4' : 'w-full')}
                style={align === 'center' ? undefined : { width: `${w}%` }} />
            )
          }
          if (lang) return <div className="my-3 rounded-md border border-dashed bg-slate-50 p-2 text-xs"><b>{lang}</b><pre className="m-0 bg-transparent p-0 text-slate-600">{src}</pre></div>
          return <pre>{children}</pre>
        },
      }}>{content}</Markdown>
      <div className="clear-both" data-fight={fightId} />
    </div>
  )
}

function Editor({ fightId }) {
  const [article, setArticle] = useState(null)
  const [content, setContent] = useState('')
  const [notes, setNotes] = useState('')
  const [draftFrom, setDraftFrom] = useState(null)   // the text a rewrite replaced, for Discard
  const [tab, setTab] = useState('edit')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const area = useRef(null)

  const reload = () => api(`/admin/articles/${fightId}`).then((a) => { setArticle(a); return a })
  useEffect(() => {
    setArticle(null); setDraftFrom(null); setSavedAt(null); setError(null)
    reload().then((a) => { setContent(a.content); setNotes(a.editor_notes) }).catch(setError)
  }, [fightId])

  const dirty = article && (content !== article.content || notes !== article.editor_notes)
  const insert = (text) => {
    const el = area.current
    const at = el ? el.selectionStart : content.length
    setContent((c) => c.slice(0, at) + text + c.slice(at))
    setTab('edit')
    requestAnimationFrame(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = at + text.length } })
  }
  const save = async () => {
    setBusy('save'); setError(null)
    try {
      await api(`/admin/articles/${fightId}`, { method: 'PUT', body: { content, editor_notes: notes } })
      await reload(); setDraftFrom(null); setSavedAt(new Date())
    } catch (e) { setError(e) } finally { setBusy(null) }
  }
  const rewrite = async () => {
    setBusy('rewrite'); setError(null)
    try {
      const { draft } = await api(`/admin/articles/${fightId}/rewrite`, { method: 'POST', body: { notes, current: content } })
      setDraftFrom((d) => d ?? content); setContent(draft); setTab('preview')
    } catch (e) { setError(e) } finally { setBusy(null) }
  }

  if (!article) return error ? <ErrorNote error={error} /> : <Empty>Loading…</Empty>
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-500">{article.event_name}</div>
          <h2 className="text-lg font-bold">{article.red} vs {article.blue}</h2>
        </div>
        {article.edited_at && <Badge>Edited {new Date(article.edited_at).toLocaleString()}</Badge>}
        {savedAt && !dirty && <span className="text-xs text-emerald-600">Saved</span>}
        <Button onClick={save} disabled={!dirty || !!busy}>{busy === 'save' && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save article</Button>
      </div>
      {error && <ErrorNote error={error} />}

      <CoverCard article={article} reload={reload} setError={setError} />
      <MediaCard article={article} onInsert={insert} reload={reload} setError={setError} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Background for the agent</CardTitle>
          <Button variant="outline" size="sm" disabled={!notes.trim() || !!busy} onClick={rewrite}>
            {busy === 'rewrite' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}Rewrite with this context
          </Button>
        </CardHeader>
        <CardContent>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="History between them, trash talk, injuries, what's at stake, storylines the article should lead with…"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Article</CardTitle>
            <div className="inline-flex rounded-md bg-slate-100 p-0.5 text-sm">
              {['edit', 'preview'].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cn('rounded px-3 py-0.5 capitalize', tab === t ? 'bg-white shadow-sm' : 'text-slate-500')}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5">
            {SNIPPETS.map((s) => <Button key={s.label} variant="outline" size="sm" onClick={() => insert(s.text)}>{s.label}</Button>)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {draftFrom != null && (
            <div className="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="flex-1">Rewritten draft. Review and edit it, then Save article to publish.</span>
              <Button size="sm" variant="ghost" onClick={() => { setContent(draftFrom); setDraftFrom(null) }}>Discard draft</Button>
            </div>
          )}
          {tab === 'edit'
            ? <textarea ref={area} value={content} onChange={(e) => setContent(e.target.value)} spellCheck
                className="h-[620px] w-full rounded-md border px-3 py-2 font-mono text-[13px] leading-relaxed outline-none focus:ring-2 focus:ring-primary/30" />
            : <Preview content={content} fightId={fightId} />}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Articles() {
  const [list, setList] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => {
    api('/admin/articles').then((l) => { setList(l); setSelected((s) => s ?? l[0]?.fight_id ?? null) }).catch(setError)
  }, [])
  const groups = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const out = new Map()
    for (const a of list || []) {
      if (words.length && !words.every((w) => `${a.red} ${a.blue} ${a.event_name}`.toLowerCase().includes(w))) continue
      if (!out.has(a.event_name)) out.set(a.event_name, { date: a.event_date, items: [] })
      out.get(a.event_name).items.push(a)
    }
    return [...out.entries()]
  }, [list, q])

  return (
    <div className="space-y-4">
      <PageTitle icon={FileText} title="Articles" />
      {error && <ErrorNote error={error} />}
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardContent className="space-y-3 pt-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fighters or events" />
            {!list ? <Empty>Loading…</Empty> : groups.map(([event, g]) => (
              <div key={event}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{event} · {g.date}</div>
                {g.items.map((a) => (
                  <button key={a.fight_id} onClick={() => setSelected(a.fight_id)}
                    className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                      selected === a.fight_id ? 'bg-slate-800 text-white' : 'hover:bg-slate-100')}>
                    <span className="min-w-0 flex-1 truncate">{a.red.split(' ').slice(-1)} vs {a.blue.split(' ').slice(-1)}</span>
                    {!a.has_cover && <ImagePlus className="h-3.5 w-3.5 shrink-0 opacity-60" title="No cover" />}
                    {a.edited_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" title="Edited" />}
                  </button>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
        <div>{selected ? <Editor key={selected} fightId={selected} /> : <Empty>Pick an article.</Empty>}</div>
      </div>
    </div>
  )
}
