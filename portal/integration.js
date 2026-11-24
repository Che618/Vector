(() => {
  const key = 'bjtu-science-business-bridge-v1';
  const limit = 600;
  let volatile = {events:[]};
  function read() {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || volatile; }
    catch { return volatile; }
  }
  function write(state) {
    volatile = state;
    try { localStorage.setItem(key,JSON.stringify(state)); } catch {}
  }
  function list(type) {
    const events = read().events || [];
    return type ? events.filter(e=>e.type===type) : events;
  }
  function publish(input) {
    const state=read(); state.events ||= [];
    const eventId=input.eventId || ('BRG-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
    const existing=state.events.find(e=>e.eventId===eventId);
    if(existing)return existing;
    const event={eventId,type:input.type,createdAt:input.createdAt||new Date().toISOString(),status:input.status||'待处理',payload:input.payload||{}};
    state.events.unshift(event); state.events=state.events.slice(0,limit); write(state);
    try { window.dispatchEvent(new CustomEvent('science-bridge-event',{detail:event})); } catch {}
    if(window.parent!==window)try { window.parent.postMessage({channel:'bjtu-science-bridge',event},location.origin); } catch {}
    return event;
  }
  function update(eventId,status,details={}) {
    const state=read(); state.events ||= [];
    const event=state.events.find(e=>e.eventId===eventId);
    if(!event)return null;
    event.status=status; Object.assign(event,details); write(state);
    try { window.dispatchEvent(new CustomEvent('science-bridge-event',{detail:event})); } catch {}
    return event;
  }
  window.ScienceBridge={key,list,publish,update};
})();
