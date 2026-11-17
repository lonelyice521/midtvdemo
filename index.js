'use strict';
// MIDTV synthetic CatPawOpen demo source package.
// All media is a developer-owned gradient placeholder + generated posters.
const BASE = 'https://cdn.jsdelivr.net/gh/lonelyice521/midtvdemo@main';

const CLASSES = [
  { type_id: 'movies', type_name: '电影' },
  { type_id: 'family', type_name: '家庭影像' },
  { type_id: 'travel', type_name: '旅行记录' },
  { type_id: 'collection', type_name: '收藏' },
];

const ITEMS = [
  { id: 'private-01', name: '山间旅行 · 2026', cls: 'travel', pic: 'poster1.jpg', remarks: '4K · 私人' },
  { id: 'private-02', name: '家庭影像 · 夏日海边', cls: 'family', pic: 'poster2.jpg', remarks: '4K · 私人' },
  { id: 'private-03', name: '孩子的第一次演出', cls: 'family', pic: 'poster3.jpg', remarks: '1080P · 私人' },
  { id: 'private-04', name: '城市漫步 · 夜', cls: 'travel', pic: 'poster4.jpg', remarks: '4K · 私人' },
  { id: 'private-05', name: '私人收藏 · 纪录片', cls: 'collection', pic: 'poster5.jpg', remarks: 'HDR · 私人' },
  { id: 'private-06', name: '老房子 · 记忆', cls: 'collection', pic: 'poster6.jpg', remarks: '1080P · 私人' },
  { id: 'private-07', name: '周末厨房', cls: 'movies', pic: 'poster2.jpg', remarks: '4K · 私人' },
  { id: 'private-08', name: '雪季', cls: 'travel', pic: 'poster3.jpg', remarks: '4K · 私人' },
];

function episodesFor(item) {
  const parts = item.cls === 'family' ? 3 : 2;
  const out = [];
  for (let i = 1; i <= parts; i += 1) out.push('第' + i + '段$' + item.id + '-p' + i);
  return out.join('#');
}

function vodItem(item) {
  return {
    vod_id: item.id,
    vod_name: item.name,
    vod_pic: BASE + '/assets/' + item.pic,
    vod_remarks: item.remarks,
    vod_year: '2026',
    vod_area: '私人',
    type_name: item.cls === 'family' ? '家庭影像' : item.cls === 'travel' ? '旅行记录' : item.cls === 'collection' ? '收藏' : '电影',
    vod_content: 'MIDTV 演示媒体库中的私人影像，用于 App 界面展示与审核。',
    vod_play_from: '私人媒体库',
    vod_play_url: episodesFor(item),
  };
}

const CONFIG = {
  video: { sites: [{ key: 'demo', name: '私人媒体库', type: 3, api: '/spider/demo/3', searchable: 1, quickSearch: 1, filterable: 0, enable: true }], danmuSearchUrl: '' },
  read: { sites: [] }, comic: { sites: [] }, music: { sites: [] }, pan: { sites: [] },
  color: { video: '#5B8DEF', read: '#5B8DEF', comic: '#5B8DEF', music: '#5B8DEF', pan: '#5B8DEF' },
};

function send(res, body, code) {
  const text = JSON.stringify(body);
  res.writeHead(code || 200, { 'content-type': 'application/json; charset=utf-8' });
  res.end(text);
}

function handler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const path = url.pathname;
  if (path === '/check') return send(res, { run: true });
  if (path === '/config') return send(res, CONFIG);
  if (path.indexOf('/spider/demo/3/') === 0) {
    const stage = path.slice('/spider/demo/3/'.length);
    if (stage === 'init') return send(res, {});
    if (stage === 'home') return send(res, { class: CLASSES, filters: {}, list: ITEMS.slice(0, 6).map(vodItem) });
    if (stage === 'category') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let b = {}; try { b = JSON.parse(body || '{}'); } catch (e) {}
        const tid = String(b.t || b.type_id || b.id || '');
        const page = Math.max(1, Number(b.pg || b.page || 1));
        const filtered = ITEMS.filter((i) => !tid || i.cls === tid);
        const pageSize = 6;
        const start = (page - 1) * pageSize;
        send(res, { page, pagecount: Math.max(1, Math.ceil(filtered.length / pageSize)), total: filtered.length, limit: pageSize, list: filtered.slice(start, start + pageSize).map(vodItem) });
      });
      return;
    }
    if (stage === 'search') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let b = {}; try { b = JSON.parse(body || '{}'); } catch (e) {}
        const kw = String(b.wd || b.keyword || '').trim();
        const list = ITEMS.filter((i) => !kw || i.name.includes(kw)).map(vodItem);
        send(res, { page: 1, pagecount: 1, total: list.length, list });
      });
      return;
    }
    if (stage === 'detail') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let b = {}; try { b = JSON.parse(body || '{}'); } catch (e) {}
        const item = ITEMS.find((i) => i.id === String(b.id || b.ids || ''));
        send(res, { list: item ? [vodItem(item)] : [] });
      });
      return;
    }
    if (stage === 'play') return send(res, { parse: 0, jx: 0, flag: '私人媒体库', url: BASE + '/assets/demo.mp4', header: {} });
    return send(res, { error: 'unsupported stage: ' + stage }, 404);
  }
  return send(res, { error: 'not found' }, 404);
}

let server = null;
async function start() {
  if (server) return;
  if (typeof globalThis.catServerFactory !== 'function') throw new Error('catServerFactory is not available');
  server = globalThis.catServerFactory(handler);
  const preferred = Number(process.env.DEV_HTTP_PORT || process.env.PORT || 0) || 0;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(preferred, '127.0.0.1', resolve); });
}
async function stop() {
  if (!server) return;
  const current = server; server = null;
  await new Promise((resolve) => current.close(resolve));
}
module.exports = { start, stop };
