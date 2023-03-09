FROM node:latest

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 3334

# "npx","prisma","migrate","deploy","&&", 
CMD ["npm", "run", "dev"]