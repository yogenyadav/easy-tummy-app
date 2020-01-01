const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const Shopify = require('shopify-api-node');
const json = require('json');

const apiKey = "251849bc52bdd0e716bbc867df396fe7"; //process.env.SHOPIFY_API_KEY;
const apiSecret = "19aed7a267ef3407cb42d0ca8d18fa4b"; //process.env.SHOPIFY_API_SECRET;
const scopes = 'read_products';
const forwardingAddress = "https://777f1c34.ngrok.io";

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});

app.get('/custom-shopify', (req, res) => {
    const shop = req.query.shop;
    console.log('shop', shop)
    if (shop) {
        const state = nonce();
        const redirectUri = forwardingAddress + '/custom-shopify/callback';
        const installUrl = 'https://' + shop +
            '/admin/oauth/authorize?client_id=' + apiKey +
            '&scope=' + scopes +
            '&state=' + state +
            '&redirect_uri=' + redirectUri;

        res.cookie('state', state);
        res.redirect(installUrl);
    } else {
        return res.status(400).send('Missing shop parameter. Please add ?shop=easy-tummy.myshopify.com to your request');
    }
});

app.get('/custom-shopify/callback', (req, res) => {
    const { shop, hmac, code, state } = req.query;
    console.log('shop', shop)
    const stateCookie = cookie.parse(req.headers.cookie).state;

    if (state !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified');
    }

    if (shop && hmac && code) {
        const map = Object.assign({}, req.query);
        delete map['signature'];
        delete map['hmac'];
        const message = querystring.stringify(map);
        const providedHmac = Buffer.from(hmac, 'utf-8');
        const generatedHash = Buffer.from(
            crypto
                .createHmac('sha256', apiSecret)
                .update(message)
                .digest('hex'),
            'utf-8'
        );
        let hashEquals = false;

        try {
            hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
        } catch (e) {
            hashEquals = false;
        };

        if (!hashEquals) {
            return res.status(400).send('HMAC validation failed');
        }

        const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
        const accessTokenPayload = {
            client_id: apiKey,
            client_secret: apiSecret,
            code,
        };

        shopResponse = '<!DOCTYPE html> \
        <html> \
        <body> \
        <a href="https://777f1c34.ngrok.io/custom-shopify/listProducts">list products</a></body> \
        </br> \
        <a href="https://777f1c34.ngrok.io/custom-shopify/addProduct">add product</a></body> \
        </html>';

        res.status(200).end(shopResponse);

        // request.post(accessTokenRequestUrl, { json: accessTokenPayload })
        //     .then((accessTokenResponse) => {
        //         const accessToken = accessTokenResponse.access_token;
        //         const shopRequestUrl = 'https://' + shop + '/admin/api/2019-10/shop.json';
        //         const shopRequestHeaders = {
        //             'X-Shopify-Access-Token': accessToken,
        //         };

        //         request.get(shopRequestUrl, { headers: shopRequestHeaders })
        //             .then((shopResponse) => {
        //                 res.status(200).end(shopResponse);
        //             })
        //             .catch((error) => {
        //                 res.status(error.statusCode).send(error.error.error_description);
        //             });
        //     })
        //     .catch((error) => {
        //         res.status(error.statusCode).send(error.error.error_description);
        //     });

    } else {
        res.status(400).send('Required parameters missing');
    }
});

shopify = new Shopify({
    shopName: 'prayog-test-store',
    apiKey: '6134e6ba8ceb59fd7f089b9efb905539',
    password: '90fdb717fa701ddf6e386e97c8b055c6'
});

app.get('/custom-shopify/listProducts', (req, res) => {
    shopify.product.list()
        .then(products => res.send(products))
        .catch(err => {
            console.log(err);
            res.send(err);
        });
});

app.get('/custom-shopify/addProduct', (req, res) => {
    shopify.product.create(
        {
            "title": "Burton Custom Freestlye 151",
            "product_type": "Snowboard",
            "vendor": "Burton"
        })
        .then(response => res.sendStatus(200))
        .catch(err => res.sendStatus(400).send(err));
});
