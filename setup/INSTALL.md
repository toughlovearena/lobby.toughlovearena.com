# server setup

how to setup on unbuntu

### setup nginx

```bash

sudo apt update

# setup nginx to serve hello page
sudo apt install nginx

# dump in nginx.conf
sudo vi /etc/nginx/sites-enabled/default

# restart nginx
systemctl restart nginx

```

### setup certbot

you need to have DNS setup first, or certbot will fail

```bash

# install snap, then certbot
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx

# to renew
sudo certbot renew --dry-run

```

### setup nvm

```bash

curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source .profile
nvm install 14.7.1

```

### setup repo

The Lobby server is unique, in that it supports two different prod environments for blue-green deploys.

```bash

cd ~
git clone https://github.com/toughlovearena/lobby.toughlovearena.com.git
mv lobby.toughlovearena.com prod-lobbya
cd prod-lobbya
git checkout prod-lobbya
nvm use
npm i
npm run bg

cd ~
git clone https://github.com/toughlovearena/lobby.toughlovearena.com.git
mv lobby.toughlovearena.com prod-lobbyb
cd prod-lobbyb
git checkout prod-lobbyb
nvm use
npm i
npm run bg

```
