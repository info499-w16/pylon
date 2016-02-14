# pylon
A microservice gateway

## Building

A dockerfile is included to make building the container extremely simple.

Just execute `docker build -t $REPOSTORY .` from the root of the project and new image will be built.

## Running (The easy way)
Set the following environment variables:
- `POSTGRES_PASSWORD`
- `POSGRES_DB=users`
- `CLIENT=google api client id`
- `SECRET=google api secret key`

Run `docker-compose up`. You're done, and the application is running! Docker compose is a wonderful
tool that makes dealing with multi-container applications easy. The specification can be found in the
`docker-compose.yml` file if you want the details or want to modify it.

The hard way outlined below has the exact same effect, it's just more of a pain in the ass.

If you make an update to a file and want to run the updated appplication, just do `docker-compose build`, and then
run it again with `docker-compose up`.

## Running (The hard way)

Before running pylon, you must first create a container for __redis__ and
__postgres__. For simplicity all of these containers should share the same
_host_, that way pylon can access them via localhost.

### Postgres
The postgres containers contains records for all users, and is need for doing any sort of authorization or lookup. Users are so common across services, that they have a dedicated endpoint and are built into pylon instead of being a separate service.

```bash
docker run --name users-db \
    -e "POSTGRES_PASSWORD=supersecretpass" \
    -e "POSTGRES_DB=users" \
    -p $HOST_PORT:$PYLON_PORT \
    -d postgres
```

### Redis
Redis is used both for session management, and for microservice discovery and registration. If redis isn't running, users won't be able to authenticate or login, and requests won't be forwarded to any services.

```bash
docker run --name session-store \
    --net=container:users-db \
    -d redis
```

### Pylon
And now that we have those two containers running (check with `docker ps` that they are actually running and didn't crash for some reason), we can at last get pylon up and running.

```bash
docker run --name pylon \
    --net=container:users-db \
    -e "CLIENT=googleClientAppId" \
    -e "SECRET=googleAppSecret" \
    -e "PORT=3000"
    -e "DB_PASSWORD=superscretpass" \
    -d calebt5/info499.pylon
```
Also requires 3 environment variables to be set
`CLIENT`, `DB_PASSWORD` and `SECRET`, which correspond the values used by your registered google application, and the password for the users database that you setup earlier. Without these the application will not start

Currently this doesn't do anything without also running another service that identifies itself via UDP broadcast. [__Echo__](https://github.com/info499-w16/echo) is an example of a service which provides self identifying information and registers itself with Pylon.

Once you have redis running, and a service like echo, you can begin to actually test out the forwarding capabilities.

Simply send a request to `http://domain.com/api/v1/forward/{name}/root/path`. You should first try visiting this link in a web browser to login via google. After authenticating you will be redirected, and will get the expected response of the service.

## Example With Echo

Currently echo doesn't do what the name implies, but writes out the body as the following JSON response

```
{"hello":"world"}
```

Accessing `http://domain.com/registry/forward/echo/v0.0.1/hello` is equivilant to calling `http://echos-domain.com/hello`. The version is not optional, and if no service meets the semantic requiremento of `^version`, then you will get a 404.
