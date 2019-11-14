# Watadoo

This is the monorepo for the Watadoo project.

## Git Workflow

This project follows the workflow suggested in this [article](https://nvie.com/posts/a-successful-git-branching-model/). Please read it carefully to understand the purpose of every branches.

Please notice the following:

- Feature branches are merged in development with the --squash flag. We don't keep the branch history except if it's a huge feature.
- Everything else is merged with the -no-ff flag, to keep all relevant history. Please clean your commit history before submitting a PR, e.g group commits together if you have a lot of irrelevant testing 1 line code change commit.
- This project uses a ```development``` branch instead of a ```develop``` branch.

## Messenger Bot Backend

This project uses Node JS for the Messenger Bot backend. More info in the ```watadoo-bot``` folder.

It is deployed on Heroku by pushing on the heroku origin. For example, if the origin is ```heroku-bot```:

```
git subtree push --prefix watadoo-bot heroku-bot master
```

It is not deployed automatically by any CD of some sort.

## Management Backend

This project uses Golang for everything related to event management. This includes: event manager admin backend, crawlers, cron jobs, etc. More info in the ```watadoo-backend``` folder.

It is deployed on Heroku by pushing on the heroku origin. For example, if the origin is ```heroku-backend```:

```
git subtree push --prefix watadoo-backend heroku-backend master
```

It is not deployed automatically by any CD of some sort.

## Prisma Datamodel

This project uses Prisma V1 as an ORM. More specifically, all changes to the database model needs to be done in this folder and the ORM clients will be generated in siblings folder. More info in the ```prisma``` folder.

It is not deployed automatically by any CD of some sortm and needs to be deployed using the Prisma CLI.

## Event Manager Admin

The Event Manager Admin is built using React.js and Next.js. This interface is not consumer facing, and is only made for our people to manage events in the bot easily. More info in the ```event-admin``` folder.

It is deployed automatically using Netlify on every push to the master branch.

## Event Landing Page

The Event Landing Page is built using React.js and Next.js. This interface is only used by people coming from the bot, looking for more information. It is not our fully-fledge website. More info in the ```event-landing-page``` folder.

It is deployed automatically using Netlify on every push to the master branch.

## Watadoo Website

The Watadoo Website is built using Wordpress. It is hosted on a server supplied by [bios Solutions informatiques](https://bios.ca/). This server also hosts our emails and DNS, which can both be managed through the cPanel.

The website's code has not been added to this repo for now, since it's deployed and modified completely independantly through a FTP access. Also, it uses it's own DB (Wordpress), so I feel it's not really related to this monorepo.

However, it should at least have it's own repo. The build pipeline for the website'S assets (css, js, svg) should be in that repo also.
