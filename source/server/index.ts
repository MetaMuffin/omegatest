import Express, { static as estatic, json } from "express";
import { join } from "path";
import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
//import { radioRoutes } from "./radio";


async function main() {

    const app = Express();

    const webpackConfig = require('../../webpack.config');
    const compiler = Webpack(webpackConfig)
    const devMiddleware = WebpackDevMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath
    })
    app.use("/scripts",devMiddleware)


    app.disable("x-powered-by");

   
    app.use(json());

    app.get("/", (req, res) => {
        res.sendFile(join(__dirname, "../../public/index.html"));
    });

    app.use("/static", estatic(join(__dirname, "../../public")));



    app.listen(8080, "0.0.0.0", () => {
        console.log("Listening...");
    });
}

main();