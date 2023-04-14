#!/bin/bash

# Clone repository
git clone https://github.com/cssjidi/chatgpt-web

# Enter repository
cd chatgpt-web

# Install dependencies
npm install

# Build application
npm run build

# Copy files to website root directory
cp -R dist/* /www/wwwroot/web-client

cp -R service/* /www/wwwroot/web-server
