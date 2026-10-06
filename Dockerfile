# 八百万神器鑑定所（試作）を nginx で配信するだけのイメージ。
# 本番は S3＋CloudFront の静的サイトなので、ここでもサーバー側の処理は持たない。
FROM nginx:1.28.3-alpine3.23

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY frontend/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1/"]
