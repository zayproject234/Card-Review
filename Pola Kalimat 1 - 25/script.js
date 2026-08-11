(function () {
  var cards = [];
  var stats = { xp: 0, streak: 0, lastReviewDate: null };
  var loaded = false;
  var reviewQueue = [];
  var reviewIndex = 0;
  var reviewResults = { lancar: 0, ulang: 0 };
  var answerShown = false;
  var comboCount = 0;
  var practiceTarget = [];
  var practicePool = [];
  var practiceSlots = [];
  var practiceMistake = false;
  var practiceLocked = false;

  var LEVELS = [
    { key: '見', name: '見習い', sub: 'Pemula', minXp: 0 },
    { key: '初', name: '初心者', sub: 'Pemula Lanjut', minXp: 60 },
    { key: '学', name: '学習者', sub: 'Pembelajar', minXp: 150 },
    { key: '中', name: '中級者', sub: 'Menengah', minXp: 280 },
    { key: '熟', name: '熟練者', sub: 'Terampil', minXp: 460 },
    { key: '達', name: '達人', sub: 'Master', minXp: 700 }
  ];

  var DEFAULT_CARDS = [
    // BAB 1
    [1, '[Kata Benda 1] は [Kata Benda 2] です', 'わたしは ミラーです。', 'KB1 adalah KB2 (identitas/predikat)', 'watashi wa miraa desu.', 'Saya adalah Miller.'],
    [1, '[Kata Benda 1] は [Kata Benda 2] じゃ ありません', 'わたしは 先生じゃ ありません。', 'KB1 bukan KB2 (negatif)', 'watashi wa sensei ja arimasen.', 'Saya bukan guru.'],
    [1, '[Kalimat] か', 'ミラーさんは 会社員ですか。', 'Kalimat tanya (apakah...?)', 'miraa-san wa kaishain desu ka.', 'Apakah Sdr. Miller karyawan perusahaan?'],
    [1, '[Kata Benda 1] も [Kata Benda 2] です', 'サントスさんも 学生です。', 'KB1 juga KB2 (pola JUGA)', 'santosu-san mo gakusei desu.', 'Sdr. Santos juga mahasiswa.'],
    [1, '[Kata Benda 1] の [Kata Benda 2]', 'わたしは IMCの 社員です。', 'KB2 milik/bagian dari KB1 (kepemilikan & hubungan)', 'watashi wa IMC no shain desu.', 'Saya karyawan IMC.'],
    [1, '[Nama Orang] さん', '佐藤さん', 'Panggilan sopan (Tuan/Nyonya/Nona)', 'Satou-san', 'Sdr. Satou'],

    // BAB 2
    [2, 'これ／それ／あれ は [Kata Benda] です', 'これは 本です。', '1. Kata Tunjuk Benda (Ini/Itu/Sana)', 'kore wa hon desu.', 'Ini adalah buku.'],
    [2, 'この／その／あの [Kata Benda]', 'この 本は わたしのです。', '2. Kata Sifat Tunjuk (+ Kata Benda)', 'kono hon wa watashi no desu.', 'Buku ini milik saya.'],
    [2, 'そうです／そうじゃ ありません', '「それは 辞書ですか。」「はい、そうです。」', '3. soudesu (Ya, benar / bukan)', '"sore wa jisho desu ka." "hai, sou desu."', '"Apakah itu kamus?" "Ya, benar."'],
    [2, '[Kalimat 1] か、[Kalimat 2] か', 'これは 「９」ですか、「７」ですか。', '4. ~ka, ~ka (Kalimat tanya pilihan A atau B)', 'kore wa "9" desu ka, "7" desu ka.', 'Apakah ini "9" atau "7"?'],
    [2, '[Kata Benda 1] の [Kata Benda 2]', 'これは 自動車の 本です。', '5. kb1 no kb2 (Menerangkan topik/kepemilikan)', 'kore wa jidousha no hon desu.', 'Ini adalah buku tentang mobil.'],
    [2, '[Kata Benda] の', 'これは わたしの です。', '6. "no" yang berfungsi sebagai pengganti kb', 'kore wa watashi no desu.', 'Ini milik saya.'],
    [2, 'お [Kata Benda]', 'お土産 / お酒', '7. o~ (Awalan kesopanan pada KB)', 'o-miyage / o-sake', 'Oleh-oleh / Minuman keras (sopan)'],
    [2, 'そうですか', '「この 傘は あなたのですか。」「いいえ。」「そうですか。」', '8. soudesuka (Ungkapan "Oh begitu")', '"kono kasa wa anata no desu ka." "iie." "sou desu ka."', '"Apakah payung ini milikmu?" "Bukan." "Oh begitu."'],

    // BAB 3
    [3, 'ここ／そこ／あそこ は [Kata Benda] です', 'ここは 教室です。', '1. Kata Tunjuk Tempat (Di Sini/Situ/Sana)', 'koko wa kyoushitsu desu.', 'Di sini adalah ruang kelas.'],
    [3, '[Kata Benda] は [Tempat] です', 'お手洗いは あそこです。', '2. Keberadaan Benda/Orang di Tempat', 'otearai wa asoko desu.', 'Toilet ada di sana.'],
    [3, 'こちら／そちら／あちら は [Kata Benda] です', 'エレベーターは こちらです。', '3. Kata Tunjuk Arah/Bentuk Halus (Sebelah Sini/Situ/Sana)', 'erebeetaa wa kochira desu.', 'Lift ada di sebelah sini.'],
    [3, '[Kata Benda] は どこ／どちら ですか', '事務所は どこですか。', '4. Menanyakan Lokasi / Arah (Di mana / Sebelah mana)', 'jimusho wa doko desu ka.', 'Di mana kantornya?'],
    [3, '[Organisasi/Perusahaan] は どこ／どちら ですか', '会社は どちらですか。', '5. Menanyakan Nama Negara/Organisasi/Perusahaan', 'kaisha wa dochira desu ka.', 'Apa nama perusahaan Anda / Di mana lokasinya?'],
    [3, '[Negara/Perusahaan] の [Kata Benda]', 'これは 日本の 車です。', '6. Menunjukkan Buatan/Asal Produk', 'kore wa Nihon no kuruma desu.', 'Ini mobil buatan Jepang.'],
    [3, '[Kata Benda] は いくらですか', 'この ワインは いくらですか。', '7. Menanyakan Harga (Berapa harganya)', 'kono wain wa ikura desu ka.', 'Berapa harga anggur ini?'],
    [3, 'お国 は どちらですか', 'お国は どちらですか。', '8. Awalan Kesopanan o- pada Negara Lawan Bicara', 'o-kuni wa dochira desu ka.', 'Berasal dari negara manakah Anda?'],

    // BAB 4
    [4, '今 〜時 〜分です', '今 4時 5分です。', 'Sekarang jam ~ menit ~', 'ima yo-ji go-fun desu.', 'Sekarang jam 4 lewat 5 menit.'],
    [4, '[Kata Kerja]-masu / [Kata Kerja]-masen / [Kata Kerja]-mashita', '起きる → 起きます／起きません／起きましました', 'Bentuk kata kerja (rutinitas/lampau)', 'okiru → okimasu / okimasen / okimashimashita', 'Bangun → Bangun / Tidak bangun / Sudah bangun'],
    [4, '[Waktu] に [Kata Kerja]', '毎朝 6時に 起きます。', 'Partikel に untuk penunjuk waktu spesifik', 'maiasa roku-ji ni okimasu.', 'Setiap pagi bangun jam 6.'],
    [4, '[Kata Benda 1] kara [Kata Benda 2] made', '9時から 5時まで 働きます。', 'Dari KB1 sampai KB2', 'ku-ji kara go-ji made hatarakimasu.', 'Bekerja dari jam 9 sampai jam 5.'],

    // BAB 5
    [5, '[Tempat] へ 行きます／来ます／帰ります', '京都へ 行きます。', 'Pergi / datang / pulang ke (tempat)', 'Kyouto e ikimasu.', 'Saya pergi ke Kyoto.'],
    [5, '[Kendaraan] で 行きます', '電車で 行きます。', 'Pergi dengan (kendaraan)', 'densha de ikimasu.', 'Saya pergi naik kereta.'],
    [5, '[Orang] と [Kata Kerja]', '友達と 日本へ 来ました。', 'Melakukan kegiatan bersama (orang)', 'tomodachi to Nihon e kimashita.', 'Saya datang ke Jepang bersama teman.'],

    // BAB 6
    [6, '[Kata Benda] を [Kata Kerja]', 'パンを 食べます。', 'Melakukan aksi KK pada objek KB', 'pan o tabemasu.', 'Saya makan roti.'],
    [6, '[Tempat] で [Kata Kerja]', 'レストランで ごはんを 食べます。', 'Melakukan aktivitas KK di (tempat)', 'resutoran de gohan o tabemasu.', 'Saya makan nasi di restoran.'],
    [6, '[Kata Kerja]-masen ka', 'いっしょに 行きませんか。', 'Ajakan: "Mau kah...?" / "Bagaimana kalau...?"', 'issho ni ikimasen ka.', 'Maukah pergi bersama?'],
    [6, '[Kata Kerja]-mashou', 'ちょっと 休みましょう。', 'Ajakan tegas: "Mari kita..."', 'chotto yasumimashou.', 'Mari kita istirahat sebentar.'],

    // BAB 7
    [7, '[Alat] / [Bahasa] で [Kata Kerja]', 'はしで 食べます。 / 日本語で 話します。', 'Melakukan KK dengan/menggunakan (alat/bahasa)', 'hashi de tabemasu. / nihongo de hanashimasu.', 'Makan menggunakan sumpit. / Berbicara dalam bahasa Jepang.'],
    [7, '[Orang] に [Kata Benda] を あげます', '木村さんに 花を あげました。', 'Memberikan KB kepada (orang)', 'Kimura-san ni hana o agemashita.', 'Saya memberikan bunga kepada Sdr. Kimura.'],
    [7, '[Orang] に [Kata Benda] を もらいます', '山田さんに 本を もらいました。', 'Menerima KB dari (orang)', 'Yamada-san ni hon o moraimashita.', 'Saya menerima buku dari Sdr. Yamada.'],
    [7, 'もう [Kata Kerja]-mashita', 'もう 昼ごはんを 食べました。', 'Sudah melakukan KK', 'mou hirugohan o tabemashita.', 'Saya sudah makan siang.'],

    // BAB 8
    [8, '[Kata Benda] は [Kata Sifat] (i/na) desu', '富士山は 高いです。 / ワット先生は 親切です。', 'KB itu (kata sifat)', 'Fujisan wa takai desu. / Watto-sensei wa shinsetsu desu.', 'Gunung Fuji tinggi. / Pak Watt ramah.'],
    [8, '[Kata Sifat-i] + [Kata Benda] / [Kata Sifat-na] + na + [Kata Benda]', '高い 山 / きれいな 部屋', 'Kata sifat yang menerangkan kata benda', 'takai yama / kirei na heya', 'Gunung yang tinggi / Kamar yang bersih'],
    [8, 'あまり + Negatif', 'この 本は あまり 面白くないです。', 'Tidak begitu / tidak terlalu...', 'kono hon wa amari omoshirokunai desu.', 'Buku ini tidak begitu menarik.'],

    // BAB 9
    [9, '[Kata Benda] が すき / きらい / じょうず / へた です', 'わたしは イタリア料理が 好きです。', 'Suka / benci / pandai / mahir KB (partikel が)', 'watashi wa Itaria ryouri ga suki desu.', 'Saya suka masakan Italia.'],
    [9, '[Kata Benda] が あります / わかります', '日本語が わかります。', 'Punya / mengerti KB', 'nihongo ga wakarimasu.', 'Saya mengerti bahasa Jepang.'],
    [9, '[Alasan] から、[Kalimat]', '時間が ありませんから、タクシーで 行きます。', 'Karena (alasan), maka...', 'jikan ga arimasen kara, takushii de ikimasu.', 'Karena tidak ada waktu, saya naik taksi.'],

    // BAB 10
    [10, '[Tempat] に [Kata Benda] (benda mati) が あります', '部屋に 机が あります。', 'Di (tempat) ada (benda mati)', 'heya ni tsukue ga arimasu.', 'Di kamar ada meja.'],
    [10, '[Tempat] に [Kata Benda] (makhluk hidup) が います', '庭に 犬が います。', 'Di (tempat) ada (makhluk hidup)', 'niwa ni inu ga imasu.', 'Di halaman ada anjing.'],
    [10, '[Kata Benda 1] と [Kata Benda 2] の 間 (aida)', '本屋と 銀行の 間に あります。', 'Di antara KB1 dan KB2', "hon'ya to ginkou no aida ni arimasu.", 'Ada di antara toko buku dan bank.'],

    // BAB 11
    [11, '[Bilangan] / [Jumlah] + [Kata Kerja]', 'りんごを 4つ 買いました。', 'Jumlah/satuan diletakkan langsung sebelum kata kerja', 'ringo o yottsu kaimashita.', 'Saya membeli 4 buah apel.'],
    [11, '[Periode] に X-kai [Kata Kerja]', '1か月に 2回 映画を 見ます。', 'Dalam (periode) melakukan KK sebanyak X kali', 'ikkagetsu ni ni-kai eiga o mimasu.', 'Dalam 1 bulan saya menonton film 2 kali.'],

    // BAB 12
    [12, '[Kata Benda 1] は [Kata Benda 2] より [Kata Sifat] です', '日本は 台湾より 広いです。', 'KB1 lebih (kata sifat) daripada KB2', 'Nihon wa Taiwan yori hiroi desu.', 'Jepang lebih luas daripada Taiwan.'],
    [12, '[Kata Benda 1] と [Kata Benda 2] と どちらが [Kata Sifat] ですか', 'サッカーと 野球と どちらが 面白いですか。', 'Antara KB1 dan KB2, mana yang lebih (kata sifat)?', 'sakkaa to yakyuu to dochira ga omoshiroi desu ka.', 'Antara sepak bola dan bisbol, mana yang lebih menarik?'],
    [12, '[Kata Benda 1] [の 中] で どこ/だれ/なに が 一番 [Kata Sifat] ですか', '日本で どこが 一番 きれいですか。', 'Di antara KB1, mana/siapa/apa yang paling (kata sifat)?', 'Nihon de doko ga ichiban kirei desu ka.', 'Di Jepang tempat mana yang paling indah?'],

    // BAB 13
    [13, '[Kata Benda] が ほしいです', '車が ほしいです。', 'Ingin (memiliki) KB', 'kuruma ga hoshii desu.', 'Saya ingin (memiliki) mobil.'],
    [13, '[Kata Kerja-stem] + たいです', '沖縄へ 行きたいです。', 'Ingin melakukan KK (kata kerja bentuk masu tanpa masu)', 'Okinawa e ikitai desu.', 'Saya ingin pergi ke Okinawa.'],
    [13, '[Tempat] へ [Kata Kerja-stem] / [Kata Benda] に 行きます', 'デパートへ 買い物に 行きます。', 'Pergi ke (tempat) untuk tujuan KK/KB', 'depaato e kaimono ni ikimasu.', 'Saya pergi ke department store untuk berbelanja.'],

    // BAB 14
    [14, '[Kata Kerja]-te ください', 'ちょっと 待ってください。', 'Tolong lakukan KK', 'chotto matte kudasai.', 'Tolong tunggu sebentar.'],
    [14, '[Kata Kerja]-te います', '今 雨が 降っています。', 'Sedang melakukan KK (kegiatan berlangsung)', 'ima ame ga futte imasu.', 'Sekarang hujan sedang turun.'],
    [14, '[Kata Kerja-stem] ましょうか', '傘を 貸しましょうか。', 'Menawarkan bantuan: "Bagaimana kalau saya...?"', 'kasa o kashimashou ka.', 'Bagaimana kalau saya pinjamkan payung?'],

    // BAB 15
    [15, '[Kata Kerja]-te も いいです [か]', 'ここで 写真を 撮っても いいですか。', 'Boleh melakukan KK / Boleh kah... ?', 'koko de shashin o tottemo ii desu ka.', 'Bolehkah mengambil foto di sini?'],
    [15, '[Kata Kerja]-te は いけません', 'ここで たばこを 吸っては いけません。', 'Dilarang / tidak boleh melakukan KK', 'koko de tabako o suttewa ikemasen.', 'Dilarang merokok di sini.'],
    [15, '[Kata Kerja]-te います (Status/Kebiasaan)', 'わたしは 結婚して います。 / IMCで 働いて います。', 'Status menikah / bekerja di / kebiasaan menetap', 'watashi wa kekkon shite imasu. / IMC de hataraite imasu.', 'Saya sudah menikah. / Saya bekerja di IMC.'],

    // BAB 16
    [16, '[Kata Kerja 1]-te, [Kata Kerja 2]-te, [Kata Kerja 3]', '朝 起きて、ごはんを 食べて、学校へ 行きます。', 'Urutan kegiatan: Melakukan KK1, lalu KK2, lalu KK3', 'asa okite, gohan o tabete, gakkou e ikimasu.', 'Pagi bangun tidur, makan nasi, lalu pergi ke sekolah.'],
    [16, '[Kata Kerja 1]-te kara, [Kata Kerja 2]', '仕事が 終わってから、ごはんを 食べます。', 'Setelah selesai melakukan KK1, baru melakukan KK2', 'shigoto ga owattekara, gohan o tabemasu.', 'Setelah pekerjaan selesai, baru makan.'],
    [16, '[Kata Benda 1] wa [Kata Benda 2] ga [Kata Sifat] desu', 'ミラーさんは 髪が 短いです。', 'KB1 (subjek) bagian KB2-nya (kata sifat)', 'Miraa-san wa kami ga mijikai desu.', 'Sdr. Miller rambutnya pendek.'],
    [16, '[Kata Kerja-Kamus] + ことが できます', '日本語を 話す ことが できます。', 'Bisa / mampu melakukan KK', 'nihongo o hanasu koto ga dekimasu.', 'Bisa berbicara bahasa Jepang.']
  ];

  var tabKelola = document.getElementById('tab-kelola');
  var tabReview = document.getElementById('tab-review');
  var tabProgres = document.getElementById('tab-progres');
  var secKelola = document.getElementById('sec-kelola');
  var secReview = document.getElementById('sec-review');
  var secProgres = document.getElementById('sec-progres');

  tabKelola.addEventListener('click', function () { switchTab('kelola'); });
  tabReview.addEventListener('click', function () { switchTab('review'); renderBabChecks(); });
  tabProgres.addEventListener('click', function () { switchTab('progres'); renderProgres(); });

  function switchTab(name) {
    tabKelola.classList.toggle('active', name === 'kelola');
    tabReview.classList.toggle('active', name === 'review');
    tabProgres.classList.toggle('active', name === 'progres');
    secKelola.classList.toggle('active', name === 'kelola');
    secReview.classList.toggle('active', name === 'review');
    secProgres.classList.toggle('active', name === 'progres');
  }

  var STORAGE_OK = (function () {
    try {
      var k = '__mnn_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  function loadAll() {
    try {
      var rawCards = STORAGE_OK ? localStorage.getItem('mnn-cards') : null;
      if (rawCards) {
        cards = JSON.parse(rawCards);
        // Sync DEFAULT_CARDS edits & additions to localStorage
        DEFAULT_CARDS.forEach(function (d) {
          var found = false;
          for (var i = 0; i < cards.length; i++) {
            if (cards[i].bab === d[0] && cards[i].pola === d[1]) {
              cards[i].contoh = d[2];
              cards[i].arti = d[3];
              cards[i].contohRomaji = d[4] || '';
              cards[i].contohArti = d[5] || '';
              found = true;
              break;
            }
          }
          if (!found) {
            cards.push({
              id: uid(),
              bab: d[0],
              pola: d[1],
              contoh: d[2],
              arti: d[3],
              contohRomaji: d[4] || '',
              contohArti: d[5] || '',
              status: 'baru',
              correctStreak: 0
            });
          }
        });
        saveCards();
      } else {
        cards = DEFAULT_CARDS.map(function (d) {
          return { id: uid(), bab: d[0], pola: d[1], contoh: d[2], arti: d[3], contohRomaji: d[4] || '', contohArti: d[5] || '', status: 'baru', correctStreak: 0 };
        });
        saveCards();
      }
    } catch (e) {
      cards = [];
    }
    try {
      var rawStats = STORAGE_OK ? localStorage.getItem('mnn-stats') : null;
      if (rawStats) {
        stats = JSON.parse(rawStats);
      } else {
        saveStats();
      }
    } catch (e) { /* keep defaults */ }

    if (!STORAGE_OK) {
      var warn = document.createElement('div');
      warn.style.cssText = 'background:#F3DEDB;border:1px solid var(--hanko);color:var(--hanko-deep);padding:10px 14px;margin-bottom:16px;font-size:13px;';
      warn.textContent = 'Penyimpanan browser tidak aktif (mode private/incognito?). Progres tidak akan tersimpan setelah halaman ditutup.';
      document.querySelector('.wrap').insertBefore(warn, document.querySelector('.stat-strip'));
    }

    loaded = true;
    renderList();
    renderStatStrip();
  }

  function saveCards() {
    if (!STORAGE_OK) return;
    try { localStorage.setItem('mnn-cards', JSON.stringify(cards)); }
    catch (e) { console.error('Gagal menyimpan kartu', e); }
  }

  function saveStats() {
    if (!STORAGE_OK) return;
    try { localStorage.setItem('mnn-stats', JSON.stringify(stats)); }
    catch (e) { console.error('Gagal menyimpan progres', e); }
  }

  function uid() {
    return 'c' + Date.now() + Math.random().toString(36).slice(2, 7);
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function currentLevel() {
    var lvl = LEVELS[0];
    for (var i = 0; i < LEVELS.length; i++) {
      if (stats.xp >= LEVELS[i].minXp) lvl = LEVELS[i];
    }
    return lvl;
  }

  function nextLevel() {
    var cur = currentLevel();
    var idx = LEVELS.indexOf(cur);
    return LEVELS[idx + 1] || null;
  }

  function renderStatStrip(justLeveled) {
    var lvl = currentLevel();
    var nxt = nextLevel();
    document.getElementById('hanko-level').textContent = lvl.key;
    document.getElementById('level-name').textContent = lvl.name;
    document.getElementById('level-sub').textContent = lvl.sub;
    var pct, label;
    if (nxt) {
      pct = Math.round(((stats.xp - lvl.minXp) / (nxt.minXp - lvl.minXp)) * 100);
      label = stats.xp + ' / ' + nxt.minXp + ' XP menuju ' + nxt.name;
    } else {
      pct = 100;
      label = stats.xp + ' XP · level tertinggi tercapai';
    }
    document.getElementById('xp-bar-fill').style.width = pct + '%';
    document.getElementById('xp-label').textContent = label;
    document.getElementById('streak-n').textContent = stats.streak || 0;

    if (justLeveled) {
      var stamp = document.getElementById('hanko-level');
      stamp.classList.remove('leveled');
      void stamp.offsetWidth;
      stamp.classList.add('leveled');
    }
  }

  function addXp(amount) {
    var before = currentLevel();
    stats.xp += amount;
    var today = todayStr();
    if (stats.lastReviewDate !== today) {
      if (stats.lastReviewDate === yesterdayStr()) {
        stats.streak = (stats.streak || 0) + 1;
      } else {
        stats.streak = 1;
      }
      stats.lastReviewDate = today;
    }
    var after = currentLevel();
    saveStats();
    renderStatStrip(after !== before);
  }

  function yesterdayStr() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  document.getElementById('btn-add').addEventListener('click', function () {
    var bab = document.getElementById('f-bab').value.trim();
    var pola = document.getElementById('f-pola').value.trim();
    var contoh = document.getElementById('f-contoh').value.trim();
    var contohRomajiEl = document.getElementById('f-contoh-romaji');
    var contohArtiEl = document.getElementById('f-contoh-arti');
    var contohRomaji = contohRomajiEl ? contohRomajiEl.value.trim() : '';
    var contohArti = contohArtiEl ? contohArtiEl.value.trim() : '';
    var arti = document.getElementById('f-arti').value.trim();

    if (!bab || !pola) {
      alert('Isi minimal nomor bab dan pola kalimatnya ya.');
      return;
    }

    cards.push({
      id: uid(),
      bab: parseInt(bab, 10),
      pola: pola,
      contoh: contoh,
      contohRomaji: contohRomaji,
      contohArti: contohArti,
      arti: arti,
      status: 'baru',
      correctStreak: 0
    });

    document.getElementById('f-bab').value = '';
    document.getElementById('f-pola').value = '';
    document.getElementById('f-contoh').value = '';
    if (contohRomajiEl) contohRomajiEl.value = '';
    if (contohArtiEl) contohArtiEl.value = '';
    document.getElementById('f-arti').value = '';
    document.getElementById('f-pola').focus();

    saveCards();
    renderList();
  });

  function renderList() {
    var container = document.getElementById('list-container');
    if (!loaded) {
      container.innerHTML = '<div class="loading">Memuat kartu…</div>';
      return;
    }
    if (cards.length === 0) {
      container.innerHTML = '<div class="empty">Belum ada kartu. Tambahkan pola kalimat dari bab yang baru dipelajari di atas.</div>';
      return;
    }

    var byBab = {};
    cards.forEach(function (c) {
      if (!byBab[c.bab]) byBab[c.bab] = [];
      byBab[c.bab].push(c);
    });
    var babNums = Object.keys(byBab).map(Number).sort(function (a, b) { return a - b; });

    var html = '';
    babNums.forEach(function (bab) {
      var list = byBab[bab];
      var lancarCount = list.filter(function (c) { return c.status === 'lancar'; }).length;
      var pct = Math.round((lancarCount / list.length) * 100);
      html += '<div class="bab-group"><div class="bab-heading"><span>Bab ' + bab + ' &middot; ' + lancarCount + '/' + list.length + '</span>' +
        '<div class="mini-progress"><div class="mini-progress-fill" style="width:' + pct + '%"></div></div></div>';
      list.forEach(function (c, idx) {
        var badgeClass = c.status === 'lancar' ? 'lancar' : (c.status === 'belajar' ? 'belajar' : 'baru');
        var badgeText = c.status === 'lancar' ? 'Lancar' : (c.status === 'belajar' ? 'Belajar' : 'Baru');
        html += '<div class="card-row">' +
          '<div class="txt"><span class="pola-no">' + (idx + 1) + '</span><div class="txt-body"><strong>' + escapeHtml(c.pola) + '</strong>' +
          (c.contoh ? '<br>' + escapeHtml(c.contoh) : '') +
          (c.contohRomaji ? '<div class="contoh-romaji">(' + escapeHtml(c.contohRomaji) + ')</div>' : '') +
          (c.contohArti ? '<div class="contoh-arti">' + escapeHtml(c.contohArti) + '</div>' : '') +
          (c.arti ? '<div class="arti">' + escapeHtml(c.arti) + '</div>' : '') +
          '</div></div>' +
          '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">' +
          '<span class="badge ' + badgeClass + '">' + badgeText + '</span>' +
          '<button class="del-btn" data-id="' + c.id + '" aria-label="Hapus kartu">✕</button>' +
          '</div></div>';
      });
      html += '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.del-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        cards = cards.filter(function (c) { return c.id !== id; });
        saveCards();
        renderList();
      });
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderBabChecks() {
    var container = document.getElementById('bab-checks');
    if (cards.length === 0) {
      container.innerHTML = '<span class="hidden-hint">Belum ada kartu untuk direview — tambahkan dulu di tab Kelola Kartu.</span>';
      return;
    }
    var babNums = Array.from(new Set(cards.map(function (c) { return c.bab; }))).sort(function (a, b) { return a - b; });
    var html = '<label><input type="checkbox" id="chk-all" checked> Semua bab</label>';
    babNums.forEach(function (b) {
      html += '<label><input type="checkbox" class="chk-bab" value="' + b + '" checked> Bab ' + b + '</label>';
    });
    container.innerHTML = html;

    document.getElementById('chk-all').addEventListener('change', function (e) {
      container.querySelectorAll('.chk-bab').forEach(function (cb) { cb.checked = e.target.checked; });
    });
  }

  document.getElementById('btn-start-review').addEventListener('click', function () {
    var checked = Array.from(document.querySelectorAll('.chk-bab:checked')).map(function (cb) { return parseInt(cb.value, 10); });
    if (checked.length === 0) {
      alert('Pilih minimal satu bab.');
      return;
    }
    var focusOnly = document.getElementById('chk-focus').checked;
    reviewQueue = cards.filter(function (c) {
      var inBab = checked.indexOf(c.bab) !== -1;
      if (!inBab) return false;
      if (focusOnly) return c.status !== 'lancar';
      return true;
    });
    for (var i = reviewQueue.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = reviewQueue[i]; reviewQueue[i] = reviewQueue[j]; reviewQueue[j] = tmp;
    }
    reviewIndex = 0;
    reviewResults = { lancar: 0, ulang: 0 };
    comboCount = 0;
    if (reviewQueue.length === 0) {
      document.getElementById('review-area').innerHTML = '<div class="empty">Tidak ada kartu untuk direview dengan pilihan ini — coba matikan "fokus belum lancar" atau tambah kartu baru.</div>';
      return;
    }
    showCard();
  });

  function showCard() {
    answerShown = false;
    practiceTarget = [];
    practicePool = [];
    practiceSlots = [];
    practiceMistake = false;
    practiceLocked = false;
    var area = document.getElementById('review-area');
    if (reviewIndex >= reviewQueue.length) {
      showSummary();
      return;
    }
    var c = reviewQueue[reviewIndex];
    var comboHtml = comboCount >= 2 ? '<span class="combo-tag">🔥 combo x' + comboCount + '</span>' : '';
    area.innerHTML =
      '<div class="genko" id="genko-card">' +
      '<div class="progress-label"><span>KARTU ' + (reviewIndex + 1) + ' / ' + reviewQueue.length + ' &middot; BAB ' + c.bab + '</span>' + comboHtml + '</div>' +
      '<div class="pola-display">' + escapeHtml(c.pola) + '</div>' +
      '<div id="answer-block"><div class="hidden-hint">— tutup dulu, coba ingat dulu artinya &amp; contoh kalimatnya —</div></div>' +
      '</div>' +
      '<div class="review-actions" id="review-actions"></div>';

    var actions = document.getElementById('review-actions');
    actions.innerHTML = '<button class="btn-show" id="btn-show-answer">Tampilkan Contoh Kalimat</button>';
    document.getElementById('btn-show-answer').addEventListener('click', revealAnswer);
  }

  function revealAnswer() {
    if (answerShown) return;
    answerShown = true;
    var c = reviewQueue[reviewIndex];
    document.getElementById('answer-block').innerHTML =
      (c.contoh ? '<div class="contoh-display">' + escapeHtml(c.contoh) + '</div>' : '') +
      (c.contohRomaji ? '<div class="contoh-romaji">(' + escapeHtml(c.contohRomaji) + ')</div>' : '') +
      (c.contohArti ? '<div class="contoh-arti-display">' + escapeHtml(c.contohArti) + '</div>' : '') +
      (c.arti ? '<div class="arti-display">' + escapeHtml(c.arti) + '</div>' : '');

    var actions = document.getElementById('review-actions');
    var tokens = getPracticeTokens(c);
    if (tokens.length >= 2) {
      actions.innerHTML = '<button class="btn-show" id="btn-start-practice">Latihan Susun Kalimat</button>';
      document.getElementById('btn-start-practice').addEventListener('click', startPractice);
    } else {
      actions.innerHTML =
        '<button class="btn-ulang" id="btn-ulang">Perlu Diulang</button>' +
        '<button class="btn-lancar" id="btn-lancar">Sudah Lancar</button>';
      document.getElementById('btn-lancar').addEventListener('click', function () { markAndNext('lancar'); });
      document.getElementById('btn-ulang').addEventListener('click', function () { markAndNext('ulang'); });
    }
  }

  function getPracticeTokens(c) {
    if (!c.contoh) return [];
    var target = c.contoh.split(' / ')[0].split('／')[0].trim();
    return target.split(/[\s　]+/).filter(Boolean);
  }

  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startPractice() {
    var c = reviewQueue[reviewIndex];
    practiceTarget = getPracticeTokens(c);
    practicePool = shuffleArr(practiceTarget);
    practiceSlots = [];
    practiceMistake = false;
    practiceLocked = false;

    document.getElementById('answer-block').innerHTML =
      '<div class="practice-wrap">' +
      '<div class="practice-label">Susun kalimatnya sesuai pola di atas</div>' +
      '<div class="answer-slots" id="answer-slots"></div>' +
      '<div class="token-pool" id="token-pool"></div>' +
      '<div class="practice-feedback" id="practice-feedback"></div>' +
      '</div>';

    document.getElementById('review-actions').innerHTML =
      '<button class="btn-reset-practice" id="btn-reset-practice">↺ Susun Ulang</button>';
    document.getElementById('btn-reset-practice').addEventListener('click', function () {
      practicePool = shuffleArr(practiceTarget);
      practiceSlots = [];
      practiceLocked = false;
      renderPractice();
    });

    renderPractice();
  }

  function renderPractice() {
    var slotsEl = document.getElementById('answer-slots');
    var poolEl = document.getElementById('token-pool');
    if (!slotsEl || !poolEl) return;

    slotsEl.innerHTML = '';
    practiceTarget.forEach(function (_, i) {
      var el = document.createElement('div');
      if (practiceSlots[i] !== undefined) {
        el.className = 'slot-item';
        el.textContent = practiceSlots[i];
        (function (idx) {
          el.addEventListener('click', function () {
            if (practiceLocked) return;
            practicePool.push(practiceSlots[idx]);
            practiceSlots.splice(idx, 1);
            renderPractice();
          });
        })(i);
      } else {
        el.className = 'slot-placeholder';
      }
      slotsEl.appendChild(el);
    });

    poolEl.innerHTML = '';
    practicePool.forEach(function (word, i) {
      var el = document.createElement('div');
      el.className = 'token-chip';
      el.textContent = word;
      el.addEventListener('click', function () {
        if (practiceLocked) return;
        practiceSlots.push(word);
        practicePool.splice(i, 1);
        renderPractice();
        if (practiceSlots.length === practiceTarget.length) {
          checkPractice();
        }
      });
      poolEl.appendChild(el);
    });
  }

  function checkPractice() {
    practiceLocked = true;
    var isCorrect = practiceSlots.join(' ') === practiceTarget.join(' ');
    var slotsEl = document.getElementById('answer-slots');
    var feedback = document.getElementById('practice-feedback');

    if (isCorrect) {
      slotsEl.querySelectorAll('.slot-item').forEach(function (el) { el.classList.add('correct'); });
      feedback.className = 'practice-feedback ok';
      feedback.textContent = '✓ Benar sekali!';
      setTimeout(function () {
        markAndNext(practiceMistake ? 'ulang' : 'lancar');
      }, 700);
    } else {
      slotsEl.querySelectorAll('.slot-item').forEach(function (el) { el.classList.add('wrong'); });
      feedback.className = 'practice-feedback bad';
      feedback.textContent = 'Belum tepat, susun ulang yuk.';
      practiceMistake = true;
      setTimeout(function () {
        practicePool = shuffleArr(practiceTarget);
        practiceSlots = [];
        practiceLocked = false;
        feedback.textContent = '';
        renderPractice();
      }, 1000);
    }
  }

  function markAndNext(result) {
    var c = reviewQueue[reviewIndex];
    var genko = document.getElementById('genko-card');

    if (result === 'lancar') {
      c.correctStreak = (c.correctStreak || 0) + 1;
      c.status = c.correctStreak >= 2 ? 'lancar' : 'belajar';
      comboCount++;
      var xpGain = 8 + Math.min(comboCount, 5) * 2;
      addXp(xpGain);
      showStamp(genko, 'ok', '合格');
      showFloatXp(genko, '+' + xpGain + ' XP');
      if (comboCount >= 3) spawnConfetti(genko);
    } else {
      c.correctStreak = 0;
      c.status = 'belajar';
      comboCount = 0;
      addXp(2);
      showStamp(genko, 'retry', 'また今度');
      showFloatXp(genko, '+2 XP');
    }
    reviewResults[result]++;
    saveCards();
    renderList();

    setTimeout(function () {
      reviewIndex++;
      showCard();
    }, 620);
  }

  function showStamp(container, kind, text) {
    var el = document.createElement('div');
    el.className = 'result-stamp ' + kind;
    el.textContent = text;
    container.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 650);
  }

  function showFloatXp(container, text) {
    var el = document.createElement('div');
    el.className = 'float-xp';
    el.textContent = text;
    container.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
  }

  function spawnConfetti(container) {
    var colors = ['#AE3327', '#2B4570', '#B8894B', '#3E6B4F', '#D98A93'];
    for (var i = 0; i < 20; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (0.7 + Math.random() * 0.6) + 's';
      piece.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
      container.appendChild(piece);
      (function (p) {
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1400);
      })(piece);
    }
  }

  function showSummary() {
    var total = reviewResults.lancar + reviewResults.ulang;
    var perfect = reviewResults.ulang === 0 && total > 0;
    if (perfect) addXp(15);
    document.getElementById('review-area').innerHTML =
      '<div class="genko summary" id="genko-summary">' +
      '<div class="big">' + reviewResults.lancar + ' / ' + total + '</div>' +
      '<div class="sub">kartu sudah lancar. ' + reviewResults.ulang + ' kartu masih perlu diulang.' +
      (perfect ? ' Sempurna! +15 XP bonus.' : '') + '</div>' +
      (reviewResults.ulang > 0 ? '<button class="primary" id="btn-review-ulang">Review Ulang yang Belum Lancar</button>' : '<div class="hidden-hint">Semua kartu di sesi ini sudah lancar. 👍</div>') +
      '</div>';
    if (perfect) spawnConfetti(document.getElementById('genko-summary'));
    if (reviewResults.ulang > 0) {
      document.getElementById('btn-review-ulang').addEventListener('click', function () {
        reviewQueue = reviewQueue.filter(function (c) { return c.status !== 'lancar'; });
        reviewIndex = 0;
        reviewResults = { lancar: 0, ulang: 0 };
        comboCount = 0;
        showCard();
      });
    }
  }

  function renderProgres() {
    var total = cards.length;
    var lancar = cards.filter(function (c) { return c.status === 'lancar'; }).length;
    var belajar = cards.filter(function (c) { return c.status === 'belajar'; }).length;
    var baru = total - lancar - belajar;

    document.getElementById('progres-grid').innerHTML =
      '<div class="progres-card"><div class="num">' + total + '</div><div class="lbl">Total Kartu</div></div>' +
      '<div class="progres-card"><div class="num">' + lancar + '</div><div class="lbl">Sudah Lancar</div></div>' +
      '<div class="progres-card"><div class="num">' + belajar + '</div><div class="lbl">Sedang Belajar</div></div>' +
      '<div class="progres-card"><div class="num">' + baru + '</div><div class="lbl">Belum Disentuh</div></div>' +
      '<div class="progres-card"><div class="num">' + (stats.streak || 0) + '</div><div class="lbl">Hari Beruntun</div></div>' +
      '<div class="progres-card"><div class="num">' + stats.xp + '</div><div class="lbl">Total XP</div></div>';

    var byBab = {};
    cards.forEach(function (c) {
      if (!byBab[c.bab]) byBab[c.bab] = [];
      byBab[c.bab].push(c);
    });
    var babNums = Object.keys(byBab).map(Number).sort(function (a, b) { return a - b; });
    var html = '';
    if (babNums.length === 0) {
      html = '<div class="empty">Belum ada kartu untuk ditampilkan progresnya.</div>';
    } else {
      babNums.forEach(function (bab) {
        var list = byBab[bab];
        var lc = list.filter(function (c) { return c.status === 'lancar'; }).length;
        var pct = Math.round((lc / list.length) * 100);
        html += '<div class="bab-progress-row">' +
          '<div class="lbl2">BAB ' + bab + '</div>' +
          '<div class="track"><div class="fill" style="width:' + pct + '%"></div></div>' +
          '<div class="cnt">' + lc + '/' + list.length + '</div>' +
          '</div>';
      });
    }
    document.getElementById('bab-progress-list').innerHTML = html;
  }

  function spawnPetal() {
    var field = document.getElementById('petal-field');
    if (!field) return;
    var p = document.createElement('div');
    p.className = 'petal';
    var size = 8 + Math.random() * 8;
    var duration = 9 + Math.random() * 7;
    var drift = (Math.random() * 120 - 60) + 'px';
    p.style.left = (Math.random() * 100) + '%';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.setProperty('--drift', drift);
    p.style.animationDuration = duration + 's';
    field.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, duration * 1000 + 200);
  }

  function startPetalRain() {
    for (var i = 0; i < 6; i++) {
      setTimeout(spawnPetal, i * 400);
    }
    setInterval(spawnPetal, 1400);
  }

  loadAll();
  startPetalRain();
})();
