const express = require('express');
var {createElement} = require('react');
var ReactDOMServer = require('react-dom/server');
const app = express()

const Renderer = components => {
    app.get('/:id', async function (req, res) {

        const {id} = req.params;
        const component = components[id];
        const rendered = await component({id: 'server', endpoint:'localhost'});

        const client = rendered.props.children.find((ele) => {
            return "$$typeof" in ele;
            console.log ("Ele", ele)
        })

        try {

            const html = ReactDOMServer.renderToString(client);
            console.log ("Rendering", JSON.stringify(html));
            return res.send(html);
            
        } catch (e) {
            throw new Error(e);
        }
        // process.exit(0);
    });

    return app;
}

module.exports = {
    Renderer
}