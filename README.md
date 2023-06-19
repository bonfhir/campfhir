# Campfhir

## Development Pre-requisites

- [Visual Studio Code](https://code.visualstudio.com/Download)
- Docker
  - Please make sure that you are using Docker Compose V2 (look in your docker
    desktop settings for it)
- [Remote Development extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)

## Get Started

1. In case you are unfamiliar with Remote Development extension, in VS Code,
   open the campfhir code folder and an option to 'Folder contains a Dev
   Container configuration file. Reopen folder to develop in a container' will
   pop up on the right bottom. Select 'Reopen in container'. If this is the
   first time building the project, using the command tools you can Shift +
   Cmd + P and select 'Dev containers: rebuild containers without cache`.
2. Then you can start querying the API at `http://localhost:8889`

### Usage

Start the webserver project:

```
yarn chat
```

Make sure that `sessions` directory exists under `workspace`, otherwise do

```
mkdir sessions
```

This will watch the project directory and restart as necessary.

Start the UI component:

```
yarn chat-styles
```
