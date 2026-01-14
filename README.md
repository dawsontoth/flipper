# Your New Harper Fabric App

This is a template for building [Harper](https://www.harper.fast/) applications. You can download this repository as a starting point for building applications with Harper.

## Installation

To get started, make sure you have [installed Harper](https://docs.harperdb.io/docs/deployments/install-harper), which can be done quickly:

```sh
npm install -g harperdb
```

## Development

Then you can start your app:
```sh
npm run dev
```

Test your application works by querying the `/Greeting` endpoint:

## Deployment

When you are ready, head to [https://fabric.harper.fast/](https://fabric.harper.fast/), log in to your account, and create a cluster.

Set up your .env file with your secure cluster credentials. Don't commit this file to source control!

```sh
npm run login
```

Then you can deploy your app to your cluster:

```sh
npm run deploy
```
