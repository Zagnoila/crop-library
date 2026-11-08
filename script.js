'use strict';
// An entry is one research card. The array is the complete collection of cards.
const STORAGE_KEY = 'cropLibrary.entries.v1';
const isExtension = location.protocol === 'chrome-extension:' && !!globalThis.chrome?.storage?.local;
const $ = id => document.getElementById(id);
let entries = [];
let editingId = null;
let ready = false;
let busy = false;

// The installed extension uses Chrome storage. The website has its own local storage.
async function readEntries() {
  const saved = isExtension ? (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] : JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (saved === undefined) return [];
  if (!Array.isArray(saved) || !saved.every(validEntry)) throw new Error('Saved data could not be read. Export a backup before making changes.');
  return saved;
}
function safeURL(value) {
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use a regular http:// or https:// source URL without a username or password.');
  return url.href;
}
function validEntry(e) {
  try { return e && typeof e.id === 'string' && typeof e.crop === 'string' && e.crop.trim() && ['Hydroponic','Soil-based'].includes(e.method) && typeof e.category === 'string' && typeof e.note === 'string' && typeof e.createdAt === 'string' && !!safeURL(e.url); } catch { return false; }
}
function tell(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
async function commit(next) {
  if (!ready) throw new Error('Storage is unavailable. Reload the library to try again.');
  if (isExtension) await chrome.storage.local.set({[STORAGE_KEY]: next});
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  entries = next;
  render();
}
async function perform(task) {
  if (busy) return;
  busy = true;
  $('save').disabled = true;
  try { await task(); } catch (error) { tell(error.message || 'Could not save. Please try again.', true); }
  finally { busy = false; $('save').disabled = !ready; }
}
function refreshOptions(id, values, placeholder) {
  const select = $(id), current = select.value;
  select.replaceChildren(new Option(placeholder, ''));
  [...new Set(values)].sort((a,b)=>a.localeCompare(b)).forEach(v=>select.add(new Option(v,v)));
  select.value = values.includes(current) ? current : '';
}
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text; // Notes are text, never executable HTML.
  return element;
}
function render() {
  $('entry-count').textContent = entries.length;
  $('crop-count').textContent = new Set(entries.map(e=>e.crop.toLowerCase())).size;
  refreshOptions('filter-crop', entries.map(e=>e.crop), 'All crops');
  refreshOptions('filter-category', entries.map(e=>e.category), 'All categories');
  const q = $('search').value.trim().toLowerCase();
  const visible = entries.filter(e => (!$('filter-crop').value || e.crop === $('filter-crop').value) && (!$('filter-method').value || e.method === $('filter-method').value) && (!$('filter-category').value || e.category === $('filter-category').value) && `${e.crop} ${e.method} ${e.category} ${e.note} ${e.url}`.toLowerCase().includes(q));
  $('results-count').textContent = `${visible.length} of ${entries.length} notes`;
  $('entries').replaceChildren();
  $('export').disabled = !entries.length;
  if (!visible.length) $('entries').append(node('div', 'empty', entries.length ? 'No matching notes. Try another filter or reset your search.' : 'Your next growing idea starts here. Save a finding or add the example notes below.'));
  [...visible].reverse().forEach(entry => {
    const card = node('article', 'card' + (entry.method === 'Soil-based' ? ' soil' : ''));
    const top = node('div','card-top');
    top.append(node('h3','',entry.crop),node('span','tag',entry.method));
    const link = node('a','source',new URL(entry.url).hostname.replace(/^www\./,'') + ' ↗');
    link.href = entry.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.title = entry.url;
    link.setAttribute('aria-label',`Read source for ${entry.crop}: ${entry.category}`);
    const bottom = node('div','card-bottom');
    const date = new Date(entry.createdAt);
    bottom.append(node('small','',Number.isNaN(date.getTime()) ? 'Saved research' : 'Saved ' + date.toLocaleDateString(undefined,{month:'short',day:'numeric'})));
    const actions = node('div');
    const edit = node('button','','Edit'); edit.setAttribute('aria-label',`Edit ${entry.crop} ${entry.category}`); edit.addEventListener('click',()=>editEntry(entry));
    const remove = node('button','','Delete'); remove.setAttribute('aria-label',`Delete ${entry.crop} ${entry.category}`);
    // A second click confirms deletion without an unexpected browser dialog.
    remove.addEventListener('click',()=>{
      if (remove.dataset.confirm !== 'yes') { remove.dataset.confirm='yes'; remove.textContent='Confirm delete'; return; }
      perform(async()=>{await commit(entries.filter(e=>e.id!==entry.id));if(editingId===entry.id)resetForm();tell('Note deleted.');});
    });
    actions.append(edit,remove); bottom.append(actions);
    card.append(top,node('p','category',entry.category),node('p','note',entry.note),link,bottom);
    $('entries').append(card);
  });
}
function resetFilters() { ['search','filter-crop','filter-method','filter-category'].forEach(id=>$(id).value=''); }
function resetForm() { editingId=null; $('research-form').reset();$('form-title').textContent='Add research';$('save').textContent='Save research ＋';$('cancel-edit').hidden=true; }
function editEntry(entry) {
  if (busy) return;
  editingId=entry.id;
  for (const key of ['crop','method','category','note','url']) $(key).value=entry[key];
  $('form-title').textContent='Edit research';$('save').textContent='Save changes';$('cancel-edit').hidden=false;
  $('crop').focus();$('research-form').scrollIntoView({block:'nearest',behavior:'smooth'});tell('Editing this note. Your changes are saved when you click Save changes.');
}
$('research-form').addEventListener('submit',event=>{
  event.preventDefault();
  perform(async()=>{
    const crop=$('crop').value.trim(), note=$('note').value.trim();
    if (!crop || !note) throw new Error('Add a crop name and a research note.');
    const existingCrop=entries.find(e=>e.crop.toLowerCase()===crop.toLowerCase())?.crop;
    const original=entries.find(e=>e.id===editingId);
    const entry={id:editingId || crypto.randomUUID(),crop:existingCrop || crop,method:$('method').value,category:$('category').value,note,url:safeURL($('url').value),createdAt:original?.createdAt || new Date().toISOString()};
    const updated=!!editingId;
    const next=updated ? entries.map(e=>e.id===editingId?entry:e) : [...entries,entry];
    await commit(next);resetForm();resetFilters();render();tell(updated?'Changes saved.':'Research saved. It will be here when you reopen the library.');
  });
});
$('cancel-edit').addEventListener('click',()=>{resetForm();tell('Edit canceled.');});
for (const id of ['search','filter-crop','filter-method','filter-category']) $(id).addEventListener(id==='search'?'input':'change',render);
$('clear-filters').addEventListener('click',()=>{resetFilters();render();});
$('samples').addEventListener('click',()=>perform(async()=>{
  const missing=SAMPLE_ENTRIES.filter(sample=>!entries.some(e=>e.id===sample.id));
  await commit([...entries,...missing]);resetFilters();render();tell(missing.length?`${missing.length} source-based example notes saved.`:'All four examples are already in your library.');
}));
$('export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(entries,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob), link=document.createElement('a');
  link.href=url;link.download='crop-library-research.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);tell(`${entries.length} notes exported. Keep the file as a backup.`);
});
$('use-tab').addEventListener('click',()=>perform(async()=>{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  try { $('url').value=safeURL(tab?.url || '');tell('Source URL added. Write your note and save it.'); }
  catch { throw new Error('Open a regular website, then click the extension icon and use this button. You can also paste the URL.'); }
}));
$('expand').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('index.html?view=full')}));
(async()=>{
  if (isExtension) {
    document.body.classList.toggle('popup', !new URLSearchParams(location.search).has('view'));
    $('storage-label').textContent='Saved in Chrome on this device';
    $('use-tab').hidden=false;$('expand').hidden=new URLSearchParams(location.search).has('view');
    $('mode-help').textContent='You are using the installed extension. Notes are saved in Chrome storage on this device.';
  } else $('storage-label').textContent='Web preview · saved in this browser';
  try { entries=await readEntries();ready=true;render(); }
  catch(error) { tell(error.message,true);$('save').disabled=true;$('samples').disabled=true; }
})();
