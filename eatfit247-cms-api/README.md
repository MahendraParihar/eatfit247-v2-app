## Admin Panel API


## Description


## Installation

```bash
$ npm i -g @nestjs/cli
$ npm install
$ nest g module [PATH]/[MODULE_NAME]
$ nest g controller [PATH]/[CONTROLLER_NAME]
$ SELECT SETVAL('seq_my_table_pk_id', (SELECT MAX(my_table_pk_id) + 1 FROM my_table));;
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Creating build for deployment
The following steps can be used in the CI/CD tool to create a deployable build folder

1. Install the dependencies using the following command
    - npm ci
2. Create the build folder
    - npm run build

## Deploying the application
Follow the following steps to deploy the application using your favorite node process monitoring tool

1. Copy the `build` and `node_modules` folders to the any path where you would like to host the application
2. Make changes to the `.env` file located in the path mentioned below as applicable to the environment
    - `build/.env`
2. Use any node process management tool such as `pm2` to start the server from the path mentioned below. Refer to the documentation of the tool that you are using to achive this.
    - `build/bin/www.js`

## SQL
```sql
SELECT SETVAL('demo_deals_id_seq', (SELECT MAX(id) + 1 FROM demo_deals));

alter table mst_mandals
    add "createdIp" varchar(100) default null,
    add "modifiedIp" varchar(100) default null;

```

## Stay in touch

- Author - [EatFit247](https://eafit247.com)
- Website - [https://eafit247.com](https://eafit247.com)

## License

Nest is [MIT licensed](LICENSE).
