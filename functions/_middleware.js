export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  let html = await response.text();

  // Expand the drawing surface without touching the fuse data or details.
  html = html
    .replace("svg{width:650px;height:950px;", "svg{width:760px;height:1220px;")
    .replace('viewBox="0 0 650 950"', 'viewBox="0 0 760 1220"')
    .replace('x="8" y="8" width="634" height="934"', 'x="8" y="8" width="744" height="1204"')
    .replace('x="325" y="28"', 'x="380" y="28"')
    .replace("let scale=.72,tx=-325*.72,ty=-475*.72", "let scale=.58,tx=-380*.58,ty=-610*.58")
    .replace("scale=Math.min(vw/680,vh/980)*.95;tx=-325*scale;ty=-475*scale", "scale=Math.min(vw/780,vh/1240)*.95;tx=-380*scale;ty=-610*scale");

  const patch = `
<style>
.relay,.breaker{cursor:pointer}
.relay.highlight rect,.breaker.highlight rect{stroke:#fff!important;stroke-width:5!important}
.fuse,.relay,.breaker{touch-action:manipulation}
</style>
<script>
(() => {
  function wire(items, selector, type) {
    document.querySelectorAll(selector).forEach((el, index) => {
      const item = items[index];
      if (!item) return;
      el.dataset.id = item.id;
      if (el.dataset.detailsWired) return;
      el.dataset.detailsWired = "1";
      el.addEventListener("click", event => {
        event.stopPropagation();
        document.querySelectorAll(".fuse,.relay,.breaker").forEach(node => {
          node.classList.toggle("highlight", node.dataset.id === item.id);
        });
        document.getElementById("detailId").textContent = item.id;
        document.getElementById("detailMeta").textContent = type;
        document.getElementById("detailFunction").textContent = item.function;
        document.getElementById("detailBadges").innerHTML =
          '<span class="badge">' + type + '</span>' +
          '<span class="badge">Ignition off before removal</span>';
        document.getElementById("details").classList.add("open");
      });
    });
  }

  if (typeof relays !== "undefined") wire(relays, ".relay", "Relay");
  if (typeof breakers !== "undefined") wire(breakers, ".breaker", "Circuit breaker");

  function move(id, x, y) {
    const el = document.querySelector('[data-id="' + id + '"]');
    if (!el) return;
    let box;
    try { box = el.getBBox(); } catch (_) { return; }
    const dx = x - box.x;
    const dy = y - box.y;
    el.setAttribute("transform", "translate(" + dx + " " + dy + ")");
  }

  const p = {};
  function at(id, x, y) { p[id] = [x, y]; }

  // Main high-current row, matching the lid orientation.
  ["F5","F4","F3","F2","F1"].forEach((id,i) => at(id, 55 + i * 100, 48));

  // Upper-left and upper-right fuse banks.
  [["F7",110,185],["F10",110,220],["F14",110,255],["F15",110,290],["F18",110,325],["F21",110,360],
   ["F8",205,185],["F11",205,220],["F16",205,255],["F22",205,360],
   ["F6",390,135],["F9",390,170],["F12",390,205],["F13",435,205],["F17",390,245],["F19",390,280],["F20",435,280],["F24",435,320],
   ["F23",300,340],["F25A",105,402],["F25B",165,402],["F26",105,438],["F28",135,470],["F29",350,430],["F30",430,405],["F31",430,447],
   ["F27",50,475],["F32",50,510],["F33",50,545],["F34",50,580],["F35",50,615],["F36",280,485],
   ["F37",105,650],["F38",175,650],["F39",245,635],["F40",315,640],["F41",390,630],["F42",470,630],["F43",535,642]]
   .forEach(v => at(v[0],v[1],v[2]));

  // Middle long fuse row.
  for (let n=44, x=55; n<=54; n++, x+=38) at("F"+n, x, 735);
  [["F55",500,725],["F56",538,725],["F57",576,725],["F58",614,725]].forEach(v=>at(v[0],v[1],v[2]));

  // Lower fuse banks.
  for (let n=59, x=55; n<=62; n++, x+=42) at("F"+n, x, 835);
  for (let n=63, x=455; n<=67; n++, x+=42) at("F"+n, x, 835);
  [["F68",50,885],["F69",50,925],["F70",50,965],
   ["F71",135,935],["F72",180,935],["F73",225,935],["F74",350,925],
   ["F75",450,935],["F76",490,935],["F77",530,935],["F78",570,935],["F79",610,935],["F80",650,935],["F81",690,935]]
   .forEach(v=>at(v[0],v[1],v[2]));

  [["F82",45,1080],["F83",90,1080],["F84",135,1080],["F85",235,1080],["F86",280,1080],
   ["F87",450,1080],["F88",490,1080],["F89",530,1080],["F90",570,1080],["F91",610,1080],["F92",650,1080],
   ["F93",55,1150],["F94",115,1150],["F95",175,1178],["F96",315,1170],["F97",375,1170],["F98",485,1150],["F99",550,1130],["F100",625,1165]]
   .forEach(v=>at(v[0],v[1],v[2]));

  // Relays and circuit breakers positioned to match the photographed lid.
  [["K1",555,125],["K2",25,205],["K3",535,235],["K4",225,395],["K5",105,510],["K6",325,510],["K7",500,510],
   ["K8",260,705],["K9",620,675],["K10",265,835],["K11",355,835],["K12",285,1040],["K13",390,1040],
   ["CB1",45,845],["CB2",675,850],["CB3",145,1035]]
   .forEach(v=>at(v[0],v[1],v[2]));

  requestAnimationFrame(() => {
    Object.keys(p).forEach(id => move(id, p[id][0], p[id][1]));
    const tip = document.getElementById("tip");
    if (tip) tip.textContent = "Pinch or scroll to zoom · Drag to move · Tap any F, K, or CB";
    const viewport = document.getElementById("viewport");
    const stage = document.getElementById("stage");
    if (viewport && stage) {
      const scale = Math.min((viewport.clientWidth-18)/760,(viewport.clientHeight-18)/1220);
      stage.style.transform = "translate(" + (-380*scale) + "px," + (-610*scale) + "px) scale(" + scale + ")";
    }
  });
})();
</script>`;

  html = html.replace("</body>", patch + "</body>");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}