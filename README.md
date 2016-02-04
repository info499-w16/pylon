# pylon
A microservice gateway

## Building
Dockerfile should be coming soon, but a 
## Running

Recommended to run as a docker container. Requires that redis be running on the localhost at the default port. Once all of these conditions are met, do an `npm start`, and the application should be running on port 3000 (unless overridden with the environment variable `PORT`).

Also requires two environment variables to be set
`CLIENT` and `SECRET`, which correspond the values used by your registered google application. Without these the application will not start

Currently this doesn't do anything without also running another service that identifies itself via UDP broadcast. [__Echo__](https://github.com/info499-w16/echo) is an example of a service which provides self identifying information and registers itself with Pylon.

Once you have redis running, and a service like echo, you can begin to actually test out the forwarding capabilities.

Simply send a request to `http://domain.com/api/v1/forward/{name}/root/path`. You should first try visiting this link in a web browser to login via google. After authenticating you will be redirected, and will get the expected response of the service.

## Example With Echo

Currently echo doesn't do what the name implies, but writes out the body as the following JSON response

```
{"hello":"world"}
```

Accessing `http://domain.com/api/v1/forward/echo/v0.0.1/hello` is equivilant to calling `http://echos-domain.com/hello`. The version is not optional, and if no service meets the semantic requiremento of `^version`, then you will get a 404.
