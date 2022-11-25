# Artrade Backend

Artrade backend services

## Getting started

Frameworks and tools used in the project:

- nodejs/yarn

## Setup developer environment - local machine

### Node & yarn

The project use node 16.x as it targets aws lambda node runtime (16.x). You can
use [nvm](https://github.com/nvm-sh/nvm#install--update-script) or [volta](https://docs.volta.sh/advanced/installers) as
node version manager.


### Run the project

```
yarn install
yarn start
```


### Docker

MongoDB, Elasticsearch and Kibana can be run with docker

```sh
# Start all services
docker compose up -d

# Start only mongodb
docker compose up -d mongodb

# Stop all services
docker compose down
```

If you already run something on the ports (27017, 9200, 9300, 5601, etc), you can override some with an env var in your `.zshrc`/`.bashrc`.

```sh
export ARTRADE_ELASTICSEARCH_PORT_9200_OVERRIDE=9201

# Look at docker-compose.yml to see all the variables you can override.
```
