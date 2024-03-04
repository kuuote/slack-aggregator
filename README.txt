* これは何？

Slackのログを収集するツールです。
トークン等、認証情報の取得方法はググってください。

* 設定

.env.example を例に .env を作成してトークン等をセットしてください。

SLACK_CHANNELS_TYPEには取得したいチャンネルの種類を記述してください。
指定の方法は https://api.slack.com/methods/conversations.list#arg_types を参照してください。

* 使い方

トークンをセットしたら ./run を実行するか各スクリプトを実行します。

* 使い方(messages.ts)

channels.tsの結果が必要なので先にchannels.tsを実行してください。

--resume を指定すると今まで取得した部分より取得を再開します。

現在より、引数に指定するか尋ねられた秒数前までの範囲のメッセージを取得します。oldestを指定すると全ての範囲になります。

* ライセンス

NYSL
http://www.kmonos.net/nysl/
