# syntax=docker/dockerfile:1
FROM node:lts-bookworm-slim
LABEL maintainer="Czcibor Bohusz-Dobosz czbd@o2.pl"
USER node
ENV NODE_ENV=production
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
WORKDIR /home/node

COPY index.js /home/node
COPY package.json /home/node
RUN npm install

CMD ["node", "index.js"]
