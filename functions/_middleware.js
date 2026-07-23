export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  let html = await response.text();
  const patch = `
<style>
.relay,.breaker{cursor:pointer}
.relay.highlight rect,.breaker.highlight rect{stroke:#fff!important;stroke-width:5!important}
</style>
<script>
(() => {
  function wire(items, selector, type) {
    document.querySelectorAll(selector).forEach((el, index) => {
      const item = items[index];
      if (!item || el.dataset.detailsWired) return;
      el.dataset.detailsWired = "1";
      el.dataset.id = item.id;
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

  const tip = document.getElementById("tip");
  if (tip) tip.textContent = "Pinch or scroll to zoom · Drag to move · Tap any F, K, or CB";
})();
</script>`;

  html = html.replace("</body>", patch + "</body>");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
