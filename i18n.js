'use strict';
/* Campus マルシェ — Japanese-first translation layer.
   The app's code is written in English. When the language is Japanese, this file translates
   everything on screen as it is drawn (and toasts / confirm boxes), using:
     1. DICT: exact sentences and labels
     2. PATTERNS: sentences with changing parts (names, prices, counts)
     3. " · " splitting: "Bedding · 1日前" → each part translated on its own
   Things students write themselves (item titles, descriptions, chat messages, bios, review
   comments) are never translated. To add a translation: add a line to DICT or PATTERNS. */

const I18N = (() => {
  const KEY = 'cm_lang';
  const lang = localStorage.getItem(KEY) || 'ja'; // Japanese first
  document.documentElement.lang = lang;

  const DICT = {
    // nicknames, live chat, ratings after a day
    'Nickname': 'ニックネーム', 'Suggest': 'おまかせ', 'e.g. Sleepy Panda': '例：ねむいパンダ',
    "Don't use your real name. Other students only see your nickname.": '本名は使わないでください。ほかの学生にはニックネームだけが表示されます。',
    'That looks like a real name. For your safety, please use a nickname. (Tap "Send code" again to keep it.)': '本名のように見えます。安全のため、ニックネームにしましょう。（このまま使う場合は、もう一度「コードを送信」を押してください）',
    'That looks like a real name. Use a nickname for your safety, or tap Save again to keep it.': '本名のように見えます。安全のためニックネームにするか、このまま使う場合はもう一度保存してください。',
    'Use a nickname, never your real name': '本名ではなくニックネームを使う',
    "Don't share your full name, faculty, year, nationality, address, phone number or LINE ID in your profile or listings.": 'プロフィールや商品ページに、フルネーム・学部・学年・国籍・住所・電話番号・LINE IDを書かないでください。',
    'Read': '既読', 'Online': 'オンライン', 'typing': '入力中',
    'Ratings open 1 day after the hand-off, so nobody has to rate on the spot. We\'ll send you a reminder.': '評価は受け渡しの1日後からできます。その場で評価しなくて大丈夫です。時間になったらお知らせします。',
    'Ratings open 1 day after the hand-off': '評価は受け渡しの1日後からできます', 'Demo: skip ahead 1 day': 'デモ：1日進める',
    // invite code
    'Join with invite code': '招待コードで参加', 'Ask the friend who shared this link for the code.': 'コードはこのリンクを教えてくれた人に聞いてください。',
    'Join': '参加する', 'Joining…': '参加中…', 'Invite code': '招待コード',
    'No email needed. Your account stays on this phone or browser.': 'メールは不要です。アカウントはこのスマホ（ブラウザ）に保存されます。',
    'That looks like a real name. For your safety, please use a nickname. (Tap "Join" again to keep it.)': '本名のように見えます。安全のため、ニックネームにしましょう。（このまま使う場合は、もう一度「参加する」を押してください）',
    "You joined with an invite code, so this account lives in this browser. If you log out or clear this site's data, you can't get back in.": '招待コードで参加したため、このアカウントはこのブラウザにだけ保存されています。ログアウトしたりサイトのデータを消したりすると、元に戻せません。',
    "You joined with an invite code, so this account only lives in this browser. If you log out, you can't get back into it. Log out anyway?": '招待コードで参加したため、このアカウントはこのブラウザにだけ保存されています。ログアウトすると元に戻せません。ログアウトしますか？',
    'That invite code is not right. Check it with the friend who shared the link.': '招待コードが違います。リンクを教えてくれた人に確認してください。',
    'Too many wrong codes. Please wait an hour and try again.': '間違いが多すぎます。1時間ほど待ってからもう一度お試しください。',
    'Joining is turned off right now. Ask the friend who shared the link.': '現在、参加を受け付けていません。リンクを教えてくれた人に聞いてください。',
    'Post something or say hi to a seller.': '出品するか、出品者にメッセージを送ってみましょう。',
    // navigation
    'Home': 'ホーム', 'Notifications': 'お知らせ', 'Post': '出品', 'Messages': 'メッセージ', 'Me': 'マイページ',
    'Back': '戻る', 'Back to start': '最初に戻る', 'Go to home': 'ホームへ',
    // welcome / sign-up
    'Campus swaps,': '送らない、', 'no shipping.': 'キャンパスのフリマ。',
    'Buy, sell and give away': '買う・売る・ゆずる', 'Only students from your university': '同じ大学の学生だけ', 'Hand things over on campus': 'キャンパスで手渡し',
    'Sign up with university email': '大学のメールで登録', 'Try a demo account': 'デモアカウントで試す', 'I already have an account': 'アカウントをお持ちの方',
    'Demo mode · data stays on this device': 'デモモード・データはこの端末にだけ保存されます',
    'Pick a demo account': 'デモアカウントを選択', 'Create account': 'アカウント作成', 'Students only': '学生限定',
    'You need a university email so everyone here is a real student.': '全員が本物の学生であるように、大学のメールアドレスが必要です。',
    'Your name': '名前', 'University': '大学', 'Your campus': 'キャンパス', "You'll see items from your campus first.": '自分のキャンパスの商品が先に表示されます。',
    'University email': '大学のメールアドレス', 'Must end in u-hyogo.ac.jp': 'u-hyogo.ac.jp で終わるアドレス',
    'Send code': 'コードを送信', 'Sending…': '送信中…', 'Check your email': 'メールを確認', 'We sent a code to': '確認コードを送信しました：',
    'Demo mode: no email is really sent. Your code is': 'デモモード：メールは送信されません。コード：',
    'Check your university inbox. It can take a minute, and sometimes lands in spam.': '大学のメールを確認してください。届くまで少しかかることがあり、迷惑メールに入る場合もあります。',
    'Code': 'コード', 'Confirm': '確認', 'Checking…': '確認中…', 'Send a new code': 'コードを再送信',
    'Log in': 'ログイン', 'Welcome back': 'おかえりなさい', "We'll email a code to your university address.": '大学のメールアドレスにコードを送ります。',
    'Please use your university email (ending in u-hyogo.ac.jp).': '大学のメールアドレス（u-hyogo.ac.jp）を使ってください。',
    'Please use your University of Hyogo email (ending in u-hyogo.ac.jp).': '兵庫県立大学のメールアドレス（u-hyogo.ac.jp）を使ってください。',
    'That code is not right. Try again.': 'コードが違います。もう一度お試しください。',
    'That code is wrong or has expired. Try again or send a new code.': 'コードが違うか、有効期限が切れています。もう一度入力するか、再送信してください。',
    'Too many emails sent. Please wait a few minutes and try again.': '送信回数が多すぎます。数分待ってからお試しください。',
    'No account found for that email. Sign up first.': 'このメールのアカウントが見つかりません。先に登録してください。',
    // student card
    'Student card': '学生証', 'Verify student card': '学生証の確認', 'Verify your student card': '学生証を確認する', 'Verify': '確認する', 'Verify first': 'まずは学生証の確認', 'Verify now': '今すぐ確認',
    'Take a photo of the front of your student card (学生証). We check that your name and university match your account.': '学生証の表面を撮影してください。名前と大学がアカウントと一致しているか確認します。',
    'Tap to add a photo of your student card': 'タップして学生証の写真を追加',
    'Demo mode: the card photo is not saved or sent anywhere, and approval is instant.': 'デモモード：写真は保存も送信もされず、すぐに承認されます。',
    'Only the app admin can see this photo. It is deleted after your card is checked.': 'この写真は運営者だけが見られます。確認後に削除されます。',
    'Submit for check': '確認を申請', 'Uploading…': 'アップロード中…', 'Skip for now (you can browse, but not post or message)': 'あとで（閲覧はできますが、出品とメッセージはできません）',
    "You're verified": '確認済みです', 'Other students see a "Verified student" tag on your profile.': 'プロフィールに「学生証確認済み」と表示されます。',
    "We're checking your card": '学生証を確認しています', 'Browse items': '商品を見る',
    "This usually takes less than a day. You'll get a notification when you're verified. Until then you can browse and like items.": '通常1日以内に完了します。確認が終わるとお知らせが届きます。それまでは閲覧といいねができます。',
    'We could not read your last photo. Please try again with a clear, well-lit picture.': '前回の写真が読み取れませんでした。明るい場所ではっきり撮影してください。',
    'To keep this students-only, you need a verified student card to post items.': '学生限定にするため、出品には学生証の確認が必要です。',
    'Verified student': '学生証確認済み', 'Not verified': '未確認',
    // home & search
    'students only': '学生限定', 'Search textbooks, rice cookers, bikes…': '教科書、炊飯器、自転車などを検索', 'Cancel': 'キャンセル',
    'My campus': '自分のキャンパス', 'All campuses': 'すべてのキャンパス', 'All': 'すべて', 'For sale': '販売', 'Free': '無料',
    'All categories': 'すべてのカテゴリー', 'Price': '価格', 'Newest': '新しい順', 'Price: low → high': '価格の安い順', 'Price: high → low': '価格の高い順', 'Most liked': 'いいねの多い順', 'Hide gone': '売り切れを非表示',
    'Meet on campus. No shipping.': 'キャンパスで手渡し。発送はいりません。', 'Agree on a place and time in chat. Safety tips ›': '場所と時間はチャットで決めましょう。安全のヒント ›',
    'Save search': '検索を保存', 'Search saved': '保存済みの検索', 'Clear all': 'すべてクリア', 'Clear filters': '条件をクリア', 'Clear': 'クリア',
    'No items match these filters.': '条件に合う商品がありません。', 'Nothing here yet.': 'まだ商品がありません。', 'Be the first to post something': '最初に出品してみましょう', 'See other campuses': 'ほかのキャンパスを見る',
    'Search by category': 'カテゴリーから探す', '· your campus': '・自分のキャンパス', '· all campuses': '・すべてのキャンパス', 'Quick filters': 'クイック検索', 'Free items': '無料の商品', 'Up to ¥1,000': '¥1,000以下', 'Posted today': '今日の出品',
    'Recent searches': '最近の検索', 'Saved searches': '保存した検索', 'Categories': 'カテゴリー', 'Items': '商品', 'Custom range…': '価格を指定…',
    'Any price': '指定なし', 'Go': '適用', 'Min': '最低', 'Max': '最高', 'Minimum price': '最低価格', 'Maximum price': '最高価格',
    'Textbooks': '教科書', 'Electronics': '家電・電子機器', 'Furniture': '家具', 'Bedding': '寝具', 'Kitchen': 'キッチン用品', 'Bikes': '自転車', 'Clothes': '服・ファッション', 'Other': 'その他',
    'Reserved': '取引中', 'Gone': 'SOLD', 'Available': '出品中', 'just now': 'たった今',
    // item page
    'Condition': '商品の状態', 'Campus': 'キャンパス', 'Free times': '都合のいい時間', 'Details': '商品の説明', '(you)': '（あなた）',
    'Like new': '未使用に近い', 'Good': '目立った傷や汚れなし', 'Used': 'やや傷や汚れあり', 'Well used': '傷や汚れあり',
    'Ask to buy': '購入を相談する', 'I want this': 'これがほしい', 'This item is gone': 'この商品は売り切れました', "You can't contact this student": 'この学生には連絡できません',
    'Edit listing': '商品の編集', 'My listings': '出品した商品', 'Report this item': 'この商品を報告', 'Like': 'いいね', 'Save': '保存', 'Saved': '保存済み',
    'Save to favorites': 'お気に入りに保存', 'Remove from favorites': 'お気に入りから外す', 'not your campus': 'ほかのキャンパス',
    // post
    'Post an item': '出品する', 'Add a photo': '写真を追加', 'Optional, but items with photos go faster': '任意ですが、写真があると早く決まります',
    'What is it?': '商品名', 'Type': '種類', 'Sell': '売る', 'Give away': '無料でゆずる', 'Price (¥)': '価格（円）', 'Category': 'カテゴリー',
    'When are you free?': '都合のいい時間', 'optional': '任意', 'Save changes': '変更を保存', 'e.g. Rice cooker, Biology textbook': '例：炊飯器、生物学の教科書',
    'e.g. Lunch break, weekdays after 4th period': '例：昼休み、平日の4限後', "Size, why you're selling, anything people should know": 'サイズ、手放す理由、知っておいてほしいこと',
    'You can only edit your own listings.': '自分の商品だけ編集できます。',
    // notifications & messages
    'Notification settings': '通知の設定', 'No notifications yet.': 'お知らせはまだありません。',
    "You'll hear here when someone wants your item, a meetup is agreed, or something new is posted on your campus.": '商品への問い合わせ、待ち合わせの決定、キャンパスの新着などをここでお知らせします。',
    'No messages yet.': 'メッセージはまだありません。', 'Find something on Home and tap "Ask to buy".': 'ホームで商品を見つけて「購入を相談する」をタップしましょう。',
    'Message': 'メッセージ', 'Send': '送信', 'Propose meetup': '待ち合わせを提案', 'Offer a price': '価格を提案',
    'Is it still available?': 'まだありますか？', 'Where should we meet?': 'どこで待ち合わせますか？', 'I can come today': '今日行けます', 'Thank you!': 'ありがとうございます！',
    'Yes, still available!': 'はい、まだあります！', 'Where works for you?': 'どこが都合いいですか？', "Sorry, it's reserved": 'すみません、取引中です',
    'When': '日時', 'Where': '場所', 'e.g. Library entrance (or decide in chat)': '例：学術情報館の入口（チャットで決めてもOK）',
    'Send proposal': '提案を送る', 'Send offer': '提案を送る', 'Your offer (¥)': '希望価格（円）', 'Accept': '承認', 'Accepted': '承認済み', "Can't make it": '都合が悪い', 'Decline': 'お断り', 'Declined': 'お断り済み',
    'Meetup proposal': '待ち合わせの提案', 'Price offer': '価格の提案', 'from you': 'あなたから', 'Waiting for you': 'あなたの返事待ち',
    'Meetup:': '待ち合わせ：', '. Did the hand-off happen?': '。受け渡しはできましたか？', 'Yes, handed off': 'はい、受け渡しました', "They didn't show": '相手が来なかった',
    'Submit rating': '評価を送信', 'Thanks for rating!': '評価ありがとうございます！', 'Tap a star to rate (1 to 5)': '星をタップして評価してください（1〜5）', 'You already rated this hand-off': 'この受け渡しは評価済みです',
    'Say thanks or leave a short comment (optional)': 'お礼やひとことコメント（任意）', 'Rating out of 5': '5段階評価',
    '1 star · Bad': '星1・悪い', '2 stars · Poor': '星2・いまいち', '3 stars · OK': '星3・ふつう', '4 stars · Good': '星4・良い', '5 stars · Great': '星5・とても良い',
    'Demo: you\'re': 'デモ：現在のユーザー', 'to reply.': 'に切り替えて返信できます。',
    "You can't message each other because one of you blocked the other.": 'どちらかがブロックしているため、メッセージを送れません。',
    'Offer declined.': '提案はお断りされました。', 'Proposal declined. Suggest another time?': '提案はお断りされました。別の時間を提案しますか？',
    // profile
    'Profile': 'プロフィール', 'My profile': 'マイプロフィール', 'Edit profile': 'プロフィール編集', 'Rating': '評価', 'Ratings': '評価', 'Hand-offs': '受け渡し', 'Listed': '出品中',
    'Block': 'ブロック', 'Unblock': 'ブロック解除', 'Report': '報告', 'Favorite seller': 'お気に入りの出品者', 'Add to favorites': 'お気に入りに追加',
    'No ratings yet': 'まだ評価がありません', 'No items yet.': '商品はまだありません。', 'No reviews yet.': 'レビューはまだありません。',
    'Add a short bio so other students know who you are.': 'ひとこと自己紹介を書くと、ほかの学生が安心できます。',
    'Tap to add a photo': 'タップして写真を追加', 'Remove photo': '写真を削除', 'Name': '名前',
    'Bio': '自己紹介', "Don't write your faculty, year, nationality or where you're from.": '学部・学年・国籍・出身地は書かないでください。',
    "Your email can't be changed, because it proves you're a student.": 'メールアドレスは学生であることの証明なので、変更できません。', 'Save profile': 'プロフィールを保存',
    'e.g. Free after 4th period. No price negotiation please.': '例：4限のあとなら会えます。値下げ交渉はご遠慮ください。',
    // favorites / likes
    'Favorites': 'お気に入り', 'Favorite sellers': 'お気に入りの出品者', 'Favorites (items and sellers)': 'お気に入り（商品と出品者）', 'Liked': 'いいね', 'Liked items': 'いいねした商品', 'Likes': 'いいね',
    'Private. Sellers aren\'t told when you save them.': '非公開です。保存しても出品者には通知されません。',
    // me / settings
    'View my profile': 'プロフィールを見る', 'Safety tips': '安全のヒント', 'Settings': '設定', 'Prototype tools': 'プロトタイプ用ツール',
    'Prototype stats (for your test)': 'テスト用の集計', 'Reset all demo data': 'デモデータをすべてリセット', 'Admin': '管理者', 'Test stats': 'テストの集計',
    "You haven't posted anything yet.": 'まだ出品していません。', 'Edit': '編集', 'Mark reserved': '取引中にする', 'Back to available': '出品中に戻す', 'Mark gone': 'SOLDにする', 'Delete': '削除',
    'Requests, offers and meetups': '問い合わせ・価格の提案・待ち合わせ', 'When someone wants your item, sends an offer or agrees a meetup': '商品への問い合わせ、価格の提案、待ち合わせが決まったとき',
    'New items on my campus': '自分のキャンパスの新着', 'When another student posts something on your campus': '同じキャンパスの学生が出品したとき',
    'Saved search matches': '保存した検索の新着', 'When a new item matches a search you saved': '保存した検索に合う商品が出品されたとき',
    'Likes on my items': '自分の商品へのいいね', 'When someone likes your listing': '誰かがあなたの商品にいいねしたとき',
    'Price drops': '値下げ', 'When an item you liked or saved to favorites gets cheaper': 'いいね・お気に入りした商品が値下げされたとき',
    'When a seller in your favorites posts something new': 'お気に入りの出品者が新しく出品したとき',
    'Search on Home and tap "Save search" to get told when a matching item is posted.': 'ホームで検索して「検索を保存」をタップすると、合う商品が出品されたときにお知らせします。',
    'Blocked students': 'ブロックした学生', "Nobody blocked. Blocked students can't message you and you won't see their items.": 'ブロック中の学生はいません。ブロックすると、メッセージが届かず、商品も表示されなくなります。',
    'Account': 'アカウント', 'Student verification': '学生証の確認', 'Verified': '確認済み', 'Safety tips for meetups': '待ち合わせの安全のヒント', 'Log out': 'ログアウト', 'Delete my account': 'アカウントを削除',
    'Language': '言語',
    // report
    'Anything else?': 'ほかに伝えたいこと', 'Send report': '報告を送信', 'Reporting the item': '報告する商品：', 'Reporting the student': '報告する学生：',
    ". Reports are private. The other person isn't told who reported them.": '。報告は非公開で、相手に報告者は伝わりません。',
    'Not allowed on campus / prohibited item': 'キャンパスで禁止されている・出品できない物', 'Scam or suspicious': '詐欺・あやしい', 'Misleading photo or description': '写真や説明が実物と違う',
    "Didn't show up / unreliable": '来なかった・信頼できない', 'Rude or harassing': '失礼・嫌がらせ', 'Not a student here': 'この大学の学生ではない', 'Nothing to report.': '報告する対象がありません。',
    // safety
    'Meet on campus, in the daytime': '昼間にキャンパスで会う', 'Busy places like the library entrance, the co-op or the cafeteria are best.': '学術情報館の入口、生協、食堂など人の多い場所がおすすめです。',
    'Check the item before paying': '支払う前に商品を確認', 'Look it over and make sure it works before you hand over cash.': '現金を渡す前に、状態や動作を確認しましょう。',
    'Pay in cash, in person': '支払いは会って現金で', "Don't send money before you meet. The app never asks you to pay in advance.": '会う前にお金を送らないでください。アプリが前払いを求めることはありません。',
    'Keep chats in the app': 'やりとりはアプリ内で', 'If something goes wrong, the chat history helps us look into it.': 'トラブルがあったとき、チャットの履歴が確認の手がかりになります。',
    'Never share your student card photo': '学生証の写真は人に送らない', 'We only need it once, for verification. Nobody else should ask for it.': '確認に一度使うだけです。ほかの人が求めることはありません。',
    'Report and block': '報告とブロック', "If someone is rude, doesn't show up, or seems like a scam, report them from their profile.": '失礼な人、来ない人、詐欺のような人は、プロフィールから報告してください。',
    // stats
    'Prototype stats': 'テストの集計', 'Download event log (CSV)': 'イベントログをダウンロード（CSV）', 'Listings posted': '出品数', 'Hand-offs completed': '受け渡し完了', 'Posted items that were handed off': '受け渡しまで進んだ割合',
    'Median time: post → hand-off': '出品から受け渡しまでの時間（中央値）', 'Chats started': 'チャット開始', 'Meetups agreed': '待ち合わせ決定', 'Price offers sent': '価格の提案', 'No-shows reported': '来なかった報告',
    'Reviews left': '評価の数', 'Students active on 2+ days': '2日以上使った学生', 'Reports sent': '報告の数', 'Sign-ups': '登録数', 'Student cards verified': '学生証の確認数',
    'Counts real actions on this device (demo items are excluded from "posted"). In the real test these would come from everyone\'s phones.': 'この端末での操作を集計しています（デモ商品は「出品数」に含みません）。本番のテストでは全員のスマホから集計されます。',
    // toasts
    'Added to your likes': 'いいねしました', 'Saved to favorites': 'お気に入りに保存しました', 'Removed from favorites': 'お気に入りから外しました', 'Search removed': '保存した検索を削除しました',
    'Changes saved': '変更を保存しました', 'Profile saved': 'プロフィールを保存しました', 'Posted! Other students can see it now': '出品しました！ほかの学生に表示されています',
    'Add a price, or choose "Give away"': '価格を入力するか「無料でゆずる」を選んでください', 'Pick a time': '時間を選んでください', 'Enter an amount': '金額を入力してください',
    'Hand-off recorded': '受け渡しを記録しました', 'Already reserved for someone else': 'ほかの人と取引中です', 'This item is already gone': 'この商品はすでに売り切れです',
    'Student card verified': '学生証を確認しました', "Sent! We'll check your card soon": '送信しました！まもなく確認します', "Thanks. We'll look into it.": 'ありがとうございます。確認します。',
    'Could not read that image': '画像を読み込めませんでした', 'Storage full: try a smaller photo or reset demo data': '保存容量がいっぱいです。小さい写真にするか、デモデータをリセットしてください',
    'Your account was deleted': 'アカウントを削除しました', 'Account created': 'アカウントを作成しました', 'New code sent': '新しいコードを送信しました',
    'Notifications on': '通知をオンにしました', 'Notifications off': '通知をオフにしました',
    // confirm boxes
    'Delete this listing?': 'この商品を削除しますか？', 'Report that the other person did not show up?': '相手が来なかったことを報告しますか？',
    'Delete all demo data on this device and start fresh?': 'この端末のデモデータをすべて削除して、最初からやり直しますか？',
    "Delete your account? Your listings will be removed. This can't be undone.": 'アカウントを削除しますか？出品した商品も削除され、元に戻せません。',
  };

  // [regex, replacement] — replacement may be a function. Captured parts can be translated with tr().
  const P = (re, rep) => [re, rep];
  const PATTERNS = [
    // times and counts
    P(/^You can rate (.+) from tomorrow$/, '$1さんの評価は明日からできます'), P(/^Opens in (\d+) h$/, 'あと$1時間'),
    P(/^Hand-off done: "(.+)"\. You can rate (.+) from tomorrow\.$/, '「$1」の受け渡しが完了しました。$2さんの評価は明日からできます'),
    P(/^You can now rate (.+) for "(.+)"$/, '$1さんを評価できるようになりました（「$2」）'),
    P(/^posted (.+)$/, (m, a) => `${a}に出品`),
    P(/^posted (.+) · edited$/, (m, a) => `${a}に出品・編集済み`),
    P(/^(\d+) items?$/, '$1件'), P(/^(\d+) items? in this range$/, 'この価格帯に$1件'), P(/^(\d+) items? for sale$/, '$1件 出品中'),
    P(/^(\d+) hand-offs?$/, '受け渡し$1回'), P(/^(\d+) ratings?$/, '評価$1件'),
    P(/^Items \((\d+)\)$/, '商品 ($1)'), P(/^Sellers \((\d+)\)$/, '出品者 ($1)'), P(/^Ratings \((\d+)\)$/, '評価 ($1)'), P(/^Reviews \((\d+)\)$/, 'レビュー ($1)'), P(/^My listings \((\d+)\)$/, '出品した商品 ($1)'),
    P(/^([\d.]+) min$/, '$1分'), P(/^([\d.]+) h$/, '$1時間'), P(/^([\d.]+) days$/, '$1日'),
    // prices
    P(/^(\d) out of 5 stars$/, '5段階中の星$1つ'),
    P(/^Up to (¥[\d,]+)$/, '$1以下'), P(/^(¥[\d,]+) & above$/, '$1以上'), P(/^listed at (.+)$/, '出品価格 $1'), P(/^Accept (¥[\d,]+)$/, '$1で承認'),
    P(/^Offer less than (¥[\d,]+), or just ask to buy$/, '$1より低い金額を入力するか、そのまま購入を相談してください'),
    // people
    P(/^from (.+)$/, '$1さんから'), P(/^Waiting for (.+)$/, '$1さんの返事待ち'),
    P(/^Switch to (.+)'s side$/, '$1さん側に切り替え'), P(/^Switch to demo user: (.+)$/, 'デモユーザーに切り替え：$1'), P(/^You are now (.+)$/, '$1さんに切り替えました'),
    P(/^Open chat with (.+)$/, '$1さんとのチャットを開く'), P(/^Rate your hand-off with (.+)$/, '$1さんとの受け渡しを評価'), P(/^You rated (.+)$/, '$1さんを評価しました'),
    P(/^Welcome back, (.+)$/, 'おかえりなさい、$1さん'), P(/^(.+) blocked$/, '$1さんをブロックしました'), P(/^(.+) unblocked$/, '$1さんのブロックを解除しました'),
    P(/^(.+) added to your favorite sellers$/, '$1さんをお気に入りの出品者に追加しました'),
    P(/^Block (.+)\? You won't see each other's items and can't message each other\.$/, '$1さんをブロックしますか？お互いの商品が表示されず、メッセージも送れなくなります。'),
    P(/^This student isn't on (.+) any more\.$/, 'この学生は$1を退会しました。'),
    P(/^My name and university are readable\. I'm a current student at (.+)\.$/, '名前と大学名がはっきり読めます。私は$1の在学生です。'),
    P(/^(\d+) student\(s\) liked this\. If you lower the price, they'll get a notification\.$/, '$1人がいいねしています。値下げするとお知らせが届きます。'),
    P(/^Saved\. We'll tell you when "(.+)" is posted$/, '保存しました。「$1」が出品されたらお知らせします'),
    P(/^Could not connect: (.+)$/, '接続できませんでした：$1'), P(/^Could not save: (.+)$/, '保存できませんでした：$1'), P(/^Upload failed: (.+)$/, 'アップロードに失敗しました：$1'),
    // inbox previews
    P(/^You: (.+)$/, 'あなた：$1'), P(/^Offer: (¥[\d,]+)$/, '価格の提案：$1'),
    // search panel
    P(/^Search for "(.+)"$/, '「$1」で検索'), P(/^"(.+)" in (.+)$/, (m, q, c) => `「${q}」を${tr(c)}で`), P(/^Browse (.+)$/, (m, c) => `${tr(c)}を見る`),
    // notifications (stored as English sentences; names and titles stay as written)
    P(/^(.+) wants your "(.+)"$/, '$1さんが「$2」に興味を持っています'),
    P(/^(.+) proposed a meetup: (.+)$/, '$1さんが待ち合わせを提案しました：$2'),
    P(/^(.+) accepted your meetup for "(.+)" · (.+)$/, '$1さんが「$2」の待ち合わせを承認しました（$3）'),
    P(/^"(.+)" was reserved by someone else$/, '「$1」はほかの人と取引中になりました'),
    P(/^(.+) can't make that time\. Suggest another\?$/, '$1さんはその時間は都合が悪いようです。別の時間を提案しますか？'),
    P(/^(.+) offered (¥[\d,]+) for "(.+)"$/, '$1さんが「$3」に$2を提案しました'),
    P(/^(.+) accepted your offer of (¥[\d,]+)$/, '$1さんが$2の提案を承認しました'),
    P(/^(.+) declined your offer$/, '$1さんが価格の提案をお断りしました'),
    P(/^Hand-off done: "(.+)"\. Rate (.+) out of 5 stars\?$/, '「$1」の受け渡しが完了しました。$2さんを5段階で評価しましょう'),
    P(/^Hand-off done: "(.+)"\. Leave a review for (.+)\?$/, '「$1」の受け渡しが完了しました。$2さんを評価しましょう'),
    P(/^(.+) reported that you missed the meetup for "(.+)"$/, '$1さんから、「$2」の待ち合わせに来なかったと報告がありました'),
    P(/^(.+) rated you ★(\d)(?:: "(.*)")?$/, (m, n, s, c) => `${n}さんがあなたを★${s}で評価しました${c ? `：「${c}」` : ''}`),
    P(/^(.+) liked your "(.+)"$/, '$1さんが「$2」にいいねしました'),
    P(/^Price drop: "(.+)" is now (.+) \(was (¥[\d,]+)\)$/, (m, t, now, was) => `値下げ：「${t}」が${tr(now)}になりました（元の価格 ${was}）`),
    P(/^New on your campus: (.+) · (.+)$/, (m, t, p) => `キャンパスの新着：${t}・${tr(p)}`),
    P(/^Saved search "(.+)": (.+) · (.+)$/, (m, q, t, p) => `保存した検索「${q}」：${t}・${tr(p)}`),
    P(/^(.+) \(a favorite seller\) posted: (.+) · (.+)$/, (m, n, t, p) => `お気に入りの${n}さんが出品しました：${t}・${tr(p)}`),
    P(/^Welcome to (.+)! (\d+) items are up for grabs on your campus right now\.$/, '$1へようこそ！今、あなたのキャンパスに$2件の商品があります。'),
    P(/^Welcome to (.+)! Verify your student card to start posting and messaging\.$/, '$1へようこそ！学生証を確認すると、出品とメッセージができるようになります。'),
    P(/^Welcome to (.+)! Post something or say hi to a seller\.$/, '$1へようこそ！出品するか、出品者にメッセージを送ってみましょう。'), P(/^Welcome, (.+)$/, 'ようこそ、$1さん'),
    P(/^Your student card is verified\. You can post and message now\.$/, '学生証を確認しました。出品とメッセージができるようになりました。'),
    // chat system messages
    P(/^Meetup agreed: (.+)\. Item reserved\.$/, '待ち合わせが決まりました：$1。商品は取引中になりました。'),
    P(/^Offer accepted: (¥[\d,]+)\. Now agree on a time to meet\.$/, '$1で合意しました。待ち合わせの時間を決めましょう。'),
    P(/^Hand-off confirmed by (.+)\. Thanks for swapping on campus\.$/, '$1さんが受け渡しを確認しました。キャンパスでの取引、ありがとうございました。'),
    P(/^(.+) reported a no-show\. The item is available again\.$/, '$1さんが「来なかった」と報告しました。商品は出品中に戻りました。'),
    // chat first messages (sent by the buyer)
    P(/^Hi! Is the "(.+)" still available\?$/, 'こんにちは！「$1」はまだありますか？'),
    P(/^Hi! I'd love the "(.+)" if it's still free\.$/, 'こんにちは！「$1」がまだあれば、ぜひいただきたいです。'),
    // campus names: show the Japanese name only ("神戸商科 · Kobe Commerce" → "神戸商科")
    P(/^([　-鿿゠-ヿ]+) · [A-Z][A-Za-z]*(?: (?:[A-Z&][A-Za-z]*|of|and))*$/, '$1'), P(/^([　-鿿゠-ヿ]+) \([A-Z][A-Za-z &]+\)$/, '$1'),
  ];

  // Translate one string. Returns the original if there is no translation.
  function tr(s) {
    if (lang !== 'ja' || !s) return s;
    if (DICT[s] != null) return DICT[s];
    for (const [re, rep] of PATTERNS) if (re.test(s)) return s.replace(re, rep);
    if (s.includes(' · ')) {
      const parts = s.split(' · ');
      const out = parts.map(tr);
      if (out.some((x, i) => x !== parts[i])) return out.join('・');
    }
    return s;
  }

  // Never translate what students wrote themselves
  const SKIP = '.title, .item-title, .desc, .msg, .bio, .review .small, [data-notr], input, textarea, script, style';
  const ATTRS = ['placeholder', 'title', 'aria-label'];

  function translateText(node) {
    const raw = node.nodeValue;
    const s = raw.replace(/\s+/g, ' ').trim();
    if (!s || !/[A-Za-z]/.test(s)) return;
    const p = node.parentElement;
    if (!p || p.closest(SKIP)) return;
    const t = tr(s);
    if (t !== s) node.nodeValue = raw.replace(/\S[\s\S]*\S|\S/, t);
  }
  function translateEl(el) {
    if (el.nodeType !== 1 || el.closest(SKIP.replace(', input, textarea', ''))) return;
    ATTRS.forEach((a) => { const v = el.getAttribute(a); if (v && /[A-Za-z]/.test(v)) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } });
  }
  function translateTree(root) {
    if (lang !== 'ja' || !root) return;
    if (root.nodeType === 3) return translateText(root);
    if (root.nodeType !== 1) return;
    translateEl(root);
    root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(translateEl);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(translateText);
  }

  let observer = null;
  function start() {
    if (lang !== 'ja') return;
    translateTree(document.body);
    observer = new MutationObserver((muts) => {
      observer.disconnect();
      for (const m of muts) {
        if (m.type === 'characterData') translateText(m.target);
        else m.addedNodes.forEach(translateTree);
      }
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // confirm() boxes are browser dialogs, not page text: translate them on the way out
  const nativeConfirm = window.confirm.bind(window);
  window.confirm = (msg) => nativeConfirm(tr(String(msg)));

  function set(l) { localStorage.setItem(KEY, l); location.reload(); }
  return { lang, tr, set };
})();
