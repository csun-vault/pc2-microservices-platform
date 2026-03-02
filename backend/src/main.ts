import "dotenv/config";
import { app } from "./app"

app.listen(process.env.PORT, () => {
      console.log(`😪 Server Running on port ${process.env.PORT}`)
});