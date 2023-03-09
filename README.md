# Auth Template

## Features

- Store User Data in Postgres and Prisma. Run docker-compose.
- Login and Signup feature added
- Encrypted JWT token
- JOI Validation
- Reset Password

## To be Added later

-

## Run Locally

- Install all Packages

```
npm install --save
```

- Make sure Docker is installed
- Run Below command in terminal

```
docker-compose -f docker-compose.yaml up -d
```

- You may need to run the following command inside docker NodeApp Container

```
npx prisma migrate dev
```

# .env File

Adding the .env file contents. Data related to SMTP server is not provided.

```
PORT="3333"
APP_URL="http://localhost:3333"
DB_USERNAME="thor"
DB_NAME="odin"
JWT_SECRET="heimdal"
ENCRYPT_KEY="janefosterislovejanefosterislove"
IV="iamgrootiamgroot"

DATABASE_URL="postgresql://postgres:postgres@localhost:5433/odin"
```
