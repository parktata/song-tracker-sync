const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

admin.initializeApp();
const db = admin.firestore();

// 12시간마다 자동 실행
exports.syncMelonReleases = functions.pubsub
    .schedule("every 12 hours")
    .onRun(async () => {
      const artistId = "4167271";
      const url = `https://www.melon.com/artist/music.htm?artistId=${artistId}`;
      // Melon 은 User-Agent 헤더가 필요합니다
      const res = await axios.get(url, {
        headers: {"User-Agent": "Mozilla/5.0"},
      });
      const $ = cheerio.load(res.data);
      const batch = db.batch();

      // Melon DOM 구조에 맞춘 선택자
      $(".album_list li .entry").each((_, el) => {
        const title = $(el).find(".ellipsis.album_name").text().trim();
        const imgUrl = $(el).find("img").attr("src");
        if (title && imgUrl) {
          const docId = title.replace(/\s+/g, "").toLowerCase();
          const ref = db.collection("covers").doc(docId);
          batch.set(ref, {url: imgUrl}, {merge: true});
        }
      });

      await batch.commit();
      console.log("Melon albums synced.");
      return null;
    });

// 수동 동기화용 HTTP 엔드포인트
exports.syncMelonReleasesNow = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  await exports.syncMelonReleases(null);
  res.send({status: "success"});
});
