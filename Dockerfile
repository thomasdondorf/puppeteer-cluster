FROM node:alpine

RUN set -eux; \
  apk add --no-cache \
    bash \
    tini \
    openssh-client \
    'chromium=~79'

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROME_BIN /usr/bin/chromium-browser
ENV NODE_PATH /usr/local/share/.config/yarn/global/node_modules:$NODE_PATH

COPY docker-entrypoint.sh /docker-entrypoint.sh

WORKDIR /app

RUN yarn global add puppeteer@2.0.* puppeteer-core@2.0.* && yarn cache clean

ENTRYPOINT ["/bin/sh", "/docker-entrypoint.sh"]

# COPY your files

CMD ["node"]
