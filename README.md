# @state-less/react-server

![npm (scoped)](https://img.shields.io/npm/v/@state-less/react-server)

`@state-less/react-server` is a powerful framework that allows you to build and manage server-rendered React applications with ease. It comes with built-in support for server-side state management, authentication, and more.

For detailed documentation and in-depth guides, please visit the official website at [state-less.cloud](https://state-less.cloud).

## Getting Started
### Backend

To get started on the backend, you can initialize a new project with the following commands:

```bash
git clone https://github.com/state-less/clean-starter.git -b react-server my-server
```

This command will set up a new project with the necessary dependencies and configuration files. Navigate into the newly created directory and start the development server:

```bash
cd my-server
git remote remove origin
yarn install
yarn start
```

This will launch the development server, allowing you to access your GraphQl endpoint at http://localhost:4000/graphql.

### Client
For the client-side, create a new vite react app and install the `@state-less/react-client` and ` @apollo/client` package:

```bash
yarn create vite
```

Choose  `my-app` as name and continue answering the questions from the wizard. Select *React* and *Typescript*. Once the wizard completed, you can change to the new directory and install the react-client package.

```bash
  cd vite-project
yarn add @apollo/client state-less/react-client
  yarn
  yarn dev
```

You should now see the Vite + React example page. Go ahead and edit `src/App.tsx`. Import the `useServerState` hook and find and replace the `useState` call.

```tsx
import { useServerState } from "@state-less/react-client";

// ...

const [count, setCount] = useServerState(0, {
  key: "count",
  scope: "global",
});
```

That's it, your App is now powered by the same backend as the documentation under [state-less.cloud](https://state-less.cloud). 

Happy Hacking! (and don't hesitate to reach out if you have questions.)