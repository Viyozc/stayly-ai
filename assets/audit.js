/* Stayly — Airbnb Listing Audit engine (client-side, zero cost)
 * Scores a listing the way Airbnb search + guests judge it:
 *   Title SEO, Description, Photos, Amenities, Pricing, Trust/Conversion.
 * Weights sum to 100. All logic runs in-browser; no network calls for scoring.
 */
(function () {
  "use strict";


  // ---- centralized audit counter (fire-and-forget) ----
  var COUNTER_NS = "stayly-ai";
  function trackAudit() {
    try {
      fetch("https://api.counterapi.dev/v1/" + COUNTER_NS + "/audit_completed/up", {
        method: "GET",
        mode: "cors",
        cache: "no-store"
      });
    } catch (e) {}
  }
  var form = document.getElementById("auditForm");
  var result = document.getElementById("auditResult");
  var titleEl = document.getElementById("fTitle");
  var descEl = document.getElementById("fDesc");
  var photosEl = document.getElementById("fPhotos");
  var instantEl = document.getElementById("fInstant");
  var amenEl = document.getElementById("fAmenities");
  var priceEl = document.getElementById("fPrice");
  var avgEl = document.getElementById("fAvg");
  var reviewsEl = document.getElementById("fReviews");
  var ratingEl = document.getElementById("fRating");
  var titleCount = document.getElementById("titleCount");
  var heroScore = document.getElementById("heroScore");
  var heroGrade = document.getElementById("heroGrade");

  var MAX_TITLE = 50;
  // descriptive/keyword words that signal an optimized, searchable title
  var DESCRIPTORS = ["downtown", "center", "central", "near", "close", "walk", "view", "ocean",
    "beach", "lake", "mountain", "cozy", "modern", "bright", "sunny", "luxury", "stylish",
    "studio", "loft", "apartment", "apt", "house", "cabin", "villa", "suite", "penthouse",
    "garden", "rooftop", "quiet", "family", "pet", "pool", "wifi", "fast"];

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function gradeFor(score) {
    if (score >= 85) return { g: "A", color: "var(--good)" };
    if (score >= 70) return { g: "B", color: "var(--brand)" };
    if (score >= 55) return { g: "C", color: "var(--warn)" };
    return { g: "D", color: "var(--bad)" };
  }

  function updateCounts() {
    titleCount.textContent = titleEl.value.length + " / " + MAX_TITLE;
  }

  titleEl.addEventListener("input", updateCounts);

  // ---- scoring ----
  function scoreListing(input) {
    var title = input.title;
    var desc = input.desc;
    var tips = [];
    var dims = {};

    // 1) Title SEO (20): length near limit + descriptive keywords
    var tLen = title.length;
    var tLenPart = 0;
    if (tLen >= 40) tLenPart = 10;
    else if (tLen >= 25) tLenPart = 7;
    else if (tLen >= 12) tLenPart = 4;
    else if (tLen > 0) tLenPart = 1;
    var tDescPart = 0;
    var low = title.toLowerCase();
    var hasDesc = DESCRIPTORS.some(function (w) { return low.indexOf(w) !== -1; });
    if (tLen > 0) tDescPart = hasDesc ? 10 : 4;
    var tScore = tLenPart + tDescPart;
    if (tLen === 0) tScore = 0;
    if (tLen > 0 && tLen < 40) tips.push("Title is " + tLen + " chars. Airbnb gives you 50 — use more with location + property type + a standout amenity.");
    if (tLen > 0 && !hasDesc) tips.push("Add searchable words to the title (e.g. “downtown”, “near metro”, “skyline view”) — buyers search phrases, not just “apartment”.");
    dims.Title = { score: tScore, max: 20 };

    // 2) Description (20): depth
    var dLen = desc.length;
    var dScore = 0;
    if (dLen >= 800) dScore = 20;
    else if (dLen >= 500) dScore = 16;
    else if (dLen >= 250) dScore = 11;
    else if (dLen >= 100) dScore = 6;
    else if (dLen > 0) dScore = 2;
    if (dLen > 0 && dLen < 250) tips.push("Description is " + dLen + " chars. Aim for 500+ covering layout, light, neighborhood, check-in, and house rules.");
    if (dLen === 0) tips.push("Add a description — it builds trust and answers guest questions before they book.");
    dims.Description = { score: dScore, max: 20 };

    // 3) Photos (15): count
    var photos = clamp(Math.round(num(input.photos)), 0, 100);
    var pScore = 0;
    if (photos >= 20) pScore = 15;
    else if (photos >= 15) pScore = 13;
    else if (photos >= 10) pScore = 10;
    else if (photos >= 5) pScore = 6;
    else if (photos >= 1) pScore = 3;
    if (photos < 15) tips.push("You have " + photos + " photos. Listings with 15+ well-sequenced photos earn far more first-page impressions — add more.");
    dims.Photos = { score: pScore, max: 15 };

    // 4) Amenities (15): expected-set coverage
    var EXPECTED = ["wifi", "kitchen", "ac", "air conditioning", "washer", "tv", "parking",
      "pool", "workspace", "heating", "elevator", "breakfast"];
    var aLow = input.amenities.toLowerCase();
    var hit = EXPECTED.filter(function (a) { return aLow.indexOf(a) !== -1; }).length;
    var aScore = Math.round((Math.min(hit, 10) / 10) * 15);
    if (hit < 6) tips.push("Only " + hit + " key amenities detected. List WiFi, kitchen, AC, washer, workspace, parking — guests filter on these.");
    dims.Amenities = { score: aScore, max: 15 };

    // 5) Pricing (15): vs area average
    var price = num(input.price);
    var avg = num(input.avg);
    var pScore2 = 0;
    if (price > 0) {
      if (avg > 0) {
        var ratio = price / avg;
        if (ratio >= 0.7 && ratio <= 1.3) pScore2 = 15;
        else if (ratio < 0.7) { pScore2 = 10; tips.push("Your price is well below the area average (" + avg + "). You may be leaving money on the table — test a small increase."); }
        else { pScore2 = 9; tips.push("Your price is above the area average (" + avg + "). Make sure reviews/photos justify the premium or you'll lose the click."); }
      } else {
        pScore2 = 12;
        tips.push("Add your area's average nightly price for a competitiveness check.");
      }
    } else {
      tips.push("Enter your nightly price to get a pricing signal.");
    }
    dims.Pricing = { score: pScore2, max: 15 };

    // 6) Trust / Conversion (15): reviews, rating, instant book
    var reviews = Math.round(num(input.reviews));
    var rating = num(input.rating);
    var tScore2 = 0;
    if (reviews >= 50) tScore2 += 6;
    else if (reviews >= 20) tScore2 += 5;
    else if (reviews >= 5) tScore2 += 3;
    else if (reviews >= 1) tScore2 += 2;
    else tScore2 += 1; // new listing
    if (rating >= 4.8) tScore2 += 5;
    else if (rating >= 4.5) tScore2 += 4;
    else if (rating >= 4.0) tScore2 += 3;
    else if (rating > 0) tScore2 += 2;
    else tScore2 += 1;
    if (input.instant) tScore2 += 4;
    tScore2 = Math.min(tScore2, 15);
    if (reviews < 5) tips.push("Few reviews yet — enable Instant Book and a warm welcome message to accelerate your first 5-star reviews.");
    if (rating > 0 && rating < 4.8) tips.push("Rating is " + rating + ". Add a house-rules section and a specific welcome message to lift it toward 4.9+.");
    if (!input.instant) tips.push("Turn on Instant Book — it removes a step in the booking flow and lifts conversion.");
    dims.Trust = { score: tScore2, max: 15 };

    var total = Math.round(dims.Title.score + dims.Description.score + dims.Photos.score +
      dims.Amenities.score + dims.Pricing.score + dims.Trust.score);
    if (tLen === 0 && dLen === 0 && photos === 0 && price === 0) total = 0;

    if (tips.length === 0) tips.push("Solid listing — keep photos fresh and re-audit after every tweak.");
    return { total: total, dims: dims, tips: tips };
  }

  // ---- render ----
  function ring(el, score) {
    var deg = (score / 100) * 360;
    el.style.background = "conic-gradient(var(--brand) " + deg + "deg, #f6e6ee " + deg + "deg)";
  }

  function render(res) {
    var gr = gradeFor(res.total);
    document.getElementById("resScore").textContent = res.total;
    var gEl = document.getElementById("resGrade");
    gEl.textContent = "Grade " + gr.g;
    gEl.style.background = gr.color;
    gEl.style.color = "#fff";
    document.getElementById("resSummary").textContent =
      res.total >= 85 ? "Strong listing — minor tweaks only."
      : res.total >= 70 ? "Good foundation, a few quick wins left."
      : res.total >= 55 ? "Workable, but leaving bookings on the table."
      : "Needs real work before it can compete.";

    ring(document.querySelector("#auditResult .score-ring"), res.total);

    var bars = document.getElementById("resBars");
    bars.innerHTML = "";
    Object.keys(res.dims).forEach(function (k) {
      var d = res.dims[k];
      var pct = Math.round((d.score / d.max) * 100);
      var row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML =
        '<span>' + k + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="bar-val">' + d.score + '/' + d.max + '</span>';
      bars.appendChild(row);
    });

    var tipsEl = document.getElementById("resTips");
    tipsEl.innerHTML = "";
    res.tips.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      tipsEl.appendChild(li);
    });

    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var res = scoreListing({
      title: titleEl.value,
      desc: descEl.value,
      photos: photosEl.value,
      amenities: amenEl.value,
      price: priceEl.value,
      avg: avgEl.value,
      reviews: reviewsEl.value,
      rating: ratingEl.value,
      instant: instantEl.checked
    });
    render(res);
    trackAudit();
  });

  // hero demo score (illustrative until user runs audit)
  heroScore.textContent = 68;
  heroGrade.textContent = "B";

  // ---- email capture (Formspree free tier) ----
  var emailForm = document.getElementById("emailForm");
  var FORMSPREE_ID = "meeyzkdp";
  emailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("fEmail").value;
    var note = document.getElementById("emailNote");
    fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, subject: "Stayly audit lead", source: "Stayly landing" })
    })
      .then(function (r) {
        if (r.ok) { note.textContent = "✓ Subscribed! We'll email you the rewrite report + hosting tips."; note.style.color = "var(--good)"; }
        else { note.textContent = "Couldn't send — try again or email us."; note.style.color = "var(--bad)"; }
      })
      .catch(function () { note.textContent = "Couldn't send — try again or email us."; note.style.color = "var(--bad)"; });
    emailForm.reset();
  });

  updateCounts();
})();
