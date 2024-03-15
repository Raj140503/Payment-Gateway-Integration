// index.js

const express = require('express');
const braintree = require('braintree');

const app = express();
const PORT = 3000;

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: '638mct7vhwmk76db',
    publicKey: 'djcdht8rw43x6rdx',
    privateKey: '9f6ffc2b21a86b42f1909c746bb7a61d'
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    gateway.clientToken.generate({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Braintree Payment Gateway Integration</title>
                </head>
                <body>
                    <h1>Enter Payment Information</h1>
                    <form id="payment-form" action="/checkout" method="post">
                        <div id="dropin-container"></div>
                        <input type="hidden" id="nonce" name="payment_method_nonce">
                        <button type="submit">Pay Now</button>
                    </form>
                
                    <script src="https://js.braintreegateway.com/web/dropin/1.31.0/js/dropin.min.js"></script>
                    <script>
                        var form = document.getElementById('payment-form');
                
                        braintree.dropin.create({
                            authorization: '${response.clientToken}',
                            container: '#dropin-container'
                        }, function (createErr, instance) {
                            if (createErr) {
                                console.log('Create Error', createErr);
                                return;
                            }
                            form.addEventListener('submit', function (event) {
                                event.preventDefault();
                                instance.requestPaymentMethod(function (err, payload) {
                                    if (err) {
                                        console.log('Request Payment Method Error', err);
                                        return;
                                    }
                                    document.getElementById('nonce').value = payload.nonce;
                                    form.submit();
                                });
                            });
                        });
                    </script>
                </body>
                </html>
            `);
        }
    });
});

app.post('/checkout', (req, res) => {
    const nonceFromTheClient = req.body.payment_method_nonce;

    gateway.transaction.sale({
        amount: '10.00',
        paymentMethodNonce: nonceFromTheClient,
        options: {
            submitForSettlement: true
        }
    }, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(result);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
