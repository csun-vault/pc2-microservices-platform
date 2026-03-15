import "dotenv/config";
import { app } from "./app"
import { initDocker } from "@libs/docker/docker.client";

app.listen(process.env.PORT, () => {
      initDocker();
      console.log(`😪 Server Running on port ${process.env.PORT}`)
});