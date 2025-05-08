// C:\song-tracker\functions\sync.js

const admin   = require('firebase-admin');
const axios   = require('axios');
const cheerio = require('cheerio');

// 서비스 계정 키 불러오기 (프로젝트 루트의 serviceAccountKey.json)
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function syncMelonCovers() {
  // 내 멜론 아티스트 앨범 페이지 URL로 바꾸세요
  const artistUrl = 'https://www.melon.com/artist/album.htm?artistId=YOUR_ARTIST_ID';

  const res = await axios.get(artistUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(res.data);

  // 앨범별 커버 이미지 크롤링 (selector는 실제 페이지 구조에 맞춰 조정)
  $('.album_thumb a img').each(async (_, el) => {
    const title = $(el).attr('alt').trim();
    const url   = $(el).attr('src');

    await db.collection('covers').doc(title).set({ url });
    console.log(`Synced: ${title}`);
  });

  console.log('Melon covers sync complete.');
}

syncMelonCovers().catch(console.error);
