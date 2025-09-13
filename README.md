# eatfit247-v2


#### Docker For EatFit247

Note: the Following commands should be executed from root of the project.

For building Server image

```shell
docker build . -f ./infra/Dockerfile.server -t vsd-server
```

For building website image

```shell
docker build . -f ./infra/Dockerfile.client -t vsd-client
```

### Docker container up
```shell
docker compose -f ./infra/docker-compose.yml up -d
```

### Docker container down
```shell
docker compose -f ./infra/docker-compose.yml down
```

#### List docker containers list
```shell
docker ps -a
```

#### Docker all images
```ssh
/var/lib/docker# du -sch /var/lib/docker/overlay2/*
```

#### Go inside docker image
```shell
docker exec -it [CONTAINER_NAME] bash
```

Note: Ensure that you have an.env file created in the infra folder with ENV variable defined
For running all Servers

### Docker images
```shell list 
docker images # list images
```

### Delete all images
```shell list
docker rmi [IMAGE_ID]
```
### Delete unused images
```shell list
docker image prune
```

### Delete all containers including its volumes use
```shell list
docker rm -vf $(docker ps -aq)
```

### logs all containers
```shell list 
docker logs [Container_NAME]