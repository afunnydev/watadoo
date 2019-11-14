# Prisma

This project uses Prisma V1 as an ORM. More specifically, all changes to the database model needs to be done in this folder and the ORM clients will be generated in siblings folder.

## Setup

Prisma uses a database and a Prisma server. For development, both are run locally using docker.

1) Install Docker. You can find installation instructions for the free Docker Community Edition (CE) on https://www.docker.com/community-edition

2) Create 2 docker containers: a PostgreSQL and a Prisma server.

```
docker-compose up -d
```

3) Setup your environment variables

```
cp .env.example.local .env.development.local
```

4) Deploy the Prisma service.

```
prisma deploy -e .env.development.local
```

## Live setup

The current live Prisma server is also deployed using Docker (so, 2 Docker containers). It is deployed on Digital Ocean, because Prisma V1 needs at least 2GB RAM, and it was too expensive on Heroku. It is not deployed through git or anything, I just created the docker-compose.yml file over there and docker-compose.

## Deploying changes live

To deploy changes live, you need the 3 environment variables and you can store them in a ```.env.development``` and a ```.env.production``` file. It is the same process as deploying changes to your local setup, but using one of these .env files.

The process needs to be done manually and quickly, since it can make our services crash for a moment. It is not the easiest deployment I've seen, I acknowledge that. But it's the best I could do with Prisma V1. CI/CD could definitely help for that, but Prisma V2 (should be out soon) will definitely help address that.