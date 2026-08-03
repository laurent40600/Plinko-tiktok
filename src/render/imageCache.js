/* ============================================================
   ROYAL DROP — render/imageCache.js
   ------------------------------------------------------------
   Charge et met en cache les images utilisées par le rendu
   Canvas. Tant qu'une image n'est pas prête, getImage() rend
   null : à l'appelant de prévoir un repli visuel pour ce court
   instant (aucune image ne doit jamais faire planter le rendu).
   ============================================================ */

const cache = new Map();

export function getImage(src) {
    let entry = cache.get(src);
    if (!entry) {
        const img = new Image();
        entry = { img, loaded: false };
        img.onload = () => { entry.loaded = true; };
        img.src = src;
        cache.set(src, entry);
    }
    return entry.loaded ? entry.img : null;
}
