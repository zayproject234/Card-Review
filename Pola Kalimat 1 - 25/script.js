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
    [4, '今 〜時 〜分です', '今 4時 5分です。', '1. Menyebutkan Jam dan Menit', 'ima yo-ji go-fun desu.'],
    [4, '[Kata Kerja]-masu / [Kata Kerja]-masen', '毎朝 6時に 起きます。 / 起きません。', '2. KK Bentuk Non-Lampau (Rutin/Masa Depan)', 'okimasu / okimasen.'],
    [4, '[Kata Kerja]-mashita / [Kata Kerja]-masen deshita', 'きのう 勉強しました。 / 勉強しませんでした。', '3. KK Bentuk Lampau (Sudah/Belum terjadi)', 'benkyou shimashita / benkyou shimasen deshita.'],
    [4, '[Waktu Spesifik] に [Kata Kerja]', '6時に 起きます。', '4. Partikel に untuk penunjuk waktu spesifik', 'roku-ji ni okimasu.'],
    [4, '[Waktu 1] kara [Waktu 2] made', '9時から 5時まで 働きます。', '5. Dari (kara) sampai (made)', 'ku-ji kara go-ji made hatarakimasu.'],
    [4, '[Kata Benda 1] と [Kata Benda 2]', '土曜日と 日曜日', '6. Partikel と (Dan - Menghubungkan KB)', 'doyoubi to nichiyoubi.'],
    [4, '[Kalimat] ね', '大変ですね。', '7. Partikel ね (Kan / Ya - Meminta persetujuan)', 'taihen desu ne.'],

    // BAB 5
    [5, '[Tempat] へ 行きます／来ます／帰ります', '京都へ 行きます。', '1. Arah pergerakan (Pergi/Datang/Pulang ke tempat)', 'Kyouto e ikimasu.'],
    [5, 'どこ [へ] も 行きません／行きませんでした', 'どこも 行きませんでした。', '2. Negatif total (Tidak pergi ke mana pun)', 'doko mo ikimasen deshita.'],
    [5, '[Kendaraan] で 行きます', '電車で 行きます。', '3. Alat transportasi (Pergi naik/menggunakan)', 'densha de ikimasu.'],
    [5, '歩いて 行きます／帰ります', '駅から 歩いて 帰ります。', '4. Berjalan kaki (Tanpa partikel de)', 'eki kara aruite kaerimasu.'],
    [5, '[Orang] と [Kata Kerja]', '友達と 日本へ 来ました。', '5. Bersama dengan (orang/hewan)', 'tomodachi to Nihon e kimashita.'],
    [5, 'いつ [Kata Kerja] か', 'いつ 日本へ 来ましたか。', '6. Menanyakan waktu (Kapan - tanpa partikel ni)', 'itsu Nihon e kimashita ka.'],
    [5, '[Kalimat] よ', 'この 電車は 甲子園へ 行きますよ。', '7. Partikel よ (Memberi tahu informasi baru/lho)', 'kono densha wa Koushien e ikimasu yo.'],

    // BAB 6
    [6, '[Kata Benda] を [Kata Kerja]', 'パンを 食べます。', '1. Objek kata kerja (Partikel を / o)', 'pan o tabemasu.'],
    [6, '[Kata Benda] を します', 'サッカーを します。 / 宿題を します。', '2. Melakukan kegiatan/olahraga/pekerjaan', 'sakkaa o shimasu / shukudai o shimasu.'],
    [6, '何を しますか', '月曜日 何を しますか。', '3. Menanyakan aktivitas (Melakukan apa?)', 'getsuyoubi nani o shimasu ka.'],
    [6, '[Tempat] で [Kata Kerja]', 'レストランで ごはんを 食べます。', '4. Tempat berlangsungnya aktivitas (Partikel で)', 'resutoran de gohan o tabemasu.'],
    [6, '[Kata Kerja]-masen ka', 'いっしょに 行きませんか。', '5. Ajakan halus: "Mau kah...?" / "Bagaimana kalau...?"', 'issho ni ikimasen ka.'],
    [6, '[Kata Kerja]-mashou', 'ちょっと 休みましょう。', '6. Ajakan tegas / respon ajakan: "Mari kita..."', 'chotto yasumimashou.'],

    // BAB 7
    [7, '[Alat / Bahasa] で [Kata Kerja]', 'はしで 食べます。 / 日本語で 話します。', '1. Menggunakan alat / sarana / bahasa (Partikel で)', 'hashi de tabemasu. / nihongo de hanashimasu.'],
    [7, '「[Kata]」は [Bahasa] で 何ですか', '「Arigatou」は 英語で 何ですか。', '2. Menanyakan padanan kata dalam bahasa lain', '"Arigatou" wa Eigo de nan desu ka.'],
    [7, '[Orang] に [Kata Benda] を あげます', '木村さんに 花を あげました。', '3. Memberikan barang kepada seseorang (ni agemasu)', 'Kimura-san ni hana o agemashita.'],
    [7, '[Orang] に／から [Kata Benda] を もらいます', '山田さんに 本を もらいました。', '4. Menerima barang dari seseorang (ni/kara moraimasu)', 'Yamada-san ni hon o moraimashita.'],
    [7, 'もう [Kata Kerja]-mashita', 'もう 昼ごはんを 食べました。', '5. Sudah melakukan kegiatan (mou + bentuk lampau)', 'mou hirugohan o tabemashita.'],
    [7, 'いいえ、まだです', '「もう 送りましたか。」「いいえ、まだです。」', '6. Belum melakukan (Respon untuk pertanyaan mou)', '"mou okurimashita ka." "iie, mada desu."'],

    // BAB 8
    [8, '[Kata Benda] は [KS-i] です／〜くないです', '富士山は 高いです。 / 面白くないです。', '1. Predikat Kata Sifat-i (Positif & Negatif)', 'Fujisan wa takai desu. / omoshirokunai desu.'],
    [8, '[Kata Benda] は [KS-na] です／〜じゃ ありません', 'ワット先生は 親切です。 / 静かじゃ ありません。', '2. Predikat Kata Sifat-na (Positif & Negatif)', 'Watto-sensei wa shinsetsu desu. / shizuka ja arimasen.'],
    [8, '[KS-i] [KB] / [KS-na] な [KB]', '高い 山 / きれいな 部屋', '3. Kata Sifat menerangkan Kata Benda', 'takai yama / kirei na heya'],
    [8, 'とても [+] / あまり [-]', 'とても 寒いです。 / あまり 寒くないです。', '4. Tingkat derajat (Sangat / Tidak begitu)', 'totemo samui desu. / amari samukunai desu.'],
    [8, '[Kata Benda] は どうですか', '日本の 生活は どうですか。', '5. Menanyakan kesan / kondisi (Bagaimana...?)', 'Nihon no seikatsu wa dou desu ka.'],
    [8, '[KB 1] は どんな [KB 2] ですか', '奈良は どんな 町ですか。', '6. Menanyakan ciri/sifat (Benda yang bagaimana?)', 'Nara wa donna machi desu ka.'],
    [8, '[Kalimat 1] が、[Kalimat 2]', '日本の 食べ物は 美味しいですが、高いです。', '7. Pertentangan (Tetapi / Namun)', 'Nihon no tabemono wa oishii desu ga, takai desu.'],

    // BAB 9
    [9, '[KB] が すき／きらい／じょうず／へた です', 'わたしは イタリア料理が 好きです。', '1. Suka / Benci / Pandai / Mahir (Partikel が)', 'watashi wa Itaria ryouri ga suki desu.'],
    [9, '[KB] が あります／わかります', '日本語が わかります。 / 車が あります。', '2. Memiliki / Mengerti (Partikel が)', 'nihongo ga wakarimasu. / kuruma ga arimasu.'],
    [9, 'よく／だいたい／すこし／あまり／ぜんぜん', '英語が よく わかります。 / ぜんぜん わかりません。', '3. Tingkat pemahaman / kuantitas', 'Eigo ga yoku wakarimasu. / zenzen wakarimasen.'],
    [9, '[Alasan] から、[Kalimat]', '時間が ありませんから、タクシーで 行きます。', '4. Menyatakan alasan (Karena..., maka...)', 'jikan ga arimasen kara, takushii de ikimasu.'],
    [9, 'どうして [Kalimat] か', 'どうして 朝新聞を 読みませんか。', '5. Menanyakan alasan (Mengapa / Kenapa?)', 'doushite asa shinbun o yomimasen ka.'],
    [9, '[Alasan] から', '「どうして 帰りますか。」「用事が ありますから。」', '6. Menjawab pertanyaan alasan (Karena...)', '"doushite kaerimasu ka." "youji ga arimasu kara."'],

    // BAB 10
    [10, '[Tempat] に [KB Mati] が あります', '部屋に 机が あります。', '1. Keberadaan benda mati / tanaman (arimasu)', 'heya ni tsukue ga arimasu.'],
    [10, '[Tempat] に [KB Hidup] が います', '庭に 犬が います。', '2. Keberadaan manusia / hewan (imasu)', 'niwa ni inu ga imasu.'],
    [10, '[Tempat] に 何が ありますか／だれが いますか', '事務所に だれが いますか。', '3. Menanyakan keberadaan (Ada apa / siapa?)', 'jimusho ni dare ga imasu ka.'],
    [10, '[KB] は [Tempat] に あります／います', '東京ディズニーランドは 千葉県に あります。', '4. Lokasi benda/orang spesifik (KB ada di...)', 'Toukyou Dizuniirando wa Chiba-ken ni arimasu.'],
    [10, '[KB 1] の [Posisi] に [KB 2] が あります／います', '机の 上に 写真が あります。', '5. Penunjuk posisi relatif (ue/shita/mae/ushiro/naka/tonari)', 'tsukue no ue ni shashin ga arimasu.'],
    [10, '[KB 1] と [KB 2] の 間 に [KB 3] が あります／います', '本屋と 銀行の 間に あります。', '6. Lokasi di antara dua benda (aida)', 'hon\'ya to ginkou no aida ni arimasu.'],
    [10, '[KB 1] や [KB 2] など', '箱の 中に 手紙や 写真などが あります。', '7. Menyebutkan beberapa contoh benda (dan lain-lain)', 'hako no naka ni tegami ya shashin nado ga arimasu.'],

    // BAB 11
    [11, '[KB] を [Bilangan/Satuan] [Kata Kerja]', 'りんごを 4つ 買いました。', '1. Posisi bilangan/jumlah sebelum KK', 'ringo o yottsu kaimashita.'],
    [11, '[Jumlah Orang] で [Kata Kerja]', '5人で 行きます。 / 1人で 行きます。', '2. Jumlah orang yang melakukan kegiatan', 'go-nin de ikimasu. / hitori de ikimasu.'],
    [11, '[Periode Waktu] に [Frekuensi] [KK]', '1か月に 2回 映画を 見ます。', '3. Frekuensi dalam periode waktu', 'ikkagetsu ni ni-kai eiga o mimasu.'],
    [11, '[KB / Jumlah] だけ', '休みは 日曜日だけです。', '4. Keterangan "Hanya / Saja" (dake)', 'yasumi wa nichiyoubi dake desu.'],
    [11, '[Lama Waktu] かかります', 'うちから 会社まで 1時間半 かかります。', '5. Memakan waktu / durasi (kakarimasu)', 'uchi kara kaisha made ichi-jikan-han kakarimasu.'],
    [11, 'どの くらい [Kata Kerja] か', 'どのくらい 日本語を 勉強しましたか。', '6. Menanyakan durasi/lama waktu (dono kurai)', 'dono kurai nihongo o benkyou shimashita ka.'],

    // BAB 12
    [12, '[KB / KS-na] でした／じゃ ありませんでした', 'きのうは 雨でした。 / 静かじゃ ありませんでした。', '1. Lampau KB & KS-na (deshita / ja arimasen deshita)', 'kinou wa ame deshita. / shizuka ja arimasen deshita.'],
    [12, '[KS-i] 〜かったです／〜くなかったです', 'きのうは 暑かったです。 / 寒くなかったです。', '2. Lampau KS-i (~katta desu / ~kunakatta desu)', 'kinou wa atsukatta desu. / samukunakatta desu.'],
    [12, '[KB 1] は [KB 2] より [KS] です', '日本は 台湾より 広いです。', '3. Perbandingan dua benda (KB1 lebih... daripada KB2)', 'Nihon wa Taiwan yori hiroi desu.'],
    [12, '[KB 1] と [KB 2] と どちらが [KS] ですか', 'サッカーと 野球と どちらが 面白いですか。', '4. Menanyakan perbandingan 2 benda (Mana yang lebih...?)', 'sakkaa to yakyuu to dochira ga omoshiroi desu ka.'],
    [12, '[Kategori] で [Kata Tanya] が 一番 [KS] ですか', '日本で どこが 一番 きれいですか。', '5. Superlatif / Paling... dalam kategori (ichiban)', 'Nihon de doko ga ichiban kirei desu ka.'],

    // BAB 13
    [13, '[Kata Benda] が ほしいです', '車が ほしいです。', '1. Ingin memiliki benda (hoshii desu)', 'kuruma ga hoshii desu.'],
    [13, '[Kata Kerja-stem] たいです', '沖縄へ 行きたいです。', '2. Ingin melakukan kegiatan (KK-stem + tai desu)', 'Okinawa e ikitai desu.'],
    [13, '[KK-stem] たくないです／たかったです', '何も 食べたくないです。', '3. Negatif / Lampau bentuk keinginan (~tai)', 'nani mo tabetakunai desu.'],
    [13, '[Tempat] へ [KK-stem / KB] に 行きます', 'デパートへ 買い物に 行きます。', '4. Pergi/datang/pulang untuk suatu tujuan (ni ikimasu)', 'depaato e kaimono ni ikimasu.'],
    [13, '何が ほしいですか／何を したいですか', '誕生日に 何が ほしいですか。', '5. Menanyakan keinginan benda/kegiatan', 'tanjoubi ni nani ga hoshii desu ka.'],

    // BAB 14
    [14, '[Kata Kerja-te] ください', 'ちょっと 待ってください。', '1. Permintaan halus (Tolong lakukan...)', 'chotto matte kudasai.'],
    [14, '[Kata Kerja-te] います', '今 雨が 降っています。', '2. Sedang melakukan kegiatan (Sedang...)', 'ima ame ga futte imasu.'],
    [14, '[Kata Kerja-stem] ましょうか', '傘を 貸しましょうか。', '3. Menawarkan bantuan (Bagaimana kalau saya...?)', 'kasa o kashimashou ka.'],
    [14, '[Kata Benda] が [KK-te] います', 'タクシーが 止まっています。', '4. Keadaan/kejadian yang sedang berlangsung', 'takushii ga tomatte imasu.'],
    [14, '[Kalimat 1] が、[Kalimat 2]', '失礼ですが、お名前は？', '5. Awalan halus sebelum meminta/bertanya (ga)', 'shitsurei desu ga, o-namae wa?'],

    // BAB 15
    [15, '[Kata Kerja-te] も いいですか', '写真を 撮っても いいですか。', '1. Meminta izin (Bolehkah...?)', 'shashin o tottemo ii desu ka.'],
    [15, '[Kata Kerja-te] は いけません', 'ここで たばこを 吸っては いけません。', '2. Larangan (Dilarang / tidak boleh...)', 'koko de tabako o suttewa ikemasen.'],
    [15, '[Kata Kerja-te] います (Status)', 'わたしは 結婚して います。 / 大阪に 住んで います。', '3. Status mapan/hasil aksi (Menikah/Tinggal di...)', 'watashi wa kekkon shite imasu. / Osaka ni sunde imasu.'],
    [15, '[Kata Kerja-te] います (Pekerjaan/Aset)', 'IMCで 働いて います。 / 車を 持って います。', '4. Pekerjaan tetap / Kepemilikan benda (Bekerja di/Mempunyai)', 'IMC de hataraite imasu. / kuruma o motte imasu.'],
    [15, 'お仕事は 何を して いますか', '「お仕事は 何を して いますか。」「先生です。」', '5. Menanyakan pekerjaan / profesi seseorang', '"o-shigoto wa nani o shite imasu ka." "sensei desu."'],

    // BAB 16
    // BAB 16
    [16, '[KK1-te], [KK2-te], [KK3]', '食べて、読んで、行きます。', '1. Urutan kegiatan berurutan (KK-te, KK-te, KK)', 'tabete, yonde, ikimasu.'],
    [16, '[KK 1-te] から、[KK 2]', '仕事が 終わってから、泳ぎます。', '2. Setelah melakukan suatu aksi (te kara)', 'shigoto ga owatte kara, oyogimasu.'],
    [16, '[KS-i]-kute / [KS-na / KB] de', '東京は 広くて、賑やかです。', '3. Menghubungkan sifat/kata benda (dan...)', 'Toukyou wa hirokute, nigiyaka desu.'],
    [16, '[KB 1] は [KB 2 (Bagian Tubuh)] が [KS]', 'マリアさんは 髪が 長いです。', '4. Menerangkan ciri fisik/bagian tubuh', 'Maria-san wa kami ga nagai desu.'],
    [16, '[Tempat] kara [KB] o oroshimasu', '銀行から お金を おろします。', '5. Mengambil/mengeluarkan barang dari tempat', 'ginkou kara o-kane o oroshimasu.'],
    // BAB 16
    [16, '[KK1-te], [KK2-te], [KK3]', '食べて、読んで、行きます。', '1. Urutan kegiatan berurutan (KK-te, KK-te, KK)', 'tabete, yonde, ikimasu.'],
    [16, '[KK 1-te] から、[KK 2]', '仕事が 終わってから、泳ぎます。', '2. Setelah melakukan suatu aksi (te kara)', 'shigoto ga owatte kara, oyogimasu.'],
    [16, '[KS-i]-kute / [KS-na / KB] de', '東京は 広くて、賑やかです。', '3. Menghubungkan sifat/kata benda (dan...)', 'Toukyou wa hirokute, nigiyaka desu.'],
    [16, '[KB 1] は [KB 2 (Bagian Tubuh)] が [KS]', 'マリアさんは 髪が 長いです。', '4. Menerangkan ciri fisik/bagian tubuh', 'Maria-san wa kami ga nagai desu.'],
    [16, '[Tempat] kara [KB] o oroshimasu', '銀行から お金を おろします。', '5. Mengambil/mengeluarkan barang dari tempat', 'ginkou kara o-kane o oroshimasu.'],

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
