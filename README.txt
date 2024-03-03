* これは何？

Slackのログを収集するツールです。
トークン等、認証情報の取得方法はググってください。

* 設定

.env.example を例に .env を作成してトークン等をセットしてください。

SLACK_CHANNELS_TYPEには取得したいチャンネルの種類を記述してください。
指定の方法は https://api.slack.com/methods/conversations.list#arg_types を参照してください。

* 使い方

トークンをセットしたら ./run を実行するか各スクリプトを実行します。
messages.ts は引数を指定しない場合は取得する範囲を尋ねます。

* ライセンス

NYSL
http://www.kmonos.net/nysl/
